import { NextResponse } from "next/server"
import { backendFetch, backendJson } from "@/lib/api/backend"
import { getAuthCookies } from "@/lib/api/auth-cookies"

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

export async function GET(request: Request) {
  const { accessToken } = getAuthCookies(request)
  if (!accessToken) {
    return NextResponse.json({ detail: "Authentication required" }, { status: 401 })
  }

  try {
    const response = await backendFetch("/api/v1/workshops/registrations/my", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      const err = await response.json().catch(() => null)
      return NextResponse.json(
        { detail: extractErrorMessage(err, "Failed to fetch registrations") },
        { status: response.status }
      )
    }

    const data = await backendJson(response)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const { accessToken } = getAuthCookies(request)
  if (!accessToken) {
    return NextResponse.json({ detail: "Authentication required" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const response = await backendFetch("/api/v1/workshops/registrations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      return NextResponse.json(
        { detail: extractErrorMessage(data, "Registration failed") },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
