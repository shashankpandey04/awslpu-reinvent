"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Check,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Ticket as TicketIcon,
  Lock,
  Loader2,
  Sparkles,
  Zap,
  Award,
  Gift,
  BadgeCheck,
  Flame,
  CreditCard,
  Layers,
  Calendar,
  X,
  UserCheck,
  Tag,
  Percent
} from "lucide-react"
import { useAuth } from "@/providers/auth-provider"
import { openRazorpayCheckout, loadRazorpayScript, type RazorpayResponse } from "@/lib/razorpay"
import type { TicketCategory, Order, Ticket } from "@/types/ticketing"

const universalPerks = [
  {
    title: "Keynotes Sessions",
    description: "Keynotes by AWS global leaders, cloud architects, and industry pioneers across main stages.",
    icon: Award,
    tag: "All Stages"
  },
  {
    title: "Live Cloud Workshops",
    description: "Hands-on practical cloud labs with live AWS sandbox environments and expert guidance.",
    icon: Zap,
    tag: "Hands-On"
  },
  {
    title: "MLH 12h Hackathon",
    description: "12-hour high-octane builder sprint with prizes, cloud tooling, and 1-on-1 mentorship.",
    icon: Flame,
    tag: "Prizes & Mentors"
  },
  {
    title: "AWS Cloud Credits",
    description: "Official AWS promotional cloud credits granted directly for your builder projects.",
    icon: CreditCard,
    tag: "Free Credits"
  },
  {
    title: "Certification Voucher",
    description: "Official AWS Certification exam voucher worth up to $300 issued to attendees.",
    icon: BadgeCheck,
    tag: "Valued at $300"
  },
  {
    title: "Builder Center Access",
    description: "$579 AWS Builder Center subscription benefits for all verified attendees.",
    icon: Layers,
    tag: "Valued at $579"
  },
  {
    title: "Limited Edition Swag",
    description: "Exclusive AWS Re:Invent 2026 hoodies, backpacks, pins, and delegate tech kits.",
    icon: Gift,
    tag: "Official Kit"
  },
  {
    title: "Catering & High-Tea",
    description: "Complimentary chef-prepared meals, beverages, energy snacks, and daily high-tea.",
    icon: Sparkles,
    tag: "3 Days Included"
  }
]

