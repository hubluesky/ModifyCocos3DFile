import { AttributeName } from "./Cocos.js";
import { Vec3 } from "./vec3.js";
import { attributes } from "./config.js";
import Accessor from "./gltf2Parser/Accessor.js";
import { Primitive, Mesh } from "./gltf2Parser/Mesh.js";


type ObjectInclude<T, E> = { [k in keyof T]: T[k] extends E ? k : never }[keyof T];
const vec3Temp1: Vec3 = new Vec3();
const vec3Temp2: Vec3 = new Vec3();
const vec3Temp3: Vec3 = new Vec3();
const vec3Temp4: Vec3 = new Vec3();
const vec3Temp5: Vec3 = new Vec3();
const vec3Temp6: Vec3 = new Vec3();
const vec3Temp7: Vec3 = new Vec3();
const vec3Temp8: Vec3 = new Vec3();

export class Geometry {
    public indicesList: number[][] = [];
    public positionList: number[][] = [];
    public normalList: number[][] = [];
    public texCoordList: number[][] = [];
    public tangentList: number[][] = [];
    public tangent1List: number[][] = [];
    public jointList: number[][] = [];
    public weightList: number[][] = [];



    attributeName: string = '';

    public getAttributeList(attribute: string, primitive: Primitive, returnType: string): Accessor | number[][] {
        let accessor: Accessor;
        let attributeList: number[][] = [];
        switch (attribute) {
            case AttributeName.ATTR_POSITION:
                accessor = this.getAttributeAccessor(primitive, "position");
                attributeList = this.positionList;
                break;
            case AttributeName.ATTR_NORMAL:
                accessor = this.getAttributeAccessor(primitive, "normal");
                attributeList = this.normalList;
                break;
            case AttributeName.ATTR_TEX_COORD:
                accessor = this.getAttributeAccessor(primitive, "texcoord_0");
                attributeList = this.texCoordList;
                break;
            case AttributeName.ATTR_TANGENT:
                accessor = this.getAttributeAccessor(primitive, "tangent");
                attributeList = this.tangentList;
                break;
            case AttributeName.ATTR_JOINTS:
                accessor = this.getAttributeAccessor(primitive, "joints_0");
                attributeList = this.jointList;
                break;
            case AttributeName.ATTR_WEIGHTS:
                accessor = this.getAttributeAccessor(primitive, "weights_0");
                attributeList = this.weightList;
                break;
            case "indices":
                accessor = this.getAttributeAccessor(primitive, "indices");
                attributeList = this.indicesList;
                break;
            default:
                throw `Can not suppert attribute ${attribute}`;
        }
        if (returnType == 'accessor') {
            return accessor;
        } else {
            return attributeList;
        }
    }

    public getAttributeAccessor(primitive: Primitive, property: ObjectInclude<Primitive, Accessor | null>): Accessor {
        return primitive[property]!;
    }

    public readGltfMesh(mesh: Mesh): void {
        for (let i = 0; i < mesh.primitives.length; i++) {
            let primitive = mesh.primitives[i];
            for (let j = 0; j < attributes.length; j++) {
                let attribute = attributes[j];
                let accessor = this.getAttributeList(attribute.name, primitive, 'accessor') as Accessor;
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
                    let attributeList = this.getAttributeList(attribute.name, primitive, 'attributeList') as number[][];
                    attributeList.push(vertexArr);
                }
            }
        }
        this.computeNormals();
        this.computeTangents();
        console.log(this.indicesList, 'indicesList');
        console.log(this.positionList, 'position');
        console.log(this.normalList, 'normal');
        console.log(this.texCoordList, 'textcoord');
        console.log(this.tangentList, 'tangent');
        console.log(this.jointList, 'joint');
        console.log(this.weightList, 'weight');
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
        if (this.normalList.length != 0) return;
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

            Vec3.subtract(vec3Temp1, vertex2Vec, vertex1Vec);
            Vec3.subtract(vec3Temp2, vertex3Vec, vertex1Vec);
            Vec3.cross(vec3Temp3, vec3Temp1, vec3Temp2);

