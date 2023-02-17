
export class EmptyTexture extends cc.gfx.Texture {
    public initialize(info: Readonly<cc.gfx.TextureInfo> | Readonly<cc.gfx.TextureViewInfo>, isSwapchainTexture?: boolean) {
        let texInfo = info as Readonly<cc.gfx.TextureInfo>;

        if ('texture' in info) {
            texInfo = info.texture.info;
            this._isTextureView = true;
            this._viewInfo.copy(info);
        } else {
            this._viewInfo.texture = this;
            this._viewInfo.type = info.type;
            this._viewInfo.format = info.format;
            this._viewInfo.baseLevel = 0;
            this._viewInfo.levelCount = 1;
            this._viewInfo.baseLayer = 0;
            this._viewInfo.layerCount = 1;
        }

        this._info.copy(texInfo);

        this._isPowerOf2 = cc.gfx.IsPowerOf2(this._info.width) && cc.gfx.IsPowerOf2(this._info.height);
        this._size = cc.gfx.FormatSurfaceSize(this._info.format, this.width, this.height,
            this.depth, this._info.levelCount) * this._info.layerCount;
    }
    public destroy() { }

    public getGLTextureHandle(): number {
        return 0;
    }

    public resize(width: number, height: number) {
        this._info.width = width;
        this._info.height = height;
    }
    protected initAsSwapchainTexture(info: cc.gfx.ISwapchainTextureInfo) { }
}

export class EmptyDescriptorSet extends cc.gfx.DescriptorSet {
    public initialize(info: Readonly<cc.gfx.DescriptorSetInfo>) {
        this._layout = info.layout;
    }
    public destroy() { }
    public update() { }
}

export class EmptyShader extends cc.gfx.Shader {
    public initialize(info: Readonly<cc.gfx.ShaderInfo>) {
        console.log(`Shader '${info.name}' compilation succeeded.`);
    }
    public destroy() { }
}

export class EmptyInputAssembler extends cc.gfx.InputAssembler {
    public initialize(info: Readonly<cc.gfx.InputAssemblerInfo>) {
        this._attributes = info.attributes;
        this._attributesHash = this.computeAttributesHash();
        this._vertexBuffers = info.vertexBuffers;

        if (info.indexBuffer) {
            this._indexBuffer = info.indexBuffer;
            this._drawInfo.indexCount = this._indexBuffer.size / this._indexBuffer.stride;
            this._drawInfo.firstIndex = 0;
        } else {
            const vertBuff = this._vertexBuffers[0];
            this._drawInfo.vertexCount = vertBuff.size / vertBuff.stride;
            this._drawInfo.firstVertex = 0;
            this._drawInfo.vertexOffset = 0;
        }
    }
    public destroy() { }
}

export class EmptyPipelineLayout extends cc.gfx.PipelineLayout {
    public initialize(info: Readonly<cc.gfx.PipelineLayoutInfo>) {
        Array.prototype.push.apply(this._setLayouts, info.setLayouts);
    }
    public destroy() { }
}

export class EmptyPipelineState extends cc.gfx.PipelineState {
    public initialize(info: Readonly<cc.gfx.PipelineStateInfo>) {
        this._primitive = info.primitive;
        this._shader = info.shader;
        this._pipelineLayout = info.pipelineLayout;
        const bs = this._bs;
        if (info.blendState) {
            const bsInfo = info.blendState;
            const { targets } = bsInfo;
            if (targets) {
                targets.forEach((t, i) => {
                    bs.setTarget(i, t);
                });
            }

            if (bsInfo.isA2C !== undefined) { bs.isA2C = bsInfo.isA2C; }
            if (bsInfo.isIndepend !== undefined) { bs.isIndepend = bsInfo.isIndepend; }
            if (bsInfo.blendColor !== undefined) { bs.blendColor = bsInfo.blendColor; }
        }
        Object.assign(this._rs, info.rasterizerState);
        Object.assign(this._dss, info.depthStencilState);
        this._is = info.inputState;
        this._renderPass = info.renderPass;
        this._dynamicStates = info.dynamicStates;
    }
    public destroy() { }
}

