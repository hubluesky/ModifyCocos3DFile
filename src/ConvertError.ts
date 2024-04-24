
export class ConvertError extends Error {
    constructor(code: number, msg: string, ...params: any[]) { super(); }
}