            let normal1 = this.normalList[index1];
            let normal2 = this.normalList[index2];
            let normal3 = this.normalList[index3];
            let vertexNormal1Vec = this.xyzTovec(normal1).add(vec3Temp3);
            let vertexNormal2Vec = this.xyzTovec(normal2).add(vec3Temp3);
            let vertexNormal3Vec = this.xyzTovec(normal3).add(vec3Temp3);
            this.vecToxyz(this.normalList, index1, vertexNormal1Vec);
            this.vecToxyz(this.normalList, index2, vertexNormal2Vec);
            this.vecToxyz(this.normalList, index3, vertexNormal3Vec);
            // console.log(this.normalList);
        }

        for (let i = 0; i < this.normalList.length; i++) {
            let normal = this.xyzTovec(this.normalList[i]);
            normal.normalize();
            this.vecToxyz(this.normalList, i, normal);
        }
    }

    public computeTangents(): void {
        if (this.tangentList.length != 0) return;
        for (let i = 0; i < this.positionList.length; i++) {
            this.tangentList.push([]);
            this.tangentList[i].push(0, 0, 0, 0);
            this.tangent1List.push([]);
            this.tangent1List[i].push(0, 0, 0);
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

            Vec3.subtract(vec3Temp1, vertex2Vec, vertex1Vec);
            Vec3.subtract(vec3Temp2, vertex3Vec, vertex1Vec);

            let texcoord1 = this.texCoordList[index1];
            let texcoord2 = this.texCoordList[index2];
            let texcoord3 = this.texCoordList[index3];

            let coordy1 = texcoord2[1] - texcoord1[1];  // texcoord y
            let coordy2 = texcoord3[1] - texcoord1[1];
            Vec3.multiplyScalar(vec3Temp3, vec3Temp1, coordy2);
            Vec3.multiplyScalar(vec3Temp4, vec3Temp2, coordy1);
            Vec3.subtract(vec3Temp5, vec3Temp4, vec3Temp3);

            let tangent1 = this.tangentList[index1];
            let tangent2 = this.tangentList[index2];
            let tangent3 = this.tangentList[index3];
            let tangent1Vec = this.xyzTovec(tangent1).add(vec3Temp5);
            let tangent2Vec = this.xyzTovec(tangent2).add(vec3Temp5);
            let tangent3Vec = this.xyzTovec(tangent3).add(vec3Temp5);
            this.vecToxyz(this.tangentList, index1, tangent1Vec);
            this.vecToxyz(this.tangentList, index2, tangent2Vec);
            this.vecToxyz(this.tangentList, index3, tangent3Vec);

            // 计算切线的第四个分量 w
            let coordy3 = texcoord2[0] - texcoord1[0];  // texcoord x
            let coordy4 = texcoord3[0] - texcoord1[0];
            Vec3.multiplyScalar(vec3Temp6, vec3Temp1, coordy4);
            Vec3.multiplyScalar(vec3Temp7, vec3Temp2, coordy3);
            Vec3.subtract(vec3Temp8, vec3Temp6, vec3Temp7);

            let tangent4 = this.tangent1List[index1];
            let tangent5 = this.tangent1List[index2];
            let tangent6 = this.tangent1List[index3];
            let tangent4Vec = this.xyzTovec(tangent4).add(vec3Temp8);
            let tangent5Vec = this.xyzTovec(tangent5).add(vec3Temp8);
            let tangent6Vec = this.xyzTovec(tangent6).add(vec3Temp8);
            this.vecToxyz(this.tangent1List, index1, tangent4Vec);
            this.vecToxyz(this.tangent1List, index2, tangent5Vec);
            this.vecToxyz(this.tangent1List, index3, tangent6Vec);

            let temp = new Vec3();
            let normal1 = this.normalList[index1];
            let normal1Vec = this.xyzTovec(normal1);
            let normal2 = this.normalList[index2];
            let normal2Vec = this.xyzTovec(normal2);
            let normal3 = this.normalList[index3];
            let normal3Vec = this.xyzTovec(normal3);
            let w1 = Vec3.dot(Vec3.cross(temp, normal1Vec, tangent4Vec), tangent1Vec) < 0.0 ? -1 : 1;
            let w2 = Vec3.dot(Vec3.cross(temp, normal2Vec, tangent5Vec), tangent2Vec) < 0.0 ? -1 : 1;
            let w3 = Vec3.dot(Vec3.cross(temp, normal3Vec, tangent6Vec), tangent3Vec) < 0.0 ? -1 : 1;
            this.tangentList[index1][3] = w1;
            this.tangentList[index2][3] = w2;
            this.tangentList[index3][3] = w3;
        }
        // console.log(this.tangent1List, 'tangent1List');
        for (let i = 0; i < this.tangentList.length; i++) {
            let tangent = this.xyzTovec(this.tangentList[i]);
            tangent.normalize();
            this.vecToxyz(this.tangentList, i, tangent);
        }
    }
}