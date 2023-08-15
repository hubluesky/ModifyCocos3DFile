export const isLittleEndian = true;

export enum Format {

    UNKNOWN,

    A8,
    L8,
    LA8,

    R8,
    R8SN,
    R8UI,
    R8I,
    R16F,
    R16UI,
    R16I,
    R32F,
    R32UI,
    R32I,

    RG8,
    RG8SN,
    RG8UI,
    RG8I,
    RG16F,
    RG16UI,
    RG16I,
    RG32F,
    RG32UI,
    RG32I,

    RGB8,
    SRGB8,
    RGB8SN,
    RGB8UI,
    RGB8I,
    RGB16F,
    RGB16UI,
    RGB16I,
    RGB32F,
    RGB32UI,
    RGB32I,

    RGBA8,
    BGRA8,
    SRGB8_A8,
    RGBA8SN,
    RGBA8UI,
    RGBA8I,
    RGBA16F,
    RGBA16UI,
    RGBA16I,
    RGBA32F,
    RGBA32UI,
    RGBA32I,

    // Special Format
    R5G6B5,
    R11G11B10F,
    RGB5A1,
    RGBA4,
    RGB10A2,
    RGB10A2UI,
    RGB9E5,

    // Depth-Stencil Format
    DEPTH,
    DEPTH_STENCIL,

    // Compressed Format

    // Block Compression Format, DDS (DirectDraw Surface)
    // DXT1: 3 channels (5:6:5), 1/8 original size, with 0 or 1 bit of alpha
    BC1,
    BC1_ALPHA,
    BC1_SRGB,
    BC1_SRGB_ALPHA,
    // DXT3: 4 channels (5:6:5), 1/4 original size, with 4 bits of alpha
    BC2,
    BC2_SRGB,
    // DXT5: 4 channels (5:6:5), 1/4 original size, with 8 bits of alpha
    BC3,
    BC3_SRGB,
    // 1 channel (8), 1/4 original size
    BC4,
    BC4_SNORM,
    // 2 channels (8:8), 1/2 original size
    BC5,
    BC5_SNORM,
    // 3 channels (16:16:16), half-floating point, 1/6 original size
    // UF16: unsigned float, 5 exponent bits + 11 mantissa bits
    // SF16: signed float, 1 signed bit + 5 exponent bits + 10 mantissa bits
    BC6H_UF16,
    BC6H_SF16,
    // 4 channels (4~7 bits per channel) with 0 to 8 bits of alpha, 1/3 original size
    BC7,
    BC7_SRGB,

    // Ericsson Texture Compression Format
    ETC_RGB8,
    ETC2_RGB8,
    ETC2_SRGB8,
    ETC2_RGB8_A1,
    ETC2_SRGB8_A1,
    ETC2_RGBA8,
    ETC2_SRGB8_A8,
    EAC_R11,
    EAC_R11SN,
    EAC_RG11,
    EAC_RG11SN,

    // PVRTC (PowerVR)
    PVRTC_RGB2,
    PVRTC_RGBA2,
    PVRTC_RGB4,
    PVRTC_RGBA4,
    PVRTC2_2BPP,
    PVRTC2_4BPP,

    // ASTC (Adaptive Scalable Texture Compression)
    ASTC_RGBA_4X4,
    ASTC_RGBA_5X4,
    ASTC_RGBA_5X5,
    ASTC_RGBA_6X5,
    ASTC_RGBA_6X6,
    ASTC_RGBA_8X5,
    ASTC_RGBA_8X6,
    ASTC_RGBA_8X8,
    ASTC_RGBA_10X5,
    ASTC_RGBA_10X6,
    ASTC_RGBA_10X8,
    ASTC_RGBA_10X10,
    ASTC_RGBA_12X10,
    ASTC_RGBA_12X12,

