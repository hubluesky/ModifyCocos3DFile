import { Document, JSONDocument, Node, NodeIO } from '@gltf-transform/core';
import { TypedArray } from '@gltf-transform/core/dist/constants';
import child_process from 'child_process';
import * as fs from 'fs';
import path from 'path';
import { AttributeName } from './Cocos';
import { CocosToGltfAttribute } from './CocosGltfWrap';
import { CocosMesh, CocosMeshMeta, CocosSkeleton, CocosSkeletonMeta } from './CocosModel';
import CocosModelReader from './CocosModelReader';
import CocosModelWriter from './CocosModelWriter';
import { gltf } from './gltf';
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
    cocosFbxToGltf(filename, gltfPath);
    return gltfPath;
}

export async function computeNormalAndTangent(document: Document, overwrite: boolean = false) {
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
    await computeNormalAndTangent(document);

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

export function readCocosMesh(filename: string, meshName: string, filePath: string) {
    const meshBinPath = `${filePath}/${filename}/${meshName}.bin`;
    const meshMetaPath = `${filePath}/${filename}/${meshName}@mesh.json`;
    // const skeletonPath = `${filePath}/${filename}/${meshName}@skeleton.json`;
    if (!fs.existsSync(meshBinPath)) throw `Can not find bin file: ${meshBinPath}`;
    if (!fs.existsSync(meshMetaPath)) throw `Can not find mesh file: ${meshMetaPath}`;

    const text: string = fs.readFileSync(meshMetaPath, "utf-8");
    const meshMeta = new CocosMeshMeta(text);
    let arrayBuffer = readFileSync(meshBinPath);
    const meshBin = new CocosMesh(arrayBuffer, meshMeta);
    return meshBin;
}

export async function cocosMeshToGltf(cocosMesh: CocosMesh, meshName?: string): Promise<JSONDocument> {
    const doc = new Document();
    const buffer = doc.createBuffer();
    const mesh = doc.createMesh(meshName);
    const node = doc.createNode().setMesh(mesh);
    const scene = doc.createScene().addChild(node);

    for (const primitive of cocosMesh.primitives) {
        const gltfPrimitive = doc.createPrimitive();
        for (const bundle of primitive.bundles) {
            for (const attribute of bundle.attributeValues) {
                const attributeType = CocosToGltfAttribute[attribute.describe.name];
                const attributeAccessor = doc.createAccessor();
                attributeAccessor.setType(gltf.AttributeElementType[attributeType]);
                attributeAccessor.setBuffer(buffer);
                attributeAccessor.setArray(attribute.data as TypedArray);
                gltfPrimitive.setAttribute(attributeType, attributeAccessor);
            }
        }
        if (primitive.indices != null) {
            const attributeAccessor = doc.createAccessor();
            attributeAccessor.setType("SCALAR");
            attributeAccessor.setBuffer(buffer);
            attributeAccessor.setArray(primitive.indices as TypedArray);
            gltfPrimitive.setIndices(attributeAccessor);
        }

        if (primitive.bundles.length > 0) {
            const coord = primitive.bundles[0].attributeValues.find(a => a.describe.name == AttributeName.ATTR_TEX_COORD);
            if (coord != null) {
                const material = doc.createMaterial("material");
                gltfPrimitive.setMaterial(material);
            }
        }

        mesh.addPrimitive(gltfPrimitive);
    }

    return new NodeIO().writeJSON(doc, {});
}

export function writeGltfFile(jsonDoc: JSONDocument, filename: string, filePath: string): void {
    fs.mkdirSync(filePath, { recursive: true });
    fs.writeFileSync(path.join(filePath, filename + ".gltf"), JSON.stringify(jsonDoc.json), "utf8");
    for (let name in jsonDoc.resources) {
        const data = jsonDoc.resources[name];
        fs.writeFileSync(path.join(filePath, name), data);
    }
}