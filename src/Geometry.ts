import { AttributeName, isLittleEndian } from "./Cocos";
import { Skin } from "./gltf2Parser";
import Accessor from "./gltf2Parser/Accessor";
import { Mesh, Primitive } from "./gltf2Parser/Mesh";
import { Vec3 } from "./Vec3";

const vec3Temp1: Vec3 = new Vec3();
const vec3Temp2: Vec3 = new Vec3();
const vec3Temp3: Vec3 = new Vec3();
const vec3Temp4: Vec3 = new Vec3();
const vec3Temp5: Vec3 = new Vec3();
const vec3Temp6: Vec3 = new Vec3();

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
    readonly joints?: number[];
    readonly attributeDatas: AttributeData[];
}

interface AttributeData {
    name: AttributeName;
    accessor: Accessor;
}

interface UVCoord {
    readonly u: number;
    readonly v: number;
}

export default class Geometry {
    public readonly primitiveDatas: PrimitiveData[] = [];

    public constructor(mesh: Mesh, skin: Skin) {
        const joints: number[] = skin == null ? null : skin.joints.map(x => x.index);
        for (const primitive of mesh.primitives) {
            const primitiveData: PrimitiveData = { attributeDatas: [], indicesAccessor: primitive.indices, joints };
            this.primitiveDatas.push(primitiveData);
            for (const key in attributeMaps) {
                const type = attributeMaps[key as PrimitiveKeys];
                const accessor = primitive[key as PrimitiveKeys];
                primitiveData.attributeDatas.push({ name: type, accessor });
            }
        }
    }

    public getBoundPositions(): { boundMin: Vec3, boundMax: Vec3 } {
        let boundMin = new Vec3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        let boundMax = new Vec3(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);
        for (let primitive of this.primitiveDatas) {
            const positionAccessor = primitive.attributeDatas.find(x => x.name == AttributeName.ATTR_POSITION).accessor;
            for (let i = 0; i < positionAccessor.elementCnt; i++) {
                const position = Geometry.createPosition(positionAccessor, i, vec3Temp1);
                boundMin = Vec3.min(boundMin, boundMin, position);
                boundMax = Vec3.max(boundMax, boundMax, position);
            }
        }
        return { boundMin, boundMax };
    }

    public getAttributeAccessor(indexPrimitive: number, attributeName: AttributeName): Accessor {
        const attributeData = this.primitiveDatas[indexPrimitive].attributeDatas.find(x => x.name == attributeName);
        if (attributeData.accessor == null) {
            switch (attributeName) {
                case AttributeName.ATTR_NORMAL: {
                    attributeData.accessor = this.createNormalAccessor(indexPrimitive);
                } break;
                case AttributeName.ATTR_TANGENT: {
                    let normalAccessor = this.primitiveDatas[indexPrimitive].attributeDatas.find(x => x.name == AttributeName.ATTR_NORMAL).accessor;
                    if (normalAccessor == null)
                        normalAccessor = this.getAttributeAccessor(indexPrimitive, AttributeName.ATTR_NORMAL);
                    attributeData.accessor = this.createTangentAccessor(indexPrimitive, normalAccessor);
                } break;
                default:
                    throw `不支持的属性类型${attributeName}`;
            }
        }

        return attributeData.accessor;
    }

    public createNormalAccessor(indexPrimitive: number): Accessor {
        const normalList = Geometry.computeNormals(this.primitiveDatas[indexPrimitive]);
        const metaData = { componentType: 5126, type: "VEC3", count: normalList.length };
        const dataView = new DataView(new ArrayBuffer(normalList.length * 3 * 4));
        for (let i = 0; i < normalList.length; i++) {
            const normal = normalList[i];
            dataView.setFloat32(i * 12 + 0, normal.x);
            dataView.setFloat32(i * 12 + 4, normal.y);
            dataView.setFloat32(i * 12 + 8, normal.z);
        }
        return new Accessor(metaData, {}, dataView.buffer);
    }

