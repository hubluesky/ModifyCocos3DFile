import { AttributeName } from "./Cocos";
import { gltf } from "./gltf";

export const CocosToGltfAttribute: Record<AttributeName, gltf.AttributeName> = {
    "a_position": gltf.AttributeName.POSITION,
    "a_normal": gltf.AttributeName.NORMAL,
    "a_tangent": gltf.AttributeName.TANGENT,
    "a_texCoord": gltf.AttributeName.TEXCOORD_0,
    "a_texCoord1": gltf.AttributeName.TEXCOORD_1,
    "a_texCoord2": gltf.AttributeName.TEXCOORD_2,
    "a_color": gltf.AttributeName.COLOR_0,
    "a_joints": gltf.AttributeName.JOINTS_0,
    "a_weights": gltf.AttributeName.WEIGHTS_0,
    
} as any;