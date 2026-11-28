"use client"

import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowUpRight,
  ArrowRight,
  CalendarDays,
  Ticket as TicketIcon,
  UserRound,
  Mail,
  MapPin,
  ShieldCheck,
  QrCode as QrIcon,
  Download,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  Save,
  CheckCircle2,
  Ban,
  Loader2,
  GraduationCap
} from "lucide-react"
import { useAuth } from "@/providers/auth-provider"
import { QrCode } from "@/components/qr-code"
import { PassLanyard } from "@/components/pass-lanyard"
import { WorkshopTab } from "@/components/dashboard/workshop-tab"
import type { Ticket } from "@/types/ticketing"

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading, authenticated, refreshUser } = useAuth()

  const [activeTab, setActiveTab] = useState<"overview" | "tickets" | "workshops" | "profile">(
    searchParams.get("tab") === "workshops"
      ? "workshops"
      : searchParams.get("tab") === "profile"
      ? "profile"
      : "overview"
  )
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [ticketError, setTicketError] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [institution, setInstitution] = useState("")
  const [degree, setDegree] = useState("")
  const [department, setDepartment] = useState("")
  const [graduationYear, setGraduationYear] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [github, setGithub] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !authenticated) {
      router.replace("/auth?mode=login")
    }
  }, [loading, authenticated, router])

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "")
      setLastName(user.last_name || "")
      setPhone(user.phone || "")
      setInstitution(user.academic?.institution || "")
      setDegree(user.academic?.degree || "")
      setDepartment(user.academic?.department || "")
      setGraduationYear(
        user.academic?.graduation_year ? String(user.academic.graduation_year) : ""
      )
      setLinkedin(user.socials?.linkedin || "")
      setGithub(user.socials?.github || "")
    }
  }, [user])

  useEffect(() => {
    async function loadTickets() {
      if (!authenticated) return
      try {
        setLoadingTickets(true)
        const res = await fetch("/api/tickets")
        if (res.ok) {
          const data = await res.json()
          setTickets(data.tickets || [])
        } else {
          setTickets([])
        }
      } catch (err) {
        setTicketError("Failed to fetch tickets")
      } finally {
        setLoadingTickets(false)
      }
    }
    loadTickets()
  }, [authenticated])

  const handleCopyTicketCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileSuccess(null)
    setProfileError(null)

    try {
      let normalizedPhone = phone.trim()
      const digits = normalizedPhone.replace(/\D/g, "")
      if (digits.length === 10 && !normalizedPhone.startsWith("+")) {
        normalizedPhone = `+91${digits}`
      } else if (digits.length === 11 && digits.startsWith("0")) {
        normalizedPhone = `+91${digits.slice(1)}`
      } else if (digits.length === 12 && digits.startsWith("91") && !normalizedPhone.startsWith("+")) {
        normalizedPhone = `+${digits}`
      } else if (!normalizedPhone.startsWith("+") && digits.length >= 8) {
        normalizedPhone = `+${digits}`
      }

      const payload: Record<string, unknown> = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: normalizedPhone
      }

      if (institution.trim()) {
        payload.academic = {
          institution: institution.trim(),
          degree: degree.trim() || null,
          department: department.trim() || null,
          graduation_year: graduationYear ? parseInt(graduationYear, 10) : null
        }
      }

      if (linkedin.trim() || github.trim()) {
        payload.socials = {
          linkedin: linkedin.trim() || null,
          github: github.trim() || null
        }
      }

      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail || "Could not update profile")
      }

      await refreshUser()
      setProfileSuccess("Profile updated successfully")
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Error saving profile")
    } finally {
      setSavingProfile(false)
    }
  }

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#FF2D87]" />
      </main>
    )
  }

  const fullName = `${user.first_name} ${user.last_name}`

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(108,0,255,0.16),transparent_65%)]" />
        <div className="absolute -left-40 top-[42rem] h-96 w-96 rounded-full bg-[#FF00D4]/[0.035] blur-3xl" />
      </div>

      <section className="relative mx-auto max-w-[1400px] overflow-x-clip px-4 pb-32 pt-24 sm:px-8 sm:pb-24 sm:pt-32 lg:px-12 lg:pt-36">
        <header className="mb-5 flex items-center justify-between gap-3 sm:mb-8">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#c5a5ff] sm:text-[10px]">
              <Sparkles className="h-3 w-3" />
              AWS re:Invent Fest 2026
            </p>
            <h1 className="mt-1 truncate text-[clamp(1.45rem,6vw,2rem)] font-semibold tracking-[-0.04em] text-white">
              Hey, <span className="text-[#e7a9ff]">{user.first_name}</span>
            </h1>
            <p className="mt-0.5 text-[11px] text-white/45 sm:text-xs">Your festival, all in one place.</p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-400/[0.08] px-2.5 py-1.5 text-[9px] text-emerald-300 sm:px-3 sm:text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Verified</span>
            </div>
            <Link
              href="/tickets"
              aria-label={tickets.length > 0 ? "View tickets" : "Get a pass"}
              className="flex h-9 items-center justify-center gap-2 rounded-full bg-[#FF00D4] px-3.5 text-[10px] font-semibold text-white shadow-[0_0_20px_rgba(255,0,212,0.16)] transition-all hover:bg-[#FF2D87] sm:h-10 sm:px-5 sm:text-xs"
            >
              <TicketIcon className="h-3.5 w-3.5" />
              <span>{tickets.length > 0 ? "Tickets" : "Get a pass"}</span>
            </Link>
          </div>
        </header>

        {/* Security Alert: Blocked Account Banner */}
        {user.is_blocked && (
          <div className="mb-6 rounded-2xl bg-rose-950/35 p-4 shadow-[0_0_35px_rgba(244,63,94,0.14)] sm:mb-8 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400 sm:h-12 sm:w-12">
                <Ban className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-rose-400">
                  Security Enforcement Notice // Account Restricted
                </span>
                <h3 className="text-xl font-light text-white">
                  Your festival delegate account is currently <span className="font-semibold text-rose-300">BLOCKED</span>
                </h3>
                <p className="text-xs text-white/70">
                  <span className="font-semibold text-white">Documented Reason:</span> {user.blocked_reason || "Administrative suspension by festival operations"}
                </p>
                <p className="text-[11px] text-white/40 pt-1">
                  While suspended, pass issuance, ticket check-in at venue gates, and registration privileges are revoked. Contact <span className="text-white underline">reinvent@awslpu.in</span> for assistance.
                </p>
              </div>
            </div>
          </div>
        )}

        <nav aria-label="Dashboard sections" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 gap-1 border-t border-white/[0.08] bg-[#09070d]/95 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-xl sm:sticky sm:top-2 sm:z-30 sm:mb-8 sm:flex sm:w-fit sm:gap-1 sm:overflow-x-auto sm:rounded-full sm:border-0 sm:bg-[#17131e]/90 sm:p-1.5 sm:shadow-[0_8px_28px_rgba(0,0,0,0.25)] sm:ring-1 sm:ring-white/[0.07] sm:scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            aria-pressed={activeTab === "overview"}
            className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-[9px] font-semibold tracking-wide transition-all sm:min-h-0 sm:shrink-0 sm:flex-row sm:gap-2 sm:rounded-full sm:px-5 sm:py-2.5 sm:text-xs ${
              activeTab === "overview"
                ? "bg-[#FF00D4] text-white shadow-[0_4px_16px_rgba(255,0,212,0.18)]"
                : "text-white/55 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <CalendarDays className="h-4 w-4 sm:h-3.5 sm:w-3.5" /> Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tickets")}
            aria-pressed={activeTab === "tickets"}
            className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-[9px] font-semibold tracking-wide transition-all sm:min-h-0 sm:shrink-0 sm:flex-row sm:gap-2 sm:rounded-full sm:px-5 sm:py-2.5 sm:text-xs ${
              activeTab === "tickets"
                ? "bg-[#FF00D4] text-white shadow-[0_4px_16px_rgba(255,0,212,0.18)]"
                : "text-white/55 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <span className="relative">
              <TicketIcon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              {tickets.length > 0 && (
                <span className="absolute -right-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#ff4dd8] px-1 text-[8px] text-white sm:hidden">
                  {tickets.length}
                </span>
              )}
            </span>
            <span>My tickets</span>
            {tickets.length > 0 && (
              <span className="hidden h-4 min-w-4 items-center justify-center rounded-full bg-black/20 px-1 text-[9px] text-white sm:flex">
                {tickets.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("workshops")}
            aria-pressed={activeTab === "workshops"}
            className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-[9px] font-semibold tracking-wide transition-all sm:min-h-0 sm:shrink-0 sm:flex-row sm:gap-2 sm:rounded-full sm:px-5 sm:py-2.5 sm:text-xs ${
              activeTab === "workshops"
                ? "bg-[#FF00D4] text-white shadow-[0_4px_16px_rgba(255,0,212,0.18)]"
                : "text-white/55 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <GraduationCap className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            <span>Workshops</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            aria-pressed={activeTab === "profile"}
            className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-[9px] font-semibold tracking-wide transition-all sm:min-h-0 sm:shrink-0 sm:flex-row sm:gap-2 sm:rounded-full sm:px-5 sm:py-2.5 sm:text-xs ${
              activeTab === "profile"
                ? "bg-[#FF00D4] text-white shadow-[0_4px_16px_rgba(255,0,212,0.18)]"
                : "text-white/55 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <UserRound className="h-4 w-4 sm:h-3.5 sm:w-3.5" /> Profile
          </button>
        </nav>

        {activeTab === "overview" && (
          <div className="space-y-4 sm:space-y-6">
            <div className={`grid gap-4 ${tickets.length > 0 ? "lg:grid-cols-[0.9fr_1.1fr]" : ""}`}>
              {tickets.length > 0 && (
                <div className="order-1 h-80 w-full sm:h-[340px] lg:h-[320px]">
                  <PassLanyard
                    category={tickets[0].category_name}
                    holder={fullName}
                    ticketCode={tickets[0].ticket_code}
                  />
                </div>
              )}

              <div className={`${tickets.length > 0 ? "order-2" : ""} relative overflow-hidden rounded-[1.75rem] bg-[#17121f] p-4 sm:rounded-[2rem] sm:p-8 lg:p-10`}>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_84%_12%,rgba(207,49,217,0.24),transparent_38%),radial-gradient(ellipse_at_12%_100%,rgba(88,65,191,0.17),transparent_44%)]" />
                <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full border border-white/[0.06]" />
                <div className="pointer-events-none absolute -right-12 bottom-12 h-48 w-48 rounded-full border border-white/[0.07]" />

                <div className="relative flex flex-col items-start">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#f4c4ff]">
                    <CalendarDays className="h-3 w-3" /> 02 Dec - 04 Dec 2026
                  </span>

                  <h2 className="mt-4 max-w-xl text-[clamp(2rem,8vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.07em]">
                    Make room for{" "}
                    <span className="bg-gradient-to-r from-[#f3b4ff] via-[#ff4dd8] to-[#a58bff] bg-clip-text text-transparent">what&apos;s next.</span>
                  </h2>

                  <p className="mt-3 max-w-md text-[11px] leading-relaxed text-white/55 sm:text-sm">
                    Three days to explore cloud, meet builders and turn big ideas into something real.
                  </p>

                  <div className="mt-4 flex w-full flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-white/55 sm:text-[11px]">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#e178f2]" />
                        LPU, Punjab
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#a58bff]" />
                        Sessions, labs & hackathons
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 sm:min-w-44">
                      {tickets.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setActiveTab("tickets")}
                          className="flex h-10 items-center justify-center gap-2 rounded-full bg-white text-xs font-semibold text-[#17121f] transition hover:bg-[#f4c4ff]"
                        >
                          <TicketIcon className="h-3.5 w-3.5" />
                          View my passes ({tickets.length})
                        </button>
                      ) : (
                        <Link
                          href="/tickets"
                          className="flex h-10 items-center justify-center gap-2 rounded-full bg-white px-4 text-xs font-semibold text-[#17121f] transition hover:bg-[#f4c4ff] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.14]"
                        >
                          <TicketIcon className="h-3.5 w-3.5" />
                          Explore tickets
                        </Link>
                      )}
                      <Link
                        href="/schedule"
                        className="flex h-10 items-center justify-center gap-2 rounded-full bg-white/[0.06] text-[10px] text-white/75 transition hover:bg-white/[0.1] hover:text-white sm:text-xs"
                      >
                        <span>Explore schedule</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.75rem] bg-[#14111a] p-5 ring-1 ring-white/[0.06] sm:p-7">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-white/40">Your details</p>
                    <h3 className="mt-1 text-lg font-semibold">Profile overview</h3>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FF00D4]/10 text-[#e7a9ff]">
                    <UserRound className="h-4 w-4" />
                  </span>
                </div>

                <div className="mt-5 grid gap-2 text-xs sm:grid-cols-2">
                  <div>
                    <span className="text-white/40">Full name</span>
                    <p className="mt-1 break-words text-sm font-medium text-white">{fullName}</p>
                  </div>
                  <div>
                    <span className="text-white/40">Email</span>
                    <p className="mt-1 break-all text-sm text-white">{user.email}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-white/40">Institution</span>
                    <p className="mt-1 text-sm text-white">
                      {user.academic?.institution || "Not added yet"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className="mt-5 flex w-full items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3 text-xs text-[#e7a9ff] transition hover:bg-white/[0.08]"
                >
                  <span>Edit Profile & Academic Details</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="rounded-[1.75rem] bg-[#14111a] p-5 ring-1 ring-white/[0.06] sm:p-7">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-white/40">Account standing</p>
                    <h3 className="mt-1 text-lg font-semibold">All in one place</h3>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8B5CFF]/10 text-[#b69aff]">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                </div>

                <div className="mt-5 space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-xl bg-white/[0.035] px-3.5 py-3">
                    <span className="text-white/55">Email status</span>
                    <span className={user.email_verified ? "text-emerald-400" : "text-amber-400"}>
                      {user.email_verified ? "Verified" : "Pending"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-white/[0.035] px-3.5 py-3">
                    <span className="text-white/55">Account status</span>
                    <span className={user.is_active ? "text-emerald-400" : "text-red-400"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.035] px-3.5 py-3">
                    <span className="text-white/55">Roles</span>
                    <div className="flex flex-wrap justify-end gap-1">
                      {user.roles.map((r) => (
                        <span key={r} className="rounded-full bg-[#8B5CFF]/15 px-2.5 py-1 text-[9px] uppercase text-[#c5a5ff]">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-white/[0.035] px-3.5 py-3">
                    <span className="text-white/55">Member since</span>
                    <span className="text-white/70">
                      {new Date(user.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tickets" && (
          <div className="mt-5 sm:mt-8">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:mb-8 sm:flex-row sm:items-end">
              <div>
                <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#e178f2]">Your event essentials</p>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Passes & entry</h2>
                <p className="mt-1 text-[11px] leading-relaxed text-white/50 sm:text-xs">
                  Keep your QR code ready to make arrival at the festival effortless.
                </p>
              </div>
              <span className="w-fit rounded-full bg-white/[0.06] px-3 py-1.5 text-[10px] font-medium text-white/65 sm:text-xs">
                {tickets.length} {tickets.length === 1 ? "Ticket" : "Tickets"}
              </span>
            </div>

            {loadingTickets ? (
              <div className="flex flex-col items-center justify-center py-24 text-white/50">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#FF00D4]" />
                <p className="mt-4 text-xs uppercase tracking-widest">Loading issued tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="mt-8 flex flex-col items-center justify-center rounded-[2rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(169,65,194,0.12),transparent_60%)] px-5 py-14 text-center ring-1 ring-white/[0.07] sm:mt-12 sm:py-20">
                <span className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[#FF00D4]/10 text-[#e178f2]">
                  <TicketIcon className="h-7 w-7" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-white/90">Your first pass is still out there</h3>
                <p className="mt-2 max-w-sm text-xs leading-relaxed text-white/50">
                  You haven't purchased any festival passes yet. Reserve your pass now to secure entry to AWS Re:Invent Fest 2026.
                </p>
                <Link
                  href="/tickets"
                  className="mt-6 flex h-11 items-center gap-2 rounded-full bg-[#FF00D4] px-6 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#FF2D87]"
                >
                  Browse Available Passes
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3 sm:mt-8">
                {tickets.map((ticket) => (
                  <article
                    key={ticket.id}
                    className="group relative overflow-hidden rounded-[1.75rem] bg-[#17131d] p-4 ring-1 ring-white/[0.07] transition hover:-translate-y-0.5 hover:ring-[#d35be7]/35 sm:p-5"
                  >
                    <div className="pointer-events-none absolute -right-14 -top-20 h-48 w-48 rounded-full bg-[#b438c6]/[0.09] blur-3xl transition group-hover:bg-[#b438c6]/[0.16]" />
                    <div className="relative">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#e7a9ff]">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF00D4]/10 text-[10px] text-white">re:</span>
                          Festival pass · 2026
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase ${
                            ticket.status === "valid"
                              ? "bg-emerald-400/10 text-emerald-300"
                              : "bg-amber-400/10 text-amber-300"
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </div>

                      <h3 className="mt-4 font-serif text-2xl font-semibold tracking-tight text-white">
                        {ticket.category_name}
                      </h3>
                      <p className="mt-1 text-xs text-white/45">Admit one · {fullName}</p>

                      <div className="my-4 flex items-center gap-4 rounded-2xl bg-white/[0.035] p-3">
                        <QrCode value={ticket.ticket_code} size={136} />
                        <div className="min-w-0 space-y-3 text-[10px]">
                          <div>
                            <p className="text-white/35">FESTIVAL DATES</p>
                            <p className="mt-1 text-xs text-white/85">02 Dec - 04 Dec 2026</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-white/35">TICKET CODE</p>
                            <p className="mt-1 truncate font-mono text-[9px] text-[#e7a9ff]">{ticket.ticket_code}</p>
                          </div>
                          <p className={`flex items-center gap-1.5 ${
                            ticket.status === "valid" ? "text-emerald-300" : "text-white/50"
                          }`}>
                            <CheckCircle2 className="h-3 w-3" />
                            {ticket.status === "valid"
                              ? "Ready for entry"
                              : ticket.status === "used"
                                ? "Already checked in"
                                : ticket.status === "refunded"
                                  ? "Ticket refunded"
                                  : "Ticket cancelled"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(ticket)}
                          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-white text-xs font-semibold text-[#17131d] transition hover:bg-[#f4c4ff]"
                        >
                          <QrIcon className="h-3.5 w-3.5" />
                          View full pass
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyTicketCode(ticket.ticket_code)}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-white/65 transition hover:bg-white/15 hover:text-white"
                          title="Copy ticket verification code"
                          aria-label="Copy ticket verification code"
                        >
                          {copiedCode ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "workshops" && (
          <div className="mt-5 sm:mt-8">
            <WorkshopTab user={user} />
          </div>
        )}

        {activeTab === "profile" && (
          <div className="mx-auto mt-5 max-w-3xl rounded-[2rem] bg-[#14111a] p-4 ring-1 ring-white/[0.07] sm:mt-8 sm:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-white/[0.08] pb-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF00D4]/10 text-[#e7a9ff]">
                <UserRound className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Your attendee profile</h2>
                <p className="mt-1 text-[11px] text-white/45 sm:text-xs">
                Keep your attendee badge information and academic affiliation up to date.
                </p>
              </div>
            </div>

            {searchParams.get("checkout") === "profile-incomplete" && (
              <div
                role="alert"
                className="mt-6 flex items-start gap-3 rounded-xl bg-amber-500/10 p-4 text-sm text-amber-200"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <p>
                  Please complete your profile before buying a ticket. Add your university/college/company,
                  degree, department, and graduation year, then save your profile.
                </p>
              </div>
            )}

            {profileSuccess && (
              <div className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="mt-6 flex items-center gap-2 rounded-xl bg-red-500/10 p-3.5 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-4 sm:space-y-5">
              <div className="rounded-2xl bg-black/20 p-4 sm:p-5">
                <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e7a9ff]">Personal details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/50">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-2 h-12 w-full rounded-xl bg-white/[0.045] px-4 text-sm text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-[#FF00D0]/70"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/50">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-2 h-12 w-full rounded-xl bg-white/[0.045] px-4 text-sm text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-[#FF00D0]/70"
                  />
                </div>
              </div>
              </div>

              <div className="rounded-2xl bg-black/20 p-4 sm:p-5">
                <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c5a5ff]">Contact details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                  <label className="text-xs uppercase tracking-wider text-white/50">Email Address (Read-only)</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="mt-2 h-12 w-full rounded-xl bg-white/[0.025] px-4 text-sm text-white/40 cursor-not-allowed"
                  />
                </div>
                  <div>
                  <label className="text-xs uppercase tracking-wider text-white/50">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-2 h-12 w-full rounded-xl bg-white/[0.045] px-4 text-sm text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-[#FF00D0]/70"
                  />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-black/20 p-4 sm:p-5">
                <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c5a5ff]">
                  Academic / Organizational Affiliation
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-white/50">University / College / Company</label>
                    <input
                      type="text"
                      placeholder="e.g. Lovely Professional University"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="mt-2 h-12 w-full rounded-xl bg-white/[0.045] px-4 text-sm text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-[#FF00D0]/70"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="text-xs uppercase tracking-wider text-white/50">Degree</label>
                      <input
                        type="text"
                        placeholder="e.g. B.Tech"
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        className="mt-2 h-12 w-full rounded-xl bg-white/[0.045] px-4 text-sm text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-[#FF00D0]/70"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wider text-white/50">Department</label>
                      <input
                        type="text"
                        placeholder="e.g. Computer Science"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="mt-2 h-12 w-full rounded-xl bg-white/[0.045] px-4 text-sm text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-[#FF00D0]/70"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wider text-white/50">Graduation Year</label>
                      <input
                        type="number"
                        placeholder="e.g. 2027"
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(e.target.value)}
                        className="mt-2 h-12 w-full rounded-xl bg-white/[0.045] px-4 text-sm text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-[#FF00D0]/70"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-black/20 p-4 sm:p-5">
                <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e7a9ff]">
                  Public Profiles & Social Links
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-white/50">LinkedIn Profile URL</label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/username"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      className="mt-2 h-12 w-full rounded-xl bg-white/[0.045] px-4 text-sm text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-[#FF00D0]/70"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-white/50">GitHub Profile URL</label>
                    <input
                      type="url"
                      placeholder="https://github.com/username"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      className="mt-2 h-12 w-full rounded-xl bg-white/[0.045] px-4 text-sm text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-[#FF00D0]/70"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-stretch pt-2 sm:justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-[#FF00D4] to-[#702cff] px-8 text-xs font-semibold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(255,0,212,0.18)] transition hover:opacity-95 disabled:opacity-50 sm:w-auto"
                >
                  <Save className="h-4 w-4" />
                  <span>{savingProfile ? "Saving Changes..." : "Save Profile"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {selectedTicket && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-2 backdrop-blur-md sm:items-center sm:p-4"
            onClick={() => setSelectedTicket(null)}
          >
            <div
              className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-[#100c14] p-5 text-center shadow-[0_0_60px_rgba(255,0,212,0.2)] sm:max-h-[90vh] sm:rounded-3xl sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-[9px] uppercase tracking-widest text-[#FF2D87]">
                  AWS Re:Invent Fest 2026
                </span>
                <span className="text-[10px] uppercase font-semibold text-emerald-400">
                  {selectedTicket.status}
                </span>
              </div>

              <h3 className="mt-6 text-3xl font-light text-white">
                {selectedTicket.category_name}
              </h3>

              <p className="mt-2 text-xs text-white/60">
                Official Delegate: <strong className="text-white">{fullName}</strong>
              </p>

              <div className="my-8 flex justify-center">
                <div className="rounded-2xl bg-white p-3">
                  <QrCode value={selectedTicket.ticket_code} size={200} />
                </div>
              </div>

              <div className="space-y-2 border-y border-white/10 py-4 text-left text-xs text-white/60">
                <div className="flex justify-between">
                  <span>Ticket ID:</span>
                  <span className="font-mono text-white/80">{selectedTicket.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Festival Dates:</span>
                  <span className="text-white">Nov 30 – Dec 04, 2026</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Verification Hash:</span>
                  <span className="font-mono text-[9px] text-[#FF00D4]">
                    {selectedTicket.ticket_code.slice(0, 20)}...
                  </span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => handleCopyTicketCode(selectedTicket.ticket_code)}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white/[0.08] text-xs uppercase tracking-wider text-white transition hover:bg-white/15"
                >
                  {copiedCode ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#FF00D4] px-5 text-xs uppercase tracking-wider text-white transition hover:bg-[#FF2D87]"
                >
                  <Download className="h-4 w-4" />
                  <span>Print</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="mt-6 text-xs uppercase text-white/40 hover:text-white"
              >
                Close Ticket View
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
          <div className="flex items-center gap-3 text-white/50 text-sm">
            <Loader2 className="h-5 w-5 animate-spin text-[#FF00D4]" />
            <span>Loading dashboard...</span>
          </div>
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
