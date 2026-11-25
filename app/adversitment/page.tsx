import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, Sparkles, Calendar, MapPin, Zap, Award, Flame, ExternalLink } from "lucide-react"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "Register Now | AWS Re:Invent Fest 2026",
  description: "Official registration & pass booking for AWS Re:Invent Fest 2026 at Lovely Professional University. Scan QR code or visit reinvent.awslpu.in to secure your pass.",
}

export default function AdvertisementPage() {
  const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://reinvent.awslpu.in"
  const targetUrl = "https://reinvent.awslpu.in"

  return (
    <main className="fixed inset-0 z-[100] h-screen w-screen max-h-screen max-w-screen overflow-hidden bg-black text-white select-none flex flex-col justify-between p-5 sm:p-8 lg:p-10 font-sans">
      {/* Background Video from Landing Page */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[58%_center] sm:object-center -z-30 filter brightness-[0.72] contrast-[1.08]"
      >
        <source src="https://static.awslpu.in/reinvent-video-loop" type="video/mp4" />
      </video>

      {/* Layered cinematic overlays */}
      <div className="pointer-events-none absolute inset-0 bg-black/60 -z-20" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/75 -z-10" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/75 -z-10" />
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[550px] w-[550px] rounded-full bg-[#FF00D4]/18 blur-[160px] -z-10" />
      <div className="pointer-events-none absolute bottom-0 right-10 h-[500px] w-[500px] rounded-full bg-[#6C00FF]/22 blur-[150px] -z-10" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px] opacity-70 -z-10" />

      {/* Glowing Top Frame Beam */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 max-w-5xl bg-gradient-to-r from-transparent via-[#FF00D4] to-transparent shadow-[0_0_25px_#FF00D4]" />

      {/* TOP BAR */}
      <header className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-[#FF00D4] shadow-[0_0_12px_#FF00D4]" />
          <div className="flex flex-col leading-none">
            <span className="text-[10px] sm:text-xs font-semibold tracking-[0.24em] uppercase text-white/90">
              AWS Student Builder Group
            </span>
            <span className="text-[9px] font-mono tracking-wider text-white/45">
              Lovely Professional University
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF00D4]/40 bg-[#FF00D4]/10 px-3 py-1 backdrop-blur-md shadow-[0_0_20px_rgba(255,0,212,0.25)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF00D4] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF00D4]" />
            </span>
            <span className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FF80DF]">
              Pass Bookings Live
            </span>
          </div>

          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70 font-mono">
            <Calendar className="h-3 w-3 text-[#FF2D87]" />
            <span>Nov 30 – Dec 4, 2026</span>
          </div>
        </div>
      </header>

      {/* MAIN CENTER CONTENT (Split 2-Column Display) */}
      <section className="relative z-10 my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center max-w-[1600px] w-full mx-auto">
        {/* Left Column: Festival Identity & Value Props */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 mb-3 sm:mb-4">
            <span className="inline-block h-px w-6 bg-[#FF00D4]" />
            <span className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.28em] text-[#FF80DF]">
              North India&apos;s Largest Cloud Gathering
            </span>
          </div>

          <h1 className="text-[clamp(2.75rem,7vw,6.5rem)] font-light tracking-[-0.075em] leading-[0.88] text-white">
            re<span className="text-[#FF2D87] drop-shadow-[0_0_25px_rgba(255,45,135,0.8)]">:</span>Invent
            <br />
            <span className="bg-gradient-to-r from-[#FF2D87] via-[#FF00D4] to-[#8B5CFF] bg-clip-text text-transparent font-normal">
              Fest 2026
            </span>
          </h1>

          <p className="mt-4 sm:mt-5 max-w-xl text-sm sm:text-base font-light leading-relaxed text-white/80">
            Five immersive days of cloud architecture, live build arenas, AWS technical keynotes, and hackathons at Lovely Professional University.
          </p>

          {/* Quick Pillars */}
          <div className="mt-5 sm:mt-6 grid grid-cols-2 gap-2.5 max-w-xl">
            <div className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-black/40 backdrop-blur-md px-3.5 py-2">
              <Zap className="h-4 w-4 text-[#FF00D4] shrink-0" />
              <span className="text-xs font-medium text-white/90">25+ Technical Keynotes</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-black/40 backdrop-blur-md px-3.5 py-2">
              <Flame className="h-4 w-4 text-[#FF2D87] shrink-0" />
              <span className="text-xs font-medium text-white/90">Cloud Hackathon Arena</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-black/40 backdrop-blur-md px-3.5 py-2">
              <Award className="h-4 w-4 text-[#8B5CFF] shrink-0" />
              <span className="text-xs font-medium text-white/90">Exclusive Swag & Certs</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-black/40 backdrop-blur-md px-3.5 py-2">
              <Sparkles className="h-4 w-4 text-[#FF80DF] shrink-0" />
              <span className="text-xs font-medium text-white/90">1:1 AWS Mentorship</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6 sm:mt-8 flex items-center gap-4">
            <Link
              href="/tickets"
              className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#FF00D4] to-[#8B5CFF] px-7 py-3 text-sm font-semibold tracking-wide text-white shadow-[0_0_30px_rgba(255,0,212,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,0,212,0.6)]"
            >
              <span>REGISTER NOW</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>

            <div className="flex items-center gap-2 text-xs font-mono text-white/60">
              <MapPin className="h-3.5 w-3.5 text-[#FF2D87]" />
              <span>LPU Campus · Jalandhar, Punjab</span>
            </div>
          </div>
        </div>

        {/* Right Column: Hero QR Code Box & Direct Link */}
        <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center">
          <div className="relative rounded-2xl border border-white/15 bg-black/70 p-5 sm:p-7 backdrop-blur-2xl shadow-[0_0_60px_rgba(255,0,212,0.22)] max-w-sm w-full text-center">
            {/* Corner Decorative Accents */}
            <div className="pointer-events-none absolute -top-1 -left-1 h-3.5 w-3.5 border-t-2 border-l-2 border-[#FF00D4]" />
            <div className="pointer-events-none absolute -top-1 -right-1 h-3.5 w-3.5 border-t-2 border-r-2 border-[#FF00D4]" />
            <div className="pointer-events-none absolute -bottom-1 -left-1 h-3.5 w-3.5 border-b-2 border-l-2 border-[#8B5CFF]" />
            <div className="pointer-events-none absolute -bottom-1 -right-1 h-3.5 w-3.5 border-b-2 border-r-2 border-[#8B5CFF]" />

            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF80DF]">
                Scan on Camera / Phone
              </span>
            </div>

            {/* High-Contrast Crisp QR Code Container */}
            <div className="relative mx-auto w-[164px] h-[164px] rounded-xl bg-white p-2.5 shadow-[0_0_35px_rgba(255,255,255,0.2)] flex items-center justify-center">
              <img
                src={qrUrl}
                alt="QR Code to register for AWS Re:Invent Fest 2026"
                width={150}
                height={150}
                className="h-[144px] w-[144px] object-contain rounded"
                loading="eager"
              />
            </div>

            {/* Direct Link Display */}
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-col items-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1">
                Direct Registration Link
              </span>
              <a
                href={targetUrl}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-1.5 font-mono text-sm sm:text-base font-bold text-[#FF80DF] hover:text-white transition-colors"
              >
                <span>reinvent.awslpu.in</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>

            <p className="mt-2 text-[10px] text-white/40 leading-snug">
              Instant pass booking & secure digital QR ticket issuance
            </p>
          </div>
        </div>
      </section>

      {/* BOTTOM TICKER BAR */}
      <footer className="relative z-10 border-t border-white/10 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-xs text-white/50 font-mono">
        <div className="flex items-center gap-3">
          <span className="text-[#FF2D87] font-semibold">● LIMITED CAPACITY</span>
          <span className="hidden sm:inline text-white/20">|</span>
          <span className="hidden sm:inline">STUDENT & GENERAL PASSES AVAILABLE</span>
        </div>

        <div className="flex items-center gap-4">
          <span>AWS STUDENT BUILDER GROUP LPU</span>
          <span className="text-white/20">|</span>
          <Link href="/" className="hover:text-white transition-colors text-white/70">
            VIEW FULL SCHEDULE &rarr;
          </Link>
        </div>
      </footer>
    </main>
  )
}
