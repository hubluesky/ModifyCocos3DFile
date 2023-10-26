import { Document, Node, NodeIO } from '@gltf-transform/core';
import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import CocosModelReader from './CocosModelReader';
import CocosModelWriter from './CocosModelWriter';
import { normals } from './gltf-transform/normals';
import { tangents } from './gltf-transform/tangents';
import { CocosMeshMeta, CocosSkeleton, CocosSkeletonMeta } from './CocosModel';
import { decodeUuid } from './decode-uuid';


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
 * @param input 
 * @param out 
 */
function facebookFbxToGltf(input: string, out: string) {
    const toolPath = `./FBX2glTF/FBX2glTF-${process.platform}`;
    const result = child_process.spawnSync(toolPath, ["--input", input, "--output", out]);
    if (result.status != 0)
        throw new Error("FBX2glTF convert failed:" + (result.error != null ? result.error : result), { cause: 102 });
}

/**
 * FBX version 2019 or higher;
 * @param filename fbx文件路径
 */
export function fbxToGLtf(filename: string, tempPath: string = "temp/fbx2gltf"): string {
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

function getJointPathName(joint: Node, jointNodes: readonly Node[]): string {
    let name: string = joint.getName();
    joint = joint.getParent() as Node;

    const isBone = function (bone: Node): boolean {
        if (bone.propertyType != "Node") return false;
        if (jointNodes.indexOf(bone) != -1) return true;
        return isBone(bone.getParent() as Node);
    }
    while (isBone(joint)) {
        name = joint.getName() + "/" + name;
        joint = joint.getParent() as Node;
    }
    return joint.getName() + "/" + name;
}

function readPrefabDependences(cocosPath: string): string[] {
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
            filenames[i] = decodeUuid(filenames[i]) + ".json";
        return filenames;
    } catch (error) {
        return null;
    }
}

function searchForCocosFile(cocosPath: string, filenames: string[], type: string): { content: string, filename: string } {
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

export async function gltfToCocosFile(uri: string, cocosPath: string, outPath: string): Promise<void> {
    const dependenceFilenames = readPrefabDependences(cocosPath);
    if (dependenceFilenames == null)
        throw new Error("Can not find cocos prefab meta file. Maybe be merge by one josn.", { cause: 103 });

    const meshResult = searchForCocosFile(cocosPath, dependenceFilenames, "cc.Mesh");
    if (meshResult == null)
        throw new Error("Can not find cocos mesh meta file. Maybe be merge by one josn.", { cause: 104 });

    const document = await new NodeIO().read(uri);
    await computeNormalAndTangent(document);

    const metaData = new CocosMeshMeta(meshResult.content)

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

        const skeletonResult = searchForCocosFile(cocosPath, dependenceFilenames, "cc.Skeleton");
        if (skeletonResult == null)
            throw new Error("Can not find cocos skeleton meta file. Maybe be merge by one josn.", { cause: 106 });

        const skeletonMeta = new CocosSkeletonMeta(skeletonResult.content);

        if (skins.length > 1)
            throw new Error(`Skin count is not match. source 1, upload ${skins.length}.`, { cause: 107 });

        const inverseBindAccessor = skins[0].getInverseBindMatrices();
        const inverseBindArray = inverseBindAccessor.getArray();
        const elementSize = inverseBindAccessor.getElementSize();

        const jointNodes = skins[0].listJoints();
        const jointNames: string[] = [];
        for (let node of jointNodes) {
            const name = getJointPathName(node, jointNodes);
            if (skeletonMeta.joints.indexOf(name) == -1)
                throw new Error(`Skeleton joint name ${name} is not match.`, { cause: 108 });
            jointNames.push(name);
        }
        if (jointNames.length != skeletonMeta.joints.length)
            throw new Error(`Skeleton joints count is not match. source ${skeletonMeta.joints.length} upload ${jointNodes.length}.`, { cause: 109 });

        const skeleton = new CocosSkeleton(jointNames, inverseBindArray, elementSize);
        const meshMetaOutPath = path.join(outPath, skeletonResult.filename);
        modelWrite.wirteSkeletonFiles(meshMetaOutPath, skeletonMeta, skeleton);
    }

    const meshMetaOutPath = path.join(outPath, meshResult.filename);
    return modelWrite.wirteMeshFiles(meshMetaOutPath, metaData, document);
}