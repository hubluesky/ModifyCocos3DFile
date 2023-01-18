import { GLTF } from "@gltf-transform/core/dist/types/gltf";

export namespace gltf {
    export enum AttributeName {
        POSITION = "POSITION",
        NORMAL = "NORMAL",
        TANGENT = "TANGENT",
        TEXCOORD_0 = "TEXCOORD_0",
        TEXCOORD_1 = "TEXCOORD_1",
        TEXCOORD_2 = "TEXCOORD_2",
        COLOR_0 = "COLOR_0",
        JOINTS_0 = "JOINTS_0",
        WEIGHTS_0 = "WEIGHTS_0",
    }

    export const AttributeElementType: Record<AttributeName, GLTF.AccessorType> = {
        "POSITION": "VEC3",
        "NORMAL": "VEC3",
        "TANGENT": "VEC4",
        "TEXCOORD_0": "VEC2",
        "TEXCOORD_1": "VEC2",
        "TEXCOORD_2": "VEC2",
        "COLOR_0": "VEC4",
        "JOINTS_0": "SCALAR",
        "WEIGHTS_0": "SCALAR",
    };
}