export interface WorkshopSpeakerInfo {
  id: string
  full_name: string
  designation: string
  company?: string | null
  bio?: string | null
  profile_picture?: string | null
}

export interface WorkshopVenueInfo {
  id: string
  name: string
  code?: string | null
  building?: string | null
  floor?: string | null
  room?: string | null
  capacity: number
}

export interface WorkshopSlot {
  slot_id: string
  date: string
  start_time: string
  end_time: string
  venue_id: string
  venue_name: string
  venue_code?: string | null
  building?: string | null
  room?: string | null
  capacity: number
  registered_count: number
  available_spots: number
  is_active: boolean
}

export interface Workshop {
  id: string
  title: string
  track: string
  description: string
  venue_id?: string | null
  venue_ids?: string[]
  venue?: WorkshopVenueInfo | null
  venues?: WorkshopVenueInfo[]
  speaker_id?: string | null
  speaker_ids?: string[]
  speaker?: WorkshopSpeakerInfo | null
  speakers?: WorkshopSpeakerInfo[]
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
  created_at: string
  updated_at: string
}

export interface WorkshopRegistration {
  id: string
  user_id: string
  user_name: string
  user_email: string
  workshop_id: string
  workshop_title: string
  track: string
  speaker_id?: string | null
  instructor_name?: string | null
  slot_id: string
  date: string
  start_time: string
  end_time: string
  venue_id: string
  venue_name: string
  venue_code?: string | null
  building?: string | null
  room?: string | null
  status: "registered" | "cancelled"
  registered_at: string
  updated_at: string
}
