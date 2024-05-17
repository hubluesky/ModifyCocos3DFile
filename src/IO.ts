import { JSONDocument } from '@gltf-transform/core';
import fs from 'fs';
import path from 'path';

export namespace io {
    export function readBinaryFileSync(filePath: string): ArrayBuffer {
        const bufferString = fs.readFileSync(filePath, { encoding: "binary" });
        const nb = Buffer.from(bufferString, "binary");
        return nb.buffer.slice(nb.byteOffset, nb.byteOffset + nb.byteLength);
    }

    export function readTextFileSync(filePath: string): string {
        return fs.readFileSync(filePath, "utf-8");
    }

    export function writeTextFileSync(filePath: string, content: string): void {
        fs.writeFileSync(filePath, content, "utf-8");
    }

    export function fileExists(filePath: string): boolean {
        return fs.existsSync(filePath);
    }

    export function writeGltfFile(jsonDoc: JSONDocument, filename: string, filePath: string): void {
        fs.mkdirSync(filePath, { recursive: true });
        fs.writeFileSync(path.join(filePath, filename + ".gltf"), JSON.stringify(jsonDoc.json), "utf8");
        for (let name in jsonDoc.resources) {
            const data = jsonDoc.resources[name];
            fs.writeFileSync(path.join(filePath, name), data);
        }
    }
}