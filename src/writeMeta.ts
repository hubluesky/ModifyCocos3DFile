import path from "path";
import * as fs from 'fs';
import { Geometry } from "./geometry.js";
import { attributes } from "./config.js";
import { AttributeName, FormatInfos } from "./cocos.js";
import { Mesh } from "./gltf2parser/Gltf2Parser.d";
import { Skin } from "./gltf2parser/Gltf2Parser.d";

const dirName = path.resolve();


export function writeMeta(geomerty: Geometry, mesh: Mesh, skin: Skin) {
    let joints = [];
    for (let i = 0; i < skin.joints.length; i++) {
        let skinc = skin.joints[i];
        let jointIndex = skinc.index;
        joints.push(jointIndex);
    }

    let minPosition = mesh.primitives[0].position?.boundMin;
    minPosition?.unshift(1)
    let maxPosition = mesh.primitives[0].position?.boundMax;
    maxPosition?.unshift(1);

    let count = geomerty.positionList.length;
    let stride = 0;
    let length = 0;


    let attributeList: number[][] = [];
    for (let j = 1; j < attributes.length; j++) {
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
        stride += FormatInfos[attribute.format].size;
    }
    length = count * stride;
    let primitiveOffset = length;
    let primitiveCount = mesh.primitives[0].indices?.elementCnt;
    let primitiveLength = mesh.primitives[0].indices?.byteSize;
    let data =
        [
            {
                "primitives": [
                    {
                        "primitiveMode": 7,
                        "jointMapIndex": 0,
                        "vertexBundelIndices": [
                            0
                        ],
                        "indexView": {
                            "offset": primitiveOffset,
                            "length": primitiveLength,
                            "count": primitiveCount,
                            "stride": primitiveLength! / primitiveCount!
                        }
                    }
                ],
                "vertexBundles": [
                    {
                        "view": {
                            "offset": 0,
                            "length": length,
                            "count": count,
                            "stride": stride
                        },
                        "attributes": [
                            {
                                "name": "a_position",
                                "format": 32,
                                "isNormalized": false
                            },
                            {
                                "name": "a_normal",
                                "format": 32,
                                "isNormalized": false
                            },
                            {
                                "name": "a_texCoord",
                                "format": 21,
                                "isNormalized": false
                            },
                            {
                                "name": "a_tangent",
                                "format": 44,
                                "isNormalized": false
                            },
                            {
                                "name": "a_joints",
                                "format": 42,
                                "isNormalized": false
                            },
                            {
                                "name": "a_weights",
                                "format": 44,
                                "isNormalized": false
                            }
                        ]
                    }
                ],
                "jointMaps": [
                    joints
                ]
            },
            "minPosition",
            8,
            minPosition,
            "maxPosition",
            8,
            maxPosition
        ]

    console.log(minPosition,maxPosition);

    let dir = path.join(dirName, './sourceMesh/model_cow.json');
    fs.readFile(dir, 'utf8', function (err, data1) {
        if (err) {
            console.log('read json error');
        }
        let newData = JSON.parse(data1.toString());
        
        newData[5][0][3] = data
        console.log(newData,'sss');
        fs.writeFile(dir,JSON.stringify(newData),function(err){
            if(err){
                console.log('write json error');
                
            }
        })
    })
}
