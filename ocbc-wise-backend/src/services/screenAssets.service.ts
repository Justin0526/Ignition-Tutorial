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
    const dim = imageSize(input.fileBuffer)
    const width = dim.width ?? 0
    const height = dim.height ?? 0
    if (!width || !height) throw new Error("Unable to read image dimensions")

    // ✅ Enforce: design width 430px exported at 2× => file width must be 860px
    const LOGICAL_WIDTH = 430
    const EXPORT_SCALE = 2
    const EXPECTED_UPLOAD_WIDTH = LOGICAL_WIDTH * EXPORT_SCALE // 860

    if (width !== EXPECTED_UPLOAD_WIDTH) {
    throw new Error(
        `Screen asset must be exported at 2x from a ${LOGICAL_WIDTH}px-wide Figma frame (expected ${EXPECTED_UPLOAD_WIDTH}px width). Got ${width}px.`
    )
    }

    // ✅ Store logical dimensions in DB
    const storedWidth = LOGICAL_WIDTH
    const storedHeight = Math.round(height / EXPORT_SCALE)

    // 3) Create a safe unique object path
    const bucket = "screen-assets";
    const safeBase = input.originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const hash = crypto.randomBytes(6).toString("hex");
    const object_path = `screens/${Date.now()}-${hash}-${safeBase}`;

    // 4) Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(object_path, input.fileBuffer, {
            contentType: input.mimeType,
            upsert: false,
        });
    
    if (uploadError) throw new Error(uploadError.message);

    // 5) Insert metadata row into screen_asset table
    const { data: inserted, error: dbError } = await supabase
        .from("screen_asset")
        .insert([
            {
                name: input.name,
                bucket,
                object_path,
                content_width: storedWidth,
                content_height: storedHeight,
            }
        ])
        .select("screen_asset_id, name, bucket, object_path, content_width, content_height, created_at")
        .single();

    if (dbError) throw new Error(dbError.message);

    return inserted;
}