export default function TicketsPage() {
  const router = useRouter()
  const { user, authenticated } = useAuth()

  const [categories, setCategories] = useState<TicketCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [existingTicket, setExistingTicket] = useState<Ticket | null>(null)
  const [checkingExisting, setCheckingExisting] = useState(false)
  const [blackFridayRemainingMs, setBlackFridayRemainingMs] = useState<number | null>(null)

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [checkoutStep, setCheckoutStep] = useState<"select" | "review" | "processing" | "success">("select")
  const [orderError, setOrderError] = useState<string | null>(null)
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null)
  const [pollingStatus, setPollingStatus] = useState<string>("")
  const [isPaying, setIsPaying] = useState(false)

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discount_percent: number
    discount_amount_in_paise: number
    original_amount_in_paise: number
    final_amount_in_paise: number
  } | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null)

  useEffect(() => {
    // Use local midnight so the launch date follows the visitor's browser timezone.
    const saleStartsAt = new Date(2026, 10, 27).getTime()
    const initialRemainingMs = saleStartsAt - Date.now()
    if (initialRemainingMs <= 0) {
      setBlackFridayRemainingMs(0)
      return
    }

    setBlackFridayRemainingMs(initialRemainingMs)
    const updateCountdown = () => {
      const remainingMs = saleStartsAt - Date.now()
      setBlackFridayRemainingMs(Math.max(0, remainingMs))
      if (remainingMs <= 0) window.clearInterval(intervalId)
    }

    const intervalId = window.setInterval(updateCountdown, 1000)
    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoadingCategories(true)
        const res = await fetch("/api/tickets/categories")
        if (!res.ok) throw new Error("Failed to load ticket categories")
        const data = await res.json()
        setCategories(data || [])
      } catch (err) {
        setOrderError(err instanceof Error ? err.message : "Error loading passes")
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategories()
    loadRazorpayScript().catch(() => {})
  }, [])

  useEffect(() => {
    async function checkUserTickets() {
      if (!authenticated) {
        setExistingTicket(null)
        return
      }
      try {
        setCheckingExisting(true)
        const res = await fetch("/api/tickets")
        if (res.ok) {
          const data = await res.json()
          const validTicket = data.tickets?.find((t: Ticket) => t.status === "valid") || null
          setExistingTicket(validTicket)
        } else {
          setExistingTicket(null)
        }
      } catch {
        setExistingTicket(null)
      } finally {
        setCheckingExisting(false)
      }
    }
    checkUserTickets()
  }, [authenticated])

  const refreshExistingTicket = async () => {
    try {
      const res = await fetch("/api/tickets", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        const validTicket = data.tickets?.find((t: Ticket) => t.status === "valid") || null
        setExistingTicket(validTicket)
      }
    } catch {
      // ignore; the dashboard will show the ticket
    }
  }

  const toggleSelectCategory = (categoryId: string) => {
    if (existingTicket) return
    const cat = categories.find((c) => c.id === categoryId)
    if (!cat) return
    const now = new Date()
    const salesStart = cat.sales_start ? new Date(cat.sales_start) : null
    const salesEnd = cat.sales_end ? new Date(cat.sales_end) : null
    const available = (cat.quantity ?? 0) - (cat.quantity_sold ?? 0) - (cat.quantity_reserved ?? 0)
    if (
      !cat.is_active ||
      cat.is_sold_out ||
      cat.quantity <= 0 ||
      available <= 0 ||
      (salesStart && now < salesStart) ||
      (salesEnd && now > salesEnd)
    ) {
      return
    }
    setSelectedCategoryId((prev) => {
      const next = prev === categoryId ? null : categoryId
      if (next !== prev) {
        setAppliedCoupon(null)
        setCouponCodeInput("")
        setCouponError(null)
        setCouponSuccess(null)
        setCreatedOrder(null)
      }
      return next
    })
  }

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)
  const unitPrice = selectedCategory ? selectedCategory.price_in_paise / 100 : 0
  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount_in_paise / 100 : 0
  const totalAmount = Math.max(0, unitPrice - discountAmount)

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const code = couponCodeInput.trim().toUpperCase()
    if (!code) {
      setCouponError("Please enter a promo/coupon code.")
      setCouponSuccess(null)
      return
    }
    if (!selectedCategory) return

    setValidatingCoupon(true)
    setCouponError(null)
    setCouponSuccess(null)

    try {
      const res = await fetch(
        `/api/coupons/validate?code=${encodeURIComponent(code)}&category_id=${selectedCategory.id}&amount_in_paise=${selectedCategory.price_in_paise}`
      )
      const data = await res.json()
      if (!res.ok || !data.valid) {
        setCouponError(data.message || data.detail || "Invalid or inactive coupon code.")
        setAppliedCoupon(null)
        return
      }

      setAppliedCoupon({
        code: data.code,
        discount_percent: data.discount_percent,
        discount_amount_in_paise: data.discount_amount_in_paise,
        original_amount_in_paise: data.original_amount_in_paise,
        final_amount_in_paise: data.final_amount_in_paise
      })
      setCouponSuccess(`Coupon ${data.code} applied! ${data.discount_percent}% discount`)
      setCreatedOrder(null)
    } catch {
      setCouponError("Could not validate coupon code. Please try again.")
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCodeInput("")
    setCouponError(null)
    setCouponSuccess(null)
    setCreatedOrder(null)
  }

  const handleStartCheckout = () => {
    if (!authenticated) {
      router.push("/auth?mode=login&redirect=/tickets")
      return
    }
    if (existingTicket) {
      setOrderError("You already have an active pass. Each attendee is strictly limited to 1 ticket.")
      return
    }
    setOrderError(null)
    setCheckoutStep("review")
  }

  const handleProceedPayment = async () => {
    if (isPaying) return

    if (!authenticated) {
      router.push("/auth?mode=login&redirect=/tickets")
      return
    }
    if (existingTicket) {
      setOrderError("You already have an active pass. Each attendee is strictly limited to 1 ticket.")
      return
    }

    if (!selectedCategoryId) {
      setOrderError("Please select a pass tier.")
      return
    }

    setIsPaying(true)

    try {
      const profileRes = await fetch("/api/auth/me", { cache: "no-store" })

      if (profileRes.status === 401) {
        router.push("/auth?mode=login&redirect=/tickets")
        return
      }

      if (!profileRes.ok) {
        throw new Error("Unable to verify your profile. Please try again.")
      }

      const { user: profile } = await profileRes.json()
      const academic = profile.academic
      if (
        !profile.first_name?.trim() ||
        !profile.last_name?.trim() ||
        !profile.phone?.trim() ||
        !academic?.institution?.trim()
      ) {
        router.push("/dashboard?tab=profile&checkout=profile-incomplete")
        return
      }

      setOrderError(null)
      setCheckoutStep("processing")
      setPollingStatus("Reserving ticket...")

      let order: Order | null = null
      const isPendingValid =
        createdOrder &&
        createdOrder.status === "pending" &&
        createdOrder.items?.some((item) => item.category_id === selectedCategoryId) &&
        (createdOrder.coupon_code || null) === (appliedCoupon?.code || null) &&
        createdOrder.expires_at &&
        new Date(createdOrder.expires_at).getTime() > Date.now() + 15000

      if (isPendingValid) {
        order = createdOrder
      } else {
        const orderPayload: {
          items: { category_id: string; quantity: number }[]
          coupon_code?: string
        } = {
          items: [
            {
              category_id: selectedCategoryId,
              quantity: 1
            }
          ]
        }

        if (appliedCoupon) {
          orderPayload.coupon_code = appliedCoupon.code
        }

        const orderRes = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload)
        })

        if (!orderRes.ok) {
          const errorData = await orderRes.json().catch(() => null)
          throw new Error(errorData?.detail || "Could not reserve ticket. Please try again.")
        }

        order = await orderRes.json()
        setCreatedOrder(order)
      }

      if (!order) {
        throw new Error("Order creation failed. Please try again.")
      }

      if (order.status === "paid" || order.total_amount === 0) {
        await refreshExistingTicket()
        setCheckoutStep("success")
        return
      }

      setPollingStatus("Opening Razorpay payment gateway...")

      const checkoutData = order.checkout || {
        key: order.razorpay_key_id || "",
        order_id: order.razorpay_order_id || "",
        amount: order.total_amount,
        currency: order.currency || "INR"
      }

      const buyerName = user ? `${user.first_name} ${user.last_name}` : ""
      const buyerEmail = user?.email || ""
      const buyerPhone = user?.phone || ""

      let rzpResponse: RazorpayResponse | null = null
      try {
        rzpResponse = await openRazorpayCheckout({
          key: checkoutData.key,
          amount: checkoutData.amount,
          currency: checkoutData.currency,
          order_id: checkoutData.order_id,
          name: "AWS Re:Invent Fest 2026",
          description: `Festival Pass Reservation (${order.id.slice(-6)})`,
          prefill: {
            name: buyerName,
            email: buyerEmail,
            contact: buyerPhone
          }
        })
      } catch (paymentErr) {
        const msg = paymentErr instanceof Error ? paymentErr.message : "Payment was cancelled"
        setOrderError(msg)
        setCheckoutStep("review")
        return
      }

      setPollingStatus("Verifying payment signature & issuing pass...")

      // Instant cryptographic verification: confirms and issues tickets in <100ms
      if (rzpResponse) {
        try {
          const verifyRes = await fetch(`/api/orders/${order.id}/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: rzpResponse.razorpay_payment_id,
              razorpay_order_id: rzpResponse.razorpay_order_id,
              razorpay_signature: rzpResponse.razorpay_signature
            })
          })

          if (verifyRes.ok) {
            const verifiedOrder: Order = await verifyRes.json()
            if (verifiedOrder.status === "paid") {
              setCreatedOrder(verifiedOrder)
              await refreshExistingTicket()
              setCheckoutStep("success")
              return
            }
          }
        } catch (verifyErr) {
          console.warn("Direct verification request failed, falling back to status check:", verifyErr)
        }
      }

      // Fallback reconciliation loop (if direct verify encountered network trouble)
      setPollingStatus("Confirming pass status...")
      let attempts = 0
      const maxAttempts = 10

      while (attempts < maxAttempts) {
        attempts++
        try {
          const checkRes = await fetch(`/api/orders/${order.id}`)
          if (checkRes.ok) {
            const checkData: Order = await checkRes.json()
            if (checkData.status === "paid") {
              setCreatedOrder(checkData)
              await refreshExistingTicket()
              setCheckoutStep("success")
              return
            }
            if (checkData.status === "failed") {
              setCreatedOrder(null)
              throw new Error("Payment was rejected or cancelled. Please retry from the review step.")
            }
            if (checkData.status === "expired" || checkData.status === "cancelled") {
              setCreatedOrder(null)
              throw new Error("Reservation has expired. Please select a pass again.")
            }
          }
        } catch (pollErr) {
          if (
            pollErr instanceof Error &&
            (pollErr.message.includes("rejected") ||
              pollErr.message.includes("cancelled") ||
              pollErr.message.includes("expired"))
          ) {
            throw pollErr
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 1500))
      }

      await refreshExistingTicket()
      setOrderError(
        "Your payment was received, but your ticket is still being issued. Please check your dashboard in a minute — do not pay again."
      )
      setCheckoutStep("select")
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : "Payment processing encountered an issue.")
      setCheckoutStep("review")
    } finally {
      setIsPaying(false)
    }
  }

  const anySoldOut = categories.some((c) => {
    const totalQty = c.quantity ?? 0
    const soldQty = c.quantity_sold ?? 0
    const reservedQty = c.quantity_reserved ?? 0
    const available = totalQty - soldQty - reservedQty
    return Boolean(c.is_sold_out) || totalQty <= 0 || available <= 0
  })
  const isBlackFridaySaleLive = blackFridayRemainingMs === 0
  const countdownParts = blackFridayRemainingMs === null ? null : {
    days: Math.floor(blackFridayRemainingMs / 86_400_000),
    hours: Math.floor((blackFridayRemainingMs % 86_400_000) / 3_600_000),
    minutes: Math.floor((blackFridayRemainingMs % 3_600_000) / 60_000),
    seconds: Math.floor((blackFridayRemainingMs % 60_000) / 1_000)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-1/2 top-0 h-[560px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(108,0,255,0.13),transparent_68%)] blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[420px] w-[420px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,0,212,0.055),transparent_68%)] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-4 pb-36 pt-24 sm:px-8 sm:pb-28 sm:pt-28 lg:px-12">
        <section aria-labelledby="black-friday-heading" className="relative mb-6 overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-[#121019] px-4 py-5 sm:mb-8 sm:rounded-[2rem] sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_90%_0%,rgba(207,49,217,0.14),transparent_46%),radial-gradient(ellipse_at_0%_100%,rgba(88,65,191,0.12),transparent_52%)]" />
          <div className="relative flex flex-col justify-between gap-3 sm:flex-row sm:items-end sm:gap-6">
            <div className="min-w-0">
              <p className="mb-1.5 flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.17em] text-[#c5a5ff]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF00D4]" />
                AWS re:Invent Fest 2026 · {isBlackFridaySaleLive ? "Limited-time offer" : "Black Friday · Nov 27"}
              </p>
              <h1 id="black-friday-heading" className="text-[clamp(1.9rem,8vw,3.5rem)] font-semibold leading-[0.94] tracking-[-0.06em] text-white">
                {isBlackFridaySaleLive ? (
                  <>BLACK FRIDAY <span className="text-[#e7a9ff]">TICKET SALE</span></>
                ) : (
                  <>BLACK FRIDAY <span className="text-[#e7a9ff]">SALE COMING SOON</span></>
                )}
              </h1>
            </div>
            <div className="w-full max-w-md text-left text-xs leading-relaxed text-white/65 sm:text-right sm:text-sm">
              {isBlackFridaySaleLive ? (
                <div className="rounded-2xl border border-[#f4c778]/25 bg-[#f4c778]/[0.08] p-3.5 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
                  <p className="flex items-start gap-2 text-sm font-semibold leading-snug text-[#ffe0a6] sm:justify-end sm:text-sm">
                    <TicketIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#f4c778] sm:hidden" />
                    <span>
                      Find your nearest AWS Registration Desk in LPU CSE Blocks for{" "}
                      <span className="font-extrabold text-white">BLACK FRIDAY Code</span>
                    </span>
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#e7a9ff]">Sale begins in IST (GMT+5:30)</p>
                  <p role="timer" aria-live="off" aria-label="Countdown to the Black Friday sale" className="mt-1 font-mono text-sm font-semibold tabular-nums tracking-wide text-white sm:text-base">
                    {countdownParts
                      ? `${String(countdownParts.days).padStart(2, "0")}d ${String(countdownParts.hours).padStart(2, "0")}h ${String(countdownParts.minutes).padStart(2, "0")}m ${String(countdownParts.seconds).padStart(2, "0")}s`
                      : "--d --h --m --s"}
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        <div className="mb-4 flex flex-col justify-between gap-2 sm:mb-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#c5a5ff]">Find your place at the festival</p>
            <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Choose your pass</h2>
            <p className="mt-1 text-[11px] text-white/50 sm:text-xs">Three days of cloud, builders and big ideas at Lovely Professional University.</p>
          </div>
          <p className="text-[9px] text-white/40 sm:text-right sm:text-[10px]">
            Live availability <span className="mx-1.5 text-white/20">·</span> Prices in INR
          </p>
        </div>

        {/* Existing Ticket Alert (If user already has an active ticket) */}
        {existingTicket && (
          <div className="mt-6 rounded-2xl bg-emerald-950/30 p-5 sm:p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                    Active Pass Verified // Admission Ready
                  </span>
                  <h3 className="mt-1 text-xl font-light text-white sm:text-2xl">
                    You already hold a <span className="font-semibold text-emerald-300">{existingTicket.category_name}</span>
                  </h3>
                  <p className="mt-1 text-xs text-white/60">
                    Fair-allocation policy limits each registered delegate to 1 pass. Your personalized entry QR code is ready in your operations dashboard.
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard"
                className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-emerald-400 px-7 text-xs font-semibold text-black transition hover:bg-emerald-300"
              >
                <span>Open Pass in Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Error notification banner */}
        {orderError && (
          <div className="mt-6 flex items-center justify-between rounded-xl bg-rose-950/35 p-4 text-xs text-rose-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
              <p>{orderError}</p>
            </div>
            <button
              onClick={() => setOrderError(null)}
              className="p-1 text-rose-400 hover:text-white transition"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* STEP 1: Pass Selection */}
        {checkoutStep === "select" && (
          <div className="mt-5">
            {/* Availability note for categories that cannot currently be booked */}
            {anySoldOut && (
              <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-rose-950/25 px-4 py-3 text-xs text-rose-200/80">
                <div className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  <span className="text-[11px]">
                    Some pass types are no longer available. Check each ticket for current status.
                  </span>
                </div>
              </div>
            )}

            {loadingCategories ? (
              <div className="flex flex-col items-center justify-center py-28 text-white/50">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#e7a9ff]" />
                <p className="mt-4 font-mono text-xs uppercase tracking-widest text-white/60">
                  Retrieving real-time festival pass inventory...
                </p>
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center border border-white/10 bg-white/[0.01] py-24 text-center">
                <TicketIcon className="h-12 w-12 text-white/30 mb-3" />
                <h3 className="text-xl font-light text-white">No passes currently available</h3>
                <p className="mt-2 text-xs text-white/50 max-w-md">
                  Ticket tiers for AWS Re:Invent Fest 2026 are currently updating or sales have concluded. Please check back shortly.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between text-[11px] text-white/45 md:hidden">
                  <span className="flex items-center gap-1.5">
                    Swipe to compare passes <ArrowRight className="h-3 w-3 text-[#e7a9ff]" />
                  </span>
                  <span>{categories.length} {categories.length === 1 ? "option" : "options"}</span>
                </div>

                <div
                  role="region"
                  aria-label="Available tickets. Swipe horizontally to compare pass options."
                  tabIndex={0}
                  className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e7a9ff] md:mx-0 md:grid md:grid-cols-2 md:items-stretch md:gap-4 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-3"
                >
                  {categories.map((cat, idx) => {
                    const priceInRupees = cat.price_in_paise / 100
                    const isHighlight =
                      cat.is_recommended !== undefined
                        ? cat.is_recommended
                        : idx === 1 || cat.name.toLowerCase().includes("builder")
                    const isSelected = selectedCategoryId === cat.id

                    const now = new Date()
                    const salesStart = cat.sales_start ? new Date(cat.sales_start) : null
                    const salesEnd = cat.sales_end ? new Date(cat.sales_end) : null
                    const isUpcoming = salesStart ? now < salesStart : false
                    const isExpired = salesEnd ? now > salesEnd : false

                    const totalQty = cat.quantity ?? 0
                    const soldQty = cat.quantity_sold ?? 0
                    const reservedQty = cat.quantity_reserved ?? 0
                    const available = totalQty - soldQty - reservedQty
                    const isSoldOut = Boolean(cat.is_sold_out) || totalQty <= 0 || available <= 0
                    const isUnavailable = isSoldOut || isUpcoming || isExpired || !cat.is_active

                    let statusText = "Available"
                    let subStatusText = "Instant Digital Issuance"
                    if (!cat.is_active) {
                      statusText = "Inactive"
                      subStatusText = "Unavailable"
                    } else if (isUpcoming) {
                      statusText = "Coming Soon"
                      subStatusText = `Opens ${salesStart?.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`
                    } else if (isExpired) {
                      statusText = "Registration Closed"
                      subStatusText = "Sales Ended"
                    } else if (isSoldOut) {
                      statusText = "0 Left"
                      subStatusText = "Sold Out"
                    }

                    return (
                      <article
                        key={cat.id}
                        className={`group relative flex min-h-64 w-[calc(100vw-3rem)] max-w-[400px] shrink-0 snap-start flex-col overflow-hidden rounded-[1.5rem] bg-[#121019] transition-all duration-200 hover:-translate-y-0.5 md:w-auto md:max-w-none md:shrink ${
                          isSoldOut
                            ? "opacity-75 ring-1 ring-rose-400/25"
                            : isSelected
                            ? "ring-2 ring-[#FF00D4] shadow-[0_14px_42px_rgba(255,0,212,0.14)]"
                            : isHighlight
                            ? "ring-1 ring-[#8B5CFF]/45 shadow-[0_12px_36px_rgba(139,92,255,0.08)] hover:ring-[#c5a5ff]/60"
                            : "ring-1 ring-white/[0.08] hover:ring-white/20"
                        }`}
                      >
                        <div className={`flex items-center justify-between px-5 py-2.5 ${
                          isSoldOut
                            ? "bg-rose-950/35 text-rose-200"
                            : isHighlight
                            ? "bg-[#241a30] text-[#d8c0ff]"
                            : "bg-white/[0.035] text-white/55"
                        }`}>
                          <span className="text-[9px] font-semibold uppercase tracking-[0.18em]">
                            {isSoldOut ? "Pass unavailable" : isHighlight ? "Recommended" : "Re:Invent Fest 2026"}
                          </span>
                          {!isUnavailable && (
                            <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.13em] text-[#d7aaff]">
                              <span className="h-1 w-1 rounded-full bg-[#FF00D4]" />
                              Sale live
                            </span>
                          )}
                        </div>

                        <div className="relative flex flex-1 flex-col md:flex-row">
                          <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-white/40">Festival pass</span>
                                <h3 className="mt-1 font-serif text-[1.55rem] font-semibold leading-tight tracking-tight text-white sm:text-[1.7rem]">
                                  {cat.name}
                                </h3>
                              </div>
                              {isSoldOut ? (
                                <span className="shrink-0 rounded-full bg-rose-400/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-rose-300">
                                  Sold out
                                </span>
                              ) : isHighlight ? (
                                <span className="shrink-0 rounded-full bg-[#8B5CFF]/15 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-[#d8c0ff]">
                                  <Sparkles className="mr-1 inline h-3 w-3" /> Top pick
                                </span>
                              ) : null}
                            </div>

                            <div className="ticket-description mt-4 hidden flex-1 text-xs leading-relaxed text-white/65 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-4 [&_li]:pl-1 [&_li]:marker:text-[#c5a5ff] [&_strong]:font-semibold [&_strong]:text-white md:block">
                              {cat.description?.trim() ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{cat.description}</ReactMarkdown>
                              ) : (
                                <p className="text-white/50">Includes complete 5-day event access, keynotes, and meals.</p>
                              )}
                            </div>

                            <details className="mt-3 md:hidden">
                              <summary className="cursor-pointer text-[11px] font-medium text-[#d8c0ff] marker:text-[#d8c0ff]">
                                View included benefits
                              </summary>
                              <div className="ticket-description pt-2 text-xs leading-relaxed text-white/65 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-4 [&_li]:pl-1 [&_li]:marker:text-[#c5a5ff] [&_strong]:font-semibold [&_strong]:text-white">
                                {cat.description?.trim() ? (
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{cat.description}</ReactMarkdown>
                                ) : (
                                  <p className="text-white/50">Includes complete 5-day event access, keynotes, and meals.</p>
                                )}
                              </div>
                            </details>

                            <div className="mt-4 flex items-center gap-2 text-[10px] text-white/45">
                              <Calendar className="h-3.5 w-3.5 text-[#c5a5ff]" />
                              <span>{subStatusText}</span>
                              <span className="ml-auto font-medium text-white/60">{statusText}</span>
                            </div>
                          </div>

                          <div className={`relative flex shrink-0 flex-col justify-between gap-4 border-t border-dashed p-5 md:w-44 md:border-l md:border-t-0 sm:p-6 ${
                            isHighlight ? "border-[#8B5CFF]/30 bg-[#15111c]" : "border-white/15 bg-[#0e0d11]"
                          }`}>
                            <span aria-hidden="true" className="absolute -top-2 left-1/4 h-4 w-4 rounded-full bg-[#050505] md:left-auto md:-left-2 md:top-1/4" />
                            <span aria-hidden="true" className="absolute -top-2 right-1/4 h-4 w-4 rounded-full bg-[#050505] md:right-auto md:-left-2 md:top-3/4" />

                            <div>
                              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/40">Ticket price</p>
                              <p className={`mt-1 whitespace-nowrap text-[2.4rem] font-semibold leading-none tracking-[-0.07em] ${
                                isSoldOut ? "text-white/45" : isHighlight ? "text-[#e7d5ff]" : "text-white"
                              }`}>
                                {priceInRupees === 0 ? "FREE" : `₹${priceInRupees.toLocaleString("en-IN")}`}
                              </p>
                              {priceInRupees !== 0 && (
                                <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-white/35">INR · per attendee</p>
                              )}
                            </div>

                            {isSoldOut ? (
                              <div className="flex h-11 items-center justify-center gap-2 rounded-full bg-white/[0.06] text-[10px] font-semibold uppercase tracking-wider text-white/40">
                                <X className="h-3.5 w-3.5" /> Sold out
                              </div>
                            ) : isUnavailable ? (
                              <div className="flex min-h-11 items-center justify-center rounded-full bg-white/[0.06] px-3 text-center text-[9px] font-semibold uppercase tracking-wider text-white/40">
                                {isUpcoming ? "Sales not started" : isExpired ? "Sales ended" : "Unavailable"}
                              </div>
                            ) : existingTicket ? (
                              <div className="flex min-h-11 items-center justify-center rounded-full bg-white/[0.06] px-3 text-center text-[9px] font-semibold uppercase tracking-wider text-white/40">
                                Pass already issued
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggleSelectCategory(cat.id)}
                                aria-pressed={isSelected}
                                className={`flex h-11 items-center justify-center gap-2 rounded-full px-4 text-[10px] font-semibold uppercase tracking-[0.12em] transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e7a9ff] ${
                                  isSelected
                                      ? "bg-[#f4d9ff] text-[#17121f] hover:bg-white"
                                      : "bg-[#FF00D4] text-white shadow-[0_6px_20px_rgba(255,0,212,0.18)] hover:bg-[#e83cff]"
                                }`}
                              >
                                {isSelected ? <><Check className="h-3.5 w-3.5" /> Selected</> : <>Choose pass <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></>}
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>

                {/* Pass inclusions */}
                <section aria-labelledby="included-heading" className="mt-12 border-t border-white/10 py-8">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#c5a5ff]" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c5a5ff]">
                          Included with your ticket
                        </span>
                      </div>
                      <h2 id="included-heading" className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                        More than a seat. <span className="text-[#e7a9ff]">A full festival.</span>
                      </h2>
                    </div>
                    <p className="max-w-md text-xs text-white/60 leading-relaxed">
                      Guaranteed for all registered delegates regardless of pass tier. High-value cloud subscriptions and official certification credentials included.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
                    {universalPerks.map((perk, i) => {
                      const Icon = perk.icon
                      return (
                        <div
                          key={i}
                          className="group min-w-0"
                        >
                          <div className="mb-3 flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8B5CFF]/10 text-[#c5a5ff] transition group-hover:bg-[#8B5CFF]/20">
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="min-w-0 truncate text-[8px] uppercase tracking-wide text-white/40 sm:text-[9px] sm:tracking-wider">
                              {perk.tag}
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold leading-snug text-white transition group-hover:text-[#e7a9ff] sm:text-sm">
                            {perk.title}
                          </h4>
                          <p className="mt-1.5 text-[10px] leading-relaxed text-white/55 sm:text-xs">
                            {perk.description}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </section>
              </>
            )}

            {/* Compact selected-pass checkout action */}
            {selectedCategory && !existingTicket && (
              <aside
                aria-label="Checkout action bar"
                className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-3xl rounded-3xl border border-white/[0.1] bg-[#100c18]/95 p-4 shadow-[0_12px_50px_rgba(0,0,0,0.55)] ring-1 ring-[#FF00D4]/25 backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 sm:inset-x-4 sm:bottom-5 sm:p-5 sm:px-8"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF00D4]" />
                      <p className="truncate text-[9px] font-medium uppercase tracking-wide text-[#e7a9ff] sm:text-xs sm:tracking-wider">
                        <span className="hidden sm:inline">1 Pass Selected: </span>
                        <span className="text-white font-semibold">{selectedCategory.name}</span>
                      </p>
                    </div>
                    <p className="mt-1 whitespace-nowrap text-xl font-semibold text-white sm:text-3xl">
                      {totalAmount === 0 ? "FREE" : `₹${totalAmount.toLocaleString("en-IN")}`}{" "}
                      <span className="text-[9px] font-sans uppercase tracking-wider text-white/40 sm:text-xs sm:tracking-widest">
                        INR
                      </span>
                      {appliedCoupon && (
                        <span className="ml-2 text-xs font-mono text-emerald-400 font-normal">
                          ({appliedCoupon.discount_percent}% OFF)
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryId(null)}
                      aria-label="Remove selected pass"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/55 transition hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleStartCheckout}
                      disabled={checkingExisting || !!existingTicket}
                      className="flex h-11 min-w-0 items-center justify-center gap-2 rounded-full bg-[#FF00D4] px-4 text-[9px] font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[#e83cff] disabled:opacity-40 sm:h-12 sm:flex-none sm:gap-3 sm:px-8 sm:text-xs sm:tracking-[0.1em]"
                    >
                      <span className="sm:hidden">Review</span>
                      <span className="hidden sm:inline">Proceed to Review</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </aside>
            )}
          </div>
        )}

        {/* STEP 2: Order Review & Attendee Verification */}
        {checkoutStep === "review" && selectedCategory && (
          <div className="mx-auto mt-5 max-w-3xl rounded-[1.75rem] border border-white/[0.08] bg-[#121019] p-4 sm:mt-8 sm:p-8">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-5">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c5a5ff]">
                  Your pass
                </span>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Order Summary
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutStep("select")}
                className="shrink-0 rounded-full bg-white/[0.06] px-3 py-2 text-[10px] text-white/65 transition hover:bg-white/10 hover:text-white sm:px-4 sm:text-xs"
              >
                ← Change Pass
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex flex-col gap-2 border-b border-white/10 pb-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-white">{selectedCategory.name}</p>
                  <p className="text-xs text-white/50 font-sans">
                    1 Official Delegate Pass · 5-Day Admission
                  </p>
                </div>
                <span className="text-xl font-semibold text-white">
                  ₹{unitPrice.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 text-xs text-white/60">
                <span>Pass Allocation</span>
                <span className="text-white">1 Ticket (Single Attendee)</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-xs text-white/60">
                <span>GST & Conference Amenities</span>
                <span className="text-emerald-400">Included</span>
              </div>

              {/* Coupon Discount breakdown line if applied */}
              {appliedCoupon && (
                <div className="flex flex-col gap-1 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400 sm:flex-row sm:items-center sm:justify-between">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Tag className="h-3.5 w-3.5" />
                    Coupon Discount ({appliedCoupon.code} - {appliedCoupon.discount_percent}% OFF)
                  </span>
                  <span className="font-mono font-semibold">
                    -₹{discountAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-white/15 pt-5 text-lg text-white sm:flex-row sm:items-center sm:justify-between sm:text-xl">
                <div>
                  <span>Total Amount Due</span>
                  {appliedCoupon && (
                    <span className="ml-2 text-xs font-mono text-emerald-400 font-normal">
                      ({appliedCoupon.discount_percent}% OFF)
                    </span>
                  )}
                </div>
                <div className="text-left sm:text-right">
                  {appliedCoupon && (
                    <span className="block text-xs line-through text-white/40 font-mono">
                      ₹{unitPrice.toLocaleString("en-IN")} INR
                    </span>
                  )}
                  <span className="text-3xl font-semibold text-[#e7a9ff]">
                    {totalAmount === 0 ? "FREE" : `₹${totalAmount.toLocaleString("en-IN")}`}{" "}
                    <span className="text-xs text-white/50 uppercase font-sans">INR</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Promo / Coupon Code Section */}
            <div className="mt-6 rounded-2xl bg-black/25 p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="coupon-code" className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#c5a5ff]">
                  <Percent className="h-3.5 w-3.5" />
                  Have a Coupon or Referral Code?
                </label>
                {appliedCoupon && (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-400">
                    Active Code
                  </span>
                )}
              </div>

              {!appliedCoupon ? (
                <form onSubmit={handleApplyCoupon} className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <input
                      id="coupon-code"
                      type="text"
                      value={couponCodeInput}
                      onChange={(e) => {
                        setCouponCodeInput(e.target.value.toUpperCase())
                        setCouponError(null)
                        setCouponSuccess(null)
                      }}
                      placeholder="ENTER PROMO CODE (OPTIONAL)"
                      disabled={validatingCoupon}
                      className="w-full rounded-xl bg-[#09080f] px-4 py-3 text-xs uppercase tracking-wider text-white placeholder-white/30 outline-none ring-1 ring-white/15 transition focus:ring-2 focus:ring-[#FF00D4]/60"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={validatingCoupon || !couponCodeInput.trim()}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#FF00D4] px-6 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#e83cff] disabled:opacity-40 sm:h-auto"
                  >
                    {validatingCoupon ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </button>
                </form>
              ) : (
                <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                      <Tag className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-300">
                          {appliedCoupon.code}
                        </span>
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                          {appliedCoupon.discount_percent}% OFF
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-400/80">
                        Saving ₹{discountAmount.toLocaleString("en-IN")} on your festival pass
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="font-mono text-[11px] uppercase text-rose-400 hover:text-rose-300 underline underline-offset-2 transition"
                  >
                    Remove
                  </button>
                </div>
              )}

              {couponError && (
                <p className="mt-2 text-[11px] font-mono text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {couponError}
                </p>
              )}

              {couponSuccess && !couponError && (
                <p className="mt-2 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  {couponSuccess}
                </p>
              )}
            </div>

            {/* Attendee Profile Box */}
            <div className="mt-6 border-t border-white/10 pt-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-[#c5a5ff]">
                  Verified Attendee Profile
                </h3>
                <span className="text-[10px] font-mono text-emerald-400">Verified</span>
              </div>
              <div className="space-y-3 text-xs text-white/70">
                <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
                  <span className="text-white/40">Full Name</span>
                  <span className="min-w-0 break-words text-right font-medium text-white">
                    {user?.first_name} {user?.last_name}
                  </span>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
                  <span className="text-white/40">Email Address</span>
                  <span className="min-w-0 break-all text-right font-medium text-white">{user?.email}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-white/40">Phone Number</span>
                  <span className="text-right font-medium text-white">{user?.phone || "Not set"}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4">
              <button
                type="button"
                onClick={handleProceedPayment}
                disabled={isPaying || checkingExisting || !!existingTicket}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#FF00D4] text-xs font-semibold uppercase tracking-[0.1em] text-white transition-all hover:bg-[#e83cff] disabled:opacity-40"
              >
                {isPaying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing Reservation...</span>
                  </>
                ) : totalAmount === 0 ? (
                  <>
                    <Sparkles className="h-4 w-4 text-emerald-300" />
                    <span>Claim Free Pass (100% Off)</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Pay ₹{totalAmount.toLocaleString("en-IN")} via Razorpay</span>
                  </>
                )}
              </button>

              <p className="text-center text-[10px] text-white/40 font-mono">
                Fair-allocation policy: strictly 1 ticket per attendee account. Passes are non-transferable.
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: Gateway Processing */}
        {checkoutStep === "processing" && (
          <div className="mx-auto mt-8 max-w-md rounded-[1.75rem] border border-white/[0.08] bg-[#121019] p-8 text-center sm:mt-12 sm:p-12">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#e7a9ff]" />
            <h3 className="mt-6 text-xl font-semibold text-white">
              Processing Booking
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/60">{pollingStatus}</p>
            <p className="mt-6 text-xs text-white/35">
              Please do not close or reload this window.
            </p>
          </div>
        )}

        {/* STEP 4: Order Confirmed & Ticket Issued */}
        {checkoutStep === "success" && (
          <div className="mx-auto mt-8 max-w-2xl rounded-[1.75rem] border border-white/[0.08] bg-[#121019] p-5 text-center sm:mt-12 sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10">
              <Check className="h-8 w-8 text-emerald-400" />
            </div>

            <span className="mt-6 inline-block text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
              Admission confirmed
            </span>

            <h2 className="mt-3 font-serif text-3xl font-semibold text-white sm:text-5xl">
              Welcome to Re:Invent.
            </h2>

            <p className="mx-auto mt-4 max-w-md text-sm text-white/60">
              Your delegate pass and entry QR code have been issued to your official account.
            </p>

            {createdOrder && (
              <div className="mt-8 rounded-xl bg-black/35 p-5 text-left text-xs">
                <div className="flex justify-between py-1.5 border-b border-white/10">
                  <span className="text-white/40">Order Reference</span>
                  <span className="text-white">{createdOrder.id}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/10">
                  <span className="text-white/40">Pass Category</span>
                  <span className="text-white">{selectedCategory?.name || "Festival Pass"}</span>
                </div>
                {createdOrder.coupon_code && (
                  <div className="flex justify-between py-1.5 border-b border-white/10 text-emerald-400">
                    <span className="text-white/40">Coupon Applied</span>
                    <span>
                      {createdOrder.coupon_code} ({createdOrder.discount_percent}% OFF)
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 border-b border-white/10">
                  <span className="text-white/40">Final Amount Paid</span>
                  <span className="text-white">
                    {createdOrder.total_amount === 0
                      ? "FREE (100% Discount)"
                      : `₹${(createdOrder.total_amount / 100).toLocaleString("en-IN")} INR`}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-white/40">Admission Status</span>
                  <span className="text-emerald-400 uppercase font-semibold">Active & Valid</span>
                </div>
              </div>
            )}

            <div className="mt-6 border border-[#FF00D4]/40 bg-[#FF00D4]/10 p-4 text-xs font-mono text-white/90">
              <span className="font-bold text-[#FF2D87]">Action Required:</span> Also Create Account using{" "}
              <a
                href="https://builder.aws.com?inviteId=ba23057e-824f-4bed-b54d-379253ff527e"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FF00D4] underline hover:text-[#FF2D87] font-semibold break-all"
              >
                https://builder.aws.com?inviteId=ba23057e-824f-4bed-b54d-379253ff527e
              </a>{" "}
              this link before joining the event.
            </div>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-emerald-400 px-8 text-xs font-semibold text-black transition hover:bg-emerald-300 sm:w-auto"
              >
                <span>View Ticket in Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/schedule"
                className="flex h-12 w-full items-center justify-center rounded-full bg-white/[0.06] px-6 text-xs text-white/75 transition hover:bg-white/10 hover:text-white sm:w-auto"
              >
                Explore Festival Schedule
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
