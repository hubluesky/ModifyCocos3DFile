import { Animation, AnimationChannel, AnimationSampler, Document, Mesh, Node, Primitive, Root, Skin, getBounds } from '@gltf-transform/core';
import fs from 'fs';
import path from 'path';
import { FormatInfos, getComponentByteLength, getIndexStrideCtor, getOffset, getWriter } from './Cocos';
import { CocosAnimationMeta } from './CocosAnimationMeta';
import { CocosToGltfAttribute, GltfChannelPathToCocos } from './CocosGltfWrap';
import { CocosMeshMeta } from "./CocosMeshMeta";
import { CocosSkeletonMeta } from "./CocosSkeletonMeta";
import { CCON, encodeCCONBinary } from './ccon';
import { gltf } from './gltf';
import { ConvertError } from './ConvertError';

export default class CocosModelWriter {

    public writeMeshFiles(outPath: string, meshMeta: CocosMeshMeta, document: Document): void {
        const root = document.getRoot();
        const meshes = root.listMeshes();
        if (meshes.length > 1)
            throw new ConvertError(111, `Mesh count is not match. source 1, upload ${meshes.length}.`, meshes.length);

        const arrayBuffer = this.writeMesh(meshMeta, meshes[0]);
        // this.writeJointMaps(meshMeta, root);
        this.writeBounds(meshMeta, root);

        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        const binPath = path.join(path.dirname(outPath), path.basename(outPath, path.extname(outPath)) + '.bin');
        fs.writeFileSync(binPath, Buffer.from(arrayBuffer), "binary");
        fs.writeFileSync(outPath, JSON.stringify(meshMeta.data), "utf-8");
    }

    public writeSkeletonFiles(outPath: string, skeletonMeta: CocosSkeletonMeta, skin: Skin): void {
        console.assert(skeletonMeta != null);
        console.assert(skin != null);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        const skeletonMetaData = this.writeSkeleton(skeletonMeta, skin);
        fs.writeFileSync(outPath, JSON.stringify(skeletonMetaData), "utf-8");
    }

