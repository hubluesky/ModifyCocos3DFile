import { AttributeName } from "./Cocos";
import { CocosMeshMeta } from "./CocosMesh";
import Accessor from "./gltf2Parser/Accessor";
import { Mesh, Primitive } from "./gltf2Parser/Mesh";
import { Vec3 } from "./Vec3";

const vec3Temp1: Vec3 = new Vec3();
const vec3Temp2: Vec3 = new Vec3();
const vec3Temp3: Vec3 = new Vec3();
const vec3Temp4: Vec3 = new Vec3();

type ObjectInclude<T, E> = { [k in keyof T]: T[k] extends E ? k : never }[keyof T];
type PrimitiveKeys = Exclude<ObjectInclude<Primitive, Accessor | null>, "indices">;
const attributeMaps: Record<PrimitiveKeys, AttributeName | null> = {
    "position": AttributeName.ATTR_POSITION,
    "normal": AttributeName.ATTR_NORMAL,
    "tangent": AttributeName.ATTR_TANGENT,
    "texcoord_0": AttributeName.ATTR_TEX_COORD,
    "texcoord_1": AttributeName.ATTR_TEX_COORD1,
    "color_0": AttributeName.ATTR_COLOR,
    "joints_0": AttributeName.ATTR_JOINTS,
    "weights_0": AttributeName.ATTR_WEIGHTS,
};

class Vec4 extends Vec3 {
    public w: number;
}

interface PrimitiveData {
    readonly indicesAccessor: Accessor;
    readonly attributeDatas: AttributeData[];
}

interface AttributeData {
    type: AttributeName;
    accessor: Accessor;
}

interface UVCoord {
    readonly u: number;
    readonly v: number;
}

export default class Geometry {
    public readonly primitiveDatas: PrimitiveData[] = [];

    public constructor(mesh: Mesh) {
        for (const primitive of mesh.primitives) {
            const primitiveData: PrimitiveData = { attributeDatas: [], indicesAccessor: primitive.indices };
            this.primitiveDatas.push(primitiveData);
            for (const key in attributeMaps) {
                const type = attributeMaps[key as PrimitiveKeys];
                const accessor = primitive[key as PrimitiveKeys];
                primitiveData.attributeDatas.push({ type, accessor });
            }

            // let attribute = attributes[j];
            // let accessor = this.getAttributeList(attribute.name, primitive, 'accessor') as Accessor;
            // if (accessor == null) continue;
            // if (accessor.data == null) throw "";
            // const vertexCount = accessor.elementCnt;
            // const componentCount = accessor.componentLen;
            // for (let iVertex = 0; iVertex < vertexCount; ++iVertex) {
            //     let vertexArr: number[] = [];
            //     for (let iComponent = 0; iComponent < componentCount; ++iComponent) {
            //         const inputOffset = iVertex * componentCount + iComponent;
            //         vertexArr.push(accessor.data![inputOffset]);
            //     }
            //     let attributeList = this.getAttributeList(attribute.name, primitive, 'attributeList') as number[][];
            //     attributeList.push(vertexArr);
            // }
            // }
        }
    }

    public converToCocosMesh(meta: CocosMeshMeta): void {

    }

    public static createUICoord(accessor: Accessor, index: number): UVCoord {
        index *= accessor.componentLen;
        return { u: accessor.data[index + 0], v: accessor.data[index + 1] }
    }

    public static createPosition(accessor: Accessor, index: number): Vec3 {
        index *= accessor.componentLen;
        return new Vec3(accessor.data[index], accessor.data[index + 1], accessor.data[index + 2]);
    }

    public static computeNormals(primitiveData: PrimitiveData): Vec3[] {
        const normalList: Vec3[] = [];

        const positionAccessor = primitiveData.attributeDatas.find(x => x.type == AttributeName.ATTR_POSITION).accessor;
        for (let i = 0; i < positionAccessor.elementCnt; i++)
            normalList.push(new Vec3());

        const indicesAcccessor = primitiveData.indicesAccessor;

        for (let i = 0; i < indicesAcccessor.elementCnt * indicesAcccessor.componentLen; i += indicesAcccessor.componentLen) {
            const index1 = indicesAcccessor.data[i + 0];
            const index2 = indicesAcccessor.data[i + 1];
            const index3 = indicesAcccessor.data[i + 2];

            const vertex1 = Geometry.createPosition(positionAccessor, index1);
            const vertex2 = Geometry.createPosition(positionAccessor, index2);
            const vertex3 = Geometry.createPosition(positionAccessor, index3);

            const dir1 = Vec3.subtract(vec3Temp1, vertex2, vertex1);
            const dir2 = Vec3.subtract(vec3Temp2, vertex3, vertex1);
            const dir3 = Vec3.cross(vec3Temp3, dir1, dir2);

            normalList[index1].add(dir3);
            normalList[index2].add(dir3);
            normalList[index3].add(dir3);
        }

        for (const normal of normalList)
            normal.normalize();

        return normalList;
    }

