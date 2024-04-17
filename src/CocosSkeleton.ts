import { ArrayLike } from "./Cocos";


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
