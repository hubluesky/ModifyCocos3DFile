import child_process from 'child_process';
import * as fs from 'fs';
import path from 'path';
import { CocosSkeleton, CocosSkeletonMeta } from './CocosModel';
import CocosModelReader from './CocosModelReader';
import CocosModelWriter from './CocosModelWriter';
import Geometry from './Geometry';
import { GLTF, GLTFLoader } from './glTFLoader';

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
export function fbxToGltf(input: string, out: string) {
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
export function fbxToGltf2(input: string, out: string) {
    const toolPath = `./FBX2glTF/FBX2glTF-${process.platform}`;
    const result = child_process.spawnSync(toolPath, ["--input", input, "--output", out]);
    if (result.status != 0)
        throw new Error(result.stderr.toString().trim());
}

export async function loadGltfFiles(gltfUrl: string, binUrls: string[]): Promise<GLTF> {
    const loader = new GLTFLoader(null);
    const json = await loader.loadJson(gltfUrl);
    const binFiles: { name: string, buffer: ArrayBuffer }[] = [];
    for (const url of binUrls) {
        const buffer = await loader.loadArrayBuffer(url);
        binFiles.push({ name: path.basename(url), buffer });
    }
    return loader.loadGLTFFromData(json, binFiles);
}

export function loadGltf(url: string): Promise<GLTF> {
    const loader = new GLTFLoader(null);
    return loader.loadGLTF(url);
}

/**
 * FBX version 2019 or higher;
 * @param filename fbx文件路径
 */
export async function readFBXToGltf(filename: string, removeTempFile: boolean = true): Promise<GLTF> {
    const gltfName = path.basename(filename, path.extname(filename));
    const gltfPath = `./temp/fbx2gltf/${gltfName}/${gltfName}.gltf`;
    fs.mkdirSync(path.dirname(gltfPath), { recursive: true });
    fbxToGltf(filename, gltfPath);
    const gltf = await loadGltf(gltfPath);
    if (removeTempFile)
        fs.rmdirSync(`./temp/fbx2gltf/${gltfName}`, { recursive: true });
    return gltf;
}

export function gltfToCocosFile(gltf: GLTF, meshName: string, meshMetaPath: string, skeletonPath: string, outPath: string): string[] {
    let skeleton: CocosSkeleton;
    let skeletonMeta: CocosSkeletonMeta;
    const metaData = CocosModelReader.readMeshMeta(meshMetaPath);

    if (metaData.jointMaps != null) {
        if (!CocosModelReader.isFileExist(skeletonPath))
            throw new Error("Missing skeleton file.");
        if (gltf.skins == null || gltf.skins.length == 0)
            throw new Error("The uploaded file does not contain skeleton information.");

        skeletonMeta = CocosModelReader.readSkeletonMeta(skeletonPath);
        const skin = gltf.skins[0];
        skeleton = new CocosSkeleton(skin.joints, skin.inverseBindMatrix);
    }

    if (gltf.skins?.length == 1 && CocosModelReader.isFileExist(skeletonPath)) {
        skeletonMeta = CocosModelReader.readSkeletonMeta(skeletonPath);
        const skin = gltf.skins[0];
        skeleton = new CocosSkeleton(skin.joints, skin.inverseBindMatrix);
        if (skeletonMeta.joints.length != skeleton.joints.length)
            throw new Error("The number of skeleton joints is different");
    }
    const geometry = Geometry.creatFromGLTF(gltf);
    const filesnames = new CocosModelWriter().wirteFiles(`${outPath}/${meshName}`, metaData, geometry, skeletonMeta, skeleton);
    return filesnames;
}