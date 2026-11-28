import { NextResponse } from "next/server"
import { backendFetch, backendJson } from "@/lib/api/backend"
import type { PopulatedSession, Speaker, Venue } from "@/types/schedule"

interface WorkshopSlot {
  slot_id: string
  date: string
  start_time: string
  end_time: string
  venue_id: string
  venue_name: string
  building?: string
  room?: string
  capacity: number
  registered_count: number
  available_spots: number
  is_active: boolean
}

interface WorkshopItem {
  id: string
  title: string
  track: string
  description: string
  venue_id?: string | null
  venue_ids?: string[]
  speaker_id?: string | null
  speaker_ids?: string[]
  speaker?: any
  speakers?: any[]
  instructor_name: string
  instructor_bio?: string | null
  level: string
  duration_minutes: number
  prerequisites: string[]
  tags: string[]
  slots: WorkshopSlot[]
  total_capacity: number
  total_registered: number
  is_active: boolean
}

export async function GET() {
  try {
    const [workshopsRes, speakersRes, venuesRes] = await Promise.allSettled([
      backendFetch("/api/v1/workshops/"),
      backendFetch("/api/v1/speakers/"),
      backendFetch("/api/v1/venues/")
    ])

    let rawWorkshops: WorkshopItem[] = []
    let speakers: Speaker[] = []
    let venues: Venue[] = []

    if (speakersRes.status === "fulfilled" && speakersRes.value.ok) {
      const data = await backendJson<Speaker[]>(speakersRes.value).catch(() => null)
      if (Array.isArray(data)) {
        speakers = data
      }
    }

    if (venuesRes.status === "fulfilled" && venuesRes.value.ok) {
      const data = await backendJson<Venue[]>(venuesRes.value).catch(() => null)
      if (Array.isArray(data)) {
        venues = data
      }
    }

    if (workshopsRes.status === "fulfilled" && workshopsRes.value.ok) {
      const data = await backendJson<WorkshopItem[]>(workshopsRes.value).catch(() => null)
      if (Array.isArray(data)) {
        rawWorkshops = data
      }
    }

    const speakerMap = new Map<string, Speaker>(speakers.map((s) => [s.id, s]))
    const venueMap = new Map<string, Venue>(venues.map((v) => [v.id, v]))

    const populatedSessions: PopulatedSession[] = []

    for (const workshop of rawWorkshops) {
      if (!workshop.is_active) continue

      // Resolve speakers
      const assignedSpeakers: Speaker[] = []
      const speakerIds = workshop.speaker_ids || (workshop.speaker_id ? [workshop.speaker_id] : [])

      for (const sid of speakerIds) {
        const found = speakerMap.get(sid)
        if (found) {
          assignedSpeakers.push(found)
        }
      }

      if (assignedSpeakers.length === 0 && workshop.speaker) {
        assignedSpeakers.push({
          id: workshop.speaker.id || "spk-0",
          full_name: workshop.speaker.full_name || workshop.instructor_name,
          designation: workshop.speaker.designation || "Instructor",
          company: workshop.speaker.company || "AWS",
          bio: workshop.speaker.bio || workshop.instructor_bio || "",
          profile_picture: workshop.speaker.profile_picture,
          socials: {},
          topics: workshop.tags || [workshop.track]
        })
      } else if (assignedSpeakers.length === 0 && workshop.instructor_name) {
        assignedSpeakers.push({
          id: "spk-inst",
          full_name: workshop.instructor_name,
          designation: "Workshop Instructor",
          company: "AWS",
          bio: workshop.instructor_bio || "",
          socials: {},
          topics: workshop.tags || [workshop.track]
        })
      }

      // If workshop has slots, map each slot to a session entry
      if (workshop.slots && workshop.slots.length > 0) {
        for (const slot of workshop.slots) {
          if (!slot.is_active) continue

          const venue = venueMap.get(slot.venue_id) || {
            id: slot.venue_id,
            name: slot.venue_name || "Campus Stage",
            building: slot.building || "Main Campus",
            room: slot.room || "",
            capacity: slot.capacity
          }

          // Format ISO time
          const startAt = `${slot.date}T${slot.start_time.length === 5 ? slot.start_time : `0${slot.start_time}`}:00Z`
          const endAt = `${slot.date}T${slot.end_time.length === 5 ? slot.end_time : `0${slot.end_time}`}:00Z`

          populatedSessions.push({
            id: `${workshop.id}-${slot.slot_id}`,
            title: workshop.title,
            description: workshop.description,
            session_type: "workshop",
            start_at: startAt,
            end_at: endAt,
            capacity: slot.capacity,
            topics: workshop.tags && workshop.tags.length > 0 ? workshop.tags : [workshop.track],
            speakers: assignedSpeakers,
            venue
          })
        }
      } else {
        // Workshop without slot: create a general session placeholder
        const venue = workshop.venue_id ? venueMap.get(workshop.venue_id) : undefined
        populatedSessions.push({
          id: workshop.id,
          title: workshop.title,
          description: workshop.description,
          session_type: "workshop",
          start_at: "2026-11-30T10:00:00Z",
          end_at: "2026-11-30T12:00:00Z",
          capacity: workshop.total_capacity || 40,
          topics: workshop.tags && workshop.tags.length > 0 ? workshop.tags : [workshop.track],
          speakers: assignedSpeakers,
          venue
        })
      }
    }

    return NextResponse.json(
      {
        sessions: populatedSessions,
        speakers,
        venues
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120"
        }
      }
    )
  } catch {
    return NextResponse.json({
      sessions: [],
      speakers: [],
      venues: []
    })
  }
}
