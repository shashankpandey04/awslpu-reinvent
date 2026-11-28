"use client"

import { useEffect, useState, useMemo } from "react"
import {
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  X,
  Loader2,
  Search,
  Check,
  Building2,
  Mic2,
  ChevronDown,
  ChevronUp,
  Tag
} from "lucide-react"
import type { Workshop, WorkshopSlot, WorkshopRegistration } from "@/types/workshop"
import type { AuthUser } from "@/types/auth"

interface WorkshopTabProps {
  user: AuthUser
}

export function WorkshopTab({ user }: WorkshopTabProps) {
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [myRegistrations, setMyRegistrations] = useState<WorkshopRegistration[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTrack, setSelectedTrack] = useState("all")
  const [selectedDate, setSelectedDate] = useState("all")
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({})

  // Action states
  const [registeringSlotId, setRegisteringSlotId] = useState<string | null>(null)
  const [cancellingRegId, setCancellingRegId] = useState<string | null>(null)

  // Change modal
  const [changeModalOpen, setChangeModalOpen] = useState(false)
  const [changingReg, setChangingReg] = useState<WorkshopRegistration | null>(null)
  const [targetWorkshopId, setTargetWorkshopId] = useState<string>("")
  const [targetSlotId, setTargetSlotId] = useState<string>("")
  const [changingLoading, setChangingLoading] = useState(false)

  // Toast
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)

  function showMessage(type: "success" | "error", text: string) {
    setFeedback({ type, text })
    setTimeout(() => setFeedback(null), 5000)
  }

  async function loadData() {
    try {
      setLoading(true)
      const [wRes, rRes] = await Promise.all([
        fetch("/api/workshops"),
        fetch("/api/workshops/registrations")
      ])

      if (wRes.ok) {
        const wData = await wRes.json()
        setWorkshops(Array.isArray(wData) ? wData : [])
      }

      if (rRes.ok) {
        const rData = await rRes.json()
        setMyRegistrations(Array.isArray(rData) ? rData : [])
      }
    } catch {
      showMessage("error", "Failed to load workshops. Please refresh the page.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Map of daily registration counts (max 2/day constraint)
  const dailyRegCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    myRegistrations.forEach((r) => {
      counts[r.date] = (counts[r.date] || 0) + 1
    })
    return counts
  }, [myRegistrations])

  // Unique festival dates detected across all workshops
  const festivalDates = useMemo(() => {
    const dates = new Set<string>()
    workshops.forEach((w) => w.slots.forEach((s) => dates.add(s.date)))
    const arr = Array.from(dates).sort()
    return arr.length > 0 ? arr : ["2026-11-30", "2026-12-01", "2026-12-02"]
  }, [workshops])

  // Unique tracks for filter
  const availableTracks = useMemo(() => {
    const tracks = new Set<string>()
    workshops.forEach((w) => tracks.add(w.track))
    return Array.from(tracks)
  }, [workshops])

  // Filtered workshops
  const filteredWorkshops = useMemo(() => {
    return workshops.filter((w) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        q === "" ||
        w.title.toLowerCase().includes(q) ||
        w.track.toLowerCase().includes(q) ||
        w.instructor_name.toLowerCase().includes(q) ||
        (w.speaker && w.speaker.full_name.toLowerCase().includes(q)) ||
        (w.speaker && w.speaker.company?.toLowerCase().includes(q)) ||
        (w.venue && w.venue.name.toLowerCase().includes(q)) ||
        w.slots.some((s) => s.venue_name.toLowerCase().includes(q)) ||
        w.tags.some((t) => t.toLowerCase().includes(q))

      const matchesTrack = selectedTrack === "all" || w.track === selectedTrack
      const matchesDate = selectedDate === "all" || w.slots.some((s) => s.date === selectedDate)

      return matchesSearch && matchesTrack && matchesDate
    })
  }, [workshops, searchQuery, selectedTrack, selectedDate])

  // Register
  async function handleRegister(workshopId: string, slotId: string, slotDate: string) {
    if (user.is_blocked) {
      showMessage("error", `Account suspended: ${user.blocked_reason || "Registration restricted."}`)
      return
    }

    const currentDayCount = dailyRegCounts[slotDate] || 0
    if (currentDayCount >= 2) {
      showMessage("error", `Daily limit reached: Maximum 2 workshops allowed on ${slotDate}.`)
      return
    }

    try {
      setRegisteringSlotId(slotId)
      const res = await fetch("/api/workshops/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workshop_id: workshopId, slot_id: slotId })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || data.message || "Registration failed")
      }

      showMessage("success", `Registered for "${data.workshop_title || 'Workshop'}"!`)
      await loadData()
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : "Error registering for workshop")
    } finally {
      setRegisteringSlotId(null)
    }
  }

  // Cancel
  async function handleCancel(registrationId: string, workshopTitle: string) {
    if (!confirm(`Cancel registration for "${workshopTitle}"? Your spot will be released immediately.`)) {
      return
    }

    try {
      setCancellingRegId(registrationId)
      const res = await fetch(`/api/workshops/registrations/${registrationId}`, {
        method: "DELETE"
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || data.message || "Cancellation failed")
      }

      showMessage("success", `Cancelled registration. Spot released.`)
      await loadData()
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : "Error cancelling registration")
    } finally {
      setCancellingRegId(null)
    }
  }

  // Change slot modal
  function openChangeModal(reg: WorkshopRegistration) {
    setChangingReg(reg)
    setTargetWorkshopId(reg.workshop_id)
    setTargetSlotId(reg.slot_id)
    setChangeModalOpen(true)
  }

  async function handleConfirmChange() {
    if (!changingReg || !targetWorkshopId || !targetSlotId) return

    if (targetWorkshopId === changingReg.workshop_id && targetSlotId === changingReg.slot_id) {
      setChangeModalOpen(false)
      return
    }

    try {
      setChangingLoading(true)
      const res = await fetch(`/api/workshops/registrations/${changingReg.id}/change`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_workshop_id: targetWorkshopId,
          new_slot_id: targetSlotId
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || data.message || "Failed to switch registration")
      }

      showMessage("success", `Switched to "${data.workshop_title}" on ${data.date}!`)
      setChangeModalOpen(false)
      await loadData()
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : "Error switching workshop")
    } finally {
      setChangingLoading(false)
    }
  }

  const selectedTargetWorkshop = useMemo(() => {
    return workshops.find((w) => w.id === targetWorkshopId) || null
  }, [workshops, targetWorkshopId])

  const toggleDescription = (id: string) => {
    setExpandedDescriptions((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast */}
      {feedback && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-xs shadow-lg transition-all ${
            feedback.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-200"
              : "bg-rose-950/80 border-rose-500/40 text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-white/40 hover:text-white p-0.5">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Concise Header & Daily Quota Summary */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c0914] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-[#FF00D4]/15 text-[#FF00D4]">
              <GraduationCap className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">Workshops & Labs</h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-white/60 border border-white/[0.08]">
              {myRegistrations.length} Booked
            </span>
          </div>
          <p className="mt-1 text-xs text-white/50">
            Register for up to <strong>2 workshops per day</strong>. Switch slots anytime if spots are open.
          </p>
        </div>

        {/* Compact Daily Quota Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {festivalDates.map((dateStr, idx) => {
            const count = dailyRegCounts[dateStr] || 0
            const isFull = count >= 2

            return (
              <div
                key={dateStr}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
                  isFull
                    ? "border-[#FF00D4]/40 bg-[#FF00D4]/10 text-[#ff8ce9]"
                    : count > 0
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-white/[0.08] bg-white/[0.02] text-white/60"
                }`}
              >
                <span className="text-[11px] font-sans font-medium text-white/80">Day {idx + 1} ({dateStr.slice(5)}):</span>
                <span className="font-bold">
                  {count}/2 {isFull ? "(Full)" : "booked"}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* My Registrations (Only shown when user has bookings or while loading) */}
      {myRegistrations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              My Reserved Seats ({myRegistrations.length})
            </h3>
            <span className="text-[11px] text-white/40">Guaranteed seat reserved on your badge</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myRegistrations.map((reg) => (
              <div
                key={reg.id}
                className="rounded-xl border border-emerald-500/30 bg-[#0f1412] p-3.5 flex flex-col justify-between gap-3 shadow-sm hover:border-emerald-500/50 transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#6C00FF]/25 border border-[#6C00FF]/40 text-[#d8b4fe]">
                      {reg.track}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Confirmed
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white leading-tight">{reg.workshop_title}</h4>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/70 pt-0.5">
                    <span className="flex items-center gap-1 text-white font-medium">
                      <Calendar className="h-3 w-3 text-[#FF00D4]" />
                      {reg.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-white/40" />
                      {reg.start_time} - {reg.end_time}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-300 font-medium truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {reg.venue_name} {reg.room ? `(${reg.room})` : ""}
                    </span>
                  </div>

                  {reg.instructor_name && (
                    <div className="text-[11px] text-white/50 flex items-center gap-1">
                      <Mic2 className="h-3 w-3 text-white/30" />
                      Instructor: <strong className="text-white/80">{reg.instructor_name}</strong>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <button
                    onClick={() => openChangeModal(reg)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-white/80 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] px-2.5 py-1 rounded-lg border border-white/[0.08] transition"
                  >
                    <ArrowRightLeft className="h-3 w-3 text-[#FF00D4]" />
                    Switch Slot
                  </button>

                  <button
                    onClick={() => handleCancel(reg.id, reg.workshop_title)}
                    disabled={cancellingRegId === reg.id}
                    className="text-xs text-white/40 hover:text-rose-400 px-2 py-1 transition flex items-center gap-1"
                  >
                    {cancellingRegId === reg.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Cancel Seat"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Row: Search + Track + Date */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workshops, speakers, topics, venues..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-white/[0.1] bg-[#120d1c] text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#FF00D4]"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
            className="text-xs rounded-xl border border-white/[0.1] bg-[#120d1c] px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[#FF00D4]"
          >
            <option value="all">All Tracks ({availableTracks.length})</option>
            {availableTracks.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs rounded-xl border border-white/[0.1] bg-[#120d1c] px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[#FF00D4]"
          >
            <option value="all">All Dates ({festivalDates.length})</option>
            {festivalDates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Workshop Catalog */}
      {loading ? (
        <div className="py-12 text-center rounded-2xl border border-white/[0.06] bg-white/[0.01]">
          <Loader2 className="h-5 w-5 text-[#FF00D4] animate-spin mx-auto mb-2" />
          <p className="text-xs text-white/40">Loading workshops...</p>
        </div>
      ) : filteredWorkshops.length === 0 ? (
        <div className="py-10 text-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01]">
          <GraduationCap className="h-8 w-8 text-white/20 mx-auto mb-1.5" />
          <p className="text-xs font-semibold text-white/70">No workshops found</p>
          <p className="text-[11px] text-white/40 mt-0.5">Try clearing your search query or track filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWorkshops.map((w) => {
            const userRegForThisWorkshop = myRegistrations.find((r) => r.workshop_id === w.id)
            const isDescExpanded = !!expandedDescriptions[w.id]
            const isLongDesc = (w.description || "").length > 180

            return (
              <div
                key={w.id}
                className="rounded-2xl border border-white/[0.08] bg-[#0c0914] overflow-hidden shadow-sm hover:border-white/[0.15] transition"
              >
                {/* Workshop Header Card */}
                <div className="p-4 sm:p-5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#FF00D4]/15 border border-[#FF00D4]/30 text-[#ff80e5]">
                        {w.track}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] bg-white/[0.06] text-white/70 border border-white/[0.08]">
                        {w.level}
                      </span>
                      <span className="text-[11px] text-white/40 flex items-center gap-1 ml-1">
                        <Clock className="h-3 w-3" /> {w.duration_minutes}m
                      </span>
                    </div>

                    {userRegForThisWorkshop && (
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Registered
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white leading-snug">{w.title}</h3>

                  {/* Speaker / Instructor Info */}
                  <div className="flex items-center gap-2 text-xs text-white/75">
                    <Mic2 className="h-3.5 w-3.5 text-[#FF00D4] shrink-0" />
                    <span className="font-semibold text-white">
                      {w.speaker?.full_name || w.instructor_name}
                    </span>
                    {(w.speaker?.designation || w.speaker?.company) && (
                      <span className="text-[11px] text-white/40 truncate">
                        • {w.speaker.designation} {w.speaker.company ? `(${w.speaker.company})` : ""}
                      </span>
                    )}
                  </div>

                  {/* Description (Clamped for conciseness) */}
                  {w.description && (
                    <div className="text-xs text-white/60 leading-relaxed">
                      <p className={isDescExpanded ? "" : "line-clamp-2"}>{w.description}</p>
                      {isLongDesc && (
                        <button
                          type="button"
                          onClick={() => toggleDescription(w.id)}
                          className="text-[11px] text-[#FF00D4] hover:underline mt-0.5 flex items-center gap-0.5"
                        >
                          {isDescExpanded ? (
                            <>Show less <ChevronUp className="h-3 w-3" /></>
                          ) : (
                            <>Read more <ChevronDown className="h-3 w-3" /></>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Prerequisites Tags (compact) */}
                  {w.prerequisites.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <span className="text-[10px] text-white/40 uppercase font-semibold mr-1">Reqs:</span>
                      {w.prerequisites.map((p, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-white/[0.04] text-white/60 border border-white/[0.08] px-2 py-0.5 rounded"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Slots List (Concise interactive pills) */}
                <div className="border-t border-white/[0.06] bg-white/[0.015] p-3 sm:p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2 flex items-center justify-between">
                    <span>Available Venues & Day Slots ({w.slots.length})</span>
                    <span className="text-[10px] font-normal normal-case text-white/40">Select a slot to reserve your seat</span>
                  </div>

                  {w.slots.length === 0 ? (
                    <p className="text-xs text-white/40 italic py-1">Slots for this workshop will be scheduled shortly.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {w.slots.map((slot) => {
                        const isRegisteredHere = userRegForThisWorkshop?.slot_id === slot.slot_id
                        const isFull = slot.available_spots <= 0
                        const dayCount = dailyRegCounts[slot.date] || 0
                        const isDailyLimitReached = dayCount >= 2 && !isRegisteredHere
                        const isRegistering = registeringSlotId === slot.slot_id

                        return (
                          <div
                            key={slot.slot_id}
                            className={`rounded-xl border p-2.5 flex flex-col justify-between gap-2 transition ${
                              isRegisteredHere
                                ? "border-emerald-500/40 bg-emerald-500/10"
                                : isFull
                                ? "border-white/[0.05] bg-white/[0.01] opacity-60"
                                : "border-white/[0.08] bg-[#120d1c] hover:border-[#FF00D4]/30"
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-white flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-[#FF00D4]" />
                                  {slot.date}
                                </span>
                                <span className="text-[10px] font-mono text-white/50">
                                  {slot.start_time}-{slot.end_time}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-white/70">
                                <span className="flex items-center gap-1 truncate text-white/80">
                                  <MapPin className="h-3 w-3 text-emerald-400 shrink-0" />
                                  <span className="truncate">{slot.venue_name}</span>
                                </span>
                                <span
                                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                    isRegisteredHere
                                      ? "text-emerald-300"
                                      : isFull
                                      ? "text-rose-400"
                                      : "text-white/60"
                                  }`}
                                >
                                  {isRegisteredHere ? "YOUR SEAT" : isFull ? "FULL" : `${slot.available_spots} left`}
                                </span>
                              </div>
                            </div>

                            {/* Slot action button */}
                            <div>
                              {isRegisteredHere ? (
                                <div className="w-full py-1 text-center text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                  ✓ Registered
                                </div>
                              ) : isFull ? (
                                <button
                                  disabled
                                  className="w-full py-1 text-[11px] text-white/30 bg-white/[0.02] rounded-lg border border-white/[0.05] cursor-not-allowed"
                                >
                                  Full (0 spots)
                                </button>
                              ) : isDailyLimitReached ? (
                                <button
                                  disabled
                                  title={`Daily limit reached: 2 workshops registered on ${slot.date}`}
                                  className="w-full py-1 text-[11px] text-amber-300/80 bg-amber-500/10 rounded-lg border border-amber-500/20 cursor-not-allowed font-medium"
                                >
                                  Day Limit Reached (2/2)
                                </button>
                              ) : userRegForThisWorkshop ? (
                                <button
                                  onClick={() => handleRegister(w.id, slot.slot_id, slot.date)}
                                  disabled={isRegistering}
                                  className="w-full py-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition flex items-center justify-center gap-1"
                                >
                                  {isRegistering ? <Loader2 className="h-3 w-3 animate-spin" /> : "Switch to this slot"}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleRegister(w.id, slot.slot_id, slot.date)}
                                  disabled={isRegistering}
                                  className="w-full py-1 text-[11px] font-semibold text-white bg-[#FF00D4] hover:bg-[#FF2D87] shadow-xs rounded-lg transition flex items-center justify-center gap-1"
                                >
                                  {isRegistering ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    `Claim Seat (${slot.available_spots} open)`
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Concise Modal: Change Workshop Slot */}
      {changeModalOpen && changingReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-white/[0.12] bg-[#0c0914] p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <ArrowRightLeft className="h-4 w-4 text-[#FF00D4]" />
                Switch Workshop Seat
              </h3>
              <button onClick={() => setChangeModalOpen(false)} className="text-white/40 hover:text-white p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Current Held Seat */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-2.5 text-xs">
              <span className="text-[10px] uppercase font-bold text-white/40">Current Seat:</span>
              <p className="font-semibold text-white truncate">{changingReg.workshop_title}</p>
              <p className="text-white/60 text-[11px]">
                {changingReg.date} · {changingReg.start_time}-{changingReg.end_time} ({changingReg.venue_name})
              </p>
            </div>

            {/* Target Workshop Selector */}
            <div className="space-y-2 text-xs">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/60">
                1. Select Target Workshop
              </label>
              <select
                value={targetWorkshopId}
                onChange={(e) => {
                  const nextWId = e.target.value
                  setTargetWorkshopId(nextWId)
                  const targetW = workshops.find((w) => w.id === nextWId)
                  if (targetW && targetW.slots.length > 0) {
                    setTargetSlotId(targetW.slots[0].slot_id)
                  }
                }}
                className="w-full text-xs rounded-xl border border-white/[0.12] bg-[#17131e] px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[#FF00D4]"
              >
                {workshops.map((w) => (
                  <option key={w.id} value={w.id}>
                    [{w.track}] {w.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Slot Selector */}
            {selectedTargetWorkshop && (
              <div className="space-y-1.5 text-xs">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/60">
                  2. Select Available Slot
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {selectedTargetWorkshop.slots.map((slot) => {
                    const isCurrent =
                      targetWorkshopId === changingReg.workshop_id && slot.slot_id === changingReg.slot_id
                    const isEmpty = slot.available_spots > 0 || isCurrent
                    const isSelected = targetSlotId === slot.slot_id

                    return (
                      <button
                        key={slot.slot_id}
                        type="button"
                        disabled={!isEmpty}
                        onClick={() => setTargetSlotId(slot.slot_id)}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition flex items-center justify-between ${
                          isSelected
                            ? "border-[#FF00D4] bg-[#FF00D4]/15"
                            : !isEmpty
                            ? "border-white/[0.04] bg-white/[0.01] opacity-40 cursor-not-allowed"
                            : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06]"
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-white">
                            {slot.date} · {slot.start_time}-{slot.end_time}
                          </div>
                          <div className="text-[11px] text-white/50">{slot.venue_name}</div>
                        </div>

                        <div className="text-right text-[10px] font-mono">
                          {isCurrent ? (
                            <span className="text-emerald-400 font-semibold">Current</span>
                          ) : !isEmpty ? (
                            <span className="text-rose-400">Full</span>
                          ) : (
                            <span className="text-emerald-300">{slot.available_spots} open</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 border-t border-white/[0.08] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setChangeModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white/60 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmChange}
                disabled={changingLoading || !targetSlotId}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#FF00D4] hover:bg-[#FF2D87] rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1"
              >
                {changingLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm Switch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
