"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, Flame, Ticket, X } from "lucide-react"

export function BlackFridayPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsOpen(true)
    }, 1800)

    return () => window.clearTimeout(timeout)
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) dialog.showModal()
    if (!isOpen && dialog.open) dialog.close()
  }, [isOpen])

  const close = () => dialogRef.current?.close()

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="black-friday-popup-title"
      aria-describedby="black-friday-popup-description"
      onClose={() => setIsOpen(false)}
      onClick={(event) => {
        if (event.target === event.currentTarget) close()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-[560px] overflow-hidden rounded-[1.5rem] border-0 bg-[#17120e] p-0 text-white shadow-[0_30px_120px_rgba(0,0,0,0.65)] backdrop:bg-black/75 backdrop:backdrop-blur-sm"
    >
      <div className="relative overflow-hidden px-6 pb-6 pt-5 sm:px-9 sm:pb-8 sm:pt-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#c4442e]/20 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f4c778]">
            <Flame className="h-4 w-4" />
            A limited-period ticket offer
          </div>
          <button
            type="button"
            aria-label="Close Black Friday sale popup"
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-white/65 transition hover:bg-white/15 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd178]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mt-7">
          <p className="font-serif text-[clamp(2rem,8vw,3.8rem)] font-bold leading-[0.9] tracking-[-0.06em]">
            BLACK FRIDAY
            <span className="mt-1 block text-[#ed6545]">TICKET SALE</span>
          </p>
          <h2 id="black-friday-popup-title" className="mt-5 text-lg font-semibold sm:text-xl">
            Your next five days start here.
          </h2>
          <p id="black-friday-popup-description" className="mt-2 max-w-md text-sm leading-relaxed text-white/60">
            Discover AWS re:Invent Fest 2026 passes at current limited-period prices. See ticket details and any eligible coupon savings before you pay.
          </p>
        </div>

        <div className="relative mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/tickets"
            onClick={() => setIsOpen(false)}
            className="group flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#e75a3b] px-5 text-sm font-semibold text-white transition hover:bg-[#f1704f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd178]"
          >
            <Ticket className="h-4 w-4" />
            Explore tickets
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button
            type="button"
            onClick={close}
            className="h-12 rounded-full px-5 text-sm font-medium text-white/55 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd178]"
          >
            Maybe later
          </button>
        </div>
      </div>
    </dialog>
  )
}
