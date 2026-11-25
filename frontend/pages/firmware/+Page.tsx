import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import type { IconType } from "react-icons"
import {
  LuBookOpen,
  LuType,
  LuTarget,
  LuChartBar,
  LuWifi,
  LuMonitor,
  LuMoon,
  LuRefreshCw,
  LuGamepad2,
  LuPalette,
  LuSettings,
  LuShield,
  LuZap,
  LuSparkles,
  LuSearch,
  LuTriangleAlert,
  LuTrophy,
} from "react-icons/lu"
import x4proBlack from "@/images/xteink/x4_pro_black.webp"
import x4proBlackFallback from "@/images/xteink/x4_pro_black.png"
import x4proWhite from "@/images/xteink/x4_pro_white.webp"
import x4proWhiteFallback from "@/images/xteink/x4_pro_white.png"
import euRobo from "@/images/xteink/screenshot_eu_robo_book.png"

type Status = "yes" | "no" | "limited" | "unknown" | "experimental"
type Cell = Status | { status: Status; note: string }

type FeatureRow = [string, Cell]
type RatingRow = [string, number]

type SectionBase = {
  number: string
  title: string
  icon: string
}

type FeatureSection = SectionBase & { rows: FeatureRow[] }
type RatingSection = SectionBase & { warning?: boolean; rows: RatingRow[] }

type FirmwareData = {
  meta: {
    name: string
    eyebrow: string
    accent?: string
    order?: number
    version?: string
  }
  summary: string
  features: FeatureSection[]
  ratingSections: RatingSection[]
}

const sectionIcons: Record<string, IconType> = {
  BookOpen: LuBookOpen,
  Type: LuType,
  Target: LuTarget,
  ChartBar: LuChartBar,
  Wifi: LuWifi,
  Monitor: LuMonitor,
  Moon: LuMoon,
  RefreshCw: LuRefreshCw,
  Gamepad2: LuGamepad2,
  Palette: LuPalette,
  Settings: LuSettings,
  Shield: LuShield,
  Zap: LuZap,
  Sparkles: LuSparkles,
}

const accentStyles = {
  amber: {
    dot: "bg-amber-500",
    bar: "bg-linear-to-r from-amber-400 to-orange-500",
    gradient: "from-amber-500 to-orange-600",
    header: "text-amber-600 dark:text-amber-400",
    glow: "hover:shadow-amber-500/10",
  },
  blue: {
    dot: "bg-blue-500",
    bar: "bg-linear-to-r from-blue-400 to-indigo-500",
    gradient: "from-blue-600 to-indigo-600",
    header: "text-blue-600 dark:text-blue-400",
    glow: "hover:shadow-blue-500/10",
  },
  emerald: {
    dot: "bg-emerald-500",
    bar: "bg-linear-to-r from-emerald-400 to-teal-500",
    gradient: "from-emerald-500 to-teal-600",
    header: "text-emerald-600 dark:text-emerald-400",
    glow: "hover:shadow-emerald-500/10",
  },
  violet: {
    dot: "bg-violet-500",
    bar: "bg-linear-to-r from-violet-400 to-purple-500",
    gradient: "from-violet-500 to-purple-600",
    header: "text-violet-600 dark:text-violet-400",
    glow: "hover:shadow-violet-500/10",
  },
  rose: {
    dot: "bg-rose-500",
    bar: "bg-linear-to-r from-rose-400 to-pink-500",
    gradient: "from-rose-500 to-pink-600",
    header: "text-rose-600 dark:text-rose-400",
    glow: "hover:shadow-rose-500/10",
  },
  cyan: {
    dot: "bg-cyan-500",
    bar: "bg-linear-to-r from-cyan-400 to-sky-500",
    gradient: "from-cyan-500 to-sky-600",
    header: "text-cyan-600 dark:text-cyan-400",
    glow: "hover:shadow-cyan-500/10",
  },
  orange: {
    dot: "bg-orange-500",
    bar: "bg-linear-to-r from-orange-400 to-red-500",
    gradient: "from-orange-500 to-red-600",
    header: "text-orange-600 dark:text-orange-400",
    glow: "hover:shadow-orange-500/10",
  },
  teal: {
    dot: "bg-teal-500",
    bar: "bg-linear-to-r from-teal-400 to-emerald-500",
    gradient: "from-teal-500 to-emerald-600",
    header: "text-teal-600 dark:text-teal-400",
    glow: "hover:shadow-teal-500/10",
  },
} as const

