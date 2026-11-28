import { NextResponse } from "next/server"
import { backendFetch, backendJson } from "@/lib/api/backend"

function extractErrorMessage(data: any, fallback: string): string {
  if (!data) return fallback
  if (typeof data === "string") return data
  if (typeof data.detail === "string") return data.detail
  if (Array.isArray(data.detail) && data.detail.length > 0) {
    return data.detail.map((e: any) => e.msg || e.message || JSON.stringify(e)).join(", ")
  }
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.map((e: any) => e.msg || e.message || JSON.stringify(e)).join(", ")
  }
  if (typeof data.message === "string") return data.message
  return fallback
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const track = searchParams.get("track")
    const date = searchParams.get("date")

    let path = "/api/v1/workshops/?include_inactive=false"
    if (track) path += `&track=${encodeURIComponent(track)}`
    if (date) path += `&date=${encodeURIComponent(date)}`

    const response = await backendFetch(path)
    if (!response.ok) {
      const err = await response.json().catch(() => null)
      return NextResponse.json(
        { detail: extractErrorMessage(err, "Failed to load workshops") },
        { status: response.status }
      )
    }
    const data = await backendJson(response)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : "Error fetching workshops" },
      { status: 500 }
    )
  }
}
