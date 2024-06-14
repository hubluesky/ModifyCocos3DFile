import { CLASS_KEYS, File, MASK_CLASS, OBJ_DATA_MASK } from "./Cocos";

function fillArray(source: ArrayLike<number>, target: number[], startIndex = 1): void {
    for (let i = startIndex; i < target.length; i++)
        target[i] = source[i - startIndex];
}

const _r2d = 180.0 / Math.PI;
export const EPSILON = 0.000001;

function toEuler(q: ArrayLike<number>): number[] {
    const x = q[0], y = q[1], z = q[2], w = q[3];
    let bank = 0;
    let heading = 0;
    let attitude = 0;
    const test = x * y + z * w;
    if (test > 0.499999) {
        bank = 0; // default to zero
        heading = 2 * Math.atan2(x, w) * _r2d;
        attitude = 90;
    } else if (test < -0.499999) {
        bank = 0; // default to zero
        heading = -2 * Math.atan2(x, w) * _r2d;
        attitude = -90;
    } else {
        const sqx = x * x;
        const sqy = y * y;
        const sqz = z * z;
        bank = Math.atan2(2 * x * w - 2 * y * z, 1 - 2 * sqx - 2 * sqz) * _r2d;
        heading = Math.atan2(2 * y * w - 2 * x * z, 1 - 2 * sqy - 2 * sqz) * _r2d;
        attitude = Math.asin(2 * test) * _r2d;
    }
    return [bank, heading, attitude];
}

function vecIsZero(value: readonly number[]): boolean {
    for (let i = 0; i < value.length; i++)
        if (Math.abs(value[i]) > EPSILON) return false;
    return true;
}

function vecIsOne(value: readonly number[]): boolean {
    for (let i = 0; i < value.length; i++)
        if (Math.abs(value[i] - 1) > EPSILON) return false;
    return true;
}

function quatIsIdentity(value: readonly number[]): boolean {
    for (let i = 0; i < value.length - 1; i++)
        if (Math.abs(value[i]) > EPSILON) return false;
    if (Math.abs(value[value.length - 1] - 1) > EPSILON) return false;
    return true;
}

class PrefabNode {
    private _name: string;
    public get name(): string { return this._name; }
    private _lpos: number[];
    public get lpos(): readonly number[] { return this._lpos; }
    public set lpos(value: readonly number[]) {
        if (this._lpos != null)
            fillArray(value, this._lpos);
        else if (!vecIsZero(value))
            this.addTransform("_lpos", 1, value);
    }
    private _lrot: number[];
    public get lrot(): readonly number[] { return this._lrot; }
    public set lrot(value: readonly number[]) {
        if (this.lrot != null)
            fillArray(value, this._lrot);
        else if (!quatIsIdentity(value))
            this.addTransform("_lrot", 3, value);
    }
    private _euler: number[];
    public get euler(): readonly number[] { return this._euler; }
    public set euler(value: readonly number[]) {
        value = toEuler(value);
        if (this._euler != null)
            fillArray(value, this._euler);
        else if (!vecIsZero(value))
            this.addTransform("_euler", 1, value);
    }
    private _lscale: number[];
    public get lscale(): readonly number[] { return this._lscale; }
    public set lscale(value: readonly number[]) {
        if (this._lscale != null)
            fillArray(value, this._lscale);
        else if (!vecIsOne(value))
            this.addTransform("_lscale", 1, toEuler(value));
    }

    private addTransform(key: string, type: number, value: readonly number[]): void {
        this[key] = [type, ...value];
        let indexMask = this.keys.indexOf(key);
        if (indexMask == -1) {
            indexMask = this.keys.length;
            this.keys.push(key);
            this.clazz.push(5);
        }
        this.mask.splice(this.objectData.length, 0, indexMask);
        this.objectData.push(this[key]);
    }

    constructor(readonly objectData: any, readonly mask: number[], readonly keys: string[], readonly clazz: any[]) { }
}

const prefabNodeKeys = Object.keys(new PrefabNode(undefined, undefined, undefined, undefined));

export class CocosMeshPrefabMeta {
    public readonly prefabNodes: PrefabNode[] = [];

    private _jsonData: any;
    public get data() { return this._jsonData; }

    private getBin() { return this.data[5]; }

    public constructor(jsonObject: Object, readonly filename: string) {
        this._jsonData = jsonObject;
        const bin = this.getBin();
        const classes = this.data[File.SharedClasses];

        const parseNode = (objectData: any) => {
            const mask = this.data[File.SharedMasks][objectData[OBJ_DATA_MASK]];
            if (mask == null) return;
            const indexClazz = mask[MASK_CLASS];
            const clazz = classes[indexClazz];
            const keys = clazz[CLASS_KEYS];

            let prefabNode: PrefabNode;
            for (let o = MASK_CLASS + 1; o < objectData.length; o++) {
                const key = keys[mask[o]];
                if (key == "_children")
                    parseNode(objectData[o][0]);
                else if (prefabNodeKeys.indexOf(key) != -1) {
                    if (prefabNode == null) prefabNode = new PrefabNode(objectData, mask, keys, clazz);
                    prefabNode[key] = objectData[o];
                }
            }
            if (prefabNode != null)
                this.prefabNodes.push(prefabNode);
        }

        for (let i = 0; i < bin.length; i++) {
            const objectData = bin[i];
            parseNode(objectData);
        }
    }

    public clone(): CocosMeshPrefabMeta {
        return new CocosMeshPrefabMeta(JSON.stringify(this.data), this.filename);
    }
}
