import http from "http";
import fs from "fs";
import formidable from "formidable";
import express from "express";
import multer from "multer";
import path from "path";
import { fbxToGltf2, loadGltf, loadGltfFiles } from "./Common";
import { GLTF } from "./glTFLoader";
import { CocosSkeleton, CocosSkeletonMeta } from "./CocosModel";
import CocosModelReader from "./CocosModelReader";
import CocosModelWriter from "./CocosModelWriter";
import Geometry from "./Geometry";

const PORT = process.env.PORT || 8077;
const fbx2gltfPath = "temp/fbx2gltf";
const outPath = "temp/out";
const fieldNames = {
    fbx: "fbx",
    gltf: "gltf",
    meshMeta: "meshMeta",
    skeletonMeta: "skeletonMeta",
};

function createServer(): void {
    const upload_html = fs.readFileSync("upload_file.html");

    const server = http.createServer();

    server.listen(PORT, function () {
        console.log(`the port ${PORT} is open.`);
    });

    server.on("request", function (req, res) {
        if (req.url == '/upload') {
            console.log(req);
            const form = new formidable.IncomingForm();

            const files = [];
            const fields = [];
            form.on('field', function (field, value) {
                fields.push([field, value]);
            });
            form.on('file', function (field, file) {
                console.log(file.originalFilename);
                files.push([field, file]);
            });
            form.on('end', function () {
                console.log('done', files, fields);
                res.end();
            });
            form.parse(req);

            // form.parse(req, function (err, fields, files) {
            //     // oldpath : temporary folder to which file is saved to
            //     if (err) throw err;
            //     const oldpath = files.upload.filepath;
            //     console.log("oldpath", oldpath, files.upload.originalFilename);

            //     // var newpath = upload_path + files.filetoupload.name;
            //     // copy the file to a new location
            //     // fs.rename(oldpath, newpath, function (err) {
            //     // you may respond with another html page
            //     const data = fs.readFileSync(oldpath, { "encoding": "utf8" });
            //     res.write(data, "utf8");
            //     res.end();
            //     // });
            // });
        } else {
            res.writeHead(200);
            res.write(upload_html);
            return res.end();
        }
    });

    // server.on("request", function (req, res) {
    //     console.log('statusCode:', res.statusCode);
    //     // console.log('headers:', res.getHeaders());

    //     req.on("data", function (dataBuffer: any) {
    //         console.log("data", dataBuffer);
    //     });
    //     req.on("end", function () {
    //         console.log("translate end");
    //     });

    //     // const file = fs.createReadStream("./assets/cocos/Quad.json", { encoding: "utf8" });
    //     const data = fs.readFileSync("assets/cocos/Quad.json", { encoding: "utf8" });
    //     res.writeHead(200, { 'Content-Type': 'text/html' });
    //     // res.write("Hellow World!");
    //     res.write(data);
    //     // file.pipe(res);

    //     res.end();
    // });
}

function checkFiles(fbx: Express.Multer.File, gltf: Express.Multer.File[], cocosMeta: Express.Multer.File, skeletonMeta: Express.Multer.File): string {
    if (cocosMeta == null) return "please upload cocos meta";
    if (cocosMeta.mimetype != "application/json") return "cocos meta must be a json";
    if (skeletonMeta != null && skeletonMeta.mimetype != "application/json") return "cocos skeleton meta must be a json";
    if (fbx == null && gltf == null) return "please upload fbx or gltf file";
    if (gltf != null) {
        const extname = path.extname(gltf[0].originalname).toLowerCase();
        if (extname == "glb") {
            if (gltf.length != 1) return "glb file must only one file";
        } else if (extname == "gltf") {
            if (gltf.length >= 2) return "gltf file must have .bin files";
            const extname2 = path.extname(gltf[1].originalname).toLowerCase();
            if (extname2 != "bin") return `gltf must have .bin files that not ${extname2}`;
        } else if (extname == "bin") {
            if (gltf.length >= 2) return "gltf file must have .gltf file";
            const gltfFileIndex = gltf.findIndex(x => x.originalname.toLowerCase().endsWith("gltf"));
            if (gltfFileIndex == -1) return "gltf must have .gltf file";
            const bin = gltf[0];
            gltf[0] = gltf[gltfFileIndex];
            gltf[gltfFileIndex] = bin;
        }
    }
}

