import { Document, NodeIO } from '@gltf-transform/core';
import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import { CocosAnimationMeta } from './CocosAnimationMeta';
import { CocosMeshMeta } from "./CocosMeshMeta";
import CocosModelWriter from './CocosModelWriter';
import { CocosSkeletonMeta } from "./CocosSkeletonMeta";
import { ConvertError } from './ConvertError';
import { io } from './IO';
import { decodeCCONBinary } from './cocos/ccon';
import { decodeUuid } from './cocos/decode-uuid';
import { normals } from './gltf-transform/normals';
import { tangents } from './gltf-transform/tangents';
import { CocosMeshPrefabMeta } from './CocosMeshPrefabMeta';
import { _d2r } from './Math';

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
        throw new ConvertError(101, "fbx-gltf-conv convert failed:" + err, err);
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


/**
 * FBX version 2019 or higher;
 * @param filename fbx文件路径
 */
export function fbxToGlb(filename: string, tempPath: string = "temp/fbx2gltf"): string {
    const gltfName = path.basename(filename, path.extname(filename));
    const gltfPath = `${tempPath}/${gltfName}/${gltfName}.glb`;
    fs.mkdirSync(path.dirname(gltfPath), { recursive: true });
    cocosFbxToGltf(filename, gltfPath);
    return gltfPath;
}

async function computeNormalAndTangent(document: Document, overwrite: boolean = false) {
    await document.transform(normals({ overwrite: overwrite }));
    await document.transform(tangents({ overwrite: overwrite }));
}

function readPrefabDependences(cocosPath: string, ext: string): { prefabObject: Object, prefabFilename: string, filenames: string[] } {
    const filename = `${path.basename(cocosPath)}.json`;
    const prefabPath = `${cocosPath}/${filename}`;
    if (!fs.existsSync(prefabPath)) return null;
    const content = fs.readFileSync(prefabPath, { encoding: "utf8" });
    try {
        const jsonObject = JSON.parse(content);
        if (!Array.isArray(jsonObject)) return null;
        if (jsonObject.length < 2 || !Array.isArray(jsonObject[1]))
            return null;
        const filenames: string[] = Array.from(jsonObject[1]);
        for (let i = 0; i < filenames.length; i++)
            filenames[i] = decodeUuid(filenames[i]) + ext;
        return { prefabObject: jsonObject, prefabFilename: filename, filenames };
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
    const result = readPrefabDependences(cocosPath, ".json");
    if (result == null || result.filenames.length == 0)
        throw new ConvertError(103, "Can not find cocos prefab meta file. Maybe be merge by one josn.");

    const meshResult = searchCocosFile(cocosPath, result.filenames, "cc.Mesh");
    if (meshResult == null)
        throw new ConvertError(104, "Can not find cocos mesh meta file. Maybe be merge by one josn.");

    try {
        var document = await new NodeIO().read(uri);
    } catch (error) {
        throw new ConvertError(102, "Gltf file is invalid, please use glTF-Validator to check.", error.message);
    }
    await computeNormalAndTangent(document);

    const prefabMeta = new CocosMeshPrefabMeta(result.prefabObject, result.prefabFilename);
    const metaData = new CocosMeshMeta(meshResult.content, meshResult.filename);

    const root = document.getRoot();
    const modelWrite = new CocosModelWriter();
    if (metaData.jointMaps != null) {
        const skins = root.listSkins();
        if (skins == null || skins.length == 0)
            throw new ConvertError(105, "The uploaded file does not contain skeleton information.");

        // 这里检查不正确，cocos的mesh里有jointMaps，而gltf里没有。
        // if (metaData.jointMaps.length != skins.length)
        // throw new ConvertError(108, "joints count is not match.");
        // for (let i = 0; i < skins.length; i++) {
        //     const jointNodes = skins[i].listJoints();
        //     const jointMaps = metaData.jointMaps[i];
        //     if (jointMaps == null || jointNodes.length != jointMaps.length)
        // throw new ConvertError(108, `joints count is not match. source ${jointMaps?.length} upload ${jointNodes.length}`, jointMaps?.length, jointNodes.length);
        // }

        const skeletonResult = searchCocosFile(cocosPath, result.filenames, "cc.Skeleton");
        if (skeletonResult == null)
            throw new ConvertError(1106, "Can not find cocos skeleton meta file. Maybe be merge by one josn.");

        const skeletonMeta = new CocosSkeletonMeta(skeletonResult.content, skeletonResult.filename);

        if (skins.length > 1)
            throw new ConvertError(107, `Skin count is not match. source 1, upload ${skins.length}.`, skins.length);

        // const skeleton = new CocosSkeleton(jointNames, inverseBindArray, elementSize);
        modelWrite.writeSkeletonFiles(outPath, skeletonMeta, skins[0]);
    }

    // const meshMetaOutPath = path.join(outPath, meshResult.filename);
    return modelWrite.writeMeshFiles(outPath, prefabMeta, metaData, document);
}

export async function convertAnimation(uri: string, cocosPath: string, outPath: string, rotateAngle?: number): Promise<void> {
    const result = readPrefabDependences(cocosPath, ".cconb");
    if (result == null || result.filenames.length == 0)
        throw new ConvertError(110, "Can not find cocos animation file. Maybe be merge by one josn");
    const filename = result.filenames[0];
    const arrayBuffer = io.readBinaryFileSync(`${cocosPath}/${filename}`);
    try {
        var ccon = decodeCCONBinary(new Uint8Array(arrayBuffer));
    } catch (err) {
        throw new ConvertError(121, "Animation file format is error." + err, err);
    }

    const animationMeta = new CocosAnimationMeta(ccon);

    try {
        var document = await new NodeIO().read(uri);
    } catch (error) {
        throw new ConvertError(102, "Gltf file is invalid, please use glTF-Validator to check.");
    }
    const root = document.getRoot();
    const animations = root.listAnimations();
    if (animations.length > 1)
        throw new ConvertError(122, `Animation count is not match. source 1, upload ${animations.length}.`, animations.length);

    const animation = animations[0];
    const modelWrite = new CocosModelWriter();
    if (rotateAngle && rotateAngle != 0)
        modelWrite.rotateAnimationRoot(animation, rotateAngle);
    return modelWrite.writeAnimationFiles(path.join(outPath, filename), animationMeta, document, animation);
}