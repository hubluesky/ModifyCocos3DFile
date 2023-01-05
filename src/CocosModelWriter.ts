import * as fs from 'fs';
import path from 'path';
import { AttributeName, FormatInfos, getComponentByteLength, getIndexStrideCtor, getOffset, getWriter } from './Cocos';
import { CocosMeshMeta, CocosSkeleton, CocosSkeletonMeta } from "./CocosModel";
import Geometry from "./Geometry";

export default class CocosModelWriter {

    /**
     * Cocos的模型文件写入
     * @param filename 模型文件路径，不带后缀
     */
    public constructor(filename: string, meshMeta: CocosMeshMeta, geometry: Geometry, skeletonMeta: CocosSkeletonMeta, skeleton: CocosSkeleton) {
        if (geometry.primitiveDatas.length != meshMeta.primitives.length)
            throw `子网络数量不匹配${geometry.primitiveDatas.length} ${meshMeta.primitives.length}`;
        const arrayBuffer = this.wirteModel(meshMeta, geometry);

        fs.mkdirSync(path.dirname(filename), { recursive: true });
        fs.writeFileSync(filename + ".bin", Buffer.from(arrayBuffer), "binary");
        fs.writeFileSync(filename + "@mesh.json", JSON.stringify(meshMeta.data), "utf-8");

        if (skeletonMeta != null && skeleton != null) {
            const skeletonMetaData = this.wirteSkeleton(skeletonMeta, skeleton);
            fs.writeFileSync(filename + "@skeleton.json", JSON.stringify(skeletonMetaData), "utf-8");
        }
    }

    private getArrayBufferSize(meshMeta: CocosMeshMeta, geometry: Geometry): number {
        let size = 0;
        for (let i = 0; i < meshMeta.vertexBundles.length; i++) {
            const vb = meshMeta.vertexBundles[i];
            const typeArray = geometry.getAttributeAccessor(i, AttributeName.ATTR_POSITION);
            vb.view.count = typeArray.length / 3;
            vb.view.length = vb.view.count * vb.view.stride;
            vb.view.offset = size;
            size += vb.view.length;
        }
        for (let p = 0; p < meshMeta.primitives.length; p++) {
            const indexView = meshMeta.primitives[p].indexView;
            if (indexView == null) continue;
            const indices = geometry.primitiveDatas[p].indices;
            indexView.offset = size;
            indexView.count = indices.length;
            indexView.length = indexView.count * indexView.stride;
            size += indexView.length;
        }
        return size;
    }

    private wirteModel(meshMeta: CocosMeshMeta, geometry: Geometry): ArrayBuffer {
        const arrayBufferSize = this.getArrayBufferSize(meshMeta, geometry);
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
                const typeArray = geometry.getAttributeAccessor(iv, name);
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

            const indicesArray = geometry.primitiveDatas[p].indices;
            for (let i = 0; i < indicesArray.length; i++) {
                ibo[i] = indicesArray[i];
            }

            if (meshMeta.jointMaps != null) {
                if (meshMeta.jointMaps[p] != null && geometry.primitiveDatas[p].joints != null)
                    meshMeta.jointMaps[p] = geometry.primitiveDatas[p].joints;
            }
        }

        const bound = geometry.getBoundPositions();
        meshMeta.minPosition = bound.boundMin;
        meshMeta.maxPosition = bound.boundMax;
        return arrayBuffer;
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