type AccentKey = keyof typeof accentStyles

function accentOf(name?: string): AccentKey {
  return name && name in accentStyles ? (name as AccentKey) : "blue"
}

function SectionIcon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  const Icon = sectionIcons[name]
  if (!Icon) return <LuSparkles className={className} aria-hidden />
  return <Icon className={className} aria-hidden />
}

/* -------------------------------------------------------------------------- */
/*  Dados: todo arquivo .json em ./data vira um firmware na comparação.        */
/* -------------------------------------------------------------------------- */

const firmwareModules = import.meta.glob<FirmwareData>("./data/*.json", {
  eager: true,
  import: "default",
})

type Firmware = {
  key: string
  data: FirmwareData
  accent: AccentKey
}

const firmwares: Firmware[] = Object.entries(firmwareModules)
  .map(([path, data]) => ({
    key: path.split("/").pop()?.replace(/\.json$/, "") ?? path,
    data,
    accent: accentOf(data.meta.accent),
  }))
  .sort(
    (a, b) =>
      (a.data.meta.order ?? Number.MAX_SAFE_INTEGER) -
        (b.data.meta.order ?? Number.MAX_SAFE_INTEGER) ||
      a.data.meta.name.localeCompare(b.data.meta.name),
  )

type FirmwareColumn = { name: string; accent: AccentKey; version?: string }

const columns: FirmwareColumn[] = firmwares.map((firmware) => ({
  name: firmware.data.meta.name,
  accent: firmware.accent,
  version: firmware.data.meta.version,
}))

const firmwareOptions = [
  { key: "both", label: "Ambos" },
  ...firmwares.map((firmware) => ({
    key: firmware.key,
    label: firmware.data.meta.name,
  })),
]

type SectionHead = {
  number: string
  title: string
  icon: string
  warning?: boolean
}

type TableRow = {
  name: string
  values: (Cell | number | undefined)[]
}

type TableSection = SectionHead & {
  kind: "feature" | "rating"
  rows: TableRow[]
}

function unionSections(sections: (FeatureSection | RatingSection)[]): SectionHead[] {
  const heads: SectionHead[] = []
  const seen = new Set<string>()

  for (const section of sections) {
    if (seen.has(section.title)) continue
    seen.add(section.title)
    heads.push({
      number: section.number,
      title: section.title,
      icon: section.icon,
      warning: "warning" in section ? section.warning : undefined,
    })
  }

  return heads
}

const featureTables: TableSection[] = unionSections(
  firmwares.flatMap((firmware) => firmware.data.features),
).map((head) => {
  const perFirmware = firmwares.map((firmware) =>
    firmware.data.features.find((section) => section.title === head.title),
  )
  const rowNames = [
    ...new Set(perFirmware.flatMap((section) => section?.rows.map(([name]) => name) ?? [])),
  ]

  return {
    ...head,
    kind: "feature",
    rows: rowNames.map((name) => ({
      name,
      values: perFirmware.map(
        (section) => section?.rows.find(([rowName]) => rowName === name)?.[1],
      ),
    })),
  }
})

const ratingTables: TableSection[] = unionSections(
  firmwares.flatMap((firmware) => firmware.data.ratingSections),
).map((head) => {
  const perFirmware = firmwares.map((firmware) =>
    firmware.data.ratingSections.find((section) => section.title === head.title),
  )
  const rowNames = [
    ...new Set(perFirmware.flatMap((section) => section?.rows.map(([name]) => name) ?? [])),
  ]

  return {
    ...head,
    kind: "rating",
    rows: rowNames.map((name) => ({
      name,
      values: perFirmware.map(
        (section) => section?.rows.find(([rowName]) => rowName === name)?.[1],
      ),
    })),
  }
})

function valuesAverage(values: (Cell | number | undefined)[]) {
  const numbers = values.filter((value): value is number => typeof value === "number")
  return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : 0
}

