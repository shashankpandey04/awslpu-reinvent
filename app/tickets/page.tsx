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
  Clock,
  Lock,
  Loader2,
  Info,
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
  ChevronRight,
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
    tag: "5 Days Included"
  }
]

export default function TicketsPage() {
  const router = useRouter()
  const { user, authenticated } = useAuth()

  const [categories, setCategories] = useState<TicketCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [existingTicket, setExistingTicket] = useState<Ticket | null>(null)
  const [checkingExisting, setCheckingExisting] = useState(false)

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

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050508] text-white">
      {/* Cyberpunk ambient lighting layers */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="absolute left-1/2 top-0 h-[650px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,255,0.18),transparent_65%)] blur-3xl" />
        <div className="absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,0,212,0.14),transparent_65%)] blur-3xl" />
        <div className="absolute bottom-10 left-10 h-[450px] w-[450px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.08),transparent_60%)] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1520px] px-4 pb-28 pt-28 sm:px-8 sm:pt-36 lg:px-12">
        {/* Step Flow Indicator */}
        <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-[#FF00D4] text-[10px] font-mono font-bold text-white shadow-[0_0_12px_rgba(255,0,212,0.6)]">
              AWS
            </span>
            <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-[#FF2D87]">
              Re:Invent 2026 // Registration Desk
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs font-mono">
            <span
              className={`flex items-center gap-1.5 px-3 py-1 border ${
                checkoutStep === "select"
                  ? "border-[#FF00D4] bg-[#FF00D4]/10 text-white font-semibold"
                  : "border-white/10 text-white/40"
              }`}
            >
              <span className="text-[#FF00D4]">01</span> Select Pass
            </span>
            <ChevronRight className="h-3 w-3 text-white/20" />
            <span
              className={`flex items-center gap-1.5 px-3 py-1 border ${
                checkoutStep === "review"
                  ? "border-[#FF00D4] bg-[#FF00D4]/10 text-white font-semibold"
                  : "border-white/10 text-white/40"
              }`}
            >
              <span className="text-[#8B5CFF]">02</span> Verification
            </span>
            <ChevronRight className="h-3 w-3 text-white/20" />
            <span
              className={`flex items-center gap-1.5 px-3 py-1 border ${
                checkoutStep === "success"
                  ? "border-emerald-500 bg-emerald-500/10 text-white font-semibold"
                  : "border-white/10 text-white/40"
              }`}
            >
              <span className="text-emerald-400">03</span> Entry QR
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col justify-between gap-8 border-b border-white/10 pb-10 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] px-3.5 py-1 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF00D4] animate-ping" />
              <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/80">
                Official Festival Passes & Tier Allocations
              </span>
            </div>

            <h1 className="text-[clamp(2.5rem,6.5vw,5.5rem)] font-light leading-[0.92] tracking-tight text-white">
              Choose your{" "}
              <span className="font-normal bg-gradient-to-r from-[#FF2D87] via-[#FF00D4] to-[#8B5CFF] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(255,0,212,0.35)]">
                pass.
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base">
              Secure your individual admission to AWS Re:Invent Fest 2026. Every verified pass includes full 5-day access to keynotes, hands-on workshops, hackathons, and catering at Lovely Professional University.
            </p>
          </div>

          {/* Quick Trust Signals Grid */}
          <div className="grid grid-cols-2 gap-2.5 text-xs text-white/60 sm:flex sm:flex-col sm:items-end sm:gap-2">
            <span className="flex items-center gap-2 border border-[#FF00D4]/30 bg-[#FF00D4]/10 px-3 py-1.5 text-[#FF2D87] font-mono text-[11px]">
              <Info className="h-3.5 w-3.5" />
              Strict Limit: 1 Pass / Attendee
            </span>
            <span className="flex items-center gap-2 border border-white/10 bg-white/[0.02] px-3 py-1.5 text-white/80 text-[11px] font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Razorpay 256-Bit TLS Checkout
            </span>
            <span className="flex items-center gap-2 border border-white/10 bg-white/[0.02] px-3 py-1.5 text-white/80 text-[11px] font-mono">
              <BadgeCheck className="h-3.5 w-3.5 text-[#8B5CFF]" />
              Instant Digital QR Delivery
            </span>
          </div>
        </div>

        {/* Existing Ticket Alert (If user already has an active ticket) */}
        {existingTicket && (
          <div className="mt-8 border border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 via-black/40 to-transparent p-6 shadow-[0_0_40px_rgba(16,185,129,0.15)] backdrop-blur-md">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-emerald-400 bg-emerald-400/10 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
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
                className="flex h-12 shrink-0 items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 px-7 text-xs font-semibold uppercase tracking-wider text-black font-mono shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:brightness-110 transition"
              >
                <span>Open Pass in Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Error notification banner */}
        {orderError && (
          <div className="mt-8 flex items-center justify-between border border-rose-500/50 bg-rose-950/20 p-4 text-xs text-rose-300 backdrop-blur-md">
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
          <div className="mt-10">
            {/* Live Inventory Status Bar if any tier is sold out */}
            {anySoldOut && (
              <div className="mb-8 flex items-center justify-between border border-rose-500/30 bg-rose-950/20 px-5 py-3 text-xs backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-rose-300">
                    High Demand Notice: One or more pass tiers are now SOLD OUT.
                  </span>
                </div>
                <span className="hidden font-mono text-[10px] uppercase text-rose-400/80 sm:inline">
                  Remaining Tiers Selling Fast
                </span>
              </div>
            )}

            {loadingCategories ? (
              <div className="flex flex-col items-center justify-center py-28 text-white/50">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#FF00D4] shadow-[0_0_20px_rgba(255,0,212,0.4)]" />
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
                {/* Modern Cyber Ticket Cards Grid */}
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
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
                      <div
                        key={cat.id}
                        className={`group relative flex flex-col justify-between border transition-all duration-300 ${
                          isSoldOut
                            ? "border-rose-500/40 bg-gradient-to-b from-rose-950/20 via-black/80 to-[#070509] shadow-[0_0_30px_rgba(244,63,94,0.1)] opacity-90"
                            : isSelected
                            ? "border-[#FF00D4] bg-gradient-to-b from-[#FF00D4]/20 via-black/60 to-black/80 shadow-[0_0_50px_rgba(255,0,212,0.3)] ring-1 ring-[#FF00D4]"
                            : isHighlight
                            ? "border-[#FF00D4]/60 bg-gradient-to-b from-[#FF00D4]/10 via-white/[0.02] to-black/60 shadow-[0_0_35px_rgba(255,0,212,0.12)] hover:border-[#FF00D4]"
                            : "border-white/10 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]"
                        }`}
                      >
                        {/* ========================================================= */}
                        {/* 1. VISIBLE FIRST: Prominent Header Banner */}
                        {/* ========================================================= */}
                        {isSoldOut ? (
                          <div className="w-full bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 border-b border-rose-500/50 px-6 py-3 flex items-center justify-between shadow-[0_4px_20px_rgba(244,63,94,0.25)]">
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                              </span>
                              <span className="font-mono text-xs font-black uppercase tracking-widest text-rose-200">
                                SOLD OUT // CAPACITY EXHAUSTED
                              </span>
                            </div>
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-300 bg-rose-500/30 px-2 py-0.5 border border-rose-500/40">
                              0 PASSES LEFT
                            </span>
                          </div>
                        ) : isHighlight ? (
                          <div className="w-full bg-gradient-to-r from-[#FF00D4]/25 via-[#8B5CFF]/20 to-[#FF00D4]/15 border-b border-[#FF00D4]/50 px-6 py-3 flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-[#FF2D87]">
                              <Sparkles className="h-3.5 w-3.5 text-[#FF00D4]" />
                              RECOMMENDED // BUILDER CHOICE
                            </span>
                            <span className="font-mono text-[10px] uppercase font-semibold tracking-wider text-emerald-400 bg-emerald-500/15 px-2 py-0.5 border border-emerald-500/30">
                              OPEN FOR BOOKING
                            </span>
                          </div>
                        ) : (
                          <div className="w-full bg-white/[0.02] border-b border-white/10 px-6 py-3 flex items-center justify-between">
                            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-white/50">
                              OFFICIAL FESTIVAL PASS
                            </span>
                            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20">
                              ACTIVE TIER
                            </span>
                          </div>
                        )}

                        {/* Card Body */}
                        <div className="p-8">
                          {/* Title & Badge */}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                                Pass Allocation Tier
                              </div>
                              <h3 className="mt-1 text-2xl font-light tracking-tight text-white group-hover:text-white transition">
                                {cat.name}
                              </h3>
                            </div>

                            {isSoldOut ? (
                              <span className="inline-block border border-rose-500/40 bg-rose-500/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-rose-400">
                                SOLD OUT
                              </span>
                            ) : (
                              <span className="inline-block border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white/60">
                                5-Day Entry
                              </span>
                            )}
                          </div>

                          {/* Price Display */}
                          <div className="relative mt-6 flex items-baseline gap-2 border-y border-white/10 py-5">
                            {priceInRupees === 0 ? (
                              <span className="text-4xl sm:text-5xl font-extralight tracking-tight text-emerald-400 font-mono">
                                FREE
                              </span>
                            ) : (
                              <span
                                className={`text-4xl sm:text-5xl font-extralight tracking-tight font-mono ${
                                  isSoldOut ? "text-white/40 line-through" : "text-white"
                                }`}
                              >
                                ₹{priceInRupees.toLocaleString("en-IN")}
                              </span>
                            )}
                            <div className="flex flex-col text-[11px] font-mono uppercase text-white/45">
                              <span>INR / 1 Delegate</span>
                              <span className="text-[9px] text-white/30">GST & Perks Included</span>
                            </div>

                            {/* Watermark badge on price if sold out */}
                            {isSoldOut && (
                              <span className="absolute right-0 top-1/2 -translate-y-1/2 border border-rose-500/50 bg-rose-950/80 px-3 py-1 font-mono text-[11px] font-extrabold uppercase tracking-widest text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                                Capacity Full
                              </span>
                            )}
                          </div>

                          {/* Description in markdown */}
                          <div className="ticket-description mt-5 text-xs leading-relaxed text-white/65 [&_p]:mb-2.5 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_li]:pl-1 [&_li]:marker:text-[#FF00D4] [&_strong]:font-semibold [&_strong]:text-white">
                            {cat.description?.trim() ? (
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {cat.description}
                              </ReactMarkdown>
                            ) : (
                              <p className="text-white/40">Includes complete 5-day event access, keynotes, and meals.</p>
                            )}
                          </div>

                          {/* Inventory / Timing Meta */}
                          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-mono">
                            <span className="flex items-center gap-1.5 text-white/50 text-[11px]">
                              <Clock className="h-3.5 w-3.5 text-[#FF2D87]" />
                              {subStatusText}
                            </span>
                            <span
                              className={`text-[11px] font-semibold ${
                                isSoldOut
                                  ? "text-rose-400"
                                  : isUnavailable
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                              }`}
                            >
                              {statusText}
                            </span>
                          </div>
                        </div>

                        {/* Card Action Footer */}
                        <div className="border-t border-white/10 bg-black/40 p-6">
                          {isSoldOut ? (
                            <div className="flex h-12 w-full items-center justify-center gap-2 border border-rose-500/30 bg-rose-950/30 font-mono text-xs font-bold uppercase tracking-wider text-rose-400 cursor-not-allowed">
                              <X className="h-4 w-4 text-rose-500" />
                              <span>Pass Sold Out (0 Available)</span>
                            </div>
                          ) : isUnavailable ? (
                            <div className="flex h-12 w-full items-center justify-center border border-white/15 bg-white/5 font-mono text-xs uppercase tracking-wider text-white/40 cursor-not-allowed">
                              {isUpcoming ? "Sales Not Started" : isExpired ? "Sales Window Ended" : "Unavailable"}
                            </div>
                          ) : existingTicket ? (
                            <div className="flex h-12 w-full items-center justify-center border border-white/10 bg-white/5 font-mono text-xs uppercase tracking-wider text-white/40 cursor-not-allowed">
                              Limit Reached (Pass Issued)
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleSelectCategory(cat.id)}
                              className={`flex h-12 w-full items-center justify-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.14em] transition-all duration-200 ${
                                isSelected
                                  ? "bg-[#FF00D4] text-white shadow-[0_0_30px_rgba(255,0,212,0.5)] ring-1 ring-white"
                                  : "border border-white/25 bg-white/[0.03] text-white hover:border-[#FF00D4] hover:bg-[#FF00D4]/10"
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="h-4 w-4" />
                                  <span>Selected Pass (1)</span>
                                </>
                              ) : (
                                <>
                                  <span>Select Pass</span>
                                  <ArrowRight className="h-4 w-4 text-white/50 group-hover:translate-x-1 transition" />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Universal Perks Cyber Grid */}
                <div className="mt-20 border border-white/10 bg-gradient-to-b from-white/[0.03] via-black/40 to-black/80 p-6 sm:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                  <div className="mb-10 flex flex-col gap-3 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#FF00D4]" />
                        <span className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-[#FF2D87]">
                          Festival Inclusions Matrix
                        </span>
                      </div>
                      <h2 className="text-2xl font-light tracking-tight text-white sm:text-4xl">
                        Included with{" "}
                        <span className="bg-gradient-to-r from-[#FF2D87] via-[#FF00D4] to-[#8B5CFF] bg-clip-text text-transparent font-normal">
                          Every Pass
                        </span>
                      </h2>
                    </div>
                    <p className="max-w-md text-xs text-white/60 leading-relaxed">
                      Guaranteed for all registered delegates regardless of pass tier. High-value cloud subscriptions and official certification credentials included.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {universalPerks.map((perk, i) => {
                      const Icon = perk.icon
                      return (
                        <div
                          key={i}
                          className="group relative border border-white/10 bg-white/[0.02] p-5 transition-all duration-200 hover:border-[#FF00D4]/60 hover:bg-white/[0.05]"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-[#FF00D4]/10 text-[#FF2D87] border border-[#FF00D4]/20 group-hover:bg-[#FF00D4] group-hover:text-white transition">
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="text-[9px] font-mono uppercase tracking-wider text-white/40 border border-white/10 px-2 py-0.5">
                              {perk.tag}
                            </span>
                          </div>
                          <h4 className="font-semibold text-sm text-white group-hover:text-[#FF2D87] transition">
                            {perk.title}
                          </h4>
                          <p className="mt-1.5 text-xs text-white/55 leading-relaxed">
                            {perk.description}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Floating Sticky Checkout Bar */}
            {selectedCategory && !existingTicket && (
              <aside
                aria-label="Checkout action bar"
                className="fixed bottom-6 inset-x-4 z-40 mx-auto max-w-3xl border border-[#FF00D4] bg-[#0c0816]/95 p-5 shadow-[0_0_60px_rgba(255,0,212,0.35)] backdrop-blur-xl sm:px-8 animate-in fade-in slide-in-from-bottom-4 duration-300"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#FF00D4] animate-pulse" />
                      <p className="text-xs font-mono uppercase tracking-wider text-[#FF2D87]">
                        1 Pass Selected: <span className="text-white font-semibold">{selectedCategory.name}</span>
                      </p>
                    </div>
                    <p className="mt-1 text-2xl sm:text-3xl font-extralight text-white font-mono">
                      {totalAmount === 0 ? "FREE" : `₹${totalAmount.toLocaleString("en-IN")}`}{" "}
                      <span className="text-xs uppercase text-white/40 tracking-widest font-sans">
                        INR / Total
                      </span>
                      {appliedCoupon && (
                        <span className="ml-2 text-xs font-mono text-emerald-400 font-normal">
                          ({appliedCoupon.discount_percent}% OFF)
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryId(null)}
                      className="px-4 py-3 text-xs font-mono uppercase text-white/50 hover:text-white transition"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleStartCheckout}
                      disabled={checkingExisting || !!existingTicket}
                      className="flex h-12 items-center justify-center gap-3 bg-gradient-to-r from-[#FF00D4] to-[#702cff] px-8 font-mono text-xs font-bold uppercase tracking-[0.16em] text-white shadow-[0_0_25px_rgba(255,0,212,0.4)] hover:brightness-110 transition disabled:opacity-40"
                    >
                      <span>Proceed to Review</span>
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
          <div className="mx-auto mt-12 max-w-2xl border border-white/15 bg-gradient-to-b from-white/[0.04] to-black/80 p-8 sm:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF00D4]">
                  Step 02 of 02 // Final Verification
                </span>
                <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-white mt-1">
                  Order Summary
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutStep("select")}
                className="font-mono text-xs uppercase text-white/50 hover:text-white transition"
              >
                ← Change Pass
              </button>
            </div>

            <div className="mt-8 space-y-4 font-mono">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 text-sm">
                <div>
                  <p className="font-semibold text-white">{selectedCategory.name}</p>
                  <p className="text-xs text-white/50 font-sans">
                    1 Official Delegate Pass · 5-Day Admission
                  </p>
                </div>
                <span className="text-lg font-light text-white">
                  ₹{unitPrice.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs text-white/60">
                <span>Pass Allocation</span>
                <span className="text-white">1 Ticket (Single Attendee)</span>
              </div>
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>GST & Conference Amenities</span>
                <span className="text-emerald-400">Included</span>
              </div>

              {/* Coupon Discount breakdown line if applied */}
              {appliedCoupon && (
                <div className="flex items-center justify-between text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Tag className="h-3.5 w-3.5" />
                    Coupon Discount ({appliedCoupon.code} - {appliedCoupon.discount_percent}% OFF)
                  </span>
                  <span className="font-mono font-semibold">
                    -₹{discountAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-white/15 pt-6 text-lg sm:text-xl font-light text-white">
                <div>
                  <span>Total Amount Due</span>
                  {appliedCoupon && (
                    <span className="ml-2 text-xs font-mono text-emerald-400 font-normal">
                      ({appliedCoupon.discount_percent}% OFF)
                    </span>
                  )}
                </div>
                <div className="text-right">
                  {appliedCoupon && (
                    <span className="block text-xs line-through text-white/40 font-mono">
                      ₹{unitPrice.toLocaleString("en-IN")} INR
                    </span>
                  )}
                  <span className="text-3xl font-light text-[#FF00D4] font-mono">
                    {totalAmount === 0 ? "FREE" : `₹${totalAmount.toLocaleString("en-IN")}`}{" "}
                    <span className="text-xs text-white/50 uppercase font-sans">INR</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Promo / Coupon Code Section */}
            <div className="mt-6 border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="coupon-code" className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#FF2D87]">
                  <Percent className="h-3.5 w-3.5" />
                  Have a Coupon or Referral Code?
                </label>
                {appliedCoupon && (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5">
                    Active Code
                  </span>
                )}
              </div>

              {!appliedCoupon ? (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
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
                      className="w-full border border-white/15 bg-black/60 px-4 py-3 font-mono text-xs uppercase tracking-wider text-white placeholder-white/30 focus:border-[#FF00D4] focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={validatingCoupon || !couponCodeInput.trim()}
                    className="flex items-center justify-center gap-2 border border-[#FF00D4] bg-[#FF00D4]/20 px-6 font-mono text-xs font-semibold uppercase tracking-wider text-[#FF2D87] hover:bg-[#FF00D4] hover:text-white transition disabled:opacity-40"
                  >
                    {validatingCoupon ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between border border-emerald-500/30 bg-emerald-950/20 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-emerald-500/20 text-emerald-400">
                      <Tag className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-300">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5">
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
            <div className="mt-10 border border-white/10 bg-black/40 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#8B5CFF]">
                  Verified Attendee Profile
                </h3>
                <span className="text-[10px] font-mono text-emerald-400">Verified</span>
              </div>
              <div className="space-y-3 text-xs text-white/70">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-white/40">Full Name</span>
                  <span className="text-white font-medium">
                    {user?.first_name} {user?.last_name}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-white/40">Email Address</span>
                  <span className="text-white font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Phone Number</span>
                  <span className="text-white font-medium">{user?.phone || "Not set"}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4">
              <button
                type="button"
                onClick={handleProceedPayment}
                disabled={isPaying || checkingExisting || !!existingTicket}
                className="flex h-14 w-full items-center justify-center gap-3 bg-gradient-to-r from-[#FF00D4] to-[#702cff] font-mono text-xs font-bold uppercase tracking-[0.18em] text-white shadow-[0_0_35px_rgba(255,0,212,0.4)] transition-all hover:brightness-110 disabled:opacity-40"
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
          <div className="mx-auto mt-20 max-w-md border border-[#FF00D4]/40 bg-black/60 p-12 text-center backdrop-blur-xl shadow-[0_0_50px_rgba(255,0,212,0.2)]">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#FF00D4]" />
            <h3 className="mt-6 text-xl font-light text-white font-mono uppercase tracking-wider">
              Processing Booking
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-white/60 font-mono">{pollingStatus}</p>
            <p className="mt-6 text-[10px] text-white/35 font-mono">
              Please do not close or reload this window.
            </p>
          </div>
        )}

        {/* STEP 4: Order Confirmed & Ticket Issued */}
        {checkoutStep === "success" && (
          <div className="mx-auto mt-12 max-w-2xl border border-emerald-400/50 bg-gradient-to-b from-emerald-950/20 via-black/80 to-black/90 p-8 text-center sm:p-14 shadow-[0_0_60px_rgba(16,185,129,0.2)] backdrop-blur-md">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400 bg-emerald-400/10 shadow-[0_0_30px_rgba(52,211,153,0.3)]">
              <Check className="h-8 w-8 text-emerald-400" />
            </div>

            <span className="mt-6 inline-block font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              Admission Confirmed // Digital Pass Issued
            </span>

            <h2 className="mt-3 text-3xl font-light text-white sm:text-5xl">
              Welcome to Re:Invent.
            </h2>

            <p className="mx-auto mt-4 max-w-md text-sm text-white/60">
              Your delegate pass and entry QR code have been issued to your official account.
            </p>

            {createdOrder && (
              <div className="mt-8 border border-white/10 bg-black/60 p-6 text-left text-xs font-mono">
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
                className="flex h-12 w-full sm:w-auto items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 px-8 font-mono text-xs font-bold uppercase tracking-[0.14em] text-black shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:brightness-110 transition"
              >
                <span>View Ticket in Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/schedule"
                className="flex h-12 w-full sm:w-auto items-center justify-center border border-white/20 px-6 font-mono text-xs uppercase tracking-[0.14em] text-white/70 hover:border-white hover:text-white transition"
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
