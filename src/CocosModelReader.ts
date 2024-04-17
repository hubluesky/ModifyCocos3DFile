import * as fs from 'fs';
import { CocosMeshMeta } from "./CocosMeshMeta";
import { CocosSkeletonMeta } from "./CocosSkeletonMeta";
import { CocosMesh } from "./CocosMesh";
import { io } from './IO';

export default class CocosModelReader {
    // public readonly mesh: CocosMesh;
    // public readonly meshMeta: CocosMeshMeta;
    // /**
    //  * Cocos的模型文件读取
    //  * @param filename 模型文件路径，不带后缀
    //  */
    // public constructor(filename: string) {
    //     this.meshMeta = CocosModelReader.readMeshMeta(filename + ".json");
    //     this.mesh = CocosModelReader.readMesh(filename + ".bin", this.meshMeta);
    // }

    public static isFileExists(filename: string): boolean {
        return fs.existsSync(filename);
    }

    // public static readMesh(filename: string, meshMeta: CocosMeshMeta): CocosMesh {
    //     let arrayBuffer = io.readBinaryFileSync(filename);
    //     return new CocosMesh(arrayBuffer, meshMeta);
    // }

    public static readMeshMeta(filename: string): CocosMeshMeta {
        const text: string = fs.readFileSync(filename, "utf-8");
        return new CocosMeshMeta(text);
    }

    public static readSkeletonMeta(filename: string): CocosSkeletonMeta {
        const text: string = fs.readFileSync(filename, "utf-8");
        return new CocosSkeletonMeta(text);
    }
}