const firmwareScores = firmwares.map((firmware, index) => {
  const perSection = ratingTables.map((table) =>
    valuesAverage(table.rows.map((row) => row.values[index])),
  )
  const overall = perSection.length
    ? perSection.reduce((sum, value) => sum + value, 0) / perSection.length
    : 0

  return {
    key: firmware.key,
    name: firmware.data.meta.name,
    eyebrow: firmware.data.meta.eyebrow,
    version: firmware.data.meta.version,
    accent: firmware.accent,
    summary: firmware.data.summary,
    perSection,
    overall5: overall,
    overall10: overall * 2,
  }
})

type FirmwareScore = (typeof firmwareScores)[number]

const winner = firmwareScores.reduce(
  (best, item) => (item.overall10 > best.overall10 ? item : best),
  firmwareScores[0],
)

const mostStable = firmwareScores.reduce(
  (best, item) => ((item.perSection[0] ?? 0) > (best.perSection[0] ?? 0) ? item : best),
  firmwareScores[0],
)

const stabilityTitle = ratingTables[0]?.title ?? "Estabilidade"

const highlights = firmwareScores.length
  ? [
      { number: "01", label: "Melhor no geral", item: winner },
      { number: "02", label: `Líder em ${stabilityTitle.toLowerCase()}`, item: mostStable },
    ].filter(
      (entry, index, list) =>
        list.findIndex((other) => other.item.key === entry.item.key) === index,
    )
  : []

const chartData = ratingTables.map((table) => ({
  title: table.title,
  icon: table.icon,
  values: firmwareScores.map((firmware, index) => ({
    name: firmware.name,
    accent: firmware.accent,
    value: valuesAverage(table.rows.map((row) => row.values[index])),
  })),
}))

/* -------------------------------------------------------------------------- */

const statusMap: Record<Status, { mark: string; label: string }> = {
  yes: { mark: "✓", label: "Possui" },
  no: { mark: "×", label: "Não possui" },
  limited: { mark: "!", label: "Com limitações" },
  unknown: { mark: "?", label: "Não confirmado" },
  experimental: { mark: "●", label: "Experimental" },
}

const statusOrder: Status[] = ["yes", "no", "limited", "unknown", "experimental"]

const statusStyles: Record<Status, string> = {
  yes: "bg-success/15 text-success ring-success/30",
  no: "bg-error/15 text-error ring-error/30",
  limited:
    "bg-warning/20 text-warning-foreground ring-warning/40 dark:text-warning",
  unknown: "bg-muted text-muted-foreground ring-border",
  experimental: "bg-primary/15 text-primary ring-primary/30",
}

function getCellStatus(cell: Cell | undefined): Status {
  if (!cell) return "unknown"
  return typeof cell === "string" ? cell : cell.status
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
}

const statusSearchTerms: Record<Status, string> = {
  yes: "possui sim tem",
  no: "nao não possui sem",
  limited: "limitado limitacoes limitações parcial",
  unknown: "desconhecido nao confirmado não confirmado desconhecida",
  experimental: "experimental teste beta",
}

