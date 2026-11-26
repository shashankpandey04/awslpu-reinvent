import { generateQrMatrix } from "@/lib/qr"

const W = 800
const H = 1125

function base(ctx: CanvasRenderingContext2D) {
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, "#14082a")
  bg.addColorStop(0.55, "#0a0612")
  bg.addColorStop(1, "#1d0720")
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const glow = ctx.createRadialGradient(W * 0.85, H * 0.2, 0, W * 0.85, H * 0.2, 420)
  glow.addColorStop(0, "rgba(139,92,255,0.45)")
  glow.addColorStop(1, "rgba(139,92,255,0)")
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  const glow2 = ctx.createRadialGradient(W * 0.1, H * 0.9, 0, W * 0.1, H * 0.9, 460)
  glow2.addColorStop(0, "rgba(255,0,212,0.35)")
  glow2.addColorStop(1, "rgba(255,0,212,0)")
  ctx.fillStyle = glow2
  ctx.fillRect(0, 0, W, H)
}

function accentBar(ctx: CanvasRenderingContext2D, y: number) {
  const g = ctx.createLinearGradient(60, 0, W - 60, 0)
  g.addColorStop(0, "#FF2D87")
  g.addColorStop(0.5, "#FF00D4")
  g.addColorStop(1, "#8B5CFF")
  ctx.fillStyle = g
  ctx.fillRect(60, y, W - 120, 6)
}

function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  let out = text
  while (out.length > 1 && ctx.measureText(out).width > maxWidth) out = out.slice(0, -1)
  return out === text ? out : out.trimEnd() + "…"
}

export interface PassCardInput {
  category: string
  holder: string
  ticketCode: string
}

export function renderPassCard({ category, holder, ticketCode }: PassCardInput) {
  const font = "'Amazon Ember', system-ui, sans-serif"

  const front = document.createElement("canvas")
  front.width = W
  front.height = H
  const f = front.getContext("2d")!
  base(f)
  f.fillStyle = "#FF2D87"
  f.font = `600 26px ${font}`
  f.fillText("AWS BUILDERS · LPU", 60, 190)
  f.fillStyle = "#fff"
  f.font = `300 92px ${font}`
  f.fillText("Re:Invent", 60, 330)
  f.fillText("Fest 2026", 60, 430)
  accentBar(f, 470)
  f.fillStyle = "rgba(255,255,255,0.65)"
  f.font = `400 28px ${font}`
  f.fillText("02 Dec - 04 Dec 2026", 60, 540)
  f.fillText("Lovely Professional University", 60, 584)

  f.fillStyle = "rgba(255,255,255,0.45)"
  f.font = `500 22px ${font}`
  f.fillText("PASS", 60, 800)
  f.fillStyle = "#fff"
  f.font = `600 44px ${font}`
  f.fillText(fit(f, category, W - 120), 60, 856)
  f.fillStyle = "rgba(255,255,255,0.45)"
  f.font = `500 22px ${font}`
  f.fillText("ATTENDEE", 60, 936)
  f.fillStyle = "#fff"
  f.font = `500 38px ${font}`
  f.fillText(fit(f, holder || "Attendee", W - 120), 60, 990)
  f.fillStyle = "rgba(255,255,255,0.35)"
  f.font = `400 20px monospace`
  f.fillText(`ID ${ticketCode.slice(0, 12).toUpperCase()}`, 60, 1060)

  const back = document.createElement("canvas")
  back.width = W
  back.height = H
  const b = back.getContext("2d")!
  base(b)
  b.fillStyle = "#fff"
  b.font = `600 30px ${font}`
  b.textAlign = "center"
  b.fillText("SCAN AT ENTRY", W / 2, 190)

  try {
    const matrix = generateQrMatrix(ticketCode)
    const quiet = 2
    const cells = matrix.length + quiet * 2
    const box = 520
    const cell = box / cells
    const x0 = (W - box) / 2
    const y0 = 270
    b.fillStyle = "#ffffff"
    b.fillRect(x0 - 20, y0 - 20, box + 40, box + 40)
    b.fillStyle = "#0a0612"
    matrix.forEach((row, y) =>
      row.forEach((on, x) => {
        if (on) b.fillRect(x0 + (x + quiet) * cell, y0 + (y + quiet) * cell, Math.ceil(cell), Math.ceil(cell))
      })
    )
  } catch {
    // QR is also available in the dashboard
  }

  b.fillStyle = "rgba(255,255,255,0.6)"
  b.font = `400 26px ${font}`
  b.fillText("Non-transferable digital pass", W / 2, 900)
  b.fillText("reinvent.awslpu.in", W / 2, 944)
  accentBar(b, 1000)

  return { front: front.toDataURL("image/png"), back: back.toDataURL("image/png") }
}
