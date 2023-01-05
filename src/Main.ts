
import path from "path";
import { CocosSkeleton, CocosSkeletonMeta } from "./CocosModel";
import CocosModelReader from "./CocosModelReader";
import CocosModelWriter from "./CocosModelWriter";
import { readFBXToGltf } from "./Common";
import Geometry from "./Geometry";


const filename = "model_cow";
const meshname = "model_cow";
const replaceName = "model_tiger";
const filePath = "E:/workspace/Cocos/ReplaceModelTest/build/web-mobile/resource/model";
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
const geometry = new Geometry(gltf);
const write = new CocosModelWriter(`./temp/out/${filename}/${meshname}`, metaData, geometry, skeletonMeta, skeleton);
// console.log("indices", glTFLoaderBasic.getAccessorData(primitive.indices));
// console.log("positions", glTFLoaderBasic.getAccessorData(primitive.attributes.POSITION));
// const positionAccessor = primitive.attributes.POSITION;
// const TypedArray = glTFLoaderBasic.glTypeToTypedArray(positionAccessor.componentType);
// const positionArray = new TypedArray(positionAccessor.bufferView.data);
// console.log("normals", glTFLoaderBasic.getAccessorData(primitive.attributes.NORMAL));
// console.log("texcoords", glTFLoaderBasic.getAccessorData(primitive.attributes.TEXCOORD_0));

// debugger;
console.log("转换完毕，输出目录:", path.join(process.cwd(), `/temp/out/${filename}`));
