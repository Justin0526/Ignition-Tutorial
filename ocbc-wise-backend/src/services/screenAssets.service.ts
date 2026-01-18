import { supabase } from "../lib/supabase.js";
import { imageSize } from "image-size";
import crypto from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;

type CreateScreenAssetInput = {
    name: string;
    fileBuffer: Buffer;
    originalName: string;
    mimeType: string;
};

type ScreenAssetRow = {
    screen_asset_id: string;
    name: string;
    bucket: string;
    object_path: string;
    content_width: number;
    content_height: number;
    pixel_ratio: number;
    original_width: number;
    original_height: number;
    created_at: string;
};

type NavBarAssetRow = {
    nav_bar_asset_id: string;
    name: string;
    nav_key: string;
    bucket: string;
    object_path: string;
    content_width: number;
    content_height: number;
    pixel_ratio: number;
    created_at: string;
}

const LOGICAL_WIDTH = 430;

function buildPublicUrl(bucket: string, object_path: string) {
    if (!SUPABASE_URL) {
        throw new Error("SUPABASE_URL is not configured");
    }
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${object_path}`;
}

export async function getAllScreenAssets() {
    const { data, error } = await supabase
        .from("screen_asset")
        .select(
        "screen_asset_id,name,bucket,object_path,content_width,content_height,pixel_ratio,original_width,original_height,created_at"
        )
        .returns<ScreenAssetRow[]>(); // ✅ key line

    if (error) throw new Error(error.message);

    const rows = data ?? []; // ✅ data can be null
    return rows.map((row) => ({
        ...row,
        public_url: buildPublicUrl(row.bucket, row.object_path),
    }));
}

export async function getAllNavBar(){
    const { data, error } = await supabase
        .from("nav_bar_asset")
        .select("nav_bar_asset_id,name,nav_key,bucket,object_path,content_width,content_height,pixel_ratio,created_at")
        .returns<NavBarAssetRow[]>();

    if (error) throw new Error(error.message);

    const rows = data ?? [];
    return rows.map((row) => ({
        ...row,
        public_url: buildPublicUrl(row.bucket, row.object_path),
    }));
}

export async function createScreenAsset(input: CreateScreenAssetInput) {
    // 1) Validate file type
    if (!["image/png", "image/jpeg"].includes(input.mimeType)) {
        throw new Error("Only PNG and JPG images are allowed")
    }

    // 2) Read image dimensions (width/height)
    const dim = imageSize(input.fileBuffer)
    const width = dim.width ?? 0
    const height = dim.height ?? 0
    if (!width || !height) throw new Error("Unable to read image dimensions")

    // 3) Enforce upload width: 430 (1x) OR 860 (2x)
    let pixel_ratio: 1 | 2
    if (width === LOGICAL_WIDTH) pixel_ratio = 1
    else if (width === LOGICAL_WIDTH * 2) pixel_ratio = 2
    else {
        throw new Error(
        `Screen asset width must be ${LOGICAL_WIDTH}px (1x) or ${LOGICAL_WIDTH * 2}px (2x). Got ${width}px.`
        )
    }

    // 4) Normalize to logical dimensions
    const content_width = LOGICAL_WIDTH
    const content_height = Math.round(height / pixel_ratio)

    // 5) Create a safe unique object path (keep your crypto if you want)
    const bucket = "screen-assets"
    const safeBase = input.originalName.replace(/[^a-zA-Z0-9._-]/g, "_")
    const hash = crypto.randomBytes(6).toString("hex")
    const object_path = `screens/${Date.now()}-${hash}-${safeBase}`

    // 6) Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(object_path, input.fileBuffer, {
        contentType: input.mimeType,
        upsert: false,
        })

    if (uploadError) throw new Error(uploadError.message)

    // 7) Insert metadata row into screen_asset table
    const { data: inserted, error: dbError } = await supabase
        .from("screen_asset")
        .insert([
        {
            name: input.name,
            bucket,
            object_path,
            content_width,
            content_height,
            pixel_ratio,
            original_width: width,
            original_height: height,
        },
        ])
        .select(
        [
            "screen_asset_id",
            "name",
            "bucket",
            "object_path",
            "content_width",
            "content_height",
            "pixel_ratio",
            "original_width",
            "original_height",
            "created_at",
        ].join(",")
        )
        .single()
        .returns<ScreenAssetRow>() // ✅ force correct type

    if (dbError) throw new Error(dbError.message)
    if (!inserted) throw new Error("Insert succeeded but no row returned") // ✅ null guard

    // keep behavior: public_url is computed, not stored
    return {
        ...inserted,
        public_url: buildPublicUrl(inserted.bucket, inserted.object_path),
    }
}
