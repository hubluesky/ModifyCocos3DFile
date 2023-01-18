
import { Logger, NodeIO } from "@gltf-transform/core";
import child_process from "child_process";
import path from "path";
import { computeNormalAndTangent, gltfToCocosFile, fbxToGLtf, readCocosMesh, cocosMeshToGltf, writeGltfFile } from "./Common";

console.log("start main script");

async function logFbxData(filename: string) {
    // const gltf = await readFBXToGltf(`./assets/fbx/${filename}.fbx`, false);
    // const primitive = gltf.meshes[0].primitives[0];
    // console.log("indices", glTFLoaderBasic.accessorToTypeArray(primitive.indices));
    // console.log("positions", glTFLoaderBasic.accessorToTypeArray(primitive.attributes.POSITION));

    // const positionAccessor = primitive.attributes.POSITION;
    // const TypedArray = glTFLoaderBasic.glTypeToTypedArray(positionAccessor.componentType);
    // const positionArray = new TypedArray(positionAccessor.bufferView.data);
    // console.log("normals", glTFLoaderBasic.getAccessorData(primitive.attributes.NORMAL));
    // console.log("texcoords", glTFLoaderBasic.getAccessorData(primitive.attributes.TEXCOORD_0));
}

// await logFbxData("Horse");

async function translate(filename: string, meshName: string, replaceName: string, filePath: string) {
    const gltfPath = await fbxToGLtf(`./assets/fbx/${replaceName}.fbx`);
    const meshMetaPath = `${filePath}/${filename}/${meshName}@mesh.json`;
    const skeletonPath = `${filePath}/${filename}/${meshName}@skeleton.json`;
    await gltfToCocosFile(gltfPath, meshMetaPath, skeletonPath, `./temp/out/${filename}`, meshName);
    const outPath = path.join(process.cwd(), `/temp/out/${filename}`);
    console.log("Conversion completed, output directory:", outPath);
    child_process.execSync(`start "" "${outPath}"`);
}

// await translate("model_cow", "model_cow", "model_tiger", "E:/workspace/Cocos/ReplaceModelTest/build/web-mobile/resource/model");

async function cocosToGltf(filename: string, meshName: string, filePath: string) {
    const cocosMesh = readCocosMesh(filename, meshName, filePath);
    const josnDoc = await cocosMeshToGltf(cocosMesh, meshName);
    writeGltfFile(josnDoc, filename, `./temp/cocos2gltf/${filename}`);
    console.log("Conversion completed, output directory:");
}

await cocosToGltf("Cube", "Cube", "E:/workspace/Cocos/ReplaceModelTest/build/web-mobile/resource/model");

async function testGltfTransform(filename: string, meshName: string, replaceName: string, filePath: string) {
    const gltfPath = await fbxToGLtf(`./assets/fbx/${replaceName}.fbx`);
    const doc = await new NodeIO().read(gltfPath);
    const root = doc.getRoot();
    doc.setLogger(new Logger(Logger.Verbosity.DEBUG));

    await computeNormalAndTangent(doc, true);
    const mesh = root.listMeshes()[0];
    const skin = root.listSkins()?.[0];
    const primitive = mesh.listPrimitives()[0];
    const indicesAccessor = primitive.getIndices();
    const attributes = primitive.listAttributes();
    const semantics = primitive.listSemantics();
    for (const semantic of semantics) {
        const accessor = primitive.getAttribute(semantic);
        const array = accessor.getArray();
        // console.log(semantic, array.length);
    }

    // const nodes = root.listNodes();
    // const joints = skin.listJoints();
    // const jointValues: number[] = [];
    // for (const joint of joints) {
    //     jointValues.push(nodes.indexOf(joint));
    // }

    // console.log(jointValues);

    // const gltfPath = await readFBXToGltf(`./assets/fbx/${replaceName}.fbx`, true);
    // const meshMetaPath = `${filePath}/${filename}/${meshName}@mesh.json`;
    // const skeletonPath = `${filePath}/${filename}/${meshName}@skeleton.json`;
    // const outPath = path.join(process.cwd(), `/temp/out/${filename}`);
    // const filenames = await gltfToCocosFile(gltfPath, meshName, meshMetaPath, skeletonPath, outPath);
}

// await testGltfTransform("model_cow", "model_cow", "Cube", "E:/workspace/Cocos/ReplaceModelTest/build/web-mobile/resource/model");