import process from 'child_process';
import * as fs from 'fs';
import Gltf2Parser, { parseGLB } from './gltf2Parser';

export function readFileSync(filePath: string): ArrayBuffer {
    let bufferString = fs.readFileSync(filePath, { encoding: "binary" });
    const nb = Buffer.from(bufferString, "binary");
    return nb.buffer.slice(nb.byteOffset, nb.byteOffset + nb.byteLength);
}

export function fbxToGltf(input: string, out: string) {
    const toolPath = "./fbx-gltf-conv/bin/darwin/FBX-glTF-conv";
    process.spawnSync(toolPath, [input, "--out", out]);
}

export function parseGltf(url: string) {
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

export function readFBXToGltf(filename: string): Gltf2Parser | null {
    const gltfPath = `./${filename}/${filename}.gltf`;
    fbxToGltf(filename + ".fbx", gltfPath);
    return parseGltf(gltfPath);
}