    // ASTC (Adaptive Scalable Texture Compression) SRGB
    ASTC_SRGBA_4X4,
    ASTC_SRGBA_5X4,
    ASTC_SRGBA_5X5,
    ASTC_SRGBA_6X5,
    ASTC_SRGBA_6X6,
    ASTC_SRGBA_8X5,
    ASTC_SRGBA_8X6,
    ASTC_SRGBA_8X8,
    ASTC_SRGBA_10X5,
    ASTC_SRGBA_10X6,
    ASTC_SRGBA_10X8,
    ASTC_SRGBA_10X10,
    ASTC_SRGBA_12X10,
    ASTC_SRGBA_12X12,

    // Total count
    COUNT,
}

export enum FormatType {
    NONE,
    UNORM,
    SNORM,
    UINT,
    INT,
    UFLOAT,
    FLOAT,
}

export class FormatInfo {
    declare private _token: never; // to make sure all usages must be an instance of this exact class, not assembled from plain object

    constructor(
        public readonly name: string = '',
        public readonly size: number = 0,
        public readonly count: number = 0,
        public readonly type: FormatType = FormatType.NONE,
        public readonly hasAlpha: boolean = false,
        public readonly hasDepth: boolean = false,
        public readonly hasStencil: boolean = false,
        public readonly isCompressed: boolean = false,
    ) { }
}

