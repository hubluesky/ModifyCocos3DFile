import { Mesh, Primitive } from "./gltf2parser/Mesh";
import Accessor from "./gltf2parser/Accessor";
import { AttributeName } from "./cocos.js";
import { Vec3 } from "./vec3.js";


type ObjectInclude<T, E> = { [k in keyof T]: T[k] extends E ? k : never }[keyof T];
const attributes = ["indices", "a_position", "a_normal", "a_texCoord", "a_tangent", "a_joints", "a_weights"];


export class Geometry {
    public indicesList: number[][] = [];
    public positionList: number[][] = [];
    public normalList: number[][] = [];
    public texCoordList: number[][] = [];
    public tangentList: number[][] = [];
    public jointList: number[][] = [];
    public weightList: number[][] = [];

    tempVec1: Vec3 = new Vec3();
    tempVec2: Vec3 = new Vec3();
    tempVec3: Vec3 = new Vec3();
    public getAttributeAccessor(primitive: Primitive, property: ObjectInclude<Primitive, Accessor | null>): Accessor {
        return primitive[property]!;
    }

    public readGltfMesh(mesh: Mesh): void {
        for (let i = 0; i < mesh.primitives.length; i++) {
            let primitive = mesh.primitives[i];
            // console.log('primitive', primitive);
            for (let j = 0; j < attributes.length; j++) {
                let attribute = attributes[j];
                let accessor: Accessor;
                let curList: number[][] = [];
                switch (attribute) {
                    case AttributeName.ATTR_POSITION:
                        accessor = this.getAttributeAccessor(primitive, "position");
                        this.positionList = curList;
                        break;
                    case AttributeName.ATTR_NORMAL:
                        accessor = this.getAttributeAccessor(primitive, "normal");
                        this.normalList = curList;
                        break;
                    case AttributeName.ATTR_TEX_COORD:
                        accessor = this.getAttributeAccessor(primitive, "texcoord_0");
                        this.texCoordList = curList;
                        break;
                    case AttributeName.ATTR_TANGENT:
                        accessor = this.getAttributeAccessor(primitive, "tangent");
                        this.tangentList = curList;
                        break;
                    case AttributeName.ATTR_JOINTS:
                        accessor = this.getAttributeAccessor(primitive, "joints_0");
                        this.jointList = curList;
                        break;
                    case AttributeName.ATTR_WEIGHTS:
                        accessor = this.getAttributeAccessor(primitive, "weights_0");
                        this.weightList = curList;
                        break;
                    case "indices":
                        accessor = this.getAttributeAccessor(primitive, "indices");
                        this.indicesList = curList;
                        break;
                    default:
                        throw `Can not suppert attribute ${attribute}`;
                }
                if (accessor == null) continue;
                if (accessor.data == null) throw "";

                const vertexCount = accessor.elementCnt;
                const componentCount = accessor.componentLen;

                for (let iVertex = 0; iVertex < vertexCount; ++iVertex) {
                    let vertexArr: number[] = [];
                    for (let iComponent = 0; iComponent < componentCount; ++iComponent) {
                        const inputOffset = iVertex * componentCount + iComponent;
                        vertexArr.push(accessor.data![inputOffset]);
                    }
                    curList.push(vertexArr);
                }

            }
        }
        this.computeNormals();
        this.computeTangents();
    }

    public vecToxyz(list: number[][], vertexIndex: number, vertexNormal: Vec3) {
        list[vertexIndex][0] = vertexNormal.x;
        list[vertexIndex][1] = vertexNormal.y;
        list[vertexIndex][2] = vertexNormal.z;
    }

    public xyzTovec(curXYZ: number[]) {
        return new Vec3(curXYZ);
    }

    public computeNormals(): void {
        // if (this.normalList.length != 0) return;
        this.normalList = [];
        for (let i = 0; i < this.positionList.length; i++) {
            this.normalList.push([]);
            this.normalList[i].push(0, 0, 0);
        }

        for (let i = 0; i < this.indicesList.length; i += 3) {
            let index1 = this.indicesList[i + 0][0];
            let index2 = this.indicesList[i + 1][0];
            let index3 = this.indicesList[i + 2][0];

            let vertex1 = this.positionList[index1];
            let vertex1Vec = this.xyzTovec(vertex1);
            let vertex2 = this.positionList[index2];
            let vertex2Vec = this.xyzTovec(vertex2);
            let vertex3 = this.positionList[index3];
            let vertex3Vec = this.xyzTovec(vertex3);

            Vec3.subtract(this.tempVec1, vertex2Vec, vertex1Vec);
            Vec3.subtract(this.tempVec2, vertex3Vec, vertex1Vec);
            Vec3.cross(this.tempVec3, this.tempVec1, this.tempVec2);

            let normal1 = this.normalList[index1];
            let normal2 = this.normalList[index2];
            let normal3 = this.normalList[index3];
            let vertexNormal1Vec = this.xyzTovec(normal1).add(this.tempVec3);
            let vertexNormal2Vec = this.xyzTovec(normal2).add(this.tempVec3);
            let vertexNormal3Vec = this.xyzTovec(normal3).add(this.tempVec3);

            this.vecToxyz(this.normalList, index1, vertexNormal1Vec);
            this.vecToxyz(this.normalList, index2, vertexNormal2Vec);
            this.vecToxyz(this.normalList, index3, vertexNormal3Vec);

        }
        for (let i = 0; i < this.normalList.length; i++) {
            let normal = this.xyzTovec(this.normalList[i]);
            normal.normalize();
            this.vecToxyz(this.normalList, i, normal);
        }
        console.log(this.normalList);
    }

    public computeTangents(): void {
        if (this.tangentList.length != 0) return;

    }
}