import path from "path";
import * as fs from 'fs';
import { Geometry } from "./geometry.js";
import { attributes } from "./config.js";
import { AttributeName, FormatInfos } from "./cocos.js";
import { Mesh } from "./gltf2parser/Gltf2Parser";
import { Skin } from "./gltf2parser/Gltf2Parser";


const dirName = path.resolve();
export function writeJson(geomerty: Geometry, mesh: Mesh, skin: Skin | null) {
    let joints: any[] = [];
    if (skin) {
        for (let i = 0; i < skin.joints.length; i++) {
            let skinc = skin.joints[i];
            let jointIndex = skinc.index;
            joints.push(jointIndex);
        }
    }

    let attributeList: number[][] = [];
    let primitives: any[] = [];
    let vertexBundles: any[] = [];

    let minPosition = [Infinity, Infinity, Infinity];
    let maxPosition = [-Infinity, -Infinity, -Infinity];

    for (let i = 0; i < mesh.primitives.length; i++) {
        let boundMin = mesh.primitives[i].position?.boundMin!;
        let boundMax = mesh.primitives[i].position?.boundMax!;
        for (let j = 0; j < 3; j++) {
            minPosition[j] = Math.min(minPosition[j], boundMin[j]);
            maxPosition[j] = Math.max(maxPosition[j], boundMax[j]);
        }
        let count = mesh.primitives[i].position?.elementCnt!;
        let attribute = [];
        let stride = 0;
        let length = 0;
        for (let j = 1; j < attributes.length; j++) {
            let attributec = attributes[j];
            switch (attributec.name) {
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
            attribute.push(attributes[j]);
            stride += FormatInfos[attributec.format].size;
        }
        length = count * stride;
        let view = {
            "view": {
                "offset": 0,
                "length": length,
                "count": count,
                "stride": stride
            },
            "attributes": attribute
        }

        let primitiveStirde = 4;
        let primitiveCount = mesh.primitives[0].indices?.elementCnt!;
        let primitive;
        if (skin) {
            primitive = {
                "primitiveMode": 7,
                "jointMapIndex": 0,
                "vertexBundelIndices": [
                    i
                ],
                "indexView": {
                    "offset": 0,
                    "length": primitiveCount * 4,
                    "count": primitiveCount,
                    "stride": primitiveStirde
                }
            }
        } else {
            primitive = {
                "primitiveMode": 7,
                "vertexBundelIndices": [
                    i
                ],
                "indexView": {
                    "offset": 0,
                    "length": primitiveCount * 4,
                    "count": primitiveCount,
                    "stride": primitiveStirde
                }
            }
        }
        if (i > 0) {
            view.view.offset = primitives[i - 1].indexView.offset + primitives[i - 1].indexView.length;
        }
        primitive.indexView.offset = view.view.length + view.view.offset;
        primitives.push(primitive);
        vertexBundles.push(view);
    }

    minPosition.unshift(1);
    maxPosition.unshift(1);

    let dir = path.join(dirName, './sourceMesh/quad.json');
    let targetDir = path.join(dirName, './targetMesh/quad.json');
    fs.readFile(dir, 'utf8', function (err, data1) {
        if (err) {
            console.log('read json error');
        }
        let newData = JSON.parse(data1.toString());
        let mainData = newData[5][0][3];
        if (mainData[0].primitives.length !== primitives.length) {
            throw ("primitives length no same");
        }
        if (mainData[0].vertexBundles.length !== vertexBundles.length) {
            throw ("vertexBoundles length no same");
        }
        if (mainData[0].jointMaps) {
            mainData[0].jointMaps[0] = joints;
        } else {
            if (joints.length > 0) {
                throw ("source no joints ,target has joints");
            }
        }
        mainData[0].primitives = primitives;
        mainData[0].vertexBundles = vertexBundles;
        mainData[3] = minPosition;
        mainData[6] = maxPosition;

        fs.writeFile(targetDir, JSON.stringify(newData), function (err) {
            if (err) {
                console.log('write json error');
            }
        })
    })
}
