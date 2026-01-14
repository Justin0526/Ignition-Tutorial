import { getScreenAssets } from "@/lib/api/screenAssets"
import { ScreenAsset } from "@/types/screenAsset"
import AppScreensClient from "./AppScreenClient"

export default async function AppScreensPage() {
  const screens: ScreenAsset[] = await getScreenAssets()
  return <AppScreensClient screens={screens} />
}
