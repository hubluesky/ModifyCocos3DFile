import * as fs from 'fs';
import path from "path";
import CocosMesh, { CocosMeshMeta } from "./CocosMesh";

export function readFileSync(filePath: string): ArrayBuffer {
    let bufferString = fs.readFileSync(filePath, { encoding: "binary" });
    const nb = Buffer.from(bufferString, "binary");
    return nb.buffer.slice(nb.byteOffset, nb.byteOffset + nb.byteLength);
}

export default class CocosModelReader {
    public readonly mesh: CocosMesh;
    public readonly meshMeta: CocosMeshMeta;
    /**
     * Cocos的模型文件读取
     * @param filename 模型文件路径，不带后缀
     */
    public constructor(filename: string) {
        this.meshMeta = this.readMeshMeta(filename + ".json");
        this.mesh = this.readMesh(filename + ".bin", this.meshMeta);
    }

    public readMesh(filename: string, meshMeta: CocosMeshMeta): CocosMesh {
        let arrayBuffer = readFileSync(filename);
        return new CocosMesh(arrayBuffer, meshMeta);
    }

    public readMeshMeta(filename: string): CocosMeshMeta {
        const text: string = fs.readFileSync(filename, "utf-8");
        return new CocosMeshMeta(text);
    }
}