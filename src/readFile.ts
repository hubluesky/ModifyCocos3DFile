import * as fs from 'fs';
import { Attribute, AttributeName, FormatInfos, getComponentByteLength, getIndexStrideCtor, getOffset, getReader, getWriter, ISubMesh, IVertexBundle } from './cocos.js';
import process from 'child_process';
import Gltf2Parser, { Mesh, parseGLB, Primitive, Accessor } from "./gltf2parser/Gltf2Parser.d.js";
import fetch from 'node-fetch';
import { assert } from 'console';
import { TTypeArray } from './gltf2parser/types.js';
import { Geometry } from './geometry.js';
import { writeBin } from './writeFile.js';
// @ts-ignore
globalThis.fetch = fetch;

const vertexBundles = [
    {
        "view": {
            "offset": 0,
            "length": 144,
            "count": 3,
            "stride": 48
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
            // {
            //     "name": "a_joints",
            //     "format": 42,
            //     "isNormalized": false
            // },
            // {
            //     "name": "a_weights",
            //     "format": 44,
            //     "isNormalized": false
            // }
        ]
    }
]

const primitives = [{
    "primitiveMode": 7,
    "vertexBundelIndices": [
        0
    ],
    "indexView": {
        "offset": 224,
        "length": 24,
        "count": 6,
        "stride": 4
    }
}];

function readFileSync(filePath: string): ArrayBuffer {
    let bufferString = fs.readFileSync(filePath, { encoding: "binary" });
    const nb = Buffer.from(bufferString, "binary");
    return nb.buffer.slice(nb.byteOffset, nb.byteOffset + nb.byteLength);
}


function readerCocosMesh() {
    const filename = "test.bin";
    let arrayBuffer = readFileSync(filename);
    console.log('byteLength', arrayBuffer.byteLength);
    let aOffset;
    for (let iv = 0; iv < vertexBundles.length; iv++) {
        let vertexBundle = vertexBundles[iv];
        let text = "";
        for (let ia = 0; ia < vertexBundle.attributes.length; ia++) {
            aOffset = getOffset(vertexBundle.attributes as Attribute[], ia);
            const view = new DataView(arrayBuffer, vertexBundle.view.offset + aOffset);
            let attribute = vertexBundle.attributes[ia];
            text += "\n" + attribute.name + " " + aOffset;
            let reader = getReader(view, attribute.format);
            const vertexCount = vertexBundle.view.count;
            const componentCount = FormatInfos[attribute.format].count;
            const inputStride = vertexBundle.view.stride;
            const inputComponentByteLength = getComponentByteLength(attribute.format);
            // const outputStride = stride;
            // const outputComponentByteLength = inputComponentByteLength;
            // console.log("FormatInfos[attribute.format] ", FormatInfos[attribute.format].size);
            for (let iVertex = 0; iVertex < vertexCount; ++iVertex) {
                text += "\t[";
                for (let iComponent = 0; iComponent < componentCount; ++iComponent) {
                    const inputOffset = inputStride * iVertex + inputComponentByteLength * iComponent;
                    let value = reader!(inputOffset);
                    text += value;
                    if (iComponent + 1 < componentCount) text += ",";
                    // const outputOffset = outputStride * iVertex + outputComponentByteLength * iComponent;
                    // writer(outputOffset, reader(inputOffset));
                }
                text += "]";
            }
        }
        console.log("vertexBundle", iv, text);
    }

    // for (let primitive of primitives) {
    //     const Ctor = getIndexStrideCtor(primitive.indexView.stride);
    //     let ibo = new Ctor(arrayBuffer, primitive.indexView.offset, primitive.indexView.count);

    //     let indexValues = "";
    //     for (let i = 0; i < primitive.indexView.count; i++)
    //         indexValues += ibo[i] + " ";
    //     // console.log("indexValues", indexValues);
    // }
}

readerCocosMesh();

async function fbxToGltf(input: string, out: string) {
    const toolPath = "./fbx-gltf-conv/bin/win32/FBX-glTF-conv";
    process.spawnSync(toolPath, [input, "--out", out]);
}

function parseGltf(url: string) {
    switch (url.slice(-4).toLocaleLowerCase()) {
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        case 'gltf':
            let bin: ArrayBuffer | undefined;
            const jsonData = fs.readFileSync(url, { encoding: "utf8" });
            const json = JSON.parse(jsonData);
            if (json.buffers && json.buffers.length > 0) {
                const path = url.substring(0, url.lastIndexOf('/') + 1);
                bin = readFileSync(path + json.buffers[0].uri);
            }

            return new Gltf2Parser(json, bin);

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        case '.glb':
            let arrayBuffer = readFileSync(url);
            const tuple = parseGLB(arrayBuffer);
            return (tuple) ? new Gltf2Parser(tuple[0], tuple[1]) : null;
    }

    return null;
}

