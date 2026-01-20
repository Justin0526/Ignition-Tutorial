import { supabase } from "../lib/supabase.js";
const SUPABASE_URL = process.env.SUPABASE_URL

function buildPublicUrl(bucket: string, object_path: string) {
  if (!SUPABASE_URL) {
    throw new Error("SUPABASE_URL is not configured")
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${object_path}`
}


type TutorialStepInput = {
    tutorial_version_id: string;
    step_index: number;

    screen_asset_id: string;
    nav_key: string;
    instruction: string;
    tip: string | null;

    scroll_progress: number;

    target_x: number | null;
    target_y: number | null;
    target_w: number | null;
    target_h: number | null;
    is_nav_target: boolean | null;
};

export async function upsertTutorialStep(input: TutorialStepInput) {
    const row = {
        tutorial_version_id: input.tutorial_version_id,
        step_index: input.step_index,

        screen_asset_id: input.screen_asset_id,
        nav_key: input.nav_key,
        instruction: input.instruction,
        tip: input.tip,

        scroll_progress: input.scroll_progress,

        target_x: input.target_x,
        target_y: input.target_y,
        target_w: input.target_w,
        target_h: input.target_h,
        is_nav_target: input.is_nav_target,
    };

    const { data, error } = await supabase
        .from("tutorial_step")
        .upsert(row, { onConflict: "tutorial_version_id,step_index" })
        .select(
        [
            "tutorial_step_id",
            "tutorial_version_id",
            "step_index",
            "screen_asset_id",
            "nav_key",
            "instruction",
            "tip",
            "scroll_progress",
            "target_x",
            "target_y",
            "target_w",
            "target_h",
            "is_nav_target",
            "created_at",
        ].join(",")
        )
        .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Upsert succeeded but no row returned");

    return data;
}

export async function getTutorialStepsByVersion(tutorial_version_id: string) {
  const { data, error } = await supabase
    .from("tutorial_step")
    .select(
      `
      tutorial_step_id,
      tutorial_version_id,
      step_index,
      screen_asset_id,
      scroll_progress,
      target_x,
      target_y,
      target_w,
      target_h,
      nav_key,
      instruction,
      tip,
      is_nav_target,
      created_at,
      screen_asset:screen_asset_id (
        screen_asset_id,
        name,
        bucket,
        object_path
      )
      `
    )
    .eq("tutorial_version_id", tutorial_version_id)
    .order("step_index", { ascending: true })

  if (error) throw new Error(error.message)

  const steps = (data ?? []) as any[]

  // Collect unique nav_keys
  const navKeys = Array.from(
    new Set(
      steps
        .map((s) => s.nav_key)
        .filter((k): k is string => typeof k === "string" && k.length > 0)
    )
  )

  // Fetch nav bar assets
  const navMap = new Map<string, any>()

  if (navKeys.length > 0) {
    const { data: navData, error: navError } = await supabase
      .from("nav_bar_asset")
      .select(
        `
        nav_bar_asset_id,
        name,
        nav_key,
        bucket,
        object_path,
        content_width,
        content_height,
        pixel_ratio,
        created_at
        `
      )
      .in("nav_key", navKeys)

    if (navError) throw new Error(navError.message)

    for (const nav of navData ?? []) {
      navMap.set(nav.nav_key, nav)
    }
  }

  // Merge derived URLs
  const rows = steps.map((r) => {
    const sa = r.screen_asset
    const nav = r.nav_key ? navMap.get(r.nav_key) : null

    return {
      ...r,

      screen_name: sa?.name ?? null,
      screen_public_url:
        sa?.bucket && sa?.object_path
          ? buildPublicUrl(sa.bucket, sa.object_path)
          : null,

      nav_name: nav?.name ?? null,
      nav_public_url:
        nav?.bucket && nav?.object_path
          ? buildPublicUrl(nav.bucket, nav.object_path)
          : null,

      nav_content_width: nav?.content_width ?? null,
      nav_content_height: nav?.content_height ?? null,
      nav_pixel_ratio: nav?.pixel_ratio ?? null,
    }
  })

  return rows
}
