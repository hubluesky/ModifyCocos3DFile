import { Attribute, FormatInfos, TypedArray, getIndexStrideCtor, getOffset, getReader, getTypedArrayConstructor } from "./Cocos";
import { CocosMeshMeta } from "./CocosMeshMeta";

export interface AttributeValue {
    describe: Attribute;
    data: TypedArray;
}

export interface Primitive {
    indices: TypedArray;
    bundles: readonly VertexBundle[];
}

export interface VertexBundle {
    readonly attributeValues: readonly AttributeValue[];
}

export class CocosMesh {
    public readonly bundles: VertexBundle[] = [];
    public readonly primitives: Primitive[] = [];

    public constructor(arrayBuffer: ArrayBuffer, meshMeta: CocosMeshMeta) {
        for (let iv = 0; iv < meshMeta.vertexBundles.length; iv++) {
            const vertexBundle = meshMeta.vertexBundles[iv];
            const attributeValues: AttributeValue[] = [];
            this.bundles[iv] = { attributeValues };
            for (let ia = 0; ia < vertexBundle.attributes.length; ia++) {
                const view = new DataView(arrayBuffer, vertexBundle.view.offset + getOffset(vertexBundle.attributes, ia));
                const { format } = vertexBundle.attributes[ia];
                const reader = getReader(view, format)!;
                console.assert(reader != null);
                const vertexCount = vertexBundle.view.count;
                const vertexStride = vertexBundle.view.stride;
                const componentCount = FormatInfos[format].count;

                const StorageConstructor = getTypedArrayConstructor(FormatInfos[format]);
                const storage = new StorageConstructor(vertexCount * componentCount);
                attributeValues[ia] = { describe: vertexBundle.attributes[ia], data: storage };

                for (let iVertex = 0; iVertex < vertexCount; iVertex++) {
                    for (let iComponent = 0; iComponent < componentCount; iComponent++) {
                        const inputIndex = iVertex * vertexStride + storage.BYTES_PER_ELEMENT * iComponent;
                        storage[componentCount * iVertex + iComponent] = reader(inputIndex);
                    }
                }
            }
        }

        for (const primitive of meshMeta.primitives) {
            const indexView = primitive.indexView!;
            const Ctor = getIndexStrideCtor(indexView.stride);
            const indices = new Ctor(arrayBuffer, indexView.offset, indexView.count);
            const bundles: VertexBundle[] = [];
            for (let bundleIndex of primitive.vertexBundelIndices)
                bundles.push(this.bundles[bundleIndex]);
            this.primitives.push({ indices, bundles });
        }
    }
}
