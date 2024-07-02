import { Animation, AnimationChannel, AnimationSampler, Document, GLTF, Mesh, Node, Primitive, Root, Scene, Skin, TypedArray, getBounds } from '@gltf-transform/core';
import fs from 'fs';
import path from 'path';
import { CocosAnimatHash, CocosAnimationMeta, ExoticAnimationHash, ExoticNodeAnimationHash, ExoticTrackHash, TrackValuesHash } from './CocosAnimationMeta';
import { CocosToGltfAttribute, GltfChannelPathToCocos } from './CocosGltfWrap';
import { CocosMeshMeta } from "./CocosMeshMeta";
import { CocosMeshPrefabMeta } from './CocosMeshPrefabMeta';
import { CocosSkeletonMeta } from "./CocosSkeletonMeta";
import { ConvertError } from './ConvertError';
import { _d2r, quat, vec3 } from './Math';
import { FormatInfos, getComponentByteLength, getIndexStrideCtor, getOffset, getWriter } from './cocos/Cocos';
import { CCON, encodeCCONBinary } from './cocos/ccon';
import { gltf } from './gltf';

export default class CocosModelWriter {

    public writeMeshFiles(outPath: string, prefabMeta: CocosMeshPrefabMeta, meshMeta: CocosMeshMeta, document: Document): void {
        const root = document.getRoot();
        const meshes = root.listMeshes();
        if (meshes.length > 1)
            throw new ConvertError(111, `Mesh count is not match. source 1, upload ${meshes.length}.`, meshes.length);

        const arrayBuffer = this.writeMesh(meshMeta, meshes[0]);
        // this.writeJointMaps(meshMeta, root);
        this.writeBounds(meshMeta, root);
        this.writeMeshPrefab(prefabMeta, root);

        fs.mkdirSync(outPath, { recursive: true });
        const binPath = path.join(outPath, path.basename(meshMeta.filename, path.extname(meshMeta.filename)) + '.bin');
        fs.writeFileSync(binPath, Buffer.from(arrayBuffer), "binary");
        fs.writeFileSync(path.join(outPath, meshMeta.filename), JSON.stringify(meshMeta.data), "utf-8");
        fs.writeFileSync(path.join(outPath, prefabMeta.filename), JSON.stringify(prefabMeta.data), "utf-8");
    }

    public writeSkeletonFiles(outPath: string, skeletonMeta: CocosSkeletonMeta, skin: Skin): void {
        console.assert(skeletonMeta != null);
        console.assert(skin != null);
        fs.mkdirSync(outPath, { recursive: true });
        const skeletonMetaData = this.writeSkeleton(skeletonMeta, skin);

        fs.writeFileSync(path.join(outPath, skeletonMeta.filename), JSON.stringify(skeletonMetaData), "utf-8");
    }

