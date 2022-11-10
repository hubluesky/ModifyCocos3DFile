import child_process from 'child_process';
import * as fs from 'fs';
import path from 'path';
import Gltf2Parser, { parseGLB } from './gltf2Parser';

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

export function loadGltf(url: string) {
    switch (url.slice(-4).toLocaleLowerCase()) {
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        case 'gltf':
            let bin: ArrayBuffer | undefined;
            const jsonData = fs.readFileSync(url, { encoding: "utf8" });
            const json = JSON.parse(jsonData);
            if (json.buffers && json.buffers.length > 0) {
                const path = url.substring(0, url.lastIndexOf('/') + 1);
                bin = readFileSync(path + json.buffers[0].uri);
            }

            return new Gltf2Parser(json, bin);

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        case '.glb':
            let arrayBuffer = readFileSync(url);
            const tuple = parseGLB(arrayBuffer);
            return (tuple) ? new Gltf2Parser(tuple[0], tuple[1]) : null;
    }
    return null;
}

/**
 * FBX version 2019 or higher;
 * @param filename fbx文件路径
 */
export function readFBXToGltf(filename: string): Gltf2Parser | null {
    const gltfName = path.basename(filename, path.extname(filename));
    const gltfPath = `./temp/${gltfName}/${gltfName}.gltf`;
    fs.mkdirSync(path.dirname(gltfPath), { recursive: true });
    fbxToGltf(filename, gltfPath);
    const gltf = loadGltf(gltfPath);
    // fs.rmdirSync(`./temp/${gltfName}`, { recursive: true });
    return gltf;
}