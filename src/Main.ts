
import CocosModelReader from "./CocosModelReader";
import CocosModelWriter from "./CocosModelWriter";
import { loadGltf } from "./Common";
import Geometry from "./Geometry";


// test
// const reader = new CocosModelReader("./sourceMesh/Quad2");
// console.log("reader", reader.mesh);

const metaData = CocosModelReader.readMeshMeta("./assets/cocos/Quad.json");
const quadGltf = loadGltf("./assets/gltf/Quad/Quad.gltf");
const geometry = new Geometry(quadGltf.getMesh(0));
const write = new CocosModelWriter("./assets/out/Quad/Quad", metaData, geometry);

// console.log("shit of ts-node");
debugger;