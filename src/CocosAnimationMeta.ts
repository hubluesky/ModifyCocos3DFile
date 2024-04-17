import { CCON, decodeCCONBinary } from "./ccon";

export class CocosAnimationMeta {
    public readonly ccon: CCON;
    public get animationName(): string { return this.list[0]["_name"]; };
    public get exoticAnimationId(): number { return this.list[0]["_exoticAnimation"]["__id__"]; }
    public get nodeAnimations(): { "__id__": number }[] { return this.list[1]["_nodeAnimations"]; }
    private _list: any[] = [];
    public get list(): any[] { return this._list; }
    private offset: number = 0;

    public constructor(arrayBuffer: ArrayBuffer) {
        this.ccon = decodeCCONBinary(new Uint8Array(arrayBuffer));
        const document = this.ccon.document;
        this.list.push(document[0]);
        this.list[0]["_exoticAnimation"]["__id__"] = 1;
        this.list.push({ __type__: "cc.animation.ExoticAnimation", _nodeAnimations: [] })
    }
}