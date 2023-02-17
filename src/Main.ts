
import { program } from "commander";
import * as fs from 'fs';
import path from "path";
import { fbxToGLtf, gltfToCocosFile } from "./Common";

async function gltfReplaceCocos(gltfPath: string, cocosPath: string, outPath: string) {
    const modelName = path.basename(gltfPath, path.extname(gltfPath));
    outPath = path.join(outPath, modelName);
    await gltfToCocosFile(gltfPath, cocosPath, outPath);
    // child_process.execSync(`start "" "${outPath}"`);
}

async function fbxReplaceCocos(fbxPath: string, cocosPath: string, outPath: string) {
    const modelName = path.basename(fbxPath, path.extname(fbxPath));
    const tempPath = `temp/fbx2gltf/${modelName}`;
    const gltfPath = await fbxToGLtf(fbxPath, tempPath);
    await gltfReplaceCocos(gltfPath, cocosPath, outPath);
    fs.rmSync(tempPath, { recursive: true, force: true });
}

// await cocosToGltf("Cube", "Cube", "E:/workspace/Cocos/ReplaceModelTest/build/web-mobile/resource/model");

interface FbxReplaceCocos {
    name: string;
    fbx: string;
    cocos: string;
    output: string;
}

interface GltfReplaceCocos {
    name: string;
    gltf: string;
    cocos: string;
    output: string;
}

interface Cocos3DFiles {
    name: string;
    bin?: string;
    mesh?: string,
    skeleton?: string,
    prefab?: string,
}

program.version("0.0.1", "-v, --version", "Cocos 3d file converter");
// program.command("fbx2cocos")
//     .alias("f2c")
//     .description("Conver fbx to cocos 3d file.")
//     .option("-n, --name <string>", "3d file name.")
//     .requiredOption("-f, --fbx <path>", "Input Fbx file path.")
//     .requiredOption("-c, --cocos [path...]", "Input cocos 3d meta files.")
//     .requiredOption("-o, --output <path>", "Output Cocos 3d file path. It must be local path.")
//     .action(function (input: Fbx2Cocos) {
//         const cocos3DFile = parseCocosFiles(input.name, input.cocos);
//         fbx2Cocos(input.fbx, cocos3DFile.mesh, cocos3DFile.skeleton, cocos3DFile.name, input.output);
//     });

// program.command("gltf2cocos")
//     .alias("g2c")
//     .description("Conver gltf to cocos 3d file.")
//     .option("-n, --name <string>", "3d file name.")
//     .requiredOption("-g, --gltf <path>", "Input gltf file path.")
//     .requiredOption("-c, --cocos [path...]", "Input cocos 3d meta files")
//     .requiredOption("-o, --output <path>", "Output Cocos 3d file path. It must be local path.")
//     .action(function (input: Gltf2Cocos) {
//         const cocos3DFile = parseCocosFiles(input.name, input.cocos);
//         gltf2Cocos(input.gltf, cocos3DFile.mesh, cocos3DFile.skeleton, cocos3DFile.name, input.output);
//     });

program.command("ModifyCocos3DFileByFbx")
    .alias("mf")
    .description("read the gltf|fbx and replace to the cocos 3d file.")
    .requiredOption("-f, --fbx <path>", "Input gltf file path.")
    .requiredOption("-c, --cocos prefab <path>", "Input cocos 3d file")
    .requiredOption("-o, --output <path>", "Output Cocos 3d file path. It must be local path.")
    .action(function (input: FbxReplaceCocos) {
        fbxReplaceCocos(input.fbx, input.cocos, input.output);
    });

program.command("ModifyCocos3DFile")
    .alias("mg")
    .description("read the gltf|fbx and replace to the cocos 3d file.")
    .requiredOption("-g, --gltf <path>", "Input gltf file path.")
    .requiredOption("-c, --cocos prefab <path>", "Input cocos 3d file")
    .requiredOption("-o, --output <path>", "Output Cocos 3d file path. It must be local path.")
    .action(function (input: GltfReplaceCocos) {
        gltfReplaceCocos(input.gltf, input.cocos, input.output);
    });

// program.command("fbx2gltf")
//     .alias("f2g")
//     .description("Conver fbx to gltf file.")
//     .requiredOption("-f, --fbx <path>", "Input Fbx file path.")
//     .requiredOption("-o, --output <path>", "Output gltf path. It must be local path.")
//     .action(function (input: Fbx2Cocos) {
//         fbxToGLtf(input.fbx, input.output);
//     });

program.parse();