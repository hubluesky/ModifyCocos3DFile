import { ArrayLike } from "./Cocos";


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
