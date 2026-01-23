export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

function hasStringProp(x: unknown, key: string): x is Record<string, unknown> & Record<string, string> {
  return typeof x === "object" && x !== null && key in x && typeof (x as Record<string, unknown>)[key] === "string"
}

export async function fetchjson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

  const contentType = res.headers.get("content-type") ?? ""
  const isJson = contentType.includes("application/json")

  const body: unknown = isJson
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "")

  if (!res.ok) {
    const message = hasStringProp(body, "error")
      ? body.error
      : `Request failed (${res.status})`

    throw new ApiError(message, res.status, body)
  }

  return body as T
}
