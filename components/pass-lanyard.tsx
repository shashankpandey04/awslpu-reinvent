"use client"

import { useEffect, useState } from "react"
import Lanyard from "@/components/Lanyard"
import { renderPassCard } from "@/lib/pass-card"

interface PassLanyardProps {
  category: string
  holder: string
  ticketCode: string
}

export function PassLanyard({ category, holder, ticketCode }: PassLanyardProps) {
  const [images, setImages] = useState<{ front: string; back: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    const draw = () => {
      if (!cancelled) setImages(renderPassCard({ category, holder, ticketCode }))
    }
    // Wait for the site fonts so the card text matches the rest of the page.
    if (document.fonts?.ready) document.fonts.ready.then(draw)
    else draw()
    return () => {
      cancelled = true
    }
  }, [category, holder, ticketCode])

  if (!images) return null

  return (
    <Lanyard
      frontImage={images.front}
      backImage={images.back}
      finish="glossy"
      strapColor="#1a0b2e"
      metal="silver"
      size={0.7}
      strapLength={0.3}
    />
  )
}
