import { GLTF } from "@gltf-transform/core";
import { CCON, decodeCCONBinary } from "./cocos/ccon";
import { murmurhash2_32_gc } from "./cocos/murmurhash2_gc";

interface Event {
    frame: number;
    func: string;
    params: any[];
}

interface Id { __id__: number; }
interface ExoticNodeAnimation {
    _path: string;
    _position: Id;
    _rotation: Id;
    _scale: Id;
}

interface ExoticTrack {
    times: any;
    values: Id;
}

//#region Cocos Animation has
function floatToHashString(value: number): string {
    // Note: referenced to `Skeleton.prototype.hash`
    return value.toPrecision(2);
}

function floatArrayToHashString(values: Float32Array): string {
    return (values).map((v: number) => Number.parseFloat(floatToHashString(v))).join(' ');
}

export class TrackValuesHash {
    constructor(readonly values: Float32Array, readonly isQuantized: boolean, readonly min: number, readonly extent: number) { }

    public toQuantizedHashString(): string {
        const { min, extent, values } = this;
        return `${0} ${floatToHashString(min)} ${floatToHashString(extent)} ${values.join(' ')}`;
    }

    public toHashString(): string {
        const { isQuantized, values } = this;
        return `${isQuantized} ${isQuantized
            ? this.toQuantizedHashString()
            : floatArrayToHashString(values)
            }`;
    }
}

export class ExoticTrackHash {
    constructor(readonly times: Float32Array, readonly values: TrackValuesHash) { }

    public toHashString(): string {
        const { times, values } = this;
        return `times: ${floatArrayToHashString(times)}; values: ${values.toHashString()}`;
    }
}

export class ExoticNodeAnimationHash {
    public _position: ExoticTrackHash | null;
    public _rotation: ExoticTrackHash | null;
    public _scale: ExoticTrackHash | null;

    constructor(readonly _path = '') { }

    public toHashString(): string {
        return `${this._path}\n${this._position?.toHashString() ?? ''
            }${this._scale?.toHashString() ?? ''
            }${this._rotation?.toHashString() ?? ''}`;
    }
}

export class ExoticAnimationHash {
    private _nodeAnimations: ExoticNodeAnimationHash[] = [];

    public addNodeAnimation(nodeAnimation: ExoticNodeAnimationHash) {
        this._nodeAnimations.push(nodeAnimation);
    }

    public toHashString(): string {
        return this._nodeAnimations.map((nodeAnimation) => nodeAnimation.toHashString()).join('\n');
    }
}

export class CocosAnimatHash {
    constructor(readonly _exoticAnimation: ExoticAnimationHash) { }

    public computeHash(): number {
        const hashString = `Exotic:${this._exoticAnimation?.toHashString() ?? ''}`;
        return murmurhash2_32_gc(hashString, 666);
    }
}

//#endregion

export class CocosAnimationMeta {
    public readonly ccon: CCON;
    public set hash(v: number) { this.list[0]["_hash"] = v; }
    public get sample(): number { return this.list[0]["sample"]; }
    public get speed(): number { return this.list[0]["speed"]; }
    public get wrapMode(): number { return this.list[0]["wrapMode"]; }
    public get duration(): number { return this.list[0]["_duration"]; }
    public set duration(v: number) { this.list[0]["_duration"] = v; }
    public get animationName(): string { return this.list[0]["_name"]; };
    public get exoticAnimationId(): number { return this.list[0]["_exoticAnimation"]["__id__"]; }
    public get nodeAnimations(): { "__id__": number }[] { return this.list[1]["_nodeAnimations"]; }
    public get events(): Event[] { return this.list[0]["_events"]; };
    private _additiveSettings: Object;
    public get additiveSettings() { return this._additiveSettings; }
    private _list: any[] = [];
    public get list(): any[] { return this._list; }

    public getId(): number { return this.list.length - 1; }

    public constructor(ccon: CCON) {
        this.ccon = ccon;
        const document = this.ccon.document;
        this.list.push(document[0]);
        // this.list[0]["_exoticAnimation"]["__id__"] = 1;
        this.list.push({ __type__: "cc.animation.ExoticAnimation", _nodeAnimations: [] });

        const additiveSettings = document[0]["_additiveSettings"];
        if (additiveSettings != null) {
            const indexAdditiveSettings = additiveSettings["__id__"];
            this._additiveSettings = document[indexAdditiveSettings];
        }
    }

    public getOriginExoticNodePath(): string[] {
        const document = this.ccon.document;
        const nodeAnimations: { "__id__": number }[] = document[1]._nodeAnimations;

        const nodePathes: string[] = [];
        for (const node of nodeAnimations) {
            const path = document[node.__id__]["_path"];
            nodePathes.push(path);
        }
        return nodePathes;
    }

    public setAdditiveSettings(): void {
        if (this.additiveSettings == null) return;
        this.list[0]["_additiveSettings"]["__id__"] = this.list.length;
        this.list.push(this.additiveSettings);
    }

    public createAnimationNode(nodePath: string): ExoticNodeAnimation {
        this.nodeAnimations.push({ __id__: this.list.length });
        const json = { __type__: "cc.animation.ExoticNodeAnimation", _path: nodePath, _position: null, _rotation: null, _scale: null };
        this.list.push(json);
        return json;
    }

    public setAnimationNodePropertyId(animationNode: ExoticNodeAnimation, property: "_position" | "_rotation" | "_scale", id: number): void {
        console.assert(animationNode[property] == null);
        animationNode[property] = { __id__: id };
    }

    public createExoticTrack(offset: number, length: number): ExoticTrack {
        const json = {
            __type__: "cc.animation.ExoticTrack",
            times: {
                "__type__": "TypedArrayRef",
                "ctor": "Float32Array", // only support Float32Array
                "offset": offset,
                "length": length,
            },
            values: {
                "__id__": null,
            }
        };
        this.list.push(json);
        return json;
    }

    public createExoticTrackValues(type: GLTF.AccessorType, offset: number, length: number, isQuantized: boolean = false): any {
        const json = {
            __type__: type == "VEC3" ? "cc.animation.ExoticVec3TrackValues" : "cc.animation.ExoticQuatTrackValues",
            _values: {
                "__type__": "TypedArrayRef",
                "ctor": "Float32Array", // only support Float32Array
                "offset": offset,
                "length": length,
            },
            _isQuantized: isQuantized,
        };
        this.list.push(json);
        return json;
    }
}