function convertToCocosFile(fbx: Express.Multer.File, gltf: Express.Multer.File[], cocosMeta: Express.Multer.File, skeletonMeta: Express.Multer.File): string {
    let gltfUrl: string;
    if (fbx != null) {
        try {
            const gltfName = path.basename(fbx.originalname, path.extname(fbx.originalname));
            gltfUrl = `${fbx2gltfPath}/${gltfName}/${gltfName}.gltf`;
            fbxToGltf2(fbx.path, gltfUrl);
        } catch (error) {
            return error;
        }
    } else if (gltf != null) {
        const filename = gltf[0].originalname;
        const gltfName = path.basename(filename, path.extname(filename));
        const gltfPath = `${fbx2gltfPath}/${gltfName}`;
        gltfUrl = path.join(gltfPath, filename);
        for (const gltfFile of gltf)
            fs.renameSync(gltfFile.path, path.join(gltfPath, gltfFile.originalname));
    }

    const meshName = path.basename(cocosMeta.originalname, path.extname(cocosMeta.originalname));
    loadGltf(gltfUrl).then(gltf => {
        gltfToCocosFile(gltf, meshName, cocosMeta.path, skeletonMeta?.path);
    });
}

function gltfToCocosFile(gltf: GLTF, meshName: string, meshMetaPath: string, skeletonPath: string): void {
    let skeleton: CocosSkeleton;
    let skeletonMeta: CocosSkeletonMeta;
    if (gltf.skins?.length == 1 && CocosModelReader.isFileExist(skeletonPath)) {
        skeletonMeta = CocosModelReader.readSkeletonMeta(skeletonPath);
        const skin = gltf.skins[0];
        skeleton = new CocosSkeleton(skin.joints, skin.inverseBindMatrix);
    }
    const geometry = Geometry.creatFromGLTF(gltf);
    const metaData = CocosModelReader.readMeshMeta(meshMetaPath);
    const write = new CocosModelWriter(`${outPath}/${meshName}/${meshName}`, metaData, geometry, skeletonMeta, skeleton);
    console.log("convert cocos file successed!");
}

function createExpressServer(): void {
    const app = express();
    app.use(express.static('status'));
    app.use(express.static('data'));
    const upload = multer({ dest: 'temp/uploads/' });

    app.get('/form', function (req, res, next) {
        var form = fs.readFileSync('./upload_file.html', { encoding: 'utf8' });
        res.send(form);
    });

    const fields = upload.fields([{ name: fieldNames.fbx, maxCount: 1 }, { name: fieldNames.gltf, maxCount: 2 }, { name: fieldNames.meshMeta, maxCount: 1 }, { name: fieldNames.skeletonMeta, maxCount: 1 }]);
    app.post('/upload', fields, function (req, res, next) {
        const fbx = req.files[fieldNames.fbx]?.[0];
        const gltf = req.files[fieldNames.gltf];
        const cocosMeta = req.files[fieldNames.meshMeta]?.[0];
        const skeletonMeta = req.files[fieldNames.skeletonMeta]?.[0];
        const errorText = checkFiles(fbx, gltf, cocosMeta, skeletonMeta);
        if (errorText != null) {
            res.end(errorText);
            return;
        }
        console.log(req.files)
        const error2 = convertToCocosFile(fbx, gltf, cocosMeta, skeletonMeta);
        if (error2 != null) {
            res.end(error2);
            return;
        }
    })

    app.listen(PORT, () => {
        console.log(`Server started ${PORT}...`);
    });
}

function main() {
    console.log("start server");
    createExpressServer();
    // createServer();
}

main();