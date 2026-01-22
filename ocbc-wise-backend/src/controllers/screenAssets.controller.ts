import * as svc from "../services/screenAssets.service.js"

export async function getAllScreenAssets(req: any, res: any){
    try{
        const data = await svc.getAllScreenAssets()
        return res.json(data)
    }catch(err: any){
        return res.status(500).json({ error: err.message ?? "Server error" })
    }
}

export async function getAllNavBars(req: any, res: any){
    try{
        const data = await svc.getAllNavBar()
        return res.json(data)
    }catch(err: any){
        return res.status(500).json({ error: err.message ?? "Server error" })
    }
}

export async function createScreenAssets(req: any, res: any){
    try{
        const { name } = req.body;
        const file = req.file;

        if (!name) return res.status(400).json({ error: "name is required" });
        if (!file) return res.status(400).json({ error: "file is required" });

        const created = await svc.createScreenAsset({
            name,
            fileBuffer: file.buffer,
            originalName: file.originalname,
            mimeType: file.mimetype,
        });

        return res.status(201).json(created);
    } catch (err: any) {
        const msg = err?.message ?? "Server error"

        // width/type validation -> 400
        if (msg.includes("width must be")) {
            return res.status(400).json({ error: msg })
        }

        return res.status(500).json({ error: msg })
   }
}

export async function deleteScreenAsset(req: any, res: any) {
    try {
        const { screenAssetId } = req.params;

        const result = await svc.deleteScreenAssetSafe(screenAssetId);

        if (!result.ok) {
        return res.status(result.status).json(result.body);
        }

        return res.sendStatus(result.status); // 204
    } catch (err: any) {
        return res.status(500).json({ error: err.message ?? "Server error" });
    }
}

