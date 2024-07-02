import { TypedArray } from "@gltf-transform/core";
import { ArrayLike } from "./cocos/Cocos";

export function fillArray(source: ArrayLike<number>, target: number[], startIndex = 1): void {
    for (let i = startIndex; i < target.length; i++)
        target[i] = source[i - startIndex];
}

export const _d2r = Math.PI / 180.0;
export const _r2d = 180.0 / Math.PI;
export const EPSILON = 0.000001;
const halfToRad = 0.5 * Math.PI / 180.0;

export namespace vec3 {

    export function isZero(value: ArrayLike<number>): boolean {
        for (let i = 0; i < value.length; i++)
            if (Math.abs(value[i]) > EPSILON) return false;
        return true;
    }
    
    export function isOne(value: ArrayLike<number>): boolean {
        for (let i = 0; i < value.length; i++)
            if (Math.abs(value[i] - 1) > EPSILON) return false;
        return true;
    }

    export function rotateY(v: TypedArray, offset: number, o: ArrayLike<number>, a: number): void {
        // Translate point to the origin
        const x = v[offset + 0] - o[0];
        const y = v[offset + 1] - o[1];
        const z = v[offset + 2] - o[2];

        // perform rotation
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        const rx = z * sin + x * cos;
        const ry = y;
        const rz = z * cos - x * sin;

        // translate to correct position
        v[offset + 0] = rx + o[0];
        v[offset + 1] = ry + o[1];
        v[offset + 2] = rz + o[2];
    }
}

export namespace quat {

    export function isIdentity(value: ArrayLike<number>): boolean {
        for (let i = 0; i < value.length - 1; i++)
            if (Math.abs(value[i]) > EPSILON) return false;
        if (Math.abs(value[value.length - 1] - 1) > EPSILON) return false;
        return true;
    }

    export function toEuler(q: ArrayLike<number>): number[] {
        const x = q[0], y = q[1], z = q[2], w = q[3];
        let bank = 0;
        let heading = 0;
        let attitude = 0;
        const test = x * y + z * w;
        if (test > 0.499999) {
            bank = 0; // default to zero
            heading = 2 * Math.atan2(x, w) * _r2d;
            attitude = 90;
        } else if (test < -0.499999) {
            bank = 0; // default to zero
            heading = -2 * Math.atan2(x, w) * _r2d;
            attitude = -90;
        } else {
            const sqx = x * x;
            const sqy = y * y;
            const sqz = z * z;
            bank = Math.atan2(2 * x * w - 2 * y * z, 1 - 2 * sqx - 2 * sqz) * _r2d;
            heading = Math.atan2(2 * y * w - 2 * x * z, 1 - 2 * sqy - 2 * sqz) * _r2d;
            attitude = Math.asin(2 * test) * _r2d;
        }
        return [bank, heading, attitude];
    }

    export function fromEuler(out: ArrayLike<number>, offset: number, x: number, y: number, z: number): void {
        x *= halfToRad;
        y *= halfToRad;
        z *= halfToRad;

        const sx = Math.sin(x);
        const cx = Math.cos(x);
        const sy = Math.sin(y);
        const cy = Math.cos(y);
        const sz = Math.sin(z);
        const cz = Math.cos(z);

        out[offset + 0] = sx * cy * cz + cx * sy * sz;
        out[offset + 1] = cx * sy * cz + sx * cy * sz;
        out[offset + 2] = cx * cy * sz - sx * sy * cz;
        out[offset + 3] = cx * cy * cz - sx * sy * sz;
    }

    export function fromAngleY(out: ArrayLike<number>, offset: number, angle: number): ArrayLike<number> {
        angle *= 0.5;
        out[offset + 0] = 0;
        out[offset + 1] = Math.sin(angle);
        out[offset + 2] = 0;
        out[offset + 3] = Math.cos(angle);
        return out;
    }

    export function multiply(out: ArrayLike<number>, oOffset: number,a: ArrayLike<number>, aOffset: number, b: ArrayLike<number>, bOffset: number): void {
        const ax = a[aOffset], ay = a[aOffset + 1], az = a[aOffset + 2], aw = a[aOffset + 3];
        const bx = b[bOffset], by = b[bOffset + 1], bz = b[bOffset + 2], bw = b[bOffset + 3];
        const x = ax * bw + aw * bx + ay * bz - az * by;
        const y = ay * bw + aw * by + az * bx - ax * bz;
        const z = az * bw + aw * bz + ax * by - ay * bx;
        const w = aw * bw - ax * bx - ay * by - az * bz;
        out[oOffset + 0] = x;
        out[oOffset + 1] = y;
        out[oOffset + 2] = z;
        out[oOffset + 3] = w;
    }
}