function StatusMark({
  status,
  label,
  className = "",
}: {
  status: Status
  label?: string
  className?: string
}) {
  const item = statusMap[status]
  return (
    <span
      aria-label={label ?? item.label}
      title={label ?? item.label}
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ring-1 ring-inset ${statusStyles[status]} ${className}`}
    >
      {item.mark}
    </span>
  )
}

function CellValue({ cell }: { cell: Cell | undefined }) {
  const value =
    cell === undefined ? { status: "unknown" as Status } : typeof cell === "string" ? { status: cell } : cell
  const isLimited = value.status === "limited"
  const note = isLimited && "note" in value ? value.note : undefined

  return (
    <div className="flex w-full flex-col items-center gap-1">
      <StatusMark status={value.status} />
      {note && (
        <p className="max-w-44 text-center text-[10px] leading-tight text-warning-foreground/80 dark:text-warning/80">
          {note}
        </p>
      )}
    </div>
  )
}

function Stars({ value }: { value: number }) {
  return (
    <span aria-label={`${value} de 5`} className="inline-flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={
            i < value
              ? "text-sm text-amber-400"
              : "text-sm text-muted-foreground/25"
          }
        >
          ★
        </span>
      ))}
    </span>
  )
}

function ScoreCard({ item }: { item: FirmwareScore }) {
  const accent = accentStyles[item.accent]
  const stats: [string, number][] = ratingTables.map((table, index) => [
    table.title,
    (item.perSection[index] ?? 0) * 2,
  ])

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md ${accent.glow}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${accent.bar}`} />

      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-[10px] font-bold uppercase tracking-[0.18em] ${accent.header}`}
          >
            {item.eyebrow}
          </p>
          <h3 className="mt-0.5 truncate text-xl font-bold tracking-tight text-card-foreground">
            {item.name}
          </h3>
          {item.version && (
            <span className="mt-1.5 inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
              {item.version}
            </span>
          )}
        </div>
        <div className="shrink-0 text-right">
          <span
            className={`text-3xl font-black leading-none tracking-tight ${accent.header}`}
          >
            {item.overall10.toFixed(1)}
          </span>
          <span className="text-xs font-semibold text-muted-foreground">
            /10
          </span>
        </div>
      </header>

      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
        {item.summary}
      </p>

      <div className="space-y-2.5">
        {stats.map(([label, value]) => (
          <div key={label} className="flex items-center gap-3 text-xs">
            <span
              title={label}
              className="w-24 shrink-0 truncate font-medium text-muted-foreground"
            >
              {label}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${accent.bar} transition-all duration-700`}
                style={{ width: `${Math.min(value, 10) * 10}%` }}
              />
            </div>
            <b className="w-10 shrink-0 text-right font-bold tabular-nums text-card-foreground">
              {value.toFixed(1)}
            </b>
          </div>
        ))}
      </div>
    </article>
  )
}

