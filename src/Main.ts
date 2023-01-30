
import { Logger, NodeIO } from "@gltf-transform/core";
import child_process from "child_process";
import path from "path";
import * as fs from 'fs';
import { program } from "commander";
import { computeNormalAndTangent, gltfToCocosFile, fbxToGLtf, readCocosMesh, cocosMeshToGltf, writeGltfFile } from "./Common";


async function gltf2Cocos(gltfPath: string, meshMetaPath: string, skeletonPath: string, modelName: string, outPath: string) {
    outPath = path.join(outPath, modelName);
    const filenames = await gltfToCocosFile(gltfPath, meshMetaPath, skeletonPath, outPath, modelName);
    console.log("Conversion completed, output directory:", outPath);
    // child_process.execSync(`start "" "${outPath}"`);
    return filenames;
}

async function fbx2Cocos(fbxPath: string, meshMetaPath: string, skeletonPath: string, modelName: string, outPath: string) {
    const tempPath = `temp/fbx2gltf/${modelName}`;
    const gltfPath = await fbxToGLtf(fbxPath, tempPath);
    const filenames = await gltf2Cocos(gltfPath, meshMetaPath, skeletonPath, modelName, outPath);
    fs.rmSync(tempPath, { recursive: true, force: true });
    return filenames;
}

async function cocosToGltf(binPath: string, meshMetaPath: string, skeletonPath: string, modelName: string, outPath: string) {
    const cocosMesh = readCocosMesh(binPath, meshMetaPath, skeletonPath);
    const josnDoc = await cocosMeshToGltf(cocosMesh, modelName);
    outPath = path.join(outPath, modelName);
    writeGltfFile(josnDoc, modelName, outPath);
    console.log("Conversion completed, output directory:", outPath);
    child_process.execSync(`start "" "${outPath}"`);
}

// await cocosToGltf("Cube", "Cube", "E:/workspace/Cocos/ReplaceModelTest/build/web-mobile/resource/model");

interface Fbx2Cocos {
    name: string;
    fbx: string;
    cocos: string[];
    output: string;
}

interface Gltf2Cocos {
    name: string;
    gltf: string;
    cocos: string[];
    output: string;
}

interface Cocos2Gltf {
    name: string;
    cocos: string[];
    output: string;
}

interface Cocos3DFiles {
    name: string;
    bin?: string;
    mesh?: string,
    skeleton?: string,
    prefab?: string,
}

function parseCocosFiles(name: string, filenames: string[]): Cocos3DFiles {
    const cocos3DFiles: Cocos3DFiles = { name };
    for (const filename of filenames) {
        const ext = path.extname(filename);
        const basename = path.basename(filename, ext);
        const index = basename.lastIndexOf("@");
        if (index == -1) {
            if (ext.toLowerCase() == ".bin")
                cocos3DFiles.bin = filename;
            continue;
        }
        const type = basename.substring(index + 1);
        if (cocos3DFiles.name == null)
            cocos3DFiles.name = basename.substring(0, index);
        switch (type) {
            case "mesh":
                cocos3DFiles.mesh = filename;
                break;
            case "skeleton":
                cocos3DFiles.skeleton = filename;
                break;
            case "prefab":
                cocos3DFiles.prefab = filename;
                break;
        }
    }
    return cocos3DFiles;
}

program.version("0.0.1", "-v, --version", "Cocos 3d file converter");
program.command("fbx2cocos")
    .alias("f2c")
    .description("Conver fbx to cocos 3d file.")
    .option("-n, --name <string>", "3d file name.")
    .requiredOption("-f, --fbx <path>", "Input Fbx file path.")
    .requiredOption("-c, --cocos [path...]", "Input cocos 3d meta files.")
    .requiredOption("-o, --output <path>", "Output Cocos 3d file path. It must be local path.")
    .action(function (input: Fbx2Cocos) {
        const cocos3DFile = parseCocosFiles(input.name, input.cocos);
        fbx2Cocos(input.fbx, cocos3DFile.mesh, cocos3DFile.skeleton, cocos3DFile.name, input.output);
    });

program.command("gltf2cocos")
    .alias("g2c")
    .description("Conver gltf to cocos 3d file.")
    .option("-n, --name <string>", "3d file name.")
    .requiredOption("-g, --gltf <path>", "Input gltf file path.")
    .requiredOption("-c, --cocos [path...]", "Input cocos 3d meta files")
    .requiredOption("-o, --output <path>", "Output Cocos 3d file path. It must be local path.")
    .action(function (input: Gltf2Cocos) {
        const cocos3DFile = parseCocosFiles(input.name, input.cocos);
        gltf2Cocos(input.gltf, cocos3DFile.mesh, cocos3DFile.skeleton, cocos3DFile.name, input.output);
    });

program.command("cocos2gltf")
    .alias("c2g")
    .description("Conver cocos 3d files to gltf. PS. skeleton models are not supported.")
    .option("-n, --name <string>", "3d file name.")
    .requiredOption("-c, --cocos [path...]", "Input cocos 3d files")
    .requiredOption("-o, --output <path>", "Output Cocos 3d file path. It must be local path.")
    .action(function (input: Cocos2Gltf) {
        const cocos3DFile = parseCocosFiles(input.name, input.cocos);
        cocosToGltf(cocos3DFile.bin, cocos3DFile.mesh, cocos3DFile.skeleton, cocos3DFile.name, input.output);
    });

program.parse();