    public createTangentAccessor(indexPrimitive: number, normalizeAccessor: Accessor): Accessor {
        const tangentList = Geometry.computeTangents(this.primitiveDatas[indexPrimitive], normalizeAccessor);
        const metaData = { componentType: 5126, type: "VEC4", count: tangentList.length };
        const dataView = new DataView(new ArrayBuffer(tangentList.length * 4 * 4));
        for (let i = 0; i < tangentList.length; i++) {
            const tangent = tangentList[i];
            dataView.setFloat32(i * 16 + 0, tangent.x, isLittleEndian);
            dataView.setFloat32(i * 16 + 4, tangent.y, isLittleEndian);
            dataView.setFloat32(i * 16 + 8, tangent.z, isLittleEndian);
            dataView.setFloat32(i * 16 + 12, tangent.w, isLittleEndian);
        }
        return new Accessor(metaData, {}, dataView.buffer);
    }

    public static createUICoord(accessor: Accessor, index: number): UVCoord {
        index *= accessor.componentLen;
        return { u: accessor.data[index + 0], v: accessor.data[index + 1] }
    }

    public static createPosition(accessor: Accessor, index: number, out: Vec3): Vec3 {
        index *= accessor.componentLen;
        return out.set(accessor.data[index], accessor.data[index + 1], accessor.data[index + 2]);
    }

    public static computeNormals(primitiveData: PrimitiveData): Vec3[] {
        const normalList: Vec3[] = [];

        const positionAccessor = primitiveData.attributeDatas.find(x => x.name == AttributeName.ATTR_POSITION).accessor;
        for (let i = 0; i < positionAccessor.elementCnt; i++)
            normalList.push(new Vec3());

        const indicesAcccessor = primitiveData.indicesAccessor;

        for (let i = 0; i < indicesAcccessor.elementCnt * indicesAcccessor.componentLen; i += indicesAcccessor.componentLen) {
            const index1 = indicesAcccessor.data[i + 0];
            const index2 = indicesAcccessor.data[i + 1];
            const index3 = indicesAcccessor.data[i + 2];

            const vertex1 = Geometry.createPosition(positionAccessor, index1, vec3Temp4);
            const vertex2 = Geometry.createPosition(positionAccessor, index2, vec3Temp5);
            const vertex3 = Geometry.createPosition(positionAccessor, index3, vec3Temp6);

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

    public static computeTangents(primitiveData: PrimitiveData, normalizeAccessor: Accessor): Vec4[] {
        const tangentList: Vec4[] = [];

        const positionAccessor = primitiveData.attributeDatas.find(x => x.name == AttributeName.ATTR_POSITION).accessor;
        for (let i = 0; i < positionAccessor.elementCnt; i++)
            tangentList.push(new Vec4());

        const indicesAcccessor = primitiveData.indicesAccessor;
        const coordAccessor = primitiveData.attributeDatas.find(x => x.name == AttributeName.ATTR_TEX_COORD).accessor;

        for (let i = 0; i < indicesAcccessor.elementCnt; i += 3) {
            const index1 = indicesAcccessor.data[i + 0];
            const index2 = indicesAcccessor.data[i + 1];
            const index3 = indicesAcccessor.data[i + 2];

            const vertex1 = Geometry.createPosition(positionAccessor, index1, vec3Temp4);
            const vertex2 = Geometry.createPosition(positionAccessor, index2, vec3Temp5);
            const vertex3 = Geometry.createPosition(positionAccessor, index3, vec3Temp6);

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

            const normal1 = Geometry.createPosition(normalizeAccessor, index1, vec3Temp4);
            const normal2 = Geometry.createPosition(normalizeAccessor, index2, vec3Temp5);
            const normal3 = Geometry.createPosition(normalizeAccessor, index3, vec3Temp6);
            tangent1.w = Vec3.dot(Vec3.cross(vec3Temp1, normal1, tangent4), tangent1) < 0.0 ? -1 : 1;
            tangent2.w = Vec3.dot(Vec3.cross(vec3Temp2, normal2, tangent5), tangent2) < 0.0 ? -1 : 1;
            tangent3.w = Vec3.dot(Vec3.cross(vec3Temp3, normal3, tangent6), tangent3) < 0.0 ? -1 : 1;
        }

        for (const tangent of tangentList)
            tangent.normalize();

        return tangentList;
    }
}