import type { Document, Transform } from '@gltf-transform/core';
import { vec3 } from 'gl-matrix';

const NAME = 'normals';

/** Options for the {@link normals} function. */
export interface NormalsOptions {
    /** Whether to overwrite existing `NORMAL` attributes. */
    overwrite?: boolean;
}

const NORMALS_DEFAULTS: Required<NormalsOptions> = {
    overwrite: false,
};

function createTransform(name: string, fn: Transform): Transform {
    Object.defineProperty(fn, 'name', { value: name });
    return fn;
}

const vec3Temp1 = vec3.create();
const vec3Temp2 = vec3.create();
const vec3Temp3 = vec3.create();
const vec3Temp4 = vec3.create();
const vec3Temp5 = vec3.create();
const vec3Temp6 = vec3.create();

function createVector3(array: ArrayLike<number>, index: number, out: vec3): vec3 {
    index *= 3;
    return vec3.set(out, array[index], array[index + 1], array[index + 2]);
}

/**
 * Generates flat vertex normals for mesh primitives.
 *
 * Example:
 *
 * ```ts
 * import { normals } from '@gltf-transform/functions';
 *
 * await document.transform(normals({overwrite: true}));
 * ```
 */
export function normals(_options: NormalsOptions = NORMALS_DEFAULTS): Transform {
    const options = { ...NORMALS_DEFAULTS, ..._options } as Required<NormalsOptions>;

    return createTransform(NAME, async (document: Document): Promise<void> => {
        const logger = document.getLogger();
        let modified = 0;

        for (const mesh of document.getRoot().listMeshes()) {
            for (const prim of mesh.listPrimitives()) {
                const positionAccessor = prim.getAttribute('POSITION')!;
                const indicesAccessor = prim.getIndices();
                let normalAccessor = prim.getAttribute('NORMAL');

                if (options.overwrite && normalAccessor) {
                    normalAccessor.dispose();
                } else if (normalAccessor) {
                    logger.debug(`${NAME}: Skipping primitive: NORMAL found.`);
                    continue;
                }

                const normalList: vec3[] = [];
                for (let i = 0; i < positionAccessor.getCount(); i++)
                    normalList.push(vec3.create());

                const positionArray = positionAccessor.getArray();
                if (indicesAccessor != null) {
                    const indicesArray = indicesAccessor.getArray();
                    for (let i = 0; i < indicesArray.length; i += 3) {
                        const index1 = indicesArray[i + 0];
                        const index2 = indicesArray[i + 1];
                        const index3 = indicesArray[i + 2];

                        computeNormal(positionArray, normalList, index1, index2, index3);
                    }
                } else {
                    for (let i = 0; i < positionAccessor.getCount(); i += 3) {
                        const index1 = i + 0;
                        const index2 = i + 1;
                        const index3 = i + 2;
                        computeNormal(positionArray, normalList, index1, index2, index3);
                    }
                }

                for (const normal of normalList)
                    vec3.normalize(normal, normal);

                normalAccessor = document.createAccessor().setType('VEC3');
                const componentCount = normalAccessor.getElementSize();
                const typeArray = new Float32Array(normalList.length * componentCount);
                for (let i = 0; i < normalList.length; i++) {
                    const normal = normalList[i];
                    typeArray[i * componentCount + 0] = normal[0];
                    typeArray[i * componentCount + 1] = normal[1];
                    typeArray[i * componentCount + 2] = normal[2];
                }

                normalAccessor = normalAccessor.setArray(typeArray);
                prim.setAttribute('NORMAL', normalAccessor);
                modified++;
            }
        }

        // if (!modified) {
        //     logger.warn(`${NAME}: No qualifying primitives found. See debug output.`);
        // } else {
        //     logger.debug(`${modified} ${NAME}: Complete.`);
        // }
    });
}

function computeNormal(positionArray: ArrayLike<number>, normalArray: readonly vec3[], index1: number, index2: number, index3: number): void {
    const vertex1 = createVector3(positionArray, index1, vec3Temp4);
    const vertex2 = createVector3(positionArray, index2, vec3Temp5);
    const vertex3 = createVector3(positionArray, index3, vec3Temp6);

    const dir1 = vec3.subtract(vec3Temp1, vertex2, vertex1);
    const dir2 = vec3.subtract(vec3Temp2, vertex3, vertex1);
    const dir3 = vec3.cross(vec3Temp3, dir1, dir2);

    vec3.add(normalArray[index1], normalArray[index1], dir3);
    vec3.add(normalArray[index2], normalArray[index2], dir3);
    vec3.add(normalArray[index3], normalArray[index3], dir3);
}
