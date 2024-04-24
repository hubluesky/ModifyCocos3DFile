# Cocos模型替换

## Cocos模型简介：

Cocos支持两种3D模型导入格式，一种是FBX，一种是GLTF，不管是那一种格式，在导入Cocos编辑器后，会由编辑器把3D模型转换为Cocos的模型格式.mesh，Cocos的模型格式是由.mesh和.meta两部分组成，meta文件描述了模型的存储信息，比喻顶点坐标、纹理坐标、索引信息的存储格式等等，而mesh则是以二进制的方式存储这些信息。

## 模型替换原理：

将3D文件FBX或者是GLTF文件内容读取出来，然后按Cocos的meta描述信息，写成一个mesh二进制文件，然后再把meta文件和mesh文件替换发布后的模型对应文件即可。

## 模型替换要求：

目前支持替换模型中的网格与骨骼蒙皮数据，如果替换的两个模型有轻微的骨骼不同，比喻多了一个绑点，是可以的，但骨骼结构要保证相同。
### 模型文件限制条件：
1. 只能有一个Mesh
2. 只能有一个Skin
3. 可以有多个材质，但材质数量必须相同
4. 纹理坐标的数量必须>=原来模型的纹理坐标数量
5. 如果旧模型有使用骨骼，关节，权重等数据，那新的模型也必须有这些相同数据
6. 必须包含的属性有：顶点，纹理坐标


## 实现步骤：

1. 导出Cocos模型的.mesh和.meta文件，需要在Cocos打包工具中支持把Cocos的.mesh和对应的.meta文件导出来。
2. 读取3D文件，FBX文件的格式是由Autodesk公司为3DMax开发的一种3D文件格式，格式内容更多是偏向3D软件的，而且是一种封闭格式，而GLTF格式是为一种开放的格式，有更为容易理解的格式布局与存储方式。为而我们先将FBX转成GLTF格式，然后再从GLTF格式中读取数据。
3. 了解Cocos的mesh代码格式，需要从Cocos的引擎源码中查看Mesh的读取方式，反现推导出写入的方式。
4. 根据打包出来的.meta文件信息，开始从GLTF读取出来的数据中，查找meta所需要的信息，比喻meta中描述了这个模型有顶点、法线，纹理坐标，切线等信息，那就从GLTF中找到对应的数据，如果GLTF文件中没有对应的数据，比喻法线，切线等，需要自己计算出来。
5. 从meta文件中了解到这个模型的所需要的数据，并且从GLTF读的出数据中获取相应的数据后，再按mesh的所要求的格式，写成一个要替换的mesh格式。

## 3D格式支持：

1. 目前支持FBX与GLTF两种格式，FBX是Autodesk公司出的3D软件格式，只是免费公开了C++版本的SDK，是一个商业格式。GLTF是新一代3D数据格式，数据紧凑，没有冗余数据，数据格式更符合web引擎，最主要的是gltf格式是开源的，有很多gltf格式的解析程序可以使用。
2. 由于FBX格式并非是开源，而且数据结构没有GLTF格式更贴近OpenGL引擎的数据格式，所以本工具是先将FBX转成GLTF，然后再解析GLTF数据到Cocos的3D文件数据格式。
3. 由于FBX格式并非是开源，也没有使用FBX的C++版本SDK，所以解析FBX文件可能会有一些问题，所以建议优化使用GLTF文件格式
4. FBX文件建议版本是2019及以上（PS.也不建议太高）版本，GLTF使用2.0版本。

## 开始
### 安装依赖文件
在项目目录下，执行`npm install`命令安装项目依赖

### ts命令行执行
项目是使用typescript开发，可以使用ts-node直接运行.ts文件。
``` command-line
ts-node src/Main.ts
```
### js命令行执行
需要先运行任务：```npm run build```来构建js文件，文件会生成在```dist/index.js```下。运行以下命令可执行。
``` command-line
node dist/index.js
```