function readFBXToGltf(filename: string) {
    const gltfPath = `./${filename}/${filename}.gltf`;
    // fbxToGltf(filename + ".fbx", gltfPath);
    return parseGltf(gltfPath);
}

type ObjectInclude<T, E> = { [k in keyof T]: T[k] extends E ? k : never }[keyof T];

function getAttributeAccessor(primitive: Primitive, property: ObjectInclude<Primitive, Accessor | null>): Accessor {
    if (primitive[property] == null) throw `ffdfdf`;
    return primitive[property]!;
}

function gltfToCocosMesh(mesh: Mesh, vertexBundles: readonly IVertexBundle[], primitives: readonly ISubMesh[]): void {
    assert(mesh.primitives.length == primitives.length);
    // if (meshNames.length != primitives.length) return;

    let vertexBundelOffset = 0;
    for (let ip = 0; ip < primitives.length; ip++) {
        let primitive = primitives[ip];
        let primitive2 = mesh.primitives[ip];
        for (const vertexBundleIndex of primitive.vertexBundelIndices) {
            const vertexBundle = vertexBundles[vertexBundleIndex];
            // let attributesSize = getOffset(vertexBundle.attributes as Attribute[], vertexBundle.attributes.length);
            vertexBundle.view.offset = vertexBundelOffset;
            vertexBundle.view.count = primitive2.position!.elementCnt;
            vertexBundle.view.length = vertexBundle.view.count * vertexBundle.view.stride;
            // const view = new DataView(arrayBuffer, vertexBundle.view.offset + );
            let arrayBuffer = new Uint8Array(vertexBundle.view.length);
            const outputView = new DataView(arrayBuffer.buffer, vertexBundle.view.offset, vertexBundle.view.length);

            for (let iv = 0; iv < vertexBundle.attributes.length; iv++) {
                let attribute = vertexBundle.attributes[iv];

                let accessor: Accessor;
                switch (attribute.name) {
                    case AttributeName.ATTR_POSITION:
                        accessor = getAttributeAccessor(primitive2, "position");
                        break;
                    case AttributeName.ATTR_NORMAL:
                        accessor = getAttributeAccessor(primitive2, "normal");
                        break;
                    case AttributeName.ATTR_TANGENT:
                        accessor = getAttributeAccessor(primitive2, "tangent");
                        break;
                    case AttributeName.ATTR_TEX_COORD:
                        accessor = getAttributeAccessor(primitive2, "texcoord_0");
                        break;
                    case AttributeName.ATTR_TEX_COORD1:
                        accessor = getAttributeAccessor(primitive2, "texcoord_1");
                        break;
                    case AttributeName.ATTR_COLOR:
                        accessor = getAttributeAccessor(primitive2, "color_0");
                        break;
                    case AttributeName.ATTR_JOINTS:
                        accessor = getAttributeAccessor(primitive2, "joints_0");
                        break;
                    case AttributeName.ATTR_WEIGHTS:
                        accessor = getAttributeAccessor(primitive2, "weights_0");
                        break;
                    default:
                        throw `Can not suppert attribute ${attribute.name}`;
                }
                if (accessor.data == null) throw "";

                const vertexCount = vertexBundle.view.count;
                const writer = getWriter(outputView, attribute.format)!;

                const formatInfo = FormatInfos[attribute.format];
                const componentCount = formatInfo.count;

                assert(componentCount == accessor.componentLen);

                const inputComponentByteLength = getComponentByteLength(attribute.format);
                const outputStride = vertexBundle.view.stride;
                const outputComponentByteLength = inputComponentByteLength;
                for (let iVertex = 0; iVertex < vertexCount; ++iVertex) {
                    for (let iComponent = 0; iComponent < componentCount; ++iComponent) {
                        const inputOffset = iVertex + inputComponentByteLength * iComponent;
                        const outputOffset = outputStride * iVertex + outputComponentByteLength * iComponent;
                        writer(outputOffset, accessor.data[inputOffset]);
                    }
                }
            }
        }
    }
}

function convertFBXToCocosMesh(filename: string): void {
    let gltf = readFBXToGltf(filename);
    assert(gltf != null);
    let mesh = gltf!.getMesh(0);
    assert(mesh != null);
    let geomerty = new Geometry();
    geomerty.readGltfMesh(mesh!);
    writeBin(geomerty);
    // gltfToCocosMesh(mesh!, vertexBundles as IVertexBundle[], primitives);
}

convertFBXToCocosMesh("Triangle");
