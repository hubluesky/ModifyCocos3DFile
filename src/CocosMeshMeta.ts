import { ReadonlyVec3 } from "gl-matrix";
import { ISubMesh, IVertexBundle } from "./cocos/Cocos";
import { murmurhash2_32_gc } from "./cocos/murmurhash2_gc";

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

    public set hash(v) { this.data[5][0][2] = v; }
    private getBin() { return this.data[5][0][3]; }

    public constructor(jsonText: string, readonly filename: string) {
        this._data = JSON.parse(jsonText);
        const bin = this.getBin()[0];
        console.assert(bin != null, "The mesh meta file format is incorrect.");
        this.primitives = bin["primitives"];
        this.vertexBundles = bin["vertexBundles"];
        this.jointMaps = bin["jointMaps"];
    }

    public static computeHash(data: Uint8Array): number {
        return murmurhash2_32_gc(data, 666);
    }
}