显示结果为：
```
Usage: index [options] [command]

Options:
  -v, --version                       Cocos 3d file converter
  -h, --help                          display help for command

Commands:
  fbx2gltf|f2g [options]              Conver fbx to gltf file.
  ConvertFbxMesh|cfm [options]        read the fbx and replace to the cocos 3d mesh file.
  ConvertGltfMesh|cgm [options]       read the gltf and replace to the cocos 3d mesh file.
  ConvertFbxAnimation|cfa [options]   read the fbx and replace to the cocos 3d animation file.
  ConvertGltfAnimation|cga [options]  read the gltf and replace to the cocos 3d animation file.
  help [command]                      display help for command
```
* `fbx2gltf|f2g`命令是把fbx文件转化为gltf文件
```
Usage: index fbx2gltf|f2g [options]

Conver fbx to gltf file.

Options:
  -f, --fbx <path>     Input Fbx file path.
  -o, --output <path>  Output gltf path. It must be local path.
  -h, --help           display help for command
```
* `ConvertFbxMesh|cfm`命令是把fbx文件的网格转化为cocos3D文件的命令
```
Usage: index ConvertFbxMesh|cfm [options]

read the fbx and replace to the cocos 3d mesh file.

Options:
  -f, --fbx <path>     Input gltf file path.
  -t, --temp <path>    fbx to gltf temp path, default temp.
  -c, --cocos <path>   Input cocos 3d file
  -o, --output <path>  Output Cocos 3d file path.
  -h, --help           display help for command
```
* `ConvertGltfMesh|cgm`命令是把gltf文件的网格转化为cocos3D文件的命令
```
Usage: index ConvertGltfMesh|cgm [options]

read the gltf and replace to the cocos 3d mesh file.

Options:
  -g, --gltf <path>    Input gltf file path.
  -c, --cocos <path>   Input cocos 3d file
  -o, --output <path>  Output Cocos 3d file path.
  -h, --help           display help for command
```
* `ConvertFbxAnimation|cfa`命令是把fbx文件的动画转化为cocos3D文件的命令
```
Usage: index ConvertFbxAnimation|cfa [options]

read the fbx and replace to the cocos 3d animation file.

Options:
  -f, --fbx <path>     Input gltf file path.
  -t, --temp <path>    fbx to gltf temp path, default temp.
  -c, --cocos <path>   Input cocos 3d file
  -o, --output <path>  Output Cocos 3d file path.
  -h, --help           display help for command
```
* `ConvertGltfAnimation|cfa`命令是把gltf的动画文件转化为cocos3D文件的命令
```
Usage: index ConvertGltfAnimation|cga [options]

read the gltf and replace to the cocos 3d animation file.

Options:
  -g, --gltf <path>    Input gltf file path.
  -c, --cocos <path>   Input cocos 3d file
  -o, --output <path>  Output Cocos 3d file path.
  -h, --help           display help for command
```
### 测试
项目中有几个测试文件，用来测试转换的。
测试命令如下：
```
node dist/index.js cfm -f ./assets/fbx/model_cow.FBX -c ./assets/cocos/model_cow -o ./temp/out

// 转换成功后，输出以下信息。
Conversion completed, output directory: temp\out\model_cow
```
### 异常信息(英文)：
* 错误码：111，消息：Mesh count is not match. source 1, upload ${meshes.length}.
* 错误码：112，消息：The ${i} of primitives does no index buffer
* 错误码：113，消息：The number of primitives does no match: source ${0} upload ${1}.
* 错误码：114，消息：Attribute ${attributeName} is not supported.
* 错误码：101，消息：FBX convert failed: ${cause}
* 错误码：102，消息：Gltf convert failed: ${cause}
* 错误码：103，消息：Can not find cocos prefab meta file. Maybe be merge by one josn.
* 错误码：104，消息：Can not find cocos mesh meta file. Maybe be merge by one josn.
* 错误码：105，消息：The uploaded file does not contain skeleton information.
* 错误码：106，消息：Can not find cocos skeleton meta file. Maybe be merge by one josn.
* 错误码：107，消息：Skin count is not match. source 1, upload ${skins.length}.
* 错误码：108，消息：Skeleton joint name ${name} is not match.
* 错误码：109，消息：Skeleton joints count is not match. source ${skeletonMeta.joints.length} upload ${jointNodes.length}.
* 错误码：121，消息：Animation file format is error. ${err}.
* 错误码：122，消息：Animation count is not match. source 1, upload ${animations.length}.

### 异常信息(中文)：
* 错误码：111，消息：网格数量不匹配. 源文件是 1, 上传文件是 ${meshes.length}.
* 错误码：112，消息：第 ${i} 子网格没有使用索引缓冲
* 错误码：113，消息：子网格数量不匹配: 源文件是 ${0} 上传文件是 ${1}.
* 错误码：114，消息：上传文件的顶点属性没有支持 ${attributeName}.
* 错误码：101，消息：FBX 转换失败，原因: ${cause}
* 错误码：102，消息：Gltf 转换失败，原因: ${cause}
* 错误码：103，消息：找不到Cocos预制的meta文件. 可能被技术人员合并了，请找相关项目开发人员.
* 错误码：104，消息：找不到Cocos网格的meta文件. 可能被技术人员合并了，请找相关项目开发人员.
* 错误码：105，消息：上传文件没有包含骨骼结构。
* 错误码：106，消息：找不到Cocos骨架的meta文件. 可能被技术人员合并了，请找相关项目开发人员.
* 错误码：107，消息：蒙皮数量不匹配. 源文件是 1, 上传文件是 ${skins.length}.
* 错误码：108，消息：骨骼名称不匹配 ${name}.
* 错误码：109，消息：骨骼数量不匹配. 源文件是 ${skeletonMeta.joints.length} 上传文件是 ${jointNodes.length}.
* 错误码：121，消息：动画文件格式错误，可能使用了错误的Cocos动画文件. ${err}.
* 错误码：122，消息：动画数量不匹配. 源文件是 1, 上传文件是 ${animations.length}.