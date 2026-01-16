import { supabase } from "../lib/supabase.js"
import { imageSize } from "image-size";
import crypto from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL

type CreateScreenAssetInput = {
    name: string;
    fileBuffer: Buffer;
    originalName: string;
    mimeType: string;
}
export async function getAllScreenAssets() {
    if (!SUPABASE_URL) {
        throw new Error("SUPABASE_URL is not configured")
    }

    const { data, error } = await supabase
        .from("screen_asset")
        .select(
        "screen_asset_id, name, type, bucket, object_path, content_width, content_height, created_at"
        )

    if (error) throw new Error(error.message)
    if (!data) return []

    return data.map((row) => ({
        ...row,
        public_url: `${SUPABASE_URL}/storage/v1/object/public/${row.bucket}/${row.object_path}`,
    }))
}


export async function createScreenAsset(input: CreateScreenAssetInput){
    // 1) Validate file type
    if (!["image/png", "image/jpeg"].includes(input.mimeType)) {
        throw new Error("Only PNG and JPG images are allowed");
    }


    // 2) Read image dimensions (width/height)
    const dim = imageSize(input.fileBuffer);
    const width = dim.width ?? 0;
    const height = dim.height ?? 0;
    if (!width || !height) throw new Error("Unable to read PNG dimensions");

    // 3) Determine screen type (long vs short)
    // Pick ONE viewport height as your standard (example: 844)
    const VIEWPORT_HEIGHT = 844;
    const type = height > VIEWPORT_HEIGHT ? "scrollable" : "static";

    // 4) Create a safe unique object path
    const bucket = "screen-assets";
    const safeBase = input.originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const hash = crypto.randomBytes(6).toString("hex");
    const object_path = `screens/${Date.now()}-${hash}-${safeBase}`;

    // 5) Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(object_path, input.fileBuffer, {
            contentType: input.mimeType,
            upsert: false,
        });
    
    if (uploadError) throw new Error(uploadError.message);

    // 6) Insert metadata row into screen_asset table
    const { data: inserted, error: dbError } = await supabase
        .from("screen_asset")
        .insert([
            {
                name: input.name,
                type,
                bucket,
                object_path,
                content_width: width,
                content_height: height,
            }
        ])
        .select("screen_asset_id, name, type, bucket, object_path, content_width, content_height, created_at")
        .single();

    if (dbError) throw new Error(dbError.message);

    return inserted;
}