export class EmptyQueue extends cc.gfx.Queue {
    public initialize(info: Readonly<cc.gfx.QueueInfo>) {
        this._type = info.type;
    }
    public destroy() { }
    public submit(cmdBuffs: Readonly<cc.gfx.CommandBuffer[]>) { }
}

export class EmptyRenderPass extends cc.gfx.RenderPass {
    public initialize(info: Readonly<cc.gfx.RenderPassInfo>) {
        this._colorInfos = info.colorAttachments;
        this._depthStencilInfo = info.depthStencilAttachment;
        this._subpasses = info.subpasses;
        this._hash = this.computeHash();
    }
    public destroy() { }
}

export class EmptyFramebuffer extends cc.gfx.Framebuffer {
    public initialize(info: Readonly<cc.gfx.FramebufferInfo>) {
        this._renderPass = info.renderPass;
        this._colorTextures = info.colorTextures || [];
        this._depthStencilTexture = info.depthStencilTexture || null;
    }
    public destroy() { }
}

export class EmptyDescriptorSetLayout extends cc.gfx.DescriptorSetLayout {
    public initialize(info: Readonly<cc.gfx.DescriptorSetLayoutInfo>) {
        Array.prototype.push.apply(this._bindings, info.bindings);
    }
    public destroy() { }
}

export class EmptySwapchain extends cc.gfx.Swapchain {
    public initialize(info: Readonly<cc.gfx.SwapchainInfo>) {
        this._colorTexture = new EmptyTexture();
        // @ts-expect-error(2445) private initializer
        this._colorTexture.initAsSwapchainTexture({
            swapchain: this,
            format: cc.gfx.Format.RGBA8,
            width: info.width,
            height: info.height,
        });

        this._depthStencilTexture = new EmptyTexture();
        // @ts-expect-error(2445) private initializer
        this._depthStencilTexture.initAsSwapchainTexture({
            swapchain: this,
            format: cc.gfx.Format.DEPTH_STENCIL,
            width: info.width,
            height: info.height,
        });
    }
    public destroy(): void { }
    public resize(width: number, height: number, surfaceTransform: cc.gfx.SurfaceTransform) { }
}

export class EmptyBuffer extends cc.gfx.Buffer {
    public initialize(info: Readonly<cc.gfx.BufferInfo> | Readonly<cc.gfx.BufferViewInfo>) {
        if ('buffer' in info) { // buffer view
            this._isBufferView = true;

            const buffer = info.buffer as EmptyBuffer;

            this._usage = buffer.usage;
            this._memUsage = buffer.memUsage;
            this._size = this._stride = info.range;
            this._count = 1;
            this._flags = buffer.flags;
        } else { // native buffer
            this._usage = info.usage;
            this._memUsage = info.memUsage;
            this._size = info.size;
            this._stride = Math.max(info.stride || this._size, 1);
            this._count = this._size / this._stride;
            this._flags = info.flags;
        }
    }
    public destroy() { }
    public resize(size: number) { }
    public update(buffer: Readonly<cc.gfx.BufferSource>, size?: number) { }
}