    public computeTangents(primitiveData: PrimitiveData, normalList: Vec3[]): Vec4[] {
        const tangentList: Vec4[] = [];

        const positionAccessor = primitiveData.attributeDatas.find(x => x.type == AttributeName.ATTR_POSITION).accessor;
        for (let i = 0; i < positionAccessor.elementCnt; i++)
            tangentList.push(new Vec4());

        const indicesAcccessor = primitiveData.indicesAccessor;
        const coordAccessor = primitiveData.attributeDatas.find(x => x.type == AttributeName.ATTR_TEX_COORD).accessor;

        for (let i = 0; i < indicesAcccessor.elementCnt * indicesAcccessor.componentLen; i += indicesAcccessor.componentLen) {
            const index1 = indicesAcccessor.data[i + 0];
            const index2 = indicesAcccessor.data[i + 1];
            const index3 = indicesAcccessor.data[i + 2];

            const vertex1 = Geometry.createPosition(positionAccessor, index1);
            const vertex2 = Geometry.createPosition(positionAccessor, index2);
            const vertex3 = Geometry.createPosition(positionAccessor, index3);

            const dir1 = Vec3.subtract(vec3Temp1, vertex2, vertex1);
            const dir2 = Vec3.subtract(vec3Temp2, vertex3, vertex1);

            const texcoord1 = Geometry.createUICoord(coordAccessor, index1);
            const texcoord2 = Geometry.createUICoord(coordAccessor, index2);
            const texcoord3 = Geometry.createUICoord(coordAccessor, index3);

            const v1Coord = texcoord2.v - texcoord1.v;
            const v2Coord = texcoord3.v - texcoord1.v;

            const scaleVDir1 = Vec3.multiplyScalar(vec3Temp3, dir1, v2Coord);
            const scaleVDir2 = Vec3.multiplyScalar(vec3Temp4, dir2, v1Coord);
            const vDir3 = Vec3.subtract(vec3Temp3, scaleVDir1, scaleVDir2);

            const tangent1 = tangentList[index1].add(vDir3);
            const tangent2 = tangentList[index2].add(vDir3);
            const tangent3 = tangentList[index3].add(vDir3);

            // 计算切线的第四个分量 w
            const u1Coord = texcoord2.u - texcoord1.u;
            const u2Coord = texcoord3.u - texcoord1.u;
            const scaleUDir1 = Vec3.multiplyScalar(vec3Temp3, dir1, u2Coord);
            const scaleUDir2 = Vec3.multiplyScalar(vec3Temp4, dir2, u1Coord);
            const uDir3 = Vec3.subtract(scaleUDir1, scaleUDir1, scaleUDir2);

            const tangent4 = Vec3.add(vec3Temp1, tangent1, uDir3);
            const tangent5 = Vec3.add(vec3Temp2, tangent2, uDir3);
            const tangent6 = Vec3.add(vec3Temp3, tangent3, uDir3);

            const normal1 = normalList[index1];
            const normal2 = normalList[index2];
            const normal3 = normalList[index3];
            tangent1.w = Vec3.dot(Vec3.cross(vec3Temp1, normal1, tangent4), tangent1) < 0.0 ? -1 : 1;
            tangent2.w = Vec3.dot(Vec3.cross(vec3Temp2, normal2, tangent5), tangent2) < 0.0 ? -1 : 1;
            tangent3.w = Vec3.dot(Vec3.cross(vec3Temp3, normal3, tangent6), tangent3) < 0.0 ? -1 : 1;
        }

        for (const tangent of tangentList)
            tangent.normalize();

        return tangentList;
    }
}