import archiver from "archiver";
import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { facebookFbxToGltf, gltfToCocosFile } from "./Common";

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

function checkCocosFiles(cocosMeta: Express.Multer.File, skeletonMeta: Express.Multer.File): string {
    if (cocosMeta == null) return "Please upload cocos meta file.";
    if (cocosMeta.mimetype != "application/json") return "The cocos meta file must be a json";
    if (skeletonMeta != null && skeletonMeta.mimetype != "application/json") return "The cocos skeleton meta file must be a json";
}

function checkFbxFiles(fbx: Express.Multer.File): string {
    if (fbx == null) return "Please upload fbx file";
}

function checkGltfFiles(gltf: Express.Multer.File[]): string {
    if (gltf == null) return "Please upload gltf files";
    const extname = path.extname(gltf[0].originalname).toLowerCase();
    if (extname == ".glb") {
        if (gltf.length != 1) return "The glb file must only one file";
    } else if (extname == ".gltf") {
        if (gltf.length >= 2) return "The gltf file must have .bin files";
        const extname2 = path.extname(gltf[1].originalname).toLowerCase();
        if (extname2 != ".bin") return `The gltf must have .bin files instead of .${extname2}`;
    } else if (extname == ".bin") {
        if (gltf.length < 2) return "The gltf file must have .gltf file";
        const gltfFileIndex = gltf.findIndex(x => x.originalname.toLowerCase().endsWith(".gltf"));
        if (gltfFileIndex == -1) return "The gltf must have .gltf file";
        const bin = gltf[0];
        gltf[0] = gltf[gltfFileIndex];
        gltf[gltfFileIndex] = bin;
    }
}

function convertToCocosFile(gltfUrl: string, cocosMeta: Express.Multer.File, skeletonMeta: Express.Multer.File): Promise<string[]> {
    let index = cocosMeta.originalname.lastIndexOf("@");
    if (index == -1) index = cocosMeta.originalname.lastIndexOf(".");
    const meshName = cocosMeta.originalname.substring(0, index);
    return gltfToCocosFile(gltfUrl, cocosMeta.path, skeletonMeta?.path, `${outPath}/${meshName}`, meshName);
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

    app.get('/fbx2cocosForm', function (req, res, next) {
        var form = fs.readFileSync('./uploadFbxfile.html', { encoding: 'utf8' });
        res.send(form);
        res.end();
    });

    app.get('/gltf2cocosForm', function (req, res, next) {
        var form = fs.readFileSync('./uploadGltffile.html', { encoding: 'utf8' });
        res.send(form);
        res.end();
    });

    const fbxFields = upload.fields([{ name: fieldNames.fbx, maxCount: 1 }, { name: fieldNames.meshMeta, maxCount: 1 }, { name: fieldNames.skeletonMeta, maxCount: 1 }]);
    app.post('/fbx2cocos', fbxFields, function (req, res, next) {
        const fbx = req.files[fieldNames.fbx]?.[0];
        const cocosMeta = req.files[fieldNames.meshMeta]?.[0];
        const skeletonMeta = req.files[fieldNames.skeletonMeta]?.[0];

        const errorText = checkCocosFiles(cocosMeta, skeletonMeta) ?? checkFbxFiles(fbx);
        if (errorText != null) {
            res.end(errorText);
            return;
        }

        try {
            const gltfName = path.basename(fbx.originalname, path.extname(fbx.originalname));
            const gltfUrl = `${fbx2gltfPath}/${gltfName}/${gltfName}.gltf`;
            facebookFbxToGltf(fbx.path, gltfUrl);

            convertToCocosFile(gltfUrl, cocosMeta, skeletonMeta).then(filenames => {
                sendFiles(res, filenames);
            });
        } catch (error) {
            res.end(error);
            return;
        }

    });

    const gltfFields = upload.fields([{ name: fieldNames.gltf, maxCount: 2 }, { name: fieldNames.meshMeta, maxCount: 1 }, { name: fieldNames.skeletonMeta, maxCount: 1 }]);
    app.post('/gltf2cocos', gltfFields, function (req, res, next) {
        const gltf: Express.Multer.File[] = req.files[fieldNames.gltf];
        const cocosMeta: Express.Multer.File = req.files[fieldNames.meshMeta]?.[0];
        const skeletonMeta: Express.Multer.File = req.files[fieldNames.skeletonMeta]?.[0];
        const errorText = checkCocosFiles(cocosMeta, skeletonMeta) ?? checkGltfFiles(gltf);
        if (errorText != null) {
            res.end(errorText);
            return;
        }

        const filename = gltf[0].originalname;
        const gltfName = path.basename(filename, path.extname(filename));
        const gltfPath = `${fbx2gltfPath}/${gltfName}`;
        const gltfUrl = path.join(gltfPath, filename);

        fs.mkdirSync(gltfPath, { recursive: true });
        for (const gltfFile of gltf) 
            fs.renameSync(gltfFile.path, path.join(gltfPath, gltfFile.originalname));
        
        try {
            convertToCocosFile(gltfUrl, cocosMeta, skeletonMeta).then(filenames => {
                sendFiles(res, filenames);
            });
        } catch (error) {
            res.end(error);
            return;
        }
    });

    app.listen(PORT, () => {
        console.log(`Server started ${PORT}...`);
    });
}

function main() {
    console.log("start server");
    createExpressServer();
}

main();