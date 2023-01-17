import { Document, NodeIO, Node } from '@gltf-transform/core';
import child_process from 'child_process';
import * as fs from 'fs';
import path from 'path';
import { CocosSkeleton, CocosSkeletonMeta } from './CocosModel';
import CocosModelReader from './CocosModelReader';
import CocosModelWriter from './CocosModelWriter';
import { normals } from './gltf-transform/normals';
import { tangents } from './gltf-transform/tangents';

export function readFileSync(filePath: string): ArrayBuffer {
    const bufferString = fs.readFileSync(filePath, { encoding: "binary" });
    const nb = Buffer.from(bufferString, "binary");
    return nb.buffer.slice(nb.byteOffset, nb.byteOffset + nb.byteLength);
}

/**
 * FBX version 2019 or higher;
 * @param input 
 * @param out 
 */
export function cocosFbxToGltf(input: string, out: string) {
    const toolPath = `./fbx-gltf-conv/bin/${process.platform}/FBX-glTF-conv`;
    const result = child_process.spawnSync(toolPath, [input, "--out", out]);
    if (result.status != 0)
        throw new Error(result.stderr.toString().trim());
}

/**
 * FBX version 2019 or higher;
 * @param input 
 * @param out 
 */
export function facebookFbxToGltf(input: string, out: string) {
    const toolPath = `./FBX2glTF/FBX2glTF-${process.platform}`;
    const result = child_process.spawnSync(toolPath, ["--input", input, "--output", out]);
    if (result.status != 0)
        throw new Error(result.stderr.toString().trim());
}

/**
 * FBX version 2019 or higher;
 * @param filename fbx文件路径
 */
export function fbxToGLtf(filename: string, tempPath: string = "temp/fbx2gltf"): string {
    const gltfName = path.basename(filename, path.extname(filename));
    const gltfPath = `./${tempPath}/${gltfName}/${gltfName}.gltf`;
    fs.mkdirSync(path.dirname(gltfPath), { recursive: true });
    facebookFbxToGltf(filename, gltfPath);
    return gltfPath;
}

export async function computeAttributes(document: Document, overwrite: boolean = false) {
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

export async function gltfToCocosFile(uri: string, meshMetaPath: string, skeletonPath: string, outPath: string, meshName: string): Promise<string[]> {
    const document = await new NodeIO().read(uri);
    await computeAttributes(document);

    let skeleton: CocosSkeleton;
    let skeletonMeta: CocosSkeletonMeta;
    const metaData = CocosModelReader.readMeshMeta(meshMetaPath);

    const root = document.getRoot();
    if (metaData.jointMaps != null) {
        if (!CocosModelReader.isFileExist(skeletonPath))
            throw new Error("Missing skeleton file.");

        const skins = root.listSkins();
        if (skins == null || skins.length == 0)
            throw new Error("The uploaded file does not contain skeleton information.");
        if (skins.length > 1)
            throw new Error("Multiple Skin is not supported.");

        skeletonMeta = CocosModelReader.readSkeletonMeta(skeletonPath);
        const inverseBindAccessor = skins[0].getInverseBindMatrices();
        const inverseBindArray = inverseBindAccessor.getArray();
        const elementSize = inverseBindAccessor.getElementSize();

        const jointNodes = skins[0].listJoints();
        const jointNames: string[] = [];
        for (let node of jointNodes) {
            const name = getJointPathName(node, jointNodes);
            jointNames.push(name);
        }
        skeleton = new CocosSkeleton(jointNames, inverseBindArray, elementSize);
    }

    return new CocosModelWriter().wirteFiles(`${outPath}/${meshName}`, metaData, document, skeletonMeta, skeleton);
}
