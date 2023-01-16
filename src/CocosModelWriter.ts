import { bounds, Document, Mesh, Primitive, Root } from '@gltf-transform/core';
import fs from 'fs';
import path from 'path';
import { AttributeName, FormatInfos, getComponentByteLength, getIndexStrideCtor, getOffset, getWriter } from './Cocos';
import { CocosMeshMeta, CocosSkeleton, CocosSkeletonMeta } from "./CocosModel";
import { gltf } from './gltf';

const gltfAttributeMaps = new Map<AttributeName, gltf.AttributeName>();
gltfAttributeMaps.set(AttributeName.ATTR_POSITION, gltf.AttributeName.POSITION);
gltfAttributeMaps.set(AttributeName.ATTR_NORMAL, gltf.AttributeName.NORMAL);
gltfAttributeMaps.set(AttributeName.ATTR_TANGENT, gltf.AttributeName.TANGENT);
gltfAttributeMaps.set(AttributeName.ATTR_TEX_COORD, gltf.AttributeName.TEXCOORD_0);
gltfAttributeMaps.set(AttributeName.ATTR_TEX_COORD1, gltf.AttributeName.TEXCOORD_1);
gltfAttributeMaps.set(AttributeName.ATTR_TEX_COORD2, gltf.AttributeName.TEXCOORD_2);
gltfAttributeMaps.set(AttributeName.ATTR_COLOR, gltf.AttributeName.COLOR_0);
gltfAttributeMaps.set(AttributeName.ATTR_JOINTS, gltf.AttributeName.JOINTS_0);
gltfAttributeMaps.set(AttributeName.ATTR_WEIGHTS, gltf.AttributeName.WEIGHTS_0);


export default class CocosModelWriter {

    public wirteFiles(filename: string, meshMeta: CocosMeshMeta, document: Document, skeletonMeta: CocosSkeletonMeta, skeleton: CocosSkeleton): string[] {
        const root = document.getRoot();
        const meshes = root.listMeshes();
        if (meshes.length > 1)
            throw new Error("Multiple Skin is not supported.");

        const arrayBuffer = this.wirteMesh(meshMeta, meshes[0]);
        this.writeJointMaps(meshMeta, root);
        this.writeBounds(meshMeta, root);

        const filesnames: string[] = [];
        fs.mkdirSync(path.dirname(filename), { recursive: true });
        fs.writeFileSync(filename + ".bin", Buffer.from(arrayBuffer), "binary");
        fs.writeFileSync(filename + "@mesh.json", JSON.stringify(meshMeta.data), "utf-8");

        filesnames.push(filename + ".bin", filename + "@mesh.json");

        if (skeletonMeta != null && skeleton != null) {
            const skeletonMetaData = this.wirteSkeleton(skeletonMeta, skeleton);
            fs.writeFileSync(filename + "@skeleton.json", JSON.stringify(skeletonMetaData), "utf-8");

            filesnames.push(filename + "@skeleton.json");
        }
        return filesnames;
    }

    private updateArrayBufferSize(meshMeta: CocosMeshMeta, listPrimitives: Primitive[]): number {
        let size = 0;
        for (let i = 0; i < meshMeta.vertexBundles.length; i++) {
            const vb = meshMeta.vertexBundles[i];
            const typeArray = listPrimitives[i].getAttribute(gltf.AttributeName.POSITION).getArray();
            vb.view.count = typeArray.length / 3;
            vb.view.length = vb.view.count * vb.view.stride;
            vb.view.offset = size;
            size += vb.view.length;
        }
        for (let i = 0; i < meshMeta.primitives.length; i++) {
            const indexView = meshMeta.primitives[i].indexView;
            if (indexView == null) continue;
            const indicesAccessor = listPrimitives[i].getIndices();
            if (indicesAccessor == null)
                throw new Error(`The ${i} of primitives does no index buffer`);
            const indices = indicesAccessor.getArray();
            indexView.offset = size;
            indexView.count = indices.length;
            indexView.length = indexView.count * indexView.stride;
            size += indexView.length;
        }
        return size;
    }

