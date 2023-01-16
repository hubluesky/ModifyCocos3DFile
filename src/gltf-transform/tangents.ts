import { Accessor, Document, ILogger, Primitive, Transform, TypedArray, uuid } from '@gltf-transform/core';
import { vec2, vec3, vec4 } from 'gl-matrix';

const NAME = 'tangents';

/** Options for the {@link tangents} function. */
export interface TangentsOptions {
    /** Whether to overwrite existing `TANGENT` attributes. */
    overwrite?: boolean;
}

const TANGENTS_DEFAULTS: Required<Omit<TangentsOptions, 'generateTangents'>> = {
    overwrite: false,
};

function createTransform(name: string, fn: Transform): Transform {
    Object.defineProperty(fn, 'name', { value: name });
    return fn;
}

function createVector2(array: ArrayLike<number>, index: number, out: vec2): vec2 {
    index *= 2;
    return vec2.set(out, array[index], array[index + 1]);
}

function createVector3(array: ArrayLike<number>, index: number, out: vec3): vec3 {
    index *= 3;
    return vec3.set(out, array[index], array[index + 1], array[index + 2]);
}

const vec2Temp1 = vec2.create();
const vec2Temp2 = vec2.create();
const vec2Temp3 = vec2.create();

const vec3Temp1 = vec3.create();
const vec3Temp2 = vec3.create();
const vec3Temp3 = vec3.create();
const vec3Temp4 = vec3.create();
const vec3Temp5 = vec3.create();

/**
 * Generates MikkTSpace vertex tangents for mesh primitives, which may fix rendering issues
 * occuring with some baked normal maps. Requires access to the [mikktspace](https://github.com/donmccurdy/mikktspace-wasm)
 * WASM package, or equivalent.
 *
 * Example:
 *
 * ```ts
 * import { tangents } from '@gltf-transform/functions';
 *
 * await document.transform(
 * 	tangents({overwrite: false})
 * );
 * ```
 */
export function tangents(_options: TangentsOptions = TANGENTS_DEFAULTS): Transform {
    const options = { ...TANGENTS_DEFAULTS, ..._options } as Required<TangentsOptions>;

    return createTransform(NAME, (doc: Document): void => {
        const logger = doc.getLogger();
        const attributeIDs = new Map<TypedArray, string>();
        const tangentCache = new Map<string, Accessor>();
        let modified = 0;

        for (const mesh of doc.getRoot().listMeshes()) {
            const meshName = mesh.getName();
            const meshPrimitives = mesh.listPrimitives();

            for (let i = 0; i < meshPrimitives.length; i++) {
                const prim = meshPrimitives[i];

                // Skip primitives for which we can't compute tangents.
                if (!filterPrimitive(prim, logger, meshName, i, options.overwrite)) continue;

                const texcoordSemantic = getNormalTexcoord(prim);

                // Nullability conditions checked by filterPrimitive() above.
                const position = prim.getAttribute('POSITION')!.getArray()!;
                const normal = prim.getAttribute('NORMAL')!.getArray()!;
                const texcoord = prim.getAttribute(texcoordSemantic)!.getArray()!;

                // Compute UUIDs for each attribute.
                const positionID = attributeIDs.get(position) || uuid();
                attributeIDs.set(position, positionID);

                const normalID = attributeIDs.get(normal) || uuid();
                attributeIDs.set(normal, normalID);

                const texcoordID = attributeIDs.get(texcoord) || uuid();
                attributeIDs.set(texcoord, texcoordID);

                // Dispose of previous TANGENT accessor if only used by this primitive (and Root).
                const prevTangent = prim.getAttribute('TANGENT');
                if (prevTangent && prevTangent.listParents().length === 2) prevTangent.dispose();

                // If we've already computed tangents for this pos/norm/uv set, reuse them.
                const attributeHash = `${positionID}|${normalID}|${texcoordID}`;
                let tangent = tangentCache.get(attributeHash);
                if (tangent) {
                    logger.debug(`${NAME}: Found cache for primitive ${i} of mesh "${meshName}".`);
                    prim.setAttribute('TANGENT', tangent);
                    modified++;
                    continue;
                }

                logger.debug(`${NAME}: Generating for primitive ${i} of mesh "${meshName}".`);
                const tangentBuffer = prim.getAttribute('POSITION')!.getBuffer();
                const indices = prim.getIndices()?.getArray();
                const tangentList = computeTangents(position, normal, texcoord, indices);
                const tangentArray = createTangentArray(tangentList);

                tangent = doc.createAccessor().setBuffer(tangentBuffer).setArray(tangentArray).setType('VEC4');
                prim.setAttribute('TANGENT', tangent);

                tangentCache.set(attributeHash, tangent);
                modified++;
            }
        }

        if (!modified) {
            logger.warn(`${NAME}: No qualifying primitives found. See debug output.`);
        } else {
            logger.debug(`${NAME}: Complete.`);
        }
    });
}