export class EmptyCommandBuffer extends cc.gfx.CommandBuffer {
    public initialize(info: Readonly<cc.gfx.CommandBufferInfo>) {
        this._type = info.type;
        this._queue = info.queue;
    }
    public destroy() { }
    public begin(renderPass?: cc.gfx.RenderPass, subpass = 0, frameBuffer?: cc.gfx.Framebuffer) { }
    public end() { }
    public beginRenderPass(renderPass: cc.gfx.RenderPass, framebuffer: cc.gfx.Framebuffer, renderArea: Readonly<cc.gfx.Rect>,
        clearColors: Readonly<cc.gfx.Color[]>, clearDepth: number, clearStencil: number) { }
    public endRenderPass() { }
    public bindPipelineState(pipelineState: cc.gfx.PipelineState) { }
    public bindDescriptorSet(set: number, descriptorSet: cc.gfx.DescriptorSet, dynamicOffsets?: Readonly<number[]>) { }
    public bindInputAssembler(inputAssembler: cc.gfx.InputAssembler) { }
    public setViewport(viewport: Readonly<cc.gfx.Viewport>) { }
    public setScissor(scissor: Readonly<cc.gfx.Rect>) { }
    public setLineWidth(lineWidth: number) { }
    public setDepthBias(depthBiasConstantFactor: number, depthBiasClamp: number, depthBiasSlopeFactor: number) { }
    public setBlendConstants(blendConstants: Readonly<cc.gfx.Color>) { }
    public setDepthBound(minDepthBounds: number, maxDepthBounds: number) { }
    public setStencilWriteMask(face: cc.gfx.StencilFace, writeMask: number) { }
    public setStencilCompareMask(face: cc.gfx.StencilFace, reference: number, compareMask: number) { }
    public draw(infoOrAssembler: Readonly<cc.gfx.DrawInfo> | Readonly<cc.gfx.InputAssembler>) { }
    public updateBuffer(buffer: cc.gfx.Buffer, data: Readonly<BufferSource>, size?: number) { }
    public copyBuffersToTexture(buffers: Readonly<ArrayBufferView[]>, texture: cc.gfx.Texture, regions: Readonly<cc.gfx.BufferTextureCopy[]>) { }
    public execute(cmdBuffs: Readonly<cc.gfx.CommandBuffer[]>, count: number) { }
    public pipelineBarrier(GeneralBarrier: Readonly<cc.gfx.GeneralBarrier>, bufferBarriers?: any,
        buffers?: Readonly<cc.gfx.Buffer[]>,
        textureBarriers?: Readonly<cc.gfx.TextureBarrier[]>,
        textures?: Readonly<cc.gfx.Texture[]>) { }
    public blitTexture(srcTexture: Readonly<cc.gfx.Texture>, dstTexture: cc.gfx.Texture, regions: Readonly<cc.gfx.TextureBlit[]>, filter: cc.gfx.Filter): void { }
}

export class EmptyDevice extends cc.gfx.Device {
    private _swapchain: EmptySwapchain | null = null;

