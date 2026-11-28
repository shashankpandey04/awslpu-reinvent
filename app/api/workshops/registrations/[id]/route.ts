import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/api/backend"
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

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function DELETE(request: Request, { params }: RouteProps) {
  const { accessToken } = getAuthCookies(request)
  if (!accessToken) {
    return NextResponse.json({ detail: "Authentication required" }, { status: 401 })
  }

  try {
    const { id } = await params
    const response = await backendFetch(`/api/v1/workshops/registrations/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      return NextResponse.json(
        { detail: extractErrorMessage(data, "Failed to cancel registration") },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
