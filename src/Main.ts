
import path from "path";
import { CocosSkeleton, CocosSkeletonMeta } from "./CocosModel";
import CocosModelReader from "./CocosModelReader";
import CocosModelWriter from "./CocosModelWriter";
import { readFBXToGltf } from "./Common";
import Geometry from "./Geometry";
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

async function translate(filename: string, meshname: string, replaceName: string, filePath: string) {
    const metaData = CocosModelReader.readMeshMeta(`${filePath}/${filename}/${meshname}@mesh.json`);

    // const gltf = await loadGltf(`./assets/gltf//${replaceName}/${replaceName}.gltf`);
    const gltf = await readFBXToGltf(`./assets/fbx/${replaceName}.fbx`, false);
    let skeleton: CocosSkeleton;
    let skeletonMeta: CocosSkeletonMeta;
    const skeletonFilename = `${filePath}/${filename}/${meshname}@skeleton.json`;
    if (gltf.skins?.length == 1 && CocosModelReader.isFileExist(skeletonFilename)) {
        skeletonMeta = CocosModelReader.readSkeletonMeta(skeletonFilename);
        const skin = gltf.skins[0];
        skeleton = new CocosSkeleton(skin.joints, skin.inverseBindMatrix);
    }
    const geometry = Geometry.creatFromGLTF(gltf);
    const write = new CocosModelWriter(`./temp/out/${filename}/${meshname}`, metaData, geometry, skeletonMeta, skeleton);
    console.log("转换完毕，输出目录:", path.join(process.cwd(), `/temp/out/${filename}`));
}

// await translate("model_cow", "model_cow", "model_tiger", "E:/workspace/Cocos/ReplaceModelTest/build/web-mobile/resource/model");
// debugger;