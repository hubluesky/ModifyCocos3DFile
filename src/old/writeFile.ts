import { AttributeName, FormatInfos, getComponentByteLength, getWriter } from "./Cocos.js";
import { attributes } from "./config.js";
import { Geometry } from "./geometry.js";
import * as fs from 'fs';
import { Mesh } from "./gltf2parser/Gltf2Parser.d.js";


export function writeBin(geomerty: Geometry, mesh: Mesh) {
    let attributeList: number[][] = [];
    let dataIndex = 0;
    let indiceIndex = 0;
    for (let i = 0; i < mesh.primitives.length; i++) {
        // console.log('cc');
        let count = mesh.primitives[i].position?.elementCnt!;
        for (let j = 0; j < count; j++) {
            for (let k = 1; k < attributes.length; k++) {
                let attribute = attributes[k];
                switch (attribute.name) {
                    case AttributeName.ATTR_POSITION:
                        attributeList = geomerty.positionList;
                        break;
                    case AttributeName.ATTR_NORMAL:
                        attributeList = geomerty.normalList;
                        break;
                    case AttributeName.ATTR_TEX_COORD:
                        attributeList = geomerty.texCoordList;
                        break;
                    case AttributeName.ATTR_TANGENT:
                        attributeList = geomerty.tangentList;
                        break;
                    case AttributeName.ATTR_JOINTS:
                        attributeList = geomerty.jointList;
                        break;
                    case AttributeName.ATTR_WEIGHTS:
                        attributeList = geomerty.weightList;
                        break;
                    default:
                        throw `Can not suppert attribute ${attribute}`;
                }
                if (attributeList.length == 0) continue;
                let vertexData = attributeList[dataIndex];
                let buffer = new ArrayBuffer(FormatInfos[attribute.format].size);
                let dataView = new DataView(buffer);
                let writer = getWriter(dataView, attribute.format)!;
                let inputComponentByteLength = getComponentByteLength(attribute.format);
                for (let k = 0; k < vertexData.length; k++) {
                    let data = vertexData[k];
                    let offset = k * inputComponentByteLength;
                    writer(offset, data);
                }
                writeFile(dataView);

            }
            dataIndex++;
        }
        // console.log('aa');
        // 写入网格顶点索引数据
        attributeList = geomerty.indicesList;
        let indiceCount = mesh.primitives[i].indices?.elementCnt!;
        for (let i = 0; i < indiceCount; i++) {
            let attribute = attributes[0];
            let vertexData = attributeList[indiceIndex];
            let buffer = new ArrayBuffer(FormatInfos[attribute.format].size);
            let dataView = new DataView(buffer);
            let writer = getWriter(dataView, attribute.format)!;
            let inputComponentByteLength = getComponentByteLength(attribute.format);
            for (let k = 0; k < vertexData.length; k++) {
                let data = vertexData[k];
                let offset = k * inputComponentByteLength;
                writer(offset, data);
            }
            writeFile(dataView);
            indiceIndex++;
        }
    }

    function writeFile(dataView: DataView) {
        fs.writeFileSync("./targetMesh/quad.bin", dataView, { encoding: "binary", flag: 'a' });
        // let bufferString = fs.readFileSync("./targetMesh/quad.bin", { encoding: "binary" });
        // const nb = Buffer.from(bufferString, "binary");
        // let aa = nb.buffer.slice(nb.byteOffset, nb.byteOffset + nb.byteLength);
        // console.log(aa.byteLength);
    }
}