import { program } from "commander";
import * as fs from 'fs';
import path from "path";
import { convertAnimation, convertMesh, fbxToGltf } from "./Common";

async function convertFbxMeshFile(fbxPath: string, tempPath: string, cocosPath: string, outPath: string) {
    const modelName = path.basename(fbxPath, path.extname(fbxPath));
    tempPath = `${tempPath}/${modelName}`;
    const gltfPath = await fbxToGltf(fbxPath, tempPath);
    await convertGltfMeshFile(gltfPath, cocosPath, outPath);
    fs.rmSync(tempPath, { recursive: true, force: true });
}

async function convertGltfMeshFile(gltfPath: string, cocosPath: string, outPath: string) {
    const modelName = path.basename(gltfPath, path.extname(gltfPath));
    outPath = path.join(outPath, modelName);
    await convertMesh(gltfPath, cocosPath, outPath);
    // child_process.execSync(`start "" "${outPath}"`);
    console.log("Conversion completed, output directory:", outPath);
}

async function convertFbxAnimationFile(fbxPath: string, tempPath: string, cocosPath: string, outPath: string) {
    const modelName = path.basename(fbxPath, path.extname(fbxPath));
    tempPath = `${tempPath}/${modelName}`;
    const gltfPath = await fbxToGltf(fbxPath, tempPath);
    await convertGltfAnimationFile(gltfPath, cocosPath, outPath);
    fs.rmSync(tempPath, { recursive: true, force: true });
}

async function convertGltfAnimationFile(gltfPath: string, cocosPath: string, outPath: string) {
    const modelName = path.basename(gltfPath, path.extname(gltfPath));
    outPath = path.join(outPath, modelName);
    await convertAnimation(gltfPath, cocosPath, outPath);
    // child_process.execSync(`start "" "${outPath}"`);
    console.log("Conversion completed, output directory:", outPath);
}

interface FBX2Gltf {
    fbx: string;
    output: string;
}

interface Fbx2Cocos {
    name: string;
    fbx: string;
    temp?: string;
    cocos: string;
    output: string;
}

interface Gltf2Cocos {
    name: string;
    gltf: string;
    cocos: string;
    output: string;
}

program.version("0.1.0", "-v, --version", "Cocos 3d file converter");

program.command("fbx2gltf")
    .alias("f2g")
    .description("Conver fbx to gltf file.")
    .requiredOption("-f, --fbx <path>", "Input Fbx file path.")
    .option("-o, --output <path>", "Output gltf path. It must be local path.")
    .action(function (input: FBX2Gltf) {
        fbxToGltf(input.fbx, input.output);
    });

program.command("ConvertFbxMesh")
    .alias("cfm").alias("mf").alias("ModifyCocos3DFileByFbx")
    .description("read the fbx and replace to the cocos 3d mesh file.")
    .requiredOption("-f, --fbx <path>", "Input gltf file path.")
    .option("-t, --temp <path>", "fbx to gltf temp path, default temp.")
    .requiredOption("-c, --cocos <path>", "Input cocos 3d file")
    .requiredOption("-o, --output <path>", "Output Cocos 3d file path.")
    .action(function (input: Fbx2Cocos) {
        return convertFbxMeshFile(input.fbx, input.temp ?? "temp", input.cocos, input.output).catch(error => {
            program.error(error.message, { exitCode: error.cause });
        });
    });

program.command("ConvertGltfMesh")
    .alias("cgm").alias("mg").alias("ModifyCocos3DFile")
    .description("read the gltf and replace to the cocos 3d mesh file.")
    .requiredOption("-g, --gltf <path>", "Input gltf file path.")
    .requiredOption("-c, --cocos <path>", "Input cocos 3d file")
    .requiredOption("-o, --output <path>", "Output Cocos 3d file path.")
    .action(function (input: Gltf2Cocos) {
        return convertGltfMeshFile(input.gltf, input.cocos, input.output).catch(error => {
            program.error(error.message, { exitCode: error.cause });
        });
    });

program.command("ConvertFbxAnimation")
    .alias("cfa")
    .description("read the fbx and replace to the cocos 3d animation file.")
    .requiredOption("-f, --fbx <path>", "Input gltf file path.")
    .option("-t, --temp <path>", "fbx to gltf temp path, default temp.")
    .requiredOption("-c, --cocos <path>", "Input cocos 3d file")
    .requiredOption("-o, --output <path>", "Output Cocos 3d file path.")
    .action(function (input: Fbx2Cocos) {
        return convertFbxAnimationFile(input.fbx, input.temp ?? "temp", input.cocos, input.output).catch(error => {
            program.error(error.message, { exitCode: error.cause });
        });
    });

program.command("ConvertGltfAnimation")
    .alias("cga")
    .description("read the gltf and replace to the cocos 3d animation file.")
    .requiredOption("-g, --gltf <path>", "Input gltf file path.")
    .requiredOption("-c, --cocos <path>", "Input cocos 3d file")
    .requiredOption("-o, --output <path>", "Output Cocos 3d file path.")
    .action(function (input: Gltf2Cocos) {
        return convertGltfAnimationFile(input.gltf, input.cocos, input.output).catch(error => {
            program.error(error.message, { exitCode: error.cause });
        });
    });

program.parse();