"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Users } from "lucide-react"
import { LinkedinIcon } from "@/components/icons"
import type { Speaker } from "@/types/schedule"

export function FeaturedSpeakers() {
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSpeakers() {
      try {
        const res = await fetch("/api/speakers")
        if (res.ok) {
          const data = await res.json()
          setSpeakers(Array.isArray(data) ? data : [])
        }
      } catch {
        setSpeakers([])
      } finally {
        setLoading(false)
      }
    }
    fetchSpeakers()
  }, [])

  return (
    <section className="relative overflow-hidden bg-[#08070b] px-5 py-20 text-white sm:px-10 lg:px-16 lg:py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_50%_0%,rgba(139,92,246,0.07),transparent_70%)]" />

      <div className="relative mx-auto max-w-[1440px]">
        <div className="flex flex-col justify-between gap-6 border-b border-white/[0.08] pb-8 sm:flex-row sm:items-end sm:pb-10">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.035] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e879d8]" />
              <span className="text-[10px] font-medium uppercase tracking-[0.17em] text-white/65">
                Official 2026 Lineup
              </span>
            </div>

            <h2 className="text-4xl font-medium tracking-[-0.055em] sm:text-5xl lg:text-6xl">
              World-class minds{" "}
              <span className="font-normal text-[#e879d8]">
                on stage.
              </span>
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55 sm:text-base">
              Learn directly from cloud architects, AWS community leaders, and distributed systems engineers shaping the modern cloud frontier.
            </p>
          </div>

          <Link
            href="/speakers"
            className="group inline-flex h-11 items-center gap-2.5 self-start rounded-full border border-white/[0.12] bg-white/[0.045] px-5 text-xs font-medium text-white/80 transition-colors hover:border-white/25 hover:bg-white/[0.08] hover:text-white sm:self-end"
          >
            <span>Explore all speakers</span>
            <ArrowUpRight className="h-4 w-4 text-white/55 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
          </Link>
        </div>

        {/* Speaker cards */}
        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="aspect-[0.78] animate-pulse rounded-2xl border border-white/[0.08] bg-white/[0.025]"
              />
            ))}
          </div>
        ) : speakers.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-16 text-center sm:py-20">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#e879d8]">
              Speaker Lineup
            </span>
            <h3 className="mt-2 text-2xl font-medium text-white">
              Announcements Coming Soon
            </h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/50">
              Leading engineers, cloud architects, researchers, and community heroes will take the stage. Full speaker roster will be revealed shortly.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {speakers.slice(0, 3).map((spk) => (
              <article
                key={spk.id}
                className="group flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.09] bg-[#111016] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.18] hover:bg-[#15131b] sm:p-5"
              >
                <div>
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-white/[0.04]">
                    {spk.profile_picture ? (
                      <img
                        src={spk.profile_picture}
                        alt={spk.full_name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/[0.035] text-3xl font-light text-white/35">
                        {spk.full_name.charAt(0)}
                      </div>
                    )}
                    {spk.company && (
                      <span className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] truncate rounded-full border border-white/15 bg-black/65 px-3 py-1 text-[9px] font-medium uppercase tracking-wider text-white/85 backdrop-blur-md">
                        {spk.company}
                      </span>
                    )}
                  </div>

                  <div className="mt-4">
                    <h3 className="text-lg font-semibold tracking-tight text-white">
                      {spk.full_name}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-white/55">
                      {spk.designation}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.08] pt-3">
                  <span className="line-clamp-1 text-[10px] text-white/45">
                    {spk.topics?.[0] ? `#${spk.topics[0]}` : "#CloudArchitecture"}
                  </span>
                  {spk.socials?.linkedin ? (
                    <a
                      href={spk.socials.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${spk.full_name} LinkedIn`}
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/[0.08] hover:text-white"
                    >
                      <LinkedinIcon className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              </article>
            ))}

            <Link
              href="/speakers"
              className="group flex h-full flex-col justify-between rounded-2xl border border-dashed border-white/[0.14] bg-white/[0.02] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.045] sm:p-5"
            >
              <div>
                <div className="flex aspect-square w-full flex-col items-center justify-center rounded-xl bg-white/[0.025]">
                  <span className="flex size-14 items-center justify-center rounded-2xl bg-white/[0.06] text-[#e879d8]">
                    <Users className="h-6 w-6" />
                  </span>
                  <span className="mt-4 text-sm font-medium text-white">Full speaker lineup</span>
                  <span className="mt-1 text-xs text-white/45">
                    {speakers.length > 3
                      ? `${speakers.length - 3} more speakers`
                      : "More speakers coming soon"}
                  </span>
                </div>

                <div className="mt-5">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                    AWS re:Invent Fest 2026
                  </span>
                  <h3 className="mt-1 text-lg font-semibold tracking-tight text-white">
                    Meet the speakers
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">
                    Browse the complete roster of keynote speakers, panelists, and workshop hosts.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-white/[0.08] pt-3 text-xs font-medium text-white/60 transition-colors group-hover:text-white">
                <span>View complete roster</span>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>
          </div>
        )}
      </div>

    </section>
  )
}
