import { AttributeName, FormatInfo, getComponentByteLength, getWriter } from "./cocos.js";
import { attributes } from "./config.js";
import { Geometry } from "./geometry.js";
import * as fs from 'fs';

let dataView: DataView;


export function writeBin(geomerty: Geometry) {
    let vertexCount = geomerty.positionList.length;
    let attributeList: number[][] = [];
    for (let i = 0; i < vertexCount ; i++) {
        for (let j = 1; j < attributes.length ; j++) {
            let attribute = attributes[j];
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
            let vertexData = attributeList[i];
            let buffer = new ArrayBuffer(geomerty.byteLengthList[j]);
            dataView = new DataView(buffer);
            let writer = getWriter(dataView, attribute.format)!;
            let inputComponentByteLength = getComponentByteLength(attribute.format);
            for (let k = 0; k < vertexData.length; k++) {
                let data = vertexData[k];
                let offset = k * inputComponentByteLength;
                writer(offset, data);
            }
            fs.writeFileSync("test.bin",dataView,{encoding:"binary",flag:'a'});
        }
    }
}