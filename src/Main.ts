
import path from "path";
import child_process from "child_process";
import { gltfToCocosFile, readFBXToGltf } from "./Common";
import { glTFLoaderBasic } from "./glTFLoader";

console.log("start main script");

async function logFbxData(filename: string) {
    const gltf = await readFBXToGltf(`./assets/fbx/${filename}.fbx`, false);
    const primitive = gltf.meshes[0].primitives[0];
    console.log("indices", glTFLoaderBasic.accessorToTypeArray(primitive.indices));
    console.log("positions", glTFLoaderBasic.accessorToTypeArray(primitive.attributes.POSITION));

    // const positionAccessor = primitive.attributes.POSITION;
    // const TypedArray = glTFLoaderBasic.glTypeToTypedArray(positionAccessor.componentType);
    // const positionArray = new TypedArray(positionAccessor.bufferView.data);
    // console.log("normals", glTFLoaderBasic.getAccessorData(primitive.attributes.NORMAL));
    // console.log("texcoords", glTFLoaderBasic.getAccessorData(primitive.attributes.TEXCOORD_0));
}

// await logFbxData("Horse");

async function translate(filename: string, meshName: string, replaceName: string, filePath: string) {
    // const gltf = await loadGltf(`./assets/gltf//${replaceName}/${replaceName}.gltf`);
    const gltf = await readFBXToGltf(`./assets/fbx/${replaceName}.fbx`, true);
    const meshMetaPath = `${filePath}/${filename}/${meshName}@mesh.json`;
    const skeletonPath = `${filePath}/${filename}/${meshName}@skeleton.json`;
    gltfToCocosFile(gltf, meshName, meshMetaPath, skeletonPath, `./temp/out/${filename}`);
    const outPath = path.join(process.cwd(), `/temp/out/${filename}`);
    console.log("Conversion completed, output directory:", outPath);
    child_process.execSync(`start "" "${outPath}"`);
}

await translate("Quad", "quad.001", "YeZhiShu", "E:/workspace/Cocos/ReplaceModelTest/build/web-mobile/resource/model");
// debugger;