function EmptyData() {
  return (
    <main className="min-h-screen bg-background text-foreground antialiased">
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground">
          XTEINK
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">
          Nenhum firmware encontrado
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Crie um arquivo <code className="rounded bg-muted px-1.5 py-0.5">.json</code> em{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">
            pages/xteink/firmware/data/
          </code>{" "}
          para adicionar um firmware à comparação.
        </p>
      </div>
    </main>
  )
}

export default function Page() {
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  useEffect(() => {
    const root = document.documentElement
    const isDark = theme === "dark"
    root.classList.toggle("dark", isDark)
    root.style.colorScheme = isDark ? "dark" : "light"
    try {
      localStorage.setItem("xteink-theme", theme)
    } catch {}
  }, [theme])

  const isDark = theme === "dark"

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<Status[]>([])
  const [firmwareFilter, setFirmwareFilter] = useState("both")

  const toggleStatus = (s: Status) =>
    setStatusFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    )

  const clearFilters = () => {
    setSearch("")
    setStatusFilter([])
    setFirmwareFilter("both")
  }

  const hasFilters =
    search.trim().length > 0 ||
    statusFilter.length > 0 ||
    firmwareFilter !== "both"

  const filteredFeatures = useMemo(() => {
    const term = normalize(search.trim())

    const matchTerm = (haystack: string) =>
      term.length === 0 || normalize(haystack).includes(term)

    const matchCell = (cell: Cell | undefined) => {
      if (!cell) return false
      const status = getCellStatus(cell)
      const note = typeof cell === "object" && "note" in cell ? cell.note : ""
      return matchTerm(`${status} ${statusSearchTerms[status]} ${note}`)
    }

    const filterIndex =
      firmwareFilter === "both"
        ? -1
        : firmwares.findIndex((firmware) => firmware.key === firmwareFilter)

    return featureTables
      .map((table) => ({
        ...table,
        rows: table.rows.filter((row) => {
          const matchesSearch =
            term.length === 0 ||
            matchTerm(row.name) ||
            matchTerm(table.title) ||
            matchTerm(table.number) ||
            row.values.some(
              (value) => typeof value !== "number" && matchCell(value as Cell | undefined),
            )

          if (!matchesSearch) return false
          if (statusFilter.length === 0) return true

          if (filterIndex >= 0) {
            return statusFilter.includes(
              getCellStatus(row.values[filterIndex] as Cell | undefined),
            )
          }

          return row.values.some((value) =>
            statusFilter.includes(getCellStatus(value as Cell | undefined)),
          )
        }),
      }))
      .filter((table) => table.rows.length > 0)
  }, [search, statusFilter, firmwareFilter])

  const totalResults = useMemo(
    () => filteredFeatures.reduce((acc, table) => acc + table.rows.length, 0),
    [filteredFeatures],
  )

  if (firmwares.length === 0) return <EmptyData />

  return (
    <main className="min-h-screen bg-background text-foreground antialiased transition-colors duration-300">
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-20 h-125 w-125 rounded-full bg-blue-500/10 blur-[120px] dark:bg-blue-500/20"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-20 h-125 w-125 rounded-full bg-violet-500/10 blur-[120px] dark:bg-violet-500/20"
        />

        <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-10">
          <nav className="flex items-center justify-between gap-4">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
              XTEINK
            </span>
            <div className="flex items-center gap-4">
              <span className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:inline">
                Guia de Firmware · 2025
              </span>
              <button
                type="button"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                aria-label={`Ativar modo ${isDark ? "claro" : "escuro"}`}
                className="flex items-center gap-2.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-foreground shadow-sm transition hover:bg-accent"
              >
                <span className="relative h-3.5 w-7 rounded-full bg-muted">
                  <span
                    className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-foreground shadow transition-all ${
                      isDark ? "left-0.5" : "left-[16px]"
                    }`}
                  />
                </span>
                {isDark ? "Escuro" : "Claro"}
              </button>
            </div>
          </nav>

          <div className="grid items-center gap-16 py-20 lg:grid-cols-[1.15fr_1fr] lg:py-28">
            <div>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                Comparativo independente
              </div>
              <h1 className="text-6xl font-black leading-[0.9] tracking-tighter text-foreground sm:text-7xl lg:text-8xl">
                X4 PRO
                <br />
                <span className="bg-linear-to-r from-blue-500 via-violet-500 to-emerald-500 bg-clip-text text-transparent">
                  FIRMWARE
                </span>
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Guia para escolher Firmware para XTEINK.
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-sm group flex justify-center">
              <div className="relative w-60 hidden  md:block">
                <picture className="hidden dark:block [.sapo_&]:block">
                  <source srcSet={x4proBlack} type="image/webp" />
                  <img
                    src={x4proBlackFallback}
                    alt="Xteink X4 Pro (preto)"
                    width={300}
                    loading="eager"
                    decoding="async"
                    className="w-full h-auto drop-shadow-2xl transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </picture>

                <picture className="block dark:hidden [.sapo_&]:hidden">
                  <source srcSet={x4proWhite} type="image/webp" />
                  <img
                    src={x4proWhiteFallback}
                    alt="Xteink X4 Pro (branco)"
                    width={300}
                    loading="eager"
                    decoding="async"
                    className="w-full h-auto drop-shadow-2xl transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </picture>

                <img
                  src={euRobo}
                  alt="Tela do X4 Pro exibindo livro"
                  loading="eager"
                  decoding="async"
                  className="pointer-events-none absolute left-1/2 top-1/2 w-[79%] -translate-x-1/2 -translate-y-41.5 md:-translate-y-42.5 rounded-sm shadow-xl transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>

              <div className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-border bg-card/90 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
                X4 Pro
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-5 sm:flex-row sm:items-center sm:gap-5">
            <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-warning-foreground dark:text-warning">
              <LuTriangleAlert className="h-3.5 w-3.5" />
              Leia antes de instalar
            </span>
            <p className="text-sm leading-relaxed text-warning-foreground/90 dark:text-warning/85">
              Dados "não confirmados" não significam ausência do recurso.
              Significam que ainda faltam documentação ou testes.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-2 md:px-6 py-16 lg:px-10">
        <section className="space-y-6">
          <SectionHead
            index="01 / Visão geral"
            title="O cenário em um olhar"
            description="Nota geral a partir das médias de estabilidade, desempenho e experiência."
          />

          <div className="grid gap-4 md:grid-cols-2">
            {firmwareScores.map((item) => (
              <ScoreCard item={item} key={item.key} />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <SectionHead
            index="Dados em destaque"
            title="Notas em gráfico"
            description="Cada gráfico corresponde a uma seção de avaliação."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {chartData.map((chart) => (
              <div
                key={chart.title}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SectionIcon
                      name={chart.icon}
                      className="h-4 w-4 text-muted-foreground"
                    />
                    <strong className="text-sm font-bold tracking-tight text-card-foreground">
                      {chart.title}
                    </strong>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold uppercase text-muted-foreground">
                    /5
                  </span>
                </div>
                <div className="space-y-3">
                  {chart.values.map((item) => {
                    const accent = accentStyles[item.accent]
                    return (
                      <div key={item.name} className="flex items-center gap-2">
                        <span className="flex w-24 shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${accent.dot}`}
                          />
                          <span className="truncate">{item.name}</span>
                        </span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${accent.bar}`}
                            style={{ width: `${item.value * 20}%` }}
                          />
                        </div>
                        <strong
                          className={`w-7 text-right text-[11px] font-bold tabular-nums ${accent.header}`}
                        >
                          {item.value.toFixed(1)}
                        </strong>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          className={`grid gap-4 ${
            highlights.length > 1 ? "lg:grid-cols-2" : "max-w-xl"
          }`}
        >
          {highlights.map((entry) => (
            <Takeaway
              key={entry.item.key}
              number={entry.number}
              label={entry.label}
              name={entry.item.name}
              text={entry.item.summary}
              tone={entry.item.accent}
            />
          ))}
        </section>

        <section className="space-y-6">
          <SectionHead
            index="02 / Inventário completo"
            title="Todos os recursos"
            description="Pesquise por nome e combine com filtros de status e firmware."
          />

          <FilterBar
            search={search}
            onSearch={setSearch}
            statusFilter={statusFilter}
            onToggleStatus={toggleStatus}
            firmwareOptions={firmwareOptions}
            firmwareFilter={firmwareFilter}
            onFirmware={setFirmwareFilter}
            onClear={clearFilters}
            hasFilters={hasFilters}
            resultCount={totalResults}
          />

          <div className="space-y-6">
            {filteredFeatures.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/60 p-8 text-center text-sm text-muted-foreground">
                Nenhum recurso encontrado com esses filtros.
              </div>
            ) : (
              filteredFeatures.map((table) => (
                <ComparisonTable
                  key={table.title}
                  table={table}
                  columns={columns}
                />
              ))
            )}
            <section className="rounded-xl border border-dashed border-border bg-card/60 p-2 md:p-4 text-center text-sm text-muted-foreground space-y-6">
            <SectionHead
              index="03 / Notas por critério"
              title="Classificação"
              description="Médias de estabilidade, desempenho e experiência — de 1 a 5 estrelas."
            />

            {ratingTables.map((table) => (
              <ComparisonTable
                key={table.title}
                table={table}
                columns={columns}
              />
            ))}
                          </section>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:p-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                03 / Veredito
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight tracking-tight text-foreground">
                O melhor hoje é o{" "}
                <span
                  className={`bg-linear-to-r ${accentStyles[winner.accent].gradient} bg-clip-text text-transparent`}
                >
                  {winner.name}.
                </span>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                O <b className="text-foreground">{winner.name}</b> tem a maior
                média geral entre os {ratingTables.length} critérios avaliados.
                {mostStable.key !== winner.key && (
                  <>
                    {" "}
                    O <b className="text-foreground">{mostStable.name}</b> lidera
                    em {stabilityTitle.toLowerCase()}.
                  </>
                )}
              </p>
            </div>
            <div className="grid content-start gap-2">
              <VerdictItem
                icon={<LuTrophy className="h-3.5 w-3.5" />}
                label="Melhor no geral"
                value={winner.name}
                tone={winner.accent}
              />
              <VerdictItem
                icon={<LuShield className="h-3.5 w-3.5" />}
                label={`Mais estável (${stabilityTitle.toLowerCase()})`}
                value={mostStable.name}
                tone={mostStable.accent}
              />
            </div>
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground sm:flex-row">
          <span>XTEINK X4 PRO · Comparação de firmwares</span>
          <span>Documentação · relatos · testes próprios</span>
        </footer>
      </div>
    </main>
  )
}

function FilterBar({
  search,
  onSearch,
  statusFilter,
  onToggleStatus,
  firmwareOptions,
  firmwareFilter,
  onFirmware,
  onClear,
  hasFilters,
  resultCount,
}: {
  search: string
  onSearch: (v: string) => void
  statusFilter: Status[]
  onToggleStatus: (s: Status) => void
  firmwareOptions: { key: string; label: string }[]
  firmwareFilter: string
  onFirmware: (v: string) => void
  onClear: () => void
  hasFilters: boolean
  resultCount: number
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <LuSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Pesquisar recurso (dicionário, gestos, EPUB…)"
            className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-ring/60 focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {firmwareOptions.map((option) => {
            const active = firmwareFilter === option.key
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onFirmware(option.key)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                  active
                    ? "border-foreground/30 bg-foreground text-background"
                    : "border-border bg-background text-foreground hover:bg-accent"
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {statusOrder.map((s) => {
          const active = statusFilter.includes(s)
          return (
            <button
              key={s}
              type="button"
              onClick={() => onToggleStatus(s)}
              aria-pressed={active}
              className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium transition ${
                active
                  ? "border-foreground/30 bg-foreground/5"
                  : "border-border bg-background hover:bg-accent"
              }`}
            >
              <StatusMark status={s} className="!h-5 !w-5 !rounded !text-[10px]" />
              <span className="text-foreground">{statusMap[s].label}</span>
            </button>
          )
        })}
        {hasFilters && (
          <>
            <span className="ml-auto text-[11px] text-muted-foreground">
              <b className="text-foreground">{resultCount}</b> resultado
              {resultCount === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={onClear}
              className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-foreground transition hover:bg-accent"
            >
              Limpar
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function SectionHead({
  index,
  title,
  description,
}: {
  index: string
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-border pb-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-col items-start gap-1 text-left">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {index}
        </p>
        <h2 className="mt-0.5 text-xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
      </div>
      {description && (
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground lg:text-right">
          {description}
        </p>
      )}
    </div>
  )
}

function Takeaway({
  number,
  label,
  name,
  text,
  tone,
}: {
  number: string
  label: string
  name: string
  text: string
  tone: AccentKey
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-linear-to-br p-5 text-white shadow-md ${accentStyles[tone].gradient}`}
    >
      <div className="absolute -right-1 -top-3 text-5xl font-black leading-none opacity-15">
        {number}
      </div>
      <p className="relative text-[10px] font-bold uppercase tracking-[0.18em] opacity-90">
        {label}
      </p>
      <h3 className="relative mt-1 text-lg font-black tracking-tight">
        {name}
      </h3>
      <p className="relative mt-1 text-xs leading-relaxed opacity-90">
        {text}
      </p>
    </div>
  )
}

function VerdictItem({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode
  label: string
  value: string
  tone: AccentKey
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </span>
      <b className={`text-sm font-bold ${accentStyles[tone].header}`}>{value}</b>
    </div>
  )
}

function ComparisonTable({
  table,
  columns,
}: {
  table: TableSection
  columns: FirmwareColumn[]
}) {
  const isRating = table.kind === "rating"
  const gridStyle = {
    gridTemplateColumns: `1.4fr repeat(${columns.length}, minmax(0, 1fr))`,
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background">
          <SectionIcon name={table.icon} className="h-4 w-4" />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {table.number}
        </span>
        <h3 className="text-sm font-bold tracking-tight text-foreground">
          {table.title}
        </h3>
        {table.warning && (
          <span className="rounded-full bg-warning/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-warning-foreground dark:text-warning">
            Atenção
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div
          className="grid gap-2 border-b border-border bg-muted/50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground"
          style={gridStyle}
        >
          <span>{isRating ? "Critério" : "Recurso"}</span>
          {columns.map((column) => (
            <span
              key={column.name}
              className={`text-center ${accentStyles[column.accent].header}`}
            >
              {column.name}
              {column.version && (
                <span className="mt-0.5 block text-[9px] font-semibold normal-case tracking-normal opacity-80">
                  {column.version}
                </span>
              )}
            </span>
          ))}
        </div>

        {table.rows.map((row, rowIndex) => (
          <div
            key={row.name}
            className={`grid items-start gap-2 px-3 py-2 text-sm ${
              rowIndex % 2 === 1 ? "bg-muted/20" : ""
            }`}
            style={gridStyle}
          >
            <span className="pt-1 font-medium text-foreground">{row.name}</span>
            {row.values.map((value, columnIndex) =>
              isRating ? (
                <span key={columnIndex} className="flex justify-center">
                  <Stars value={typeof value === "number" ? value : 0} />
                </span>
              ) : (
                <div key={columnIndex} className="flex justify-center">
                  <CellValue cell={value as Cell | undefined} />
                </div>
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
