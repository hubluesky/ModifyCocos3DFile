import { Document, NodeIO } from '@gltf-transform/core';
import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import { CocosMeshMeta } from "./CocosMeshMeta";
import CocosModelWriter from './CocosModelWriter';
import { CocosSkeletonMeta } from "./CocosSkeletonMeta";
import { decodeUuid } from './decode-uuid';
import { normals } from './gltf-transform/normals';
import { tangents } from './gltf-transform/tangents';
import { io } from './IO';
import { decodeCCONBinary } from './ccon';
import { CocosAnimationMeta } from './CocosAnimationMeta';


/**
 * FBX version 2019 or higher;
 * @param input 
 * @param out 
 */
function cocosFbxToGltf(input: string, out: string) {
    const toolPath = `./fbx-gltf-conv/${process.platform}/Release/bin/FBX-glTF-conv`;
    const result = child_process.spawnSync(toolPath, [input, "--out", out]);
    if (result.status != 0) {
        const err = result.error != null ? result.error : result.stderr?.toString();
        throw new Error("fbx-gltf-conv convert failed:" + err, { cause: 101 });
    }
}

/**
 * FBX version 2019 or higher;
 * @param filename fbx文件路径
 */
export function fbxToGltf(filename: string, tempPath: string = "temp/fbx2gltf"): string {
    const gltfName = path.basename(filename, path.extname(filename));
    const gltfPath = `${tempPath}/${gltfName}/${gltfName}.gltf`;
    fs.mkdirSync(path.dirname(gltfPath), { recursive: true });
    cocosFbxToGltf(filename, gltfPath);
    return gltfPath;
}

async function computeNormalAndTangent(document: Document, overwrite: boolean = false) {
    await document.transform(normals({ overwrite: overwrite }));
    await document.transform(tangents({ overwrite: overwrite }));
}

function readPrefabDependences(cocosPath: string, ext: string): string[] {
    const prefabPath = `${cocosPath}/${path.basename(cocosPath)}.json`;
    if (!fs.existsSync(prefabPath)) return null;
    const content = fs.readFileSync(prefabPath, { encoding: "utf8" });
    try {
        const jsonObject = JSON.parse(content);
        if (!Array.isArray(jsonObject)) return null;
        if (jsonObject.length < 2 || !Array.isArray(jsonObject[1]))
            return null;
        const filenames: string[] = jsonObject[1];
        for (let i = 0; i < filenames.length; i++)
            filenames[i] = decodeUuid(filenames[i]) + ext;
        return filenames;
    } catch (error) {
        return null;
    }
}

function searchCocosFile(cocosPath: string, filenames: string[], type: string): { content: string, filename: string } {
    for (const filename of filenames) {
        try {
            const content = fs.readFileSync(`${cocosPath}/${filename}`, { encoding: "utf8" });
            if (content == null) continue;
            const jsonObject = JSON.parse(content);
            if (!Array.isArray(jsonObject)) continue;
            if (jsonObject.length < 3 || jsonObject[3].length < 1 || jsonObject[3][0].length < 1)
                continue;
            const jsonType = jsonObject[3][0][0];
            if (jsonType == type)
                return { content, filename };
        } catch (error) {
            continue;
        }
    }
}

export async function convertMesh(uri: string, cocosPath: string, outPath: string): Promise<void> {
    const dependenceFilenames = readPrefabDependences(cocosPath, ".json");
    if (dependenceFilenames == null)
        throw new Error("Can not find cocos prefab meta file. Maybe be merge by one josn.", { cause: 103 });

    const meshResult = searchCocosFile(cocosPath, dependenceFilenames, "cc.Mesh");
    if (meshResult == null)
        throw new Error("Can not find cocos mesh meta file. Maybe be merge by one josn.", { cause: 104 });

    const document = await new NodeIO().read(uri);
    await computeNormalAndTangent(document);

    const metaData = new CocosMeshMeta(meshResult.content);

    const root = document.getRoot();
    const modelWrite = new CocosModelWriter();
    if (metaData.jointMaps != null) {
        const skins = root.listSkins();
        if (skins == null || skins.length == 0)
            throw new Error("The uploaded file does not contain skeleton information.", { cause: 105 });

        // 这里检查不正确，cocos的mesh里有jointMaps，而gltf里没有。
        // if (metaData.jointMaps.length != skins.length)
        //     throw new Error("joints count is not match.", { cause: 108 });
        // for (let i = 0; i < skins.length; i++) {
        //     const jointNodes = skins[i].listJoints();
        //     const jointMaps = metaData.jointMaps[i];
        //     if (jointMaps == null || jointNodes.length != jointMaps.length)
        //         throw new Error(`joints count is not match. source ${jointMaps?.length} upload ${jointNodes.length}`, { cause: 108 });
        // }

        const skeletonResult = searchCocosFile(cocosPath, dependenceFilenames, "cc.Skeleton");
        if (skeletonResult == null)
            throw new Error("Can not find cocos skeleton meta file. Maybe be merge by one josn.", { cause: 106 });

        const skeletonMeta = new CocosSkeletonMeta(skeletonResult.content);

        if (skins.length > 1)
            throw new Error(`Skin count is not match. source 1, upload ${skins.length}.`, { cause: 107 });

        // const skeleton = new CocosSkeleton(jointNames, inverseBindArray, elementSize);
        const meshMetaOutPath = path.join(outPath, skeletonResult.filename);
        modelWrite.writeSkeletonFiles(meshMetaOutPath, skeletonMeta, skins[0]);
    }

    const meshMetaOutPath = path.join(outPath, meshResult.filename);
    return modelWrite.writeMeshFiles(meshMetaOutPath, metaData, document);
}

export async function convertAnimation(uri: string, cocosPath: string, outPath: string): Promise<void> {
    const dependenceFilenames = readPrefabDependences(cocosPath, ".cconb");
    if (dependenceFilenames == null)
        throw new Error("Can not find cocos prefab meta file. Maybe be merge by one josn.", { cause: 103 });
    console.assert(dependenceFilenames.length == 1);
    const filename = dependenceFilenames[0];
    const arrayBuffer = io.readBinaryFileSync(`${cocosPath}/${filename}`);
    try {
        var ccon = decodeCCONBinary(new Uint8Array(arrayBuffer));
    } catch (err) {
        throw new Error("Animation file format is error." + err, { cause: 121 });
    }

    const animationMeta = new CocosAnimationMeta(ccon);

    const document = await new NodeIO().read(uri);
    const root = document.getRoot();
    const animations = root.listAnimations();
    if (animations.length > 1)
        throw new Error(`Animation count is not match. source 1, upload ${animations.length}.`, { cause: 122 });
    
    const modelWrite = new CocosModelWriter();
    return modelWrite.writeAnimationFiles(path.join(outPath, filename), animationMeta, animations[0]);
}