    initialize(info: Readonly<cc.gfx.DeviceInfo>): boolean {
        this._gfxAPI = 0;
        this._bindingMappingInfo = info.bindingMappingInfo;
        this._queue = this.createQueue(new cc.gfx.QueueInfo(cc.gfx.QueueType.GRAPHICS));
        this._cmdBuff = this.createCommandBuffer(new cc.gfx.CommandBufferInfo(this._queue));
        return true;
    }
    destroy(): void {
        if (this._queue) {
            this._queue.destroy();
            this._queue = null;
        }

        if (this._cmdBuff) {
            this._cmdBuff.destroy();
            this._cmdBuff = null;
        }

        this._swapchain = null;
    }
    acquire(swapchains: readonly cc.gfx.Swapchain[]): void { }
    present(): void { }
    flushCommands(cmdBuffs: readonly cc.gfx.CommandBuffer[]): void { }
    createCommandBuffer(info: Readonly<cc.gfx.CommandBufferInfo>): cc.gfx.CommandBuffer {
        const cmdBuff = new EmptyCommandBuffer();
        cmdBuff.initialize(info);
        return cmdBuff;
    }
    createSwapchain(info: Readonly<cc.gfx.SwapchainInfo>): cc.gfx.Swapchain {
        const swapchain = new EmptySwapchain();
        this._swapchain = swapchain;
        swapchain.initialize(info);
        return swapchain;
    }
    createBuffer(info: Readonly<cc.gfx.BufferInfo> | cc.gfx.BufferViewInfo): cc.gfx.Buffer {
        const buffer = new EmptyBuffer();
        buffer.initialize(info);
        return buffer;
    }
    createTexture(info: Readonly<cc.gfx.TextureInfo> | cc.gfx.TextureViewInfo): cc.gfx.Texture {
        const texture = new EmptyTexture();
        texture.initialize(info);
        return texture;
    }
    createDescriptorSet(info: Readonly<cc.gfx.DescriptorSetInfo>): cc.gfx.DescriptorSet {
        const descriptorSet = new EmptyDescriptorSet();
        descriptorSet.initialize(info);
        return descriptorSet;
    }
    createShader(info: Readonly<cc.gfx.ShaderInfo>): cc.gfx.Shader {
        const shader = new EmptyShader();
        shader.initialize(info);
        return shader;
    }
    createInputAssembler(info: Readonly<cc.gfx.InputAssemblerInfo>): cc.gfx.InputAssembler {
        const inputAssembler = new EmptyInputAssembler();
        inputAssembler.initialize(info);
        return inputAssembler;
    }
    createRenderPass(info: Readonly<cc.gfx.RenderPassInfo>): cc.gfx.RenderPass {
        const renderPass = new EmptyRenderPass();
        renderPass.initialize(info);
        return renderPass;
    }
    createFramebuffer(info: Readonly<cc.gfx.FramebufferInfo>): cc.gfx.Framebuffer {
        const framebuffer = new EmptyFramebuffer();
        framebuffer.initialize(info);
        return framebuffer;
    }
    createDescriptorSetLayout(info: Readonly<cc.gfx.DescriptorSetLayoutInfo>): cc.gfx.DescriptorSetLayout {
        const descriptorSetLayout = new EmptyDescriptorSetLayout();
        descriptorSetLayout.initialize(info);
        return descriptorSetLayout;
    }
    createPipelineLayout(info: Readonly<cc.gfx.PipelineLayoutInfo>): cc.gfx.PipelineLayout {
        const pipelineLayout = new EmptyPipelineLayout();
        pipelineLayout.initialize(info);
        return pipelineLayout;
    }
    createPipelineState(info: Readonly<cc.gfx.PipelineStateInfo>): cc.gfx.PipelineState {
        const pipelineState = new EmptyPipelineState();
        pipelineState.initialize(info);
        return pipelineState;
    }
    createQueue(info: Readonly<cc.gfx.QueueInfo>): cc.gfx.Queue {
        const queue = new EmptyQueue();
        queue.initialize(info);
        return queue;
    }
    getSampler(info: Readonly<cc.gfx.SamplerInfo>): cc.gfx.Sampler {
        const hash = cc.gfx.Sampler.computeHash(info);
        if (!this._samplers.has(hash)) {
            this._samplers.set(hash, new cc.gfx.Sampler(info, hash));
        }
        return this._samplers.get(hash)!;
    }
    getSwapchains(): readonly cc.gfx.Swapchain[] {
        return [this._swapchain as cc.gfx.Swapchain];
    }
    getGeneralBarrier(info: Readonly<cc.gfx.GeneralBarrierInfo>): cc.gfx.GeneralBarrier {
        const hash = cc.gfx.GeneralBarrier.computeHash(info);
        if (!this._generalBarrierss.has(hash)) {
            this._generalBarrierss.set(hash, new cc.gfx.GeneralBarrier(info, hash));
        }
        return this._generalBarrierss.get(hash)!;
    }
    getTextureBarrier(info: Readonly<cc.gfx.TextureBarrierInfo>): cc.gfx.TextureBarrier {
        const hash = cc.gfx.TextureBarrier.computeHash(info);
        if (!this._textureBarriers.has(hash)) {
            this._textureBarriers.set(hash, new cc.gfx.TextureBarrier(info, hash));
        }
        return this._textureBarriers.get(hash)!;
    }
    getBufferBarrier(info: Readonly<cc.gfx.BufferBarrierInfo>): cc.__private._cocos_gfx_base_states_buffer_barrier__BufferBarrier {
        const hash = cc.__private._cocos_gfx_base_states_buffer_barrier__BufferBarrier.computeHash(info);
        if (!this._bufferBarriers.has(hash)) {
            this._bufferBarriers.set(hash, new cc.__private._cocos_gfx_base_states_buffer_barrier__BufferBarrier(info, hash));
        }
        return this._bufferBarriers.get(hash)!;
    }
    copyBuffersToTexture(buffers: readonly ArrayBufferView[], texture: cc.gfx.Texture, regions: readonly cc.gfx.BufferTextureCopy[]): void {
    }
    copyTextureToBuffers(texture: Readonly<cc.gfx.Texture>, buffers: ArrayBufferView[], regions: readonly cc.gfx.BufferTextureCopy[]): void {
    }
    copyTexImagesToTexture(texImages: readonly TexImageSource[], texture: cc.gfx.Texture, regions: readonly cc.gfx.BufferTextureCopy[]): void {
    }
}