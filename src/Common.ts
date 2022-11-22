import child_process from 'child_process';
import * as fs from 'fs';
import path from 'path';
import { GLTF, GLTFLoader } from './glTFLoader';

export function readFileSync(filePath: string): ArrayBuffer {
    let bufferString = fs.readFileSync(filePath, { encoding: "binary" });
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
    console.log("fbxToGltf ", toolPath);
    child_process.spawnSync(toolPath, [input, "--out", out]);
}

export function loadGltf(url: string): Promise<GLTF> {
    const loader = new GLTFLoader(null);
    return loader.loadGLTF(url);;
}

/**
 * FBX version 2019 or higher;
 * @param filename fbx文件路径
 */
export async function readFBXToGltf(filename: string): Promise<GLTF> {
    const gltfName = path.basename(filename, path.extname(filename));
    const gltfPath = `./temp/${gltfName}/${gltfName}.gltf`;
    fs.mkdirSync(path.dirname(gltfPath), { recursive: true });
    fbxToGltf(filename, gltfPath);
    const gltf = await loadGltf(gltfPath);
    // fs.rmdirSync(`./temp/${gltfName}`, { recursive: true });
    return gltf;
}