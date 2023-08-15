import { bounds, Document, Mesh, Primitive, Root } from '@gltf-transform/core';
import fs from 'fs';
import path from 'path';
import { FormatInfos, getComponentByteLength, getIndexStrideCtor, getOffset, getWriter } from './Cocos';
import { CocosToGltfAttribute } from './CocosGltfWrap';
import { CocosMeshMeta, CocosSkeleton, CocosSkeletonMeta } from "./CocosModel";
import { gltf } from './gltf';

export default class CocosModelWriter {

    public wirteFiles(document: Document, meshPath: string, meshMeta: CocosMeshMeta): void {
        const root = document.getRoot();
        const meshes = root.listMeshes();
        if (meshes.length > 1)
            throw new Error("Multiple Skin is not supported.");

        const arrayBuffer = this.wirteMesh(meshMeta, meshes[0]);
        this.writeJointMaps(meshMeta, root);
        this.writeBounds(meshMeta, root);

        fs.mkdirSync(path.dirname(meshPath), { recursive: true });
        fs.writeFileSync(meshPath + ".bin", Buffer.from(arrayBuffer), "binary");
        fs.writeFileSync(meshPath + ".json", JSON.stringify(meshMeta.data), "utf-8");

        // if (skeletonMeta != null && skeleton != null) {
        //     const skeletonMetaData = this.wirteSkeleton(skeletonMeta, skeleton);
        //     fs.writeFileSync(meshPath + ".json", JSON.stringify(skeletonMetaData), "utf-8");
        // }
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
                const attributeName = CocosToGltfAttribute[name];
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

    // private wirteSkeleton(meta: CocosSkeletonMeta, skeleton: CocosSkeleton): Object {
    //     // const skeletonMeta = meta.clone();
    //     meta.joints.length = 0;
    //     for (let i = 0; i < skeleton.joints.length; i++)
    //         meta.joints[i] = skeleton.joints[i];
    //     const matrixType = meta.bindposes[0][0];
    //     meta.bindposes.length = 0;
    //     for (let i = 0; i < skeleton.bindPoses.length; i++)
    //         meta.bindposes[i] = new Array(matrixType, ...skeleton.bindPoses[i]);
    //     const bindPosesValueType = meta.bindposesValueType[1];
    //     meta.bindposesValueType.length = 1;
    //     for (let i = 1; i < skeleton.bindPoses.length + 1; i++)
    //         meta.bindposesValueType[i] = bindPosesValueType;
    //     return meta.data;
    // }
}