
import CocosModelReader from "./CocosModelReader";
import CocosModelWriter from "./CocosModelWriter";
import { loadGltf, readFBXToGltf } from "./Common";
import Geometry from "./Geometry";


// test
// const reader = new CocosModelReader("./sourceMesh/Quad2");
// console.log("reader", reader.mesh);

// const metaData = CocosModelReader.readMeshMeta("./assets/cocos/model_cow.json");
// const gltf = readFBXToGltf("./assets/fbx/ff.FBX");
// const gltf = readFBXToGltf("./assets/fbx/model_tiger.FBX");
// const gltf = loadGltf("./assets/gltf/model_cow/model_cow.gltf");
const metaData = CocosModelReader.readMeshMeta("./assets/cocos/Quad.json");
const gltf = loadGltf("./assets/gltf/Quad/Quad.gltf");
const geometry = new Geometry(gltf.getMesh(0), gltf.getSkin(0));
const write = new CocosModelWriter("./assets/out/Quad/Quad", metaData, geometry);
// const write = new CocosModelWriter("./assets/out/Quad/Quad", metaData, geometry);

// console.log("shit of ts-node");
debugger;