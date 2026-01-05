import "dotenv/config"

function mustGetEnv(key: string): string {
    const value = process.env[key]
    if (!value) throw new Error(`Missing environment variable: ${key}`)
        return value
}

export const env = {
    SUPABASE_URL: mustGetEnv("SUPABASE_URL"),
    SUPABASE_SERVICE_ROLE_KEY: mustGetEnv("SUPABASE_SERVICE_ROLE_KEY"),
}