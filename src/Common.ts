import { Document, JSONDocument, Node, NodeIO } from '@gltf-transform/core';
import { TypedArray } from '@gltf-transform/core/dist/constants';
import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import { CocosToGltfAttribute } from './CocosGltfWrap';
import { CocosMesh, CocosMeshMeta } from './CocosModel';
import CocosModelReader from './CocosModelReader';
import CocosModelWriter from './CocosModelWriter';
import { gltf } from './gltf';
import { normals } from './gltf-transform/normals';
import { tangents } from './gltf-transform/tangents';
import { io } from './IO';


/**
 * FBX version 2019 or higher;
 * @param input 
 * @param out 
 */
export function cocosFbxToGltf(input: string, out: string) {
    const toolPath = `./fbx-gltf-conv/bin/${process.platform}/FBX-glTF-conv`;
    const result = child_process.spawnSync(toolPath, [input, "--out", out]);
    if (result.status != 0)
        throw new Error("FBX convert failed:"+result.stderr.toString().trim());
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
        throw new Error("Gltf convert failed:"+result.stderr.toString().trim());
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

function searchForCocosMeshFile(cocosPath: string): string {
    const cocosFilenames = fs.readdirSync(cocosPath);
    const meshBins = cocosFilenames.filter(f => path.extname(f) == ".bin");
    if (meshBins.length == 0)
        new Error("Can not find cocos mesh file which .bin extension.");
    if (meshBins.length > 1)
        new Error("The model contain multiply meshes files.");
    const meshMetaName = path.basename(meshBins[0], ".bin") + ".json";
    return cocosFilenames.find(f => path.basename(f) == meshMetaName);
}

export async function gltfToCocosFile(uri: string, cocosPath: string, outPath: string): Promise<void> {
    const meshMetaName = searchForCocosMeshFile(cocosPath);
    if (meshMetaName == null)
        new Error("Can not find cocos mesh meta file.");

    const document = await new NodeIO().read(uri);
    await computeNormalAndTangent(document);

    // let skeleton: CocosSkeleton;
    // let skeletonMeta: CocosSkeletonMeta;
    const metaData = CocosModelReader.readMeshMeta(path.join(cocosPath, meshMetaName));

    const root = document.getRoot();
    if (metaData.jointMaps != null) {
        const skins = root.listSkins();
        if (skins == null || skins.length == 0)
            throw new Error("The uploaded file does not contain skeleton information.");
        if (skins.length > 1)
            throw new Error("Multiple Skin is not supported.");

        // if (!CocosModelReader.isFileExist(skeletonPath))
        //     throw new Error("Missing skeleton file.");

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

export function readCocosMesh(binPath: string, meshMetaPath: string, skeletonPath: string) {
    if (!fs.existsSync(binPath)) throw new Error(`Can not find cocos .bin file: ${binPath}`);
    if (!fs.existsSync(meshMetaPath)) throw new Error(`Can not find cocos mesh meta file: ${meshMetaPath}`);

    const text: string = fs.readFileSync(meshMetaPath, "utf-8");
    const meshMeta = new CocosMeshMeta(text);
    let arrayBuffer = io.readBinaryFileSync(binPath);
    const meshBin = new CocosMesh(arrayBuffer, meshMeta);
    return meshBin;
}

export async function cocosToGltf(prefab: cc.Prefab) {
    const doc = new Document();
    const scene = doc.createScene()
    const buffer = doc.createBuffer();

    const createNodes = function (gltfParent: Node, cocosNode: cc.Node) {
        for (const child of cocosNode.children) {
            const node = doc.createNode(child.name);
            gltfParent.addChild(node);

            const meshRenderer = child.getComponent(cc.MeshRenderer);
            if (meshRenderer != null) {

            }
        }
    }

    const rootNode: cc.Node = prefab.data;
    createNodes(scene as any, rootNode);
}


export async function cocosMeshToGltf(mesh: cc.Mesh, meshName?: string): Promise<JSONDocument> {
    const doc = new Document();
    const buffer = doc.createBuffer();
    const gltfMesh = doc.createMesh(meshName);
    const node = doc.createNode().setMesh(gltfMesh);
    const scene = doc.createScene().addChild(node);

    const meshStruct = mesh.struct;

    for (let indexPrimitive = 0; indexPrimitive < meshStruct.primitives.length; indexPrimitive++) {
        const primitive = meshStruct.primitives[indexPrimitive];
        const gltfPrimitive = doc.createPrimitive();
        for (const bundleIndex of primitive.vertexBundelIndices) {
            const bundle = meshStruct.vertexBundles[bundleIndex];
            for (const attribute of bundle.attributes) {
                const attributeType = CocosToGltfAttribute[attribute.name];
                const attributeAccessor = doc.createAccessor();
                attributeAccessor.setType(gltf.AttributeElementType[attributeType]);
                attributeAccessor.setBuffer(buffer);

                const data = mesh.readAttribute(indexPrimitive, attribute.name as cc.gfx.AttributeName);
                attributeAccessor.setArray(data as TypedArray);
                gltfPrimitive.setAttribute(attributeType, attributeAccessor);
            }
        }

        const indices = mesh.readIndices(indexPrimitive);
        if (indices != null) {
            const attributeAccessor = doc.createAccessor();
            attributeAccessor.setType("SCALAR");
            attributeAccessor.setBuffer(buffer);
            attributeAccessor.setArray(indices as TypedArray);
            gltfPrimitive.setIndices(attributeAccessor);
        }

        if (primitive.vertexBundelIndices.length > 0) {
            const material = doc.createMaterial("material");
            gltfPrimitive.setMaterial(material);
        }

        gltfMesh.addPrimitive(gltfPrimitive);
    }

    return new NodeIO().writeJSON(doc, {});
}

// export function writeGltfFile(jsonDoc: JSONDocument, filename: string, filePath: string): void {
//     fs.mkdirSync(filePath, { recursive: true });
//     fs.writeFileSync(path.join(filePath, filename + ".gltf"), JSON.stringify(jsonDoc.json), "utf8");
//     for (let name in jsonDoc.resources) {
//         const data = jsonDoc.resources[name];
//         fs.writeFileSync(path.join(filePath, name), data);
//     }
// }