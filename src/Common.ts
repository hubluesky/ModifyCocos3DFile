import { Document, Node, NodeIO } from '@gltf-transform/core';
import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import CocosModelReader from './CocosModelReader';
import CocosModelWriter from './CocosModelWriter';
import { normals } from './gltf-transform/normals';
import { tangents } from './gltf-transform/tangents';


/**
 * FBX version 2019 or higher;
 * @param input 
 * @param out 
 */
function cocosFbxToGltf(input: string, out: string) {
    const toolPath = `./fbx-gltf-conv/${process.platform}/Release/bin/FBX-glTF-conv`;
    const result = child_process.spawnSync(toolPath, [input, "--out", out]);
    if (result.status != 0) {
        const err = result.error != null ? result.error : result;
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

function searchForCocosMeshFile(cocosPath: string): string {
    const cocosFilenames = fs.readdirSync(cocosPath);
    const meshBins = cocosFilenames.filter(f => path.extname(f) == ".bin");
    if (meshBins.length == 0)
        new Error("Can not find cocos mesh file which .bin extension.", { cause: 103 });
    if (meshBins.length > 1)
        new Error("The model contain multiply meshes files.", { cause: 104 });
    const meshMetaName = path.basename(meshBins[0], ".bin") + ".json";
    return cocosFilenames.find(f => path.basename(f) == meshMetaName);
}

export async function gltfToCocosFile(uri: string, cocosPath: string, outPath: string): Promise<void> {
    const meshMetaName = searchForCocosMeshFile(cocosPath);
    if (meshMetaName == null)
        new Error("Can not find cocos mesh meta file.", { cause: 105 });

    const document = await new NodeIO().read(uri);
    await computeNormalAndTangent(document);

    // let skeleton: CocosSkeleton;
    // let skeletonMeta: CocosSkeletonMeta;
    const metaData = CocosModelReader.readMeshMeta(path.join(cocosPath, meshMetaName));

    const root = document.getRoot();
    if (metaData.jointMaps != null) {
        const skins = root.listSkins();
        if (skins == null || skins.length == 0)
            throw new Error("The uploaded file does not contain skeleton information.", { cause: 106 });
        if (skins.length > 1)
            throw new Error("Multiple Skin is not supported.", { cause: 107 });

        // if (!CocosModelReader.isFileExist(skeletonPath))
        //     throw new Error("Missing skeleton file.", { cause: 108 });

        // skeletonMeta = CocosModelReader.readSkeletonMeta(skeletonPath);
        // const inverseBindAccessor = skins[0].getInverseBindMatrices();
        // const inverseBindArray = inverseBindAccessor.getArray();
        // const elementSize = inverseBindAccessor.getElementSize();

        // const jointNodes = skins[0].listJoints();
        // const jointNames: string[] = [];
        // for (let node of jointNodes) {
        //     const name = getJointPathName(node, jointNodes);
        //     jointNames.push(name);
        // }
        // skeleton = new CocosSkeleton(jointNames, inverseBindArray, elementSize);
    }

    const meshMetaOutPath = path.join(outPath, path.basename(meshMetaName, path.extname(meshMetaName)));
    return new CocosModelWriter().wirteFiles(document, meshMetaOutPath, metaData);
}

// export function readCocosMesh(binPath: string, meshMetaPath: string, skeletonPath: string) {
//     if (!fs.existsSync(binPath)) throw new Error(`Can not find cocos .bin file: ${binPath}`, { cause: 109 });
//     if (!fs.existsSync(meshMetaPath)) throw new Error(`Can not find cocos mesh meta file: ${meshMetaPath}`, { cause: 110 });

//     const text: string = fs.readFileSync(meshMetaPath, "utf-8");
//     const meshMeta = new CocosMeshMeta(text);
//     let arrayBuffer = io.readBinaryFileSync(binPath);
//     const meshBin = new CocosMesh(arrayBuffer, meshMeta);
//     return meshBin;
// }