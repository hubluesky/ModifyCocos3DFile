import * as fs from 'fs';
import path from 'path';
import { AttributeName, FormatInfos, getComponentByteLength, getIndexStrideCtor, getOffset, getWriter } from './Cocos';
import { CocosMeshMeta } from "./CocosMesh";
import Geometry from "./Geometry";

export default class CocosModelWriter {

    /**
     * Cocos的模型文件写入
     * @param filename 模型文件路径，不带后缀
     */
    public constructor(filename: string, meshMeta: CocosMeshMeta, geometry: Geometry) {
        if (geometry.primitiveDatas.length != meshMeta.primitives.length)
            throw `子网络数量不匹配${geometry.primitiveDatas.length} ${meshMeta.primitives.length}`;
        const arrayBuffer = this.wirteModel(meshMeta, geometry);

        fs.mkdirSync(path.dirname(filename), { recursive: true });
        fs.writeFileSync(filename + ".bin", Buffer.from(arrayBuffer), "binary");
        fs.writeFileSync(filename + ".json", JSON.stringify(meshMeta.data), "utf-8");
    }

    private getArrayBufferSize(meshMeta: CocosMeshMeta, geometry: Geometry): number {
        let size = 0;
        for (let i = 0; i < meshMeta.vertexBundles.length; i++) {
            const vb = meshMeta.vertexBundles[i];
            const accessor = geometry.getAttributeAccessor(i, AttributeName.ATTR_POSITION);
            vb.view.count = accessor.elementCnt;
            vb.view.length = vb.view.count * vb.view.stride;
            vb.view.offset = size;
            size += vb.view.length;
        }
        for (let p = 0; p < meshMeta.primitives.length; p++) {
            const indexView = meshMeta.primitives[p].indexView;
            if (indexView == null) continue;
            const indices = geometry.primitiveDatas[p].indicesAccessor;
            indexView.offset = size;
            indexView.count = indices.elementCnt;
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
                const view = new DataView(arrayBuffer, vertexBundle.view.offset + getOffset(vertexBundle.attributes, ia));
                const writer = getWriter(view, format)!;
                console.assert(writer != null);

                const attributeData = geometry.getAttributeAccessor(iv, name);
                // const stride = vertexBundle.view.stride;
                const outputStride = vertexBundle.view.stride;
                const outputComponentByteLength = getComponentByteLength(format);
                // let text = "\n";
                for (let iVertex = 0; iVertex < attributeData.elementCnt; iVertex++) {
                    for (let iComponent = 0; iComponent < attributeData.componentLen; iComponent++) {
                        const inputOffset = attributeData.componentLen * iVertex + iComponent;
                        const outputOffset = outputStride * iVertex + outputComponentByteLength * iComponent;
                        
                        // text += attributeData.data[inputOffset] + ",";
                        writer(outputOffset, attributeData.data[inputOffset]);
                    }
                    // text += "\n";
                }
                // if (name == AttributeName.ATTR_POSITION) {
                //     console.log(name, attributeData.elementCnt, attributeData.componentLen, text);
                //     console.log("attributeData", attributeData.data);
                // }
            }
        }

        for (let p = 0; p < meshMeta.primitives.length; p++) {
            const primitive = meshMeta.primitives[p];
            if (primitive == null) continue;
            const indexView = primitive.indexView;
            const Ctor = getIndexStrideCtor(indexView.stride);
            const ibo = new Ctor(arrayBuffer, indexView.offset, indexView.count);

            const indicesAccessor = geometry.primitiveDatas[p].indicesAccessor;
            for (let i = 0; i < indicesAccessor.elementCnt; i++) {
                ibo[i] = indicesAccessor.data[i];
            }

            if (meshMeta.jointMaps != null) {
                if (meshMeta.jointMaps[p] != null && geometry.primitiveDatas[p].joints != null)
                    meshMeta.jointMaps[p] = geometry.primitiveDatas[p].joints;
            }
        }

        const bound = geometry.getBoundPositions();
        meshMeta.minPosition = bound.boundMin;
        meshMeta.maxPosition = bound.boundMax;
        console.log("bound", bound.boundMin, bound.boundMax);
        return arrayBuffer;
    }
}