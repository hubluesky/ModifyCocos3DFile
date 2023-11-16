import child_process from 'child_process';
import path from 'path';
import { fbxToGLtf, gltfToCocosFile } from './Common';

// console.log("System", System.import);

// declare namespace cc {
//     class Asset {

//     }
// }

// globalThis.cc = await SystemJs.System.import("./src/cocos/cc.js");

// console.log("cc", cc.Asset);

// import { SystemJs } from "./cocos/system.bundle.js";

// const SystemJs = require("./cocos/system.bundle.js")
// import app2 = require("./cocos/system.bundle.js");

// const prefabJson: string = io.readTextFileSync("./assets/cocos/paotai/paotai@prefab.json");
// const mesh2Bin = io.readBinaryFileSync("./assets/cocos/paotai/paotai02_Material0.bin");
// const mesh2Json: string = io.readTextFileSync("./assets/cocos/paotai/paotai02_Material0@mesh.json");
// const mesh1Bin = io.readBinaryFileSync("./assets/cocos/paotai/paotai01_Material0.bin");
// const mesh1Json: string = io.readTextFileSync("./assets/cocos/paotai/paotai01_Material0@mesh.json");

// const mesh2 = cocos.deserializeMesh(mesh2Json, mesh2Bin);
// const mesh1 = cocos.deserializeMesh(mesh1Json, mesh1Bin);
// const prefab = cocos.deserializeModel(prefabJson, [mesh1, mesh2]);

// cocos.testMesh("paotai mesh", "6c51737e-2fd0-45ee-b509-7147fb4bf4ce@1cb0f");
// cocos.init("./assets/cocos/paotai");
// const paotaiPrefab = await cocos.loadAssetInDependent("6c51737e-2fd0-45ee-b509-7147fb4bf4ce@9112a.json");
// const text = io.readTextFileSync("./assets/cocos/paotai/6c51737e-2fd0-45ee-b509-7147fb4bf4ce@9112a.json");
// const data = cocos.deserialize(text);
// console.log("paotaiPrefab", data);

async function run() {
    const fbxPath = "assets/fbx/model_EnemyTiers3.FBX";
    const gltfPath = await fbxToGLtf(fbxPath);
    const cocosPath = "assets/cocos/Stickman02";
    const outPath = "temp/out/Stickman02";
    await gltfToCocosFile(gltfPath, cocosPath, outPath);
    child_process.exec(`start "" "${path.resolve(outPath)}"`);
    console.log("convert completed!");
}

run();
// cocosToGltf(prefab);
// const mesh: cc.Mesh = cocos.deserializeMesh(text, bin);
// // console.log("mesh", mesh)
// const modelName = "Quad";
// let outPath = "./temp/Quad"

// const josnDoc = await cocosMeshToGltf2(mesh, modelName);
// outPath = path.join(outPath, modelName);
// writeGltfFile(josnDoc, modelName, outPath);
// console.log("Conversion completed, output directory:", outPath);
// // child_process.execSync(`start "" "${outPath}"`);
