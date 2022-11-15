
import CocosModelReader from "./CocosModelReader";
import CocosModelWriter from "./CocosModelWriter";
import { loadGltf, readFBXToGltf } from "./Common";
import Geometry from "./Geometry";


// test
// const reader = new CocosModelReader("./assets/out/model_cow/model_cow");
const reader = new CocosModelReader("./assets/cocos/model_cow");

// console.log("reader", reader.mesh);

// const metaData = CocosModelReader.readMeshMeta("./assets/cocos/model_cow.json");
// const gltf = loadGltf("./assets/gltf/model_cow/model_cow.gltf");
// const geometry = new Geometry(gltf.getMesh(0), gltf.getSkin(0));
// const write = new CocosModelWriter("./assets/out/model_cow/model_cow", metaData, geometry);

// const metaData = CocosModelReader.readMeshMeta("E:/workspace/Cocos/ReplaceModelTest/build/web-mobile/resource/model/YeZiShu/YeZiShu_Material0.json");
// const gltf = readFBXToGltf("./assets/fbx/YeZiShu.FBX");
// const metaData = CocosModelReader.readMeshMeta("E:/workspace/Cocos/ReplaceModelTest/build/web-mobile/resource/model/box/Cube.json");
// const gltf = loadGltf("./assets/gltf/box/box.gltf");
// const geometry = new Geometry(gltf.getMesh(0), gltf.getSkin(0));
// const write = new CocosModelWriter("./assets/out/box/Cube", metaData, geometry);

// console.log("shit of ts-node");
debugger;