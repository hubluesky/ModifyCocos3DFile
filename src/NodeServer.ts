import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import archiver from "archiver";
import { CocosSkeleton, CocosSkeletonMeta } from "./CocosModel";
import CocosModelReader from "./CocosModelReader";
import CocosModelWriter from "./CocosModelWriter";
import { fbxToGltf2, gltfToCocosFile, loadGltf } from "./Common";
import Geometry from "./Geometry";
import { GLTF } from "./glTFLoader";

const PORT = process.env.PORT || 8077;
const fbx2gltfPath = "temp/fbx2gltf";
const outPath = "temp/out";
const uploadPath = "temp/uploads";

const fieldNames = {
    fbx: "fbx",
    gltf: "gltf",
    meshMeta: "meshMeta",
    skeletonMeta: "skeletonMeta",
};

// process.env.UV_THREADPOOL_SIZE = "20";

function checkFiles(fbx: Express.Multer.File, gltf: Express.Multer.File[], cocosMeta: Express.Multer.File, skeletonMeta: Express.Multer.File): string {
    if (cocosMeta == null) return "Please upload cocos meta file.";
    if (cocosMeta.mimetype != "application/json") return "The cocos meta file must be a json";
    if (skeletonMeta != null && skeletonMeta.mimetype != "application/json") return "The cocos skeleton meta file must be a json";
    if (fbx == null && gltf == null) return "Please upload fbx or gltf file";
    if (gltf != null) {
        const extname = path.extname(gltf[0].originalname).toLowerCase();
        if (extname == "glb") {
            if (gltf.length != 1) return "The glb file must only one file";
        } else if (extname == "gltf") {
            if (gltf.length >= 2) return "The gltf file must have .bin files";
            const extname2 = path.extname(gltf[1].originalname).toLowerCase();
            if (extname2 != "bin") return `The gltf must have .bin files instead of .${extname2}`;
        } else if (extname == "bin") {
            if (gltf.length >= 2) return "The gltf file must have .gltf file";
            const gltfFileIndex = gltf.findIndex(x => x.originalname.toLowerCase().endsWith("gltf"));
            if (gltfFileIndex == -1) return "The gltf must have .gltf file";
            const bin = gltf[0];
            gltf[0] = gltf[gltfFileIndex];
            gltf[gltfFileIndex] = bin;
        }
    }
}

function convertToCocosFile(fbx: Express.Multer.File, gltf: Express.Multer.File[], cocosMeta: Express.Multer.File, skeletonMeta: Express.Multer.File, callback?: (error: string, filenames: string[]) => void): void {
    let gltfUrl: string;
    if (fbx != null) {
        try {
            const gltfName = path.basename(fbx.originalname, path.extname(fbx.originalname));
            gltfUrl = `${fbx2gltfPath}/${gltfName}/${gltfName}.gltf`;
            fbxToGltf2(fbx.path, gltfUrl);
        } catch (error) {
            callback?.(error, undefined);
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
        try {
            const filenames = gltfToCocosFile(gltf, meshName, cocosMeta.path, skeletonMeta?.path, `${outPath}/${meshName}`);
            callback?.(undefined, filenames);
        } catch (error) {
            callback?.(error, undefined);
        }
    });
}

async function sendFiles(res: express.Response, filenames: readonly string[]) {
    const zipDir = path.dirname(filenames[0]);
    const meshName = path.basename(filenames[0], path.extname(filenames[0]));
    const zipFilename = path.join(zipDir, `${meshName}`);
    const output = fs.createWriteStream(zipFilename);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(output);
    for (const filename of filenames)
        archive.file(filename, { name: path.basename(filename) });
    await archive.finalize();

    res.download(path.resolve(zipFilename), function (error) {
        console.log("send file", zipFilename, error);
    });
}

function createExpressServer(): void {
    const app = express();
    app.use(express.static('status'));
    app.use(express.static('data'));
    const upload = multer({ dest: uploadPath });

    app.get('/form', function (req, res, next) {
        var form = fs.readFileSync('./upload_file.html', { encoding: 'utf8' });
        res.send(form);
        res.end();
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
        convertToCocosFile(fbx, gltf, cocosMeta, skeletonMeta, function (error, filenames) {
            if (error != null) {
                res.end(error);
                return;
            }
            sendFiles(res, filenames);
        });
    })

    app.listen(PORT, () => {
        console.log(`Server started ${PORT}...`);
    });
}

function main() {
    console.log("start server");
    createExpressServer();
}

main();