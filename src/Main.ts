
import path from "path";
import { CocosSkeleton, CocosSkeletonMeta } from "./CocosModel";
import CocosModelReader from "./CocosModelReader";
import CocosModelWriter from "./CocosModelWriter";
import { fbxToGltf, loadGltf, readFBXToGltf } from "./Common";
import Geometry from "./Geometry";
import { GLTFLoader, glTFLoaderBasic } from "./glTFLoader";


// test
// const reader = new CocosModelReader("./assets/out/model_cow/model_cow");
// const reader = new CocosModelReader("E:/workspace/Cocos/ReplaceModelTest/build/web-mobile/resource/model/Quad/Quad");
// console.log("reader", reader.mesh.bundles[0].attributeValues[3]);

// console.log("reader", reader.mesh);

// const metaData = CocosModelReader.readMeshMeta("./assets/cocos/model_cow.json");
// const gltf = loadGltf("./assets/gltf/model_cow/model_cow.gltf");
// const geometry = new Geometry(gltf.getMesh(0), gltf.getSkin(0));
// const write = new CocosModelWriter("./assets/out/model_cow/model_cow", metaData, geometry);

// const metaData = CocosModelReader.readMeshMeta("E:/workspace/Cocos/ReplaceModelTest/build/web-mobile/resource/model/Quad/Quad.json");
// const gltf = loadGltf("./assets/gltf/Quad/Quad.gltf");
// const geometry = new Geometry(gltf.getMesh(0), gltf.getSkin(0));
// const write = new CocosModelWriter("./assets/out/Quad/Quad", metaData, geometry);

const filename = "Quad1";
const meshname = "Quad1_Material0";
const replaceName = "YeZiShu";
// const reader = new CocosModelReader(`E:/workspace/Cocos/ReplaceModelTest/build/web-mobile/resource/model/${filename}/${meshname}`);

// for (const primitive of reader.mesh.primitives) {
//     console.log(primitive);
// }
// for (const bundle of reader.mesh.bundles) {
//     for (const attr of bundle.attributeValues) {
//         console.log(attr.attribute.name, attr.data);
//     }
// }
console.warn("------------------------------------------------")
const filePath = "D:/cocos/ReplaceModelTest/build/web-mobile/resource/model";
const metaData = CocosModelReader.readMeshMeta(`${filePath}/${filename}/${meshname}@mesh.json`);
// const gltf = loadGltf("./assets/gltf/model_cow/model_cow.gltf");
// const gltf = readFBXToGltf(`./assets/fbx/${filename}.fbx`);
// const geometry = new Geometry(gltf.getMesh(0), gltf.getSkin(0));
// const write = new CocosModelWriter(`./assets/out/${filename}/${meshname}`, metaData, geometry);

// const metaData = CocosModelReader.readMeshMeta("E:/workspace/Cocos/ReplaceModelTest/build/web-mobile/resource/model/diaoxiang/diaoxiang.json");
// const gltf = readFBXToGltf("./assets/fbx/diaoxiang.fbx");
// const geometry = new Geometry(gltf.getMesh(0), gltf.getSkin(0));
// const write = new CocosModelWriter("./assets/out/diaoxiang/diaoxiang", metaData, geometry);

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
