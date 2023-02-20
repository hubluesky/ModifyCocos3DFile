
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

program.version("0.0.1", "-v, --version", "Cocos 3d file converter");

program.command("ModifyCocos3DFileByFbx")
    .alias("mf")
    .description("read the fbx and replace to the cocos 3d file.")
    .requiredOption("-f, --fbx <path>", "Input gltf file path.")
    .requiredOption("-c, --cocos <path>", "Input cocos 3d file")
    .requiredOption("-o, --output <path>", "Output Cocos 3d file path.")
    .action(function (input: FbxReplaceCocos) {
        fbxReplaceCocos(input.fbx, input.cocos, input.output);
    });

program.command("ModifyCocos3DFile")
    .alias("mg")
    .description("read the gltf and replace to the cocos 3d file.")
    .requiredOption("-g, --gltf <path>", "Input gltf file path.")
    .requiredOption("-c, --cocos <path>", "Input cocos 3d file")
    .requiredOption("-o, --output <path>", "Output Cocos 3d file path.")
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