    public writeAnimationFiles(outPath: string, animationMeta: CocosAnimationMeta, animation: Animation): void {
        console.assert(animationMeta != null);
        console.assert(animation != null);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });

        const arrayBuffer = this.writeAnimation(animationMeta, animation);
        const ccon = new CCON(animationMeta.list, [new Uint8Array(arrayBuffer.buffer)]);
        fs.writeFileSync(outPath, Buffer.from(encodeCCONBinary(ccon)), "binary");

        // fs.writeFileSync(outPath + ".ccon", JSON.stringify(ccon.document), "utf-8");
    }

    private updateArrayBufferSize(meshMeta: CocosMeshMeta, listPrimitives: Primitive[]): number {
        let size = 0;
        for (let i = 0; i < meshMeta.vertexBundles.length; i++) {
            const vb = meshMeta.vertexBundles[i];
            const typeArray = listPrimitives[i].getAttribute(gltf.AttributeName.POSITION).getArray();
            vb.view.count = typeArray.length / 3;
            vb.view.length = vb.view.count * vb.view.stride;
            vb.view.offset = size;
            size += vb.view.length;
        }
        for (let i = 0; i < meshMeta.primitives.length; i++) {
            const indexView = meshMeta.primitives[i].indexView;
            if (indexView == null) continue;
            const indicesAccessor = listPrimitives[i].getIndices();
            if (indicesAccessor == null)
                throw new ConvertError(112, `The ${i} of primitives does no index buffer`, 112);
            const indices = indicesAccessor.getArray();
            indexView.offset = size;
            indexView.count = indices.length;
            indexView.length = indexView.count * indexView.stride;
            size += indexView.length;
        }
        return size;
    }

    private writeMesh(meshMeta: CocosMeshMeta, mesh: Mesh): ArrayBuffer {
        const listPrimitives = mesh.listPrimitives();

        if (listPrimitives.length != meshMeta.primitives.length)
            throw new ConvertError(113, `The number of primitives does no match: source ${meshMeta.primitives.length} upload ${listPrimitives.length}.`, meshMeta.primitives.length);

        const arrayBufferSize = this.updateArrayBufferSize(meshMeta, listPrimitives);
        const arrayBuffer = new ArrayBuffer(arrayBufferSize);

        for (let iv = 0; iv < meshMeta.vertexBundles.length; iv++) {
            const vertexBundle = meshMeta.vertexBundles[iv];
            for (let ia = 0; ia < vertexBundle.attributes.length; ia++) {
                const { format, name } = vertexBundle.attributes[ia];

                const writer = getWriter(new DataView(arrayBuffer, vertexBundle.view.offset + getOffset(vertexBundle.attributes, ia)), format)!;
                console.assert(writer != null);

                const outputStride = vertexBundle.view.stride;
                const componentCount = FormatInfos[format].count;
                const outputComponentByteLength = getComponentByteLength(format);
                const attributeName = CocosToGltfAttribute[name];
                const attributeAccessor = listPrimitives[iv].getAttribute(attributeName);
                if (attributeAccessor == null)
                    throw new ConvertError(114, `Attribute ${attributeName} is not supported.`, attributeName);
                const typeArray = attributeAccessor.getArray();
                const vertexCount = typeArray.length / componentCount;
                for (let iVertex = 0; iVertex < vertexCount; iVertex++) {
                    for (let iComponent = 0; iComponent < componentCount; iComponent++) {
                        const inputOffset = componentCount * iVertex + iComponent;
                        const outputOffset = outputStride * iVertex + outputComponentByteLength * iComponent;
                        writer(outputOffset, typeArray[inputOffset]);
                    }
                }
            }
        }

        for (let p = 0; p < meshMeta.primitives.length; p++) {
            const primitive = meshMeta.primitives[p];
            if (primitive == null) continue;
            const indexView = primitive.indexView;
            const Ctor = getIndexStrideCtor(indexView.stride);
            const ibo = new Ctor(arrayBuffer, indexView.offset, indexView.count);

            const indicesArray = listPrimitives[p].getIndices().getArray();
            for (let i = 0; i < indicesArray.length; i++) {
                ibo[i] = indicesArray[i];
            }
        }

        return arrayBuffer;
    }

    /**
     * 此函数计算有误
     * @param meshMeta 
     * @param root 
     * @deprecated
     */
    private writeJointMaps(meshMeta: CocosMeshMeta, root: Root): void {
        if (meshMeta.jointMaps != null) {
            const listSkin = root.listSkins();
            const nodes = root.listNodes();
            const jointMapCount = Math.min(meshMeta.jointMaps.length, listSkin.length);
            for (let i = 0; i < jointMapCount; i++) {
                const skin = listSkin[i];
                const joints = skin.listJoints();
                const jointValues: number[] = [];
                for (const joint of joints) {
                    jointValues.push(nodes.indexOf(joint));
                }
                meshMeta.jointMaps[i] = jointValues;
            }
        }
    }

    private writeBounds(meshMeta: CocosMeshMeta, root: Root): void {
        const { min, max } = getBounds(root.listScenes()[0]);
        meshMeta.minPosition = min;
        meshMeta.maxPosition = max;
    }

    private static getJointPathName(joint: Node): string {
        let name: string = joint.getName();

        const isBone = function (bone: Node): boolean {
            return bone?.propertyType == "Node";
        }
        while (isBone(joint.getParentNode() as Node)) {
            joint = joint.getParentNode() as Node;
            name = joint.getName() + "/" + name;
        }
        return name;
    }

    private writeSkeleton(meta: CocosSkeletonMeta, skin: Skin): Object {
        const inverseBindAccessor = skin.getInverseBindMatrices();
        const inverseBindArray = inverseBindAccessor.getArray();
        const componentSize = inverseBindAccessor.getElementSize();

        const jointNodes = skin.listJoints();
        const jointNames: string[] = [];
        for (let node of jointNodes) {
            const name = CocosModelWriter.getJointPathName(node);
            if (meta.jointNames.indexOf(name) == -1)
                throw new ConvertError(108, `Skeleton joint name "${name}" is not match.`, name);
            jointNames.push(name);
        }
        if (jointNames.length != meta.jointNames.length)
            throw new ConvertError(109, `Skeleton joints count is not match. source ${meta.jointNames.length} upload ${jointNodes.length}.`, meta.jointNames.length, jointNodes.length);

        const bindPoses = new Array<number[]>(inverseBindArray.length / componentSize);
        for (let i = 0; i < bindPoses.length; i++) {
            const mat4: number[] = [];
            for (let j = 0; j < componentSize; j++)
                mat4[j] = inverseBindArray[i * componentSize + j];
            bindPoses[i] = mat4;
        }

        // const skeletonMeta = meta.clone();
        meta.jointNames.length = 0;
        for (let i = 0; i < jointNames.length; i++)
            meta.jointNames[i] = jointNames[i];

        const matrixType = meta.bindposes[0][0];
        meta.bindposes.length = 0;

        for (let i = 0; i < bindPoses.length; i++)
            meta.bindposes[i] = new Array(matrixType, ...bindPoses[i]);

        const bindPosesValueType = meta.bindposesValueType[1];
        meta.bindposesValueType.length = 1;

        for (let i = 1; i < bindPoses.length + 1; i++)
            meta.bindposesValueType[i] = bindPosesValueType;

        return meta.data;
    }

    private writeAnimation(meta: CocosAnimationMeta, animation: Animation): Float32Array {
        const channels = animation.listChannels();
        const samples = animation.listSamplers();
        console.assert(channels.length == samples.length, `channels length cannot equals samples length ${channels.length, samples.length}`);
        const animationNodes: {
            node: Node,
            samples: AnimationSampler[],
            channels: AnimationChannel[]
        }[] = [];

        for (let i = 0; i < channels.length; i++) {
            const channel = channels[i];
            const sample = samples[i];
            const node = channel.getTargetNode();

            let animationNode = animationNodes.find(v => v.node == node);
            if (animationNode == null) {
                animationNodes.push(animationNode = { node, samples: [], channels: [] });
            }
            animationNode.samples.push(sample);
            animationNode.channels.push(channel);
        }

        let offset = 0;
        const buffer = new Array<number>();
        let newDuration: number = 0;
        for (const animationNode of animationNodes) {
            const pathname = CocosModelWriter.getJointPathName(animationNode.node);
            const metaAnimationNode = meta.createAnimationNode(pathname);

            for (let i = 0; i < animationNode.samples.length; i++) {
                const sample = animationNode.samples[i];
                const channel = animationNode.channels[i];
                const channelPath = channel.getTargetPath();
                const input = sample.getInput();
                const output = sample.getOutput();

                const timesLength = input.getElementSize() * input.getCount();
                const valuesLength = output.getElementSize() * output.getCount();

                const metaTrack = meta.createExoticTrack(offset, timesLength);
                offset += timesLength * input.getComponentSize();
                meta.setAnimationNodePropertyId(metaAnimationNode, GltfChannelPathToCocos[channelPath], meta.getId());
                meta.createExoticTrackValues(output.getType(), offset, valuesLength, output.getNormalized());
                offset += valuesLength * input.getComponentSize();
                metaTrack.values.__id__ = meta.getId();

                const inputArray = new Float32Array(input.getArray());
                buffer.push(...inputArray);
                buffer.push(... new Float32Array(output.getArray()));

                newDuration = Math.max(newDuration, inputArray[inputArray.length - 1]);
            }
        }

        const duration = meta.duration;
        for (const event of meta.events) {
            event.frame = event.frame / duration * newDuration;
        }
        meta.duration = newDuration;

        meta.setAdditiveSettings();
        return new Float32Array(buffer);
    }
}