function computeTangent(positionArray: ArrayLike<number>, normalArray: ArrayLike<number>, coordArray: ArrayLike<number>, index1: number, index2: number, index3: number, tan1: readonly vec3[], tan2: readonly vec3[]) {
    const vertex1 = createVector3(positionArray, index1, vec3Temp1);
    const vertex2 = createVector3(positionArray, index2, vec3Temp2);
    const vertex3 = createVector3(positionArray, index3, vec3Temp3);

    const texcoord1 = createVector2(coordArray, index1, vec2Temp1);
    const texcoord2 = createVector2(coordArray, index2, vec2Temp2);
    const texcoord3 = createVector2(coordArray, index3, vec2Temp3);

    const dir1 = vec3.subtract(vertex2, vertex2, vertex1);
    const dir2 = vec3.subtract(vertex3, vertex3, vertex1);

    const uv1 = vec2.subtract(texcoord2, texcoord2, texcoord1);
    const uv2 = vec2.subtract(texcoord3, texcoord3, texcoord1);

    const r = 1.0 / (uv1[0] * uv2[1] - uv2[0] * uv1[1]);

    if (!isFinite(r)) {
        // console.warn(uv1, uv2);
        return;
    }

    const sdir = vec3.scale(vec3Temp4, dir1, uv2[1]);
    vec3.scaleAndAdd(sdir, sdir, dir2, -uv1[1]);
    vec3.scale(sdir, sdir, r);

    const tdir = vec3.scale(vec3Temp5, dir2, uv1[0]);
    vec3.scaleAndAdd(tdir, tdir, dir1, -uv2[0]);
    vec3.scale(tdir, tdir, r);

    vec3.add(tan1[index1], tan1[index1], sdir);
    vec3.add(tan1[index2], tan1[index2], sdir);
    vec3.add(tan1[index3], tan1[index3], sdir);

    vec3.add(tan2[index1], tan2[index1], tdir);
    vec3.add(tan2[index2], tan2[index2], tdir);
    vec3.add(tan2[index3], tan2[index3], tdir);
}

function computeTangents(positionArray: ArrayLike<number>, normalArray: ArrayLike<number>, coordArray: ArrayLike<number>, indicesArray: ArrayLike<number>): vec4[] {
    const tan1: vec3[] = [];
    const tan2: vec3[] = [];

    const vertexCount = positionArray.length / 3;
    for (let i = 0; i < vertexCount; i++) {
        tan1.push(vec3.create());
        tan2.push(vec3.create());
    }

    if (indicesArray != null) {
        const triangleCount = indicesArray.length / 3;
        for (let i = 0; i < triangleCount; i++) {
            const index1 = indicesArray[i * 3 + 0];
            const index2 = indicesArray[i * 3 + 1];
            const index3 = indicesArray[i * 3 + 2];
            computeTangent(positionArray, normalArray, coordArray, index1, index2, index3, tan1, tan2);
        }
    } else {
        for (let i = 0; i < vertexCount; i += 3) {
            const index1 = i + 0;
            const index2 = i + 1;
            const index3 = i + 2;
            computeTangent(positionArray, normalArray, coordArray, index1, index2, index3, tan1, tan2);
        }
    }

    const tangentList: vec4[] = [];
    for (let i = 0; i < vertexCount; i++) {
        const normal = createVector3(normalArray, i, vec3Temp1);
        vec3.normalize(normal, normal);
        const normal2 = vec3.clone(normal);
        const t = tan1[i];
        // Gram-Schmidt orthogonalize
        const temp = vec3.clone(t);
        vec3.scale(normal, normal, vec3.dot(normal, t));
        vec3.subtract(temp, temp, normal);
        vec3.normalize(temp, temp);
        // Calculate handedness
        const temp2 = vec3.cross(vec3Temp2, normal2, t);
        const test = vec3.dot(temp2, tan2[i]);
        const w = (test < 0.0) ? 1.0 : 1.0;
        tangentList[i] = vec4.fromValues(temp[0], temp[1], temp[2], w);
    }

    return tangentList;
}

function createTangentArray(tangentList: ArrayLike<vec4>, componentCount: number = 4): Float32Array {
    const typeArray = new Float32Array(tangentList.length * componentCount);
    for (let i = 0; i < tangentList.length; i++) {
        const tangent = tangentList[i];
        typeArray[i * componentCount + 0] = tangent[0];
        typeArray[i * componentCount + 1] = tangent[1];
        typeArray[i * componentCount + 2] = tangent[2];
        typeArray[i * componentCount + 3] = tangent[3];
    }
    return typeArray;
}

function getNormalTexcoord(prim: Primitive): string {
    const material = prim.getMaterial();
    if (!material) return 'TEXCOORD_0';

    const normalTextureInfo = material.getNormalTextureInfo();
    if (!normalTextureInfo) return 'TEXCOORD_0';

    const texcoord = normalTextureInfo.getTexCoord();
    const semantic = `TEXCOORD_${texcoord}`;
    if (prim.getAttribute(semantic)) return semantic;

    return 'TEXCOORD_0';
}

function filterPrimitive(prim: Primitive, logger: ILogger, meshName: string, i: number, overwrite: boolean): boolean {
    if (
        prim.getMode() !== Primitive.Mode.TRIANGLES ||
        !prim.getAttribute('POSITION') ||
        !prim.getAttribute('NORMAL') ||
        !prim.getAttribute('TEXCOORD_0')
    ) {
        logger.debug(
            `${NAME}: Skipping primitive ${i} of mesh "${meshName}": primitives must` +
            ' have attributes=[POSITION, NORMAL, TEXCOORD_0] and mode=TRIANGLES.'
        );
        return false;
    }

    if (prim.getAttribute('TANGENT') && !overwrite) {
        logger.debug(`${NAME}: Skipping primitive ${i} of mesh "${meshName}": TANGENT found.`);
        return false;
    }

    return true;
}