    private wirteMesh(meshMeta: CocosMeshMeta, mesh: Mesh): ArrayBuffer {
        const listPrimitives = mesh.listPrimitives();

        if (listPrimitives.length != meshMeta.primitives.length)
            throw new Error(`The number of primitives does no match: source ${meshMeta.primitives.length} upload ${listPrimitives.length}`);

        const arrayBufferSize = this.updateArrayBufferSize(meshMeta, listPrimitives);
        const arrayBuffer = new ArrayBuffer(arrayBufferSize);

        for (let iv = 0; iv < meshMeta.vertexBundles.length; iv++) {
            const vertexBundle = meshMeta.vertexBundles[iv];
            for (let ia = 0; ia < vertexBundle.attributes.length; ia++) {
                const { format, name } = vertexBundle.attributes[ia];

                const writer = getWriter(new DataView(arrayBuffer, vertexBundle.view.offset + getOffset(vertexBundle.attributes, ia)), format)!;
                console.assert(writer != null);

                const outputStride = vertexBundle.view.stride;
                const componentCount = FormatInfos[format].count;
                const outputComponentByteLength = getComponentByteLength(format);
                const attributeName = gltfAttributeMaps.get(name);
                const attributeAccessor = listPrimitives[iv].getAttribute(attributeName);
                if (attributeAccessor == null)
                    throw new Error(`Attribute ${attributeName} is not supported.`);
                const typeArray = attributeAccessor.getArray();
                const vertexCount = typeArray.length / componentCount;
                for (let iVertex = 0; iVertex < vertexCount; iVertex++) {
                    for (let iComponent = 0; iComponent < componentCount; iComponent++) {
                        const inputOffset = componentCount * iVertex + iComponent;
                        const outputOffset = outputStride * iVertex + outputComponentByteLength * iComponent;
                        writer(outputOffset, typeArray[inputOffset]);
                    }
                }
                // console.log(name, typeArray);
            }
        }

        for (let p = 0; p < meshMeta.primitives.length; p++) {
            const primitive = meshMeta.primitives[p];
            if (primitive == null) continue;
            const indexView = primitive.indexView;
            const Ctor = getIndexStrideCtor(indexView.stride);
            const ibo = new Ctor(arrayBuffer, indexView.offset, indexView.count);

            const indicesArray = listPrimitives[p].getIndices().getArray();
            for (let i = 0; i < indicesArray.length; i++) {
                ibo[i] = indicesArray[i];
            }
        }

        return arrayBuffer;
    }

    private writeJointMaps(meshMeta: CocosMeshMeta, root: Root): void {
        if (meshMeta.jointMaps != null) {
            const listSkin = root.listSkins();
            const nodes = root.listNodes();
            const jointMapCount = Math.min(meshMeta.jointMaps.length, listSkin.length);
            for (let i = 0; i < jointMapCount; i++) {
                const skin = listSkin[i];
                const joints = skin.listJoints();
                const jointValues: number[] = [];
                for (const joint of joints) {
                    jointValues.push(nodes.indexOf(joint));
                }
                meshMeta.jointMaps[i] = jointValues;
            }
        }
    }

    private writeBounds(meshMeta: CocosMeshMeta, root: Root): void {
        const { min, max } = bounds(root.listScenes()[0]);
        meshMeta.minPosition = min;
        meshMeta.maxPosition = max;
    }

    private wirteSkeleton(meta: CocosSkeletonMeta, skeleton: CocosSkeleton): Object {
        // const skeletonMeta = meta.clone();
        meta.joints.length = 0;
        for (let i = 0; i < skeleton.joints.length; i++)
            meta.joints[i] = skeleton.joints[i];
        const matrixType = meta.bindposes[0][0];
        meta.bindposes.length = 0;
        for (let i = 0; i < skeleton.bindPoses.length; i++)
            meta.bindposes[i] = new Array(matrixType, ...skeleton.bindPoses[i]);
        const bindPosesValueType = meta.bindposesValueType[1];
        meta.bindposesValueType.length = 1;
        for (let i = 1; i < skeleton.bindPoses.length + 1; i++)
            meta.bindposesValueType[i] = bindPosesValueType;
        return meta.data;
    }
}