    public writeAnimationFiles(outPath: string, animationMeta: CocosAnimationMeta, document: Document, animation: Animation): void {
        console.assert(animationMeta != null);
        console.assert(animation != null);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });

        const arrayBuffer = this.writeAnimation(animationMeta, document, animation);
        const ccon = new CCON(animationMeta.list, [new Uint8Array(arrayBuffer.buffer)]);
        fs.writeFileSync(outPath, Buffer.from(encodeCCONBinary(ccon)), "binary");

        // fs.writeFileSync(outPath + ".ccon", JSON.stringify(ccon.document), "utf-8");
    }

    public rotateAnimationRoot(animation: Animation, angle: number): void {
        const channels = animation.listChannels();
        for (let i = 0; i < channels.length; i++) {
            const channel = channels[i];
            const node = channel.getTargetNode();
            const parentNode = node.getParentNode();
            if (parentNode != null) continue; // find root node.
            switch (channel.getTargetPath()) {
                case "translation": {
                    const sample = channel.getSampler();
                    const outputAccessor = sample.getOutput();
                    const outputArray = outputAccessor.getArray();
                    for (let i = 0; i < outputArray.length; i += 3) {
                        vec3.rotateY(outputArray, i, [0, 0, 0], angle);
                    }
                    break;
                }
                case "rotation": {
                    const sample = channel.getSampler();
                    const outputAccessor = sample.getOutput();
                    const outputArray = outputAccessor.getArray();
                    const angleRotation = quat.fromAngleY([], 0, angle);
                    for (let i = 0; i < outputArray.length; i += 4) {
                        quat.multiply(outputArray, i, angleRotation, 0, outputArray, i);
                        // const euler = quat.toEuler(new Float32Array([outputArray[i], outputArray[i + 1], outputArray[i + 2], outputArray[i + 3]]));
                        // euler[1] += angle;
                        // quat.fromEuler(outputArray, i, euler[0], euler[1], euler[2]);
                    }
                    break;
                }
            }
        }
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

    private writeMeshPrefab(prefabMeta: CocosMeshPrefabMeta, root: Root): void {
        const nodes = root.listNodes();
        for (const prefabNode of prefabMeta.prefabNodes) {
            if (prefabNode.name == null) continue;
            const node = nodes.find(x => x.getName() == prefabNode.name);
            if (node == null) continue;
            prefabNode.lpos = node.getTranslation();
            prefabNode.lrot = node.getRotation();
            prefabNode.euler = node.getRotation();
            prefabNode.lscale = node.getScale();
        }
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

        meshMeta.hash = CocosMeshMeta.computeHash(new Uint8Array(arrayBuffer));
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

    public static getChildByPath(parent: Node | Scene, path: string): Node | null {
        const segments = path.split('/');
        let lastNode: Node | Scene = parent;
        for (let i = 0; i < segments.length; ++i) {
            const segment = segments[i];
            if (segment.length === 0)
                continue;

            const next = lastNode.listChildren().find((childNode) => childNode.getName() === segment);
            if (!next)
                return null;
            lastNode = next;
        }
        return lastNode as Node;
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

        meta.hash = CocosSkeletonMeta.computeHash(meta.bindposes);
        return meta.data;
    }

    private writeAnimation(meta: CocosAnimationMeta, document: Document, animation: Animation): Float32Array {
        const scene = document.getRoot().listScenes()[0];
        const channels = animation.listChannels();
        const samples = animation.listSamplers();
        console.assert(channels.length == samples.length, `channels length cannot equals samples length ${channels.length, samples.length}`);
        const keyframes: {
            node: Node,
            samples: AnimationSampler[],
            channels: AnimationChannel[]
        }[] = [];

        const pathes = meta.getOriginExoticNodePath();
        const createAnimationFrame = function (animationNode: Node, targetPath: GLTF.AnimationChannelTargetPath, data: TypedArray): [AnimationSampler, AnimationChannel] {
            const inputArray = new Float32Array(1);
            inputArray[0] = 0;
            const input = document.createAccessor();
            input.setArray(inputArray);
            const output = document.createAccessor();
            output.setArray(data);
            const sampler = document.createAnimationSampler();
            sampler.setInput(input);
            sampler.setOutput(output);

            const channel = document.createAnimationChannel();
            channel.setTargetNode(animationNode);
            channel.setSampler(sampler);
            channel.setTargetPath(targetPath);
            return [sampler, channel];
        }

        // const propertyFuncWrap = ["getTranslation", "getRotation", "getScale", "getWeights"];
        // 暂不支持带weights的动画哦，就是不支持变化动画
        const properties = ["translation", "rotation", "scale"/*, "weights"*/] as GLTF.AnimationChannelTargetPath[];
        for (const path of pathes) {
            const node = CocosModelWriter.getChildByPath(scene, path);
            const keyframeValues = { node, samples: [], channels: [] };
            keyframes.push(keyframeValues);
            for (let i = 0; i < properties.length; i++) {
                const property = properties[i];
                const channel = channels.find(c => c.getTargetNode() == node && c.getTargetPath() == property);
                if (channel == null) {
                    // @ts-ignore
                    const result = createAnimationFrame(node, property, new Float32Array(node.get(property)));
                    keyframeValues.samples.push(result[0]);
                    keyframeValues.channels.push(result[1]);
                } else {
                    keyframeValues.samples.push(channel.getSampler());
                    keyframeValues.channels.push(channel);
                }
            }
        }

        const exoticAnimationHash = new ExoticAnimationHash();
        let offset = 0;
        const buffer = new Array<number>();
        let newDuration: number = 0;
        for (const keyframe of keyframes) {
            const pathname = CocosModelWriter.getJointPathName(keyframe.node);
            const metaAnimationNode = meta.createAnimationNode(pathname);

            const exoticNodeAnimationHash = new ExoticNodeAnimationHash(pathname);
            exoticAnimationHash.addNodeAnimation(exoticNodeAnimationHash);

            for (let i = 0; i < keyframe.samples.length; i++) {
                const sample = keyframe.samples[i];
                const channel = keyframe.channels[i];
                const channelPath = channel.getTargetPath();
                const input = sample.getInput();
                const output = sample.getOutput();

                const timesLength = input.getElementSize() * input.getCount();
                const valuesLength = output.getElementSize() * output.getCount();

                const metaTrack = meta.createExoticTrack(offset, timesLength);
                offset += timesLength * input.getComponentSize();
                const cocosChannelPath = GltfChannelPathToCocos[channelPath];
                meta.setAnimationNodePropertyId(metaAnimationNode, cocosChannelPath, meta.getId());
                meta.createExoticTrackValues(output.getType(), offset, valuesLength, output.getNormalized());
                offset += valuesLength * input.getComponentSize();
                metaTrack.values.__id__ = meta.getId();

                const inputArray = new Float32Array(input.getArray());
                const outArray = new Float32Array(output.getArray());
                buffer.push(...inputArray);
                buffer.push(...outArray);

                exoticNodeAnimationHash[cocosChannelPath] = new ExoticTrackHash(inputArray, new TrackValuesHash(outArray, false, 0, 0));

                newDuration = Math.max(newDuration, inputArray[inputArray.length - 1]);
            }
        }

        const duration = meta.duration;
        for (const event of meta.events) {
            event.frame = event.frame / duration * newDuration;
        }
        meta.duration = newDuration;
        meta.hash = new CocosAnimatHash(exoticAnimationHash).computeHash();
        meta.setAdditiveSettings();
        return new Float32Array(buffer);
    }
}