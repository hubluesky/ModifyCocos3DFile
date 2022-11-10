
import CocosModelReader from "./CocosModelReader";
import CocosModelWriter from "./CocosModelWriter";
import { loadGltf, readFBXToGltf } from "./Common";
import Geometry from "./Geometry";


// test
// const reader = new CocosModelReader("./sourceMesh/Quad2");
// console.log("reader", reader.mesh);

const metaData = CocosModelReader.readMeshMeta("E:/workspace/Cocos/ReplaceModelTest/build/web-mobile/resource/model/YeZiShu/YeZiShu_Material0.json");
// const gltf = loadGltf("./assets/gltf/model_cow/model_cow.gltf");
const gltf = readFBXToGltf("./assets/fbx/YeZiShu.FBX");
const geometry = new Geometry(gltf.getMesh(0), gltf.getSkin(0));
const write = new CocosModelWriter("./assets/out/YeZiShu/YeZiShu_Material0", metaData, geometry);

// const metaData = CocosModelReader.readMeshMeta("E:/workspace/Cocos/ReplaceModelTest/build/web-mobile/resource/model/box/Cube.json");
// const gltf = loadGltf("./assets/gltf/box/box.gltf");
// const geometry = new Geometry(gltf.getMesh(0), gltf.getSkin(0));
// const write = new CocosModelWriter("./assets/out/box/Cube", metaData, geometry);

// console.log("shit of ts-node");
debugger;