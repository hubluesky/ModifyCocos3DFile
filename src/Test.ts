import child_process from 'child_process';
import path from 'path';
import { fbxToGltf, convertMesh, convertAnimation } from './Common';
import { io } from './IO';
import { decodeCCONBinary } from './ccon';
import { ConvertError } from './ConvertError';

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

async function testConvertMesh() {
    const gltfPath = "assets/gltf/ktzs/ktzs.gltf";
    const cocosPath = "assets/cocos/ktzs";
    const outPath = "temp/out/ktzs";
    await convertMesh(gltfPath, cocosPath, outPath);
    child_process.exec(`start "" "${path.resolve(outPath)}"`);
    console.log("convert completed!");
}

async function testConvertAnimation() {
    const gltfPath = "assets/gltf/ktzs/ktzs@run.glb";
    const cocosPath = "assets/cocos/ktzs@idle";
    const outPath = "temp/out/ktzs@idle";
    await convertAnimation(gltfPath, cocosPath, outPath);
    child_process.exec(`start "" "${path.resolve(outPath)}"`);
    console.log("convert completed!");
}

async function splitCconb() {
    {
        const cocosPath = "temp/out/ktzs@idle/21c497fc-caba-46e7-b79c-5464dfcf40ef@1f586.cconb";
        const outPath = "temp/out/ktzs@idle/ccon.json";
        const arrayBuffer = io.readBinaryFileSync(cocosPath);
        try {
            var ccon = decodeCCONBinary(new Uint8Array(arrayBuffer));
        } catch (err) {
            throw new ConvertError(121, "Animation file format is error." + err, err);
        }
        io.writeTextFileSync(outPath, JSON.stringify(ccon.document));
    }
    {
        const cocosPath2 = "assets/cocos/ktzs@attack/02793395-95bd-46e5-805b-ab621f110e28@989ed.cconb";
        const outPath2 = "temp/out/ktzs@idle/ccon2.json";
        const arrayBuffer2 = io.readBinaryFileSync(cocosPath2);
        try {
            var ccon2 = decodeCCONBinary(new Uint8Array(arrayBuffer2));
        } catch (err) {
            throw new ConvertError(121, "Animation file format is error." + err, err);
        }
        io.writeTextFileSync(outPath2, JSON.stringify(ccon2.document));
    }

    // child_process.exec(`start "" "${path.resolve(outPath)}"`);
    console.log("convert completed!");
}

// testConvertMesh();
testConvertAnimation();
// splitCconb();

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
