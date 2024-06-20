import { ArrayLike } from "./cocos/Cocos";

export type ReadonlyVec3 = readonly [number, number, number] | ArrayLike<number>;
export type ReadonlyMat4 = readonly [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number] | ArrayLike<number>;