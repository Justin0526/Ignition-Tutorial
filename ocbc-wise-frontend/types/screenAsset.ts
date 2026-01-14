export type ScreenAsset = {
    screen_asset_id: string
    name: string
    type: "static" | "scrollable"
    bucket: string
    object_path: string
    content_width: number
    content_height: number
    created_at: string
}
