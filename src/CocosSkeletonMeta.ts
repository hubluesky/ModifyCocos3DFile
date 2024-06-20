import { ArrayLike } from "./cocos/Cocos";
import { murmurhash2_32_gc } from "./cocos/murmurhash2_gc";

export class CocosSkeletonMeta {
    public readonly jointNames: string[];
    public readonly bindposes: ArrayLike<number>[];
    public readonly bindposesValueType: ArrayLike<number>[];

    private _data: any;
    public get data() { return this._data; }

    private getBin() { return this.data[5][0]; }
    public get hash() { return this.getBin()[2]; }
    public set hash(v) { this.getBin()[2] = v; }

    public constructor(jsonText: string, readonly filename: string) {
        this._data = JSON.parse(jsonText);
        const bin = this.getBin();
        console.assert(bin != null, "The skeleton meta file format is incorrect.");
        this.jointNames = bin[3];
        this.bindposesValueType = bin[4];
        this.bindposes = bin[4][0];
    }

    public clone(): CocosSkeletonMeta {
        return new CocosSkeletonMeta(JSON.stringify(this.data), this.filename);
    }

    public static computeHash(bindposes: ArrayLike<number>[]): number {
        let str = '';
        for (let i = 0; i < bindposes.length; i++) {
            const ibm = bindposes[i];
            str += `${ibm[1].toPrecision(2)} ${ibm[2].toPrecision(2)} ${ibm[3].toPrecision(2)} ${ibm[4].toPrecision(2)} ${ibm[5].toPrecision(2)} ${ibm[6].toPrecision(2)} ${ibm[7].toPrecision(2)} ${ibm[8].toPrecision(2)} ${ibm[9].toPrecision(2)} ${ibm[10].toPrecision(2)} ${ibm[11].toPrecision(2)} ${ibm[12].toPrecision(2)} ${ibm[13].toPrecision(2)} ${ibm[14].toPrecision(2)} ${ibm[15].toPrecision(2)} ${ibm[16].toPrecision(2)}\n`;
        }
        return murmurhash2_32_gc(str, 666);
    }
}
