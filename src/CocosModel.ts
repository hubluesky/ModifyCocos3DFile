import { Attribute, FormatInfos, getIndexStrideCtor, getOffset, getReader, getTypedArrayConstructor, ISubMesh, IVertexBundle, TypedArray } from "./Cocos";

interface ArrayLike<T> {
    readonly length: number;
    readonly [n: number]: T;
    /** Iterator */
    [Symbol.iterator](): IterableIterator<T>;
}

export type ReadonlyVec3 = readonly [number, number, number] | ArrayLike<number>;
export type ReadonlyMat4 = readonly [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number] | ArrayLike<number>;

export class CocosMeshMeta {
    public readonly primitives: ISubMesh[];
    public readonly vertexBundles: IVertexBundle[];
    public readonly jointMaps?: number[][];
    public set minPosition(v: ReadonlyVec3) {
        const minPositionArray: number[] = this.getBin()[3];
        minPositionArray[1] = v[0];
        minPositionArray[2] = v[1];
        minPositionArray[3] = v[2];
    }
    public set maxPosition(v: ReadonlyVec3) {
        const maxPositionArray: number[] = this.getBin()[6];
        maxPositionArray[1] = v[0];
        maxPositionArray[2] = v[1];
        maxPositionArray[3] = v[2];
    }

    private _data: any;
    public get data() { return this._data; }

    private getBin() { return this.data[5][0][3]; }

    public constructor(jsonText: string) {
        this._data = JSON.parse(jsonText);
        const bin = this.getBin()[0];
        console.assert(bin != null, "The mesh meta file format is incorrect.");
        this.primitives = bin["primitives"];
        this.vertexBundles = bin["vertexBundles"];
        this.jointMaps = bin["jointMaps"];
    }
}

interface AttributeValue {
    attribute: Attribute;
    data: TypedArray;
}

interface VertexBundle {
    readonly attributeValues: AttributeValue[];
}

export class CocosSkeletonMeta {
    public readonly joints: string[];
    public readonly bindposes: ArrayLike<number>[];
    public readonly bindposesValueType: ArrayLike<number>[];

    private _data: any;
    public get data() { return this._data; }

    private getBin() { return this.data[5][0]; }

    public constructor(jsonText: string) {
        this._data = JSON.parse(jsonText);
        const bin = this.getBin();
        console.assert(bin != null, "The skeleton meta file format is incorrect.");
        this.joints = bin[3];
        this.bindposesValueType = bin[4];
        this.bindposes = bin[4][0];
    }

    public clone(): CocosSkeletonMeta {
        return new CocosSkeletonMeta(JSON.stringify(this.data));
    }
}

export class CocosSkeleton {
    public readonly joints: readonly string[];
    public readonly bindPoses: ArrayLike<number>[];

    public constructor(joints: readonly string[], bindPoses: ArrayLike<number>, componentSize: number = 16) {
        this.joints = joints;

        this.bindPoses = new Array(bindPoses.length / componentSize);
        for (let i = 0; i < bindPoses.length / componentSize; i++) {
            const mat4: number[] = [];
            for (let j = 0; j < componentSize; j++)
                mat4[j] = bindPoses[i * componentSize + j];
            this.bindPoses[i] = mat4;
        }
    }
}

export class CocosMesh {
    public readonly bundles: VertexBundle[] = [];
    public readonly primitives: TypedArray[] = [];

    public constructor(arrayBuffer: ArrayBuffer, meshMeta: CocosMeshMeta) {
        for (let iv = 0; iv < meshMeta.vertexBundles.length; iv++) {
            const vertexBundle = meshMeta.vertexBundles[iv];
            this.bundles[iv] = { attributeValues: [] };
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
                this.bundles[iv].attributeValues[ia] = { attribute: vertexBundle.attributes[ia], data: storage };

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
            const ibo = new Ctor(arrayBuffer, indexView.offset, indexView.count);
            this.primitives.push(ibo);
        }
    }
}