export const FormatInfos = Object.freeze([

    new FormatInfo('UNKNOWN', 0, 0, FormatType.NONE, false, false, false, false),

    new FormatInfo('A8', 1, 1, FormatType.UNORM, true, false, false, false),
    new FormatInfo('L8', 1, 1, FormatType.UNORM, false, false, false, false),
    new FormatInfo('LA8', 1, 2, FormatType.UNORM, true, false, false, false),

    new FormatInfo('R8', 1, 1, FormatType.UNORM, false, false, false, false),
    new FormatInfo('R8SN', 1, 1, FormatType.SNORM, false, false, false, false),
    new FormatInfo('R8UI', 1, 1, FormatType.UINT, false, false, false, false),
    new FormatInfo('R8I', 1, 1, FormatType.INT, false, false, false, false),
    new FormatInfo('R16F', 2, 1, FormatType.FLOAT, false, false, false, false),
    new FormatInfo('R16UI', 2, 1, FormatType.UINT, false, false, false, false),
    new FormatInfo('R16I', 2, 1, FormatType.INT, false, false, false, false),
    new FormatInfo('R32F', 4, 1, FormatType.FLOAT, false, false, false, false),
    new FormatInfo('R32UI', 4, 1, FormatType.UINT, false, false, false, false),
    new FormatInfo('R32I', 4, 1, FormatType.INT, false, false, false, false),

    new FormatInfo('RG8', 2, 2, FormatType.UNORM, false, false, false, false),
    new FormatInfo('RG8SN', 2, 2, FormatType.SNORM, false, false, false, false),
    new FormatInfo('RG8UI', 2, 2, FormatType.UINT, false, false, false, false),
    new FormatInfo('RG8I', 2, 2, FormatType.INT, false, false, false, false),
    new FormatInfo('RG16F', 4, 2, FormatType.FLOAT, false, false, false, false),
    new FormatInfo('RG16UI', 4, 2, FormatType.UINT, false, false, false, false),
    new FormatInfo('RG16I', 4, 2, FormatType.INT, false, false, false, false),
    new FormatInfo('RG32F', 8, 2, FormatType.FLOAT, false, false, false, false),
    new FormatInfo('RG32UI', 8, 2, FormatType.UINT, false, false, false, false),
    new FormatInfo('RG32I', 8, 2, FormatType.INT, false, false, false, false),

    new FormatInfo('RGB8', 3, 3, FormatType.UNORM, false, false, false, false),
    new FormatInfo('SRGB8', 3, 3, FormatType.UNORM, false, false, false, false),
    new FormatInfo('RGB8SN', 3, 3, FormatType.SNORM, false, false, false, false),
    new FormatInfo('RGB8UI', 3, 3, FormatType.UINT, false, false, false, false),
    new FormatInfo('RGB8I', 3, 3, FormatType.INT, false, false, false, false),
    new FormatInfo('RGB16F', 6, 3, FormatType.FLOAT, false, false, false, false),
    new FormatInfo('RGB16UI', 6, 3, FormatType.UINT, false, false, false, false),
    new FormatInfo('RGB16I', 6, 3, FormatType.INT, false, false, false, false),
    new FormatInfo('RGB32F', 12, 3, FormatType.FLOAT, false, false, false, false),
    new FormatInfo('RGB32UI', 12, 3, FormatType.UINT, false, false, false, false),
    new FormatInfo('RGB32I', 12, 3, FormatType.INT, false, false, false, false),

    new FormatInfo('RGBA8', 4, 4, FormatType.UNORM, true, false, false, false),
    new FormatInfo('BGRA8', 4, 4, FormatType.UNORM, true, false, false, false),
    new FormatInfo('SRGB8_A8', 4, 4, FormatType.UNORM, true, false, false, false),
    new FormatInfo('RGBA8SN', 4, 4, FormatType.SNORM, true, false, false, false),
    new FormatInfo('RGBA8UI', 4, 4, FormatType.UINT, true, false, false, false),
    new FormatInfo('RGBA8I', 4, 4, FormatType.INT, true, false, false, false),
    new FormatInfo('RGBA16F', 8, 4, FormatType.FLOAT, true, false, false, false),
    new FormatInfo('RGBA16UI', 8, 4, FormatType.UINT, true, false, false, false),
    new FormatInfo('RGBA16I', 8, 4, FormatType.INT, true, false, false, false),
    new FormatInfo('RGBA32F', 16, 4, FormatType.FLOAT, true, false, false, false),
    new FormatInfo('RGBA32UI', 16, 4, FormatType.UINT, true, false, false, false),
    new FormatInfo('RGBA32I', 16, 4, FormatType.INT, true, false, false, false),

    new FormatInfo('R5G6B5', 2, 3, FormatType.UNORM, false, false, false, false),
    new FormatInfo('R11G11B10F', 4, 3, FormatType.FLOAT, false, false, false, false),
    new FormatInfo('RGB5A1', 2, 4, FormatType.UNORM, true, false, false, false),
    new FormatInfo('RGBA4', 2, 4, FormatType.UNORM, true, false, false, false),
    new FormatInfo('RGB10A2', 2, 4, FormatType.UNORM, true, false, false, false),
    new FormatInfo('RGB10A2UI', 2, 4, FormatType.UINT, true, false, false, false),
    new FormatInfo('RGB9E5', 2, 4, FormatType.FLOAT, true, false, false, false),

    new FormatInfo('DEPTH', 4, 1, FormatType.FLOAT, false, true, false, false),
    new FormatInfo('DEPTH_STENCIL', 5, 2, FormatType.FLOAT, false, true, true, false),

    new FormatInfo('BC1', 1, 3, FormatType.UNORM, false, false, false, true),
    new FormatInfo('BC1_ALPHA', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('BC1_SRGB', 1, 3, FormatType.UNORM, false, false, false, true),
    new FormatInfo('BC1_SRGB_ALPHA', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('BC2', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('BC2_SRGB', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('BC3', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('BC3_SRGB', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('BC4', 1, 1, FormatType.UNORM, false, false, false, true),
    new FormatInfo('BC4_SNORM', 1, 1, FormatType.SNORM, false, false, false, true),
    new FormatInfo('BC5', 1, 2, FormatType.UNORM, false, false, false, true),
    new FormatInfo('BC5_SNORM', 1, 2, FormatType.SNORM, false, false, false, true),
    new FormatInfo('BC6H_UF16', 1, 3, FormatType.UFLOAT, false, false, false, true),
    new FormatInfo('BC6H_SF16', 1, 3, FormatType.FLOAT, false, false, false, true),
    new FormatInfo('BC7', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('BC7_SRGB', 1, 4, FormatType.UNORM, true, false, false, true),

    new FormatInfo('ETC_RGB8', 1, 3, FormatType.UNORM, false, false, false, true),
    new FormatInfo('ETC2_RGB8', 1, 3, FormatType.UNORM, false, false, false, true),
    new FormatInfo('ETC2_SRGB8', 1, 3, FormatType.UNORM, false, false, false, true),
    new FormatInfo('ETC2_RGB8_A1', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ETC2_SRGB8_A1', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ETC2_RGBA8', 2, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ETC2_SRGB8_A8', 2, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('EAC_R11', 1, 1, FormatType.UNORM, false, false, false, true),
    new FormatInfo('EAC_R11SN', 1, 1, FormatType.SNORM, false, false, false, true),
    new FormatInfo('EAC_RG11', 2, 2, FormatType.UNORM, false, false, false, true),
    new FormatInfo('EAC_RG11SN', 2, 2, FormatType.SNORM, false, false, false, true),

    new FormatInfo('PVRTC_RGB2', 2, 3, FormatType.UNORM, false, false, false, true),
    new FormatInfo('PVRTC_RGBA2', 2, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('PVRTC_RGB4', 2, 3, FormatType.UNORM, false, false, false, true),
    new FormatInfo('PVRTC_RGBA4', 2, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('PVRTC2_2BPP', 2, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('PVRTC2_4BPP', 2, 4, FormatType.UNORM, true, false, false, true),

    new FormatInfo('ASTC_RGBA_4x4', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_RGBA_5x4', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_RGBA_5x5', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_RGBA_6x5', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_RGBA_6x6', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_RGBA_8x5', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_RGBA_8x6', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_RGBA_8x8', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_RGBA_10x5', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_RGBA_10x6', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_RGBA_10x8', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_RGBA_10x10', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_RGBA_12x10', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_RGBA_12x12', 1, 4, FormatType.UNORM, true, false, false, true),

    new FormatInfo('ASTC_SRGBA_4x4', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_SRGBA_5x4', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_SRGBA_5x5', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_SRGBA_6x5', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_SRGBA_6x6', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_SRGBA_8x5', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_SRGBA_8x6', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_SRGBA_8x8', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_SRGBA_10x5', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_SRGBA_10x6', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_SRGBA_10x8', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_SRGBA_10x10', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_SRGBA_12x10', 1, 4, FormatType.UNORM, true, false, false, true),
    new FormatInfo('ASTC_SRGBA_12x12', 1, 4, FormatType.UNORM, true, false, false, true),
]);

export enum AttributeName {
    ATTR_POSITION = 'a_position',
    ATTR_NORMAL = 'a_normal',
    ATTR_TANGENT = 'a_tangent',
    ATTR_BITANGENT = 'a_bitangent',
    ATTR_WEIGHTS = 'a_weights',
    ATTR_JOINTS = 'a_joints',
    ATTR_COLOR = 'a_color',
    ATTR_COLOR1 = 'a_color1',
    ATTR_COLOR2 = 'a_color2',
    ATTR_TEX_COORD = 'a_texCoord',
    ATTR_TEX_COORD1 = 'a_texCoord1',
    ATTR_TEX_COORD2 = 'a_texCoord2',
    ATTR_TEX_COORD3 = 'a_texCoord3',
    ATTR_TEX_COORD4 = 'a_texCoord4',
    ATTR_TEX_COORD5 = 'a_texCoord5',
    ATTR_TEX_COORD6 = 'a_texCoord6',
    ATTR_TEX_COORD7 = 'a_texCoord7',
    ATTR_TEX_COORD8 = 'a_texCoord8',
    ATTR_BATCH_ID = 'a_batch_id',
    ATTR_BATCH_UV = 'a_batch_uv',
}

export class Attribute {
    declare private _token: never; // to make sure all usages must be an instance of this exact class, not assembled from plain object

    constructor(
        public name: AttributeName,
        public format: Format = Format.UNKNOWN,
        public isNormalized: boolean = false,
        public stream: number = 0,
        public isInstanced: boolean = false,
        public location: number = 0,
    ) { }

    public copy(info: Readonly<Attribute>) {
        this.name = info.name;
        this.format = info.format;
        this.isNormalized = info.isNormalized;
        this.stream = info.stream;
        this.isInstanced = info.isInstanced;
        this.location = info.location;
        return this;
    }
}

export function getComponentByteLength(format: Format) {
    const info = FormatInfos[format];
    return info.size / info.count;
}

export function getReader(dataView: DataView, format: Format) {
    const info = FormatInfos[format];
    const stride = info.size / info.count;

    switch (info.type) {
        case FormatType.UNORM: {
            switch (stride) {
                case 1: return (offset: number) => dataView.getUint8(offset);
                case 2: return (offset: number) => dataView.getUint16(offset, isLittleEndian);
                case 4: return (offset: number) => dataView.getUint32(offset, isLittleEndian);
                default:
            }
            break;
        }
        case FormatType.SNORM: {
            switch (stride) {
                case 1: return (offset: number) => dataView.getInt8(offset);
                case 2: return (offset: number) => dataView.getInt16(offset, isLittleEndian);
                case 4: return (offset: number) => dataView.getInt32(offset, isLittleEndian);
                default:
            }
            break;
        }
        case FormatType.INT: {
            switch (stride) {
                case 1: return (offset: number) => dataView.getInt8(offset);
                case 2: return (offset: number) => dataView.getInt16(offset, isLittleEndian);
                case 4: return (offset: number) => dataView.getInt32(offset, isLittleEndian);
                default:
            }
            break;
        }
        case FormatType.UINT: {
            switch (stride) {
                case 1: return (offset: number) => dataView.getUint8(offset);
                case 2: return (offset: number) => dataView.getUint16(offset, isLittleEndian);
                case 4: return (offset: number) => dataView.getUint32(offset, isLittleEndian);
                default:
            }
            break;
        }
        case FormatType.FLOAT: {
            return (offset: number) => dataView.getFloat32(offset, isLittleEndian);
        }
        default:
    }

    return null;
}

export function getWriter(dataView: DataView, format: Format) {
    const info = FormatInfos[format];
    const stride = info.size / info.count;

    switch (info.type) {
        case FormatType.UNORM: {
            switch (stride) {
                case 1: return (offset: number, value: number) => dataView.setUint8(offset, value);
                case 2: return (offset: number, value: number) => dataView.setUint16(offset, value, isLittleEndian);
                case 4: return (offset: number, value: number) => dataView.setUint32(offset, value, isLittleEndian);
                default:
            }
            break;
        }
        case FormatType.SNORM: {
            switch (stride) {
                case 1: return (offset: number, value: number) => dataView.setInt8(offset, value);
                case 2: return (offset: number, value: number) => dataView.setInt16(offset, value, isLittleEndian);
                case 4: return (offset: number, value: number) => dataView.setInt32(offset, value, isLittleEndian);
                default:
            }
            break;
        }
        case FormatType.INT: {
            switch (stride) {
                case 1: return (offset: number, value: number) => dataView.setInt8(offset, value);
                case 2: return (offset: number, value: number) => dataView.setInt16(offset, value, isLittleEndian);
                case 4: return (offset: number, value: number) => dataView.setInt32(offset, value, isLittleEndian);
                default:
            }
            break;
        }
        case FormatType.UINT: {
            switch (stride) {
                case 1: return (offset: number, value: number) => dataView.setUint8(offset, value);
                case 2: return (offset: number, value: number) => dataView.setUint16(offset, value, isLittleEndian);
                case 4: return (offset: number, value: number) => dataView.setUint32(offset, value, isLittleEndian);
                default:
            }
            break;
        }
        case FormatType.FLOAT: {
            return (offset: number, value: number) => dataView.setFloat32(offset, value, isLittleEndian);
        }
        default:
    }

    return null;
}

export function getOffset(attributes: Attribute[], attributeIndex: number) {
    let result = 0;
    for (let i = 0; i < attributeIndex; ++i) {
        const attribute = attributes[i];
        result += FormatInfos[attribute.format].size;
    }
    return result;
}

export function getIndexStrideCtor(stride: number) {
    switch (stride) {
        case 1: return Uint8Array;
        case 2: return Uint16Array;
        case 4: return Uint32Array;
        default: return Uint8Array;
    }
}

export type TypedArray = Uint8Array | Uint8ClampedArray | Int8Array | Uint16Array |
    Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array;

export type TypedArrayConstructor = Uint8ArrayConstructor | Uint8ClampedArrayConstructor |
    Int8ArrayConstructor | Uint16ArrayConstructor | Int16ArrayConstructor | Uint32ArrayConstructor |
    Int32ArrayConstructor | Float32ArrayConstructor | Float64ArrayConstructor;

export function getTypedArrayConstructor(info: FormatInfo): TypedArrayConstructor {
    if (info.isCompressed) {
        return Uint8Array;
    }
    const stride = info.size / info.count;
    switch (info.type) {
        case FormatType.UNORM:
        case FormatType.UINT: {
            switch (stride) {
                case 1: return Uint8Array;
                case 2: return Uint16Array;
                case 4: return Uint32Array;
                default:
                    return Uint8Array;
            }
        }
        case FormatType.SNORM:
        case FormatType.INT: {
            switch (stride) {
                case 1: return Int8Array;
                case 2: return Int16Array;
                case 4: return Int32Array;
                default:
                    return Int8Array;
            }
        }
        case FormatType.FLOAT: {
            return Float32Array;
        }
        default:
    }
    return Float32Array;
}

export interface IBufferView {
    offset: number;
    length: number;
    count: number;
    stride: number;
}

/**
 * @en Vertex bundle, it describes a set of interleaved vertex attributes and their values.
 * @zh 顶点块。顶点块描述了一组**交错排列**（interleaved）的顶点属性并存储了顶点属性的实际数据。<br>
 * 交错排列是指在实际数据的缓冲区中，每个顶点的所有属性总是依次排列，并总是出现在下一个顶点的所有属性之前。
 */
export interface IVertexBundle {
    /**
     * @en The actual value for all vertex attributes.
     * You must use DataView to access the data.
     * Because there is no guarantee that the starting offsets of all properties are byte aligned as required by TypedArray.
     * @zh 所有顶点属性的实际数据块。
     * 你必须使用 DataView 来读取数据。
     * 因为不能保证所有属性的起始偏移都按 TypedArray 要求的字节对齐。
     */
    view: IBufferView;

    /**
     * @en All attributes included in the bundle
     * @zh 包含的所有顶点属性。
     */
    attributes: Attribute[];
}

export enum PrimitiveMode {
    POINT_LIST,
    LINE_LIST,
    LINE_STRIP,
    LINE_LOOP,
    LINE_LIST_ADJACENCY,
    LINE_STRIP_ADJACENCY,
    ISO_LINE_LIST,
    // raycast detectable:
    TRIANGLE_LIST,
    TRIANGLE_STRIP,
    TRIANGLE_FAN,
    TRIANGLE_LIST_ADJACENCY,
    TRIANGLE_STRIP_ADJACENCY,
    TRIANGLE_PATCH_ADJACENCY,
    QUAD_PATCH_LIST,
}

/**
 * @en Sub mesh contains a list of primitives with the same type (Point, Line or Triangle)
 * @zh 子网格。子网格由一系列相同类型的图元组成（例如点、线、面等）。
 */
export interface ISubMesh {
    /**
     * @en The vertex bundle references used by the sub mesh.
     * @zh 此子网格引用的顶点块，索引至网格的顶点块数组。
     */
    vertexBundelIndices: number[];

    /**
     * @en The primitive mode of the sub mesh
     * @zh 此子网格的图元类型。
     */
    primitiveMode: PrimitiveMode;

    /**
     * @en The index data of the sub mesh
     * @zh 此子网格使用的索引数据。
     */
    indexView?: IBufferView;

    /**
     * @en The joint map index in [[IStruct.jointMaps]]. Could be absent
     * @zh 此子网格使用的关节索引映射表在 [[IStruct.jointMaps]] 中的索引。
     * 如未定义或指向的映射表不存在，则默认 VB 内所有关节索引数据直接对应骨骼资源数据。
     */
    jointMapIndex?: number;
}
