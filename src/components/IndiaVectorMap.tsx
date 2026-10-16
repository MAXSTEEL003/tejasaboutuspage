import React, { useState, useMemo } from "react"
import {
  INDIA_MAINLAND_OUTLINE,
  INDIA_STATE_BORDERS,
  INDIA_ISLANDS,
  INDIA_CLOSED_LANDMASS_SHAPES,
  MAP_DIMENSIONS,
} from "../data/indiaVectorData"
import { SUPPLY_HUBS, StateHub } from "../data/networkData"

interface Props {
  activeStateId: string | null
  onSelectState: (state: StateHub | null) => void
  selectedRegion?: string
  theme?: "dark" | "light"
}

/**
 * Memoized Static Base Cartography
 * Prevents React from re-diffing or re-rendering ~200KB of complex SVG path data
 * whenever state hover or selection changes.
 */
const StaticMapCartography = React.memo(function StaticMapCartography({
  isDark,
}: {
  isDark: boolean
}) {
  return (
    <>
      {/* Subcontinent State Polygons (Seamless Landmass Fill) */}
      <g className="landmass-layer">
        {INDIA_CLOSED_LANDMASS_SHAPES.map((shapeD, i) => (
          <path
            key={`land-${i}`}
            d={shapeD}
            fill={isDark ? "#16110a" : "#f5edd9"}
            stroke="none"
          />
        ))}
      </g>

      {/* Internal State Boundaries (Single Crisp Brass Seams with Zero Duplicate Strokes) */}
      <g className="state-borders-layer">
        {INDIA_STATE_BORDERS.map((borderD, i) => (
          <path
            key={`border-${i}`}
            d={borderD}
            fill="none"
            stroke={isDark ? "#8a6523" : "#8c5319"}
            strokeWidth={isDark ? "0.75" : "0.9"}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
      </g>

      {/* Coastal & International Perimeter Outline (Gleaming Gold Perimeter) */}
      <path
        d={INDIA_MAINLAND_OUTLINE}
        fill="none"
        stroke={isDark ? "#ffd700" : "#6b450c"}
        strokeWidth={isDark ? "1.6" : "1.8"}
        strokeLinejoin="round"
      />

      {/* Island Archipelagoes (Lakshadweep & Andaman Nicobar) */}
      <g className="islands-layer">
        {INDIA_ISLANDS.map((islandPath, i) => (
          <path
            key={`island-${i}`}
            d={islandPath}
            fill={isDark ? "#e5b842" : "#7a5410"}
            stroke={isDark ? "#ffd700" : "#7a5410"}
            strokeWidth="0.8"
          />
        ))}
      </g>
    </>
  )
})

export default function IndiaVectorMap({
  activeStateId,
  onSelectState,
  selectedRegion = "All",
  theme = "dark",
}: Props) {
  const [hoveredStateId, setHoveredStateId] = useState<string | null>(null)

  // Current inspected state
  const currentId = hoveredStateId || activeStateId
  const activeState = useMemo(
    () => SUPPLY_HUBS.find((h) => h.id === currentId) || null,
    [currentId],
  )

  // Origin hubs
  const nagpurHub = useMemo(
    () => SUPPLY_HUBS.find((h) => h.id === "nagpur")!,
    [],
  )
  const miryalagudaHub = useMemo(
    () => SUPPLY_HUBS.find((h) => h.id === "miryalaguda")!,
    [],
  )

  // Filtered hubs by region
  const filteredHubs = useMemo(() => {
    if (selectedRegion === "All") return SUPPLY_HUBS
    return SUPPLY_HUBS.filter((h) => {
      if (selectedRegion === "North") return h.region === "North"
      if (selectedRegion === "West") return h.region === "West"
      if (selectedRegion === "South") return h.region === "South"
      if (selectedRegion === "East & Central")
        return h.region === "East" || h.region === "Central"
      return true
    })
  }, [selectedRegion])

  // Calculate curved bezier supply lines from origin hubs to destinations
  const supplyRoutes = useMemo(() => {
    return SUPPLY_HUBS.map((dest) => {
      if (dest.isOrigin) return null
      const origin = dest.originHub === "miryalaguda" ? miryalagudaHub : nagpurHub

      // Hub vector coordinates in 615.43 x 693 space
      const ox = origin.x * 6.1543
      const oy = origin.y * 6.93
      const dx = dest.x * 6.1543
      const dy = dest.y * 6.93

      // Bezier arch control point
      const diffX = dx - ox
      const diffY = dy - oy
      const curvature = 0.2
      const cx = ox + diffX * 0.5 - diffY * curvature
      const cy = oy + diffY * 0.5 + diffX * curvature

      return {
        id: `route-${dest.id}`,
        destId: dest.id,
        path: `M ${ox.toFixed(1)} ${oy.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${dx.toFixed(1)} ${dy.toFixed(1)}`,
        originName: origin.hubName || origin.name,
        destName: dest.name,
        originHub: dest.originHub || "nagpur",
      }
    }).filter(Boolean) as Array<{
      id: string
      destId: string
      path: string
      originName: string
      destName: string
      originHub: "nagpur" | "miryalaguda"
    }>
  }, [nagpurHub, miryalagudaHub])

  const isDark = theme === "dark"

  return (
    <div className="relative mx-auto flex w-full max-w-[720px] flex-col items-center select-none">
      {/* High-Performance 2D Precision Cartography Card */}
      <div
        className={`relative aspect-[100/108] w-full border p-4 sm:p-7 shadow-[0_24px_80px_rgba(0,0,0,0.85)] transition-colors duration-300 ${
          isDark
            ? "border-gold/25 bg-gradient-to-b from-[#140f0a] via-[#0d0906] to-[#050403] shadow-[0_24px_80px_rgba(0,0,0,0.9),0_0_40px_rgba(217,164,65,0.06)]"
            : "border-brass/25 bg-gradient-to-b from-[#faf6ee] via-[#f4ebd8] to-[#e8d9bd] shadow-[0_24px_80px_rgba(70,45,15,0.18)]"
        }`}
      >
        {/* Subtle Ambient Top Glow */}
        <div
          className={`pointer-events-none absolute -top-8 left-1/2 h-28 w-2/3 -translate-x-1/2 rounded-full blur-2xl ${
            isDark ? "bg-gold/10" : "bg-amber-400/20"
          }`}
        />

        {/* Header HUD */}
        <div
          className={`relative z-10 mb-2 flex items-center justify-between border-b pb-3 ${
            isDark ? "border-gold/15" : "border-brass/15"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                  isDark ? "bg-gold" : "bg-brass"
                }`}
              />
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  isDark ? "bg-gold" : "bg-brass"
                }`}
              />
            </span>
            <span
              className={`eyebrow text-[10px] ${
                isDark ? "text-gold" : "text-brass"
              }`}
            >
              {isDark ? "Nocturne Vector" : "Terroir Vector"} · 19 Freight
              Corridors
            </span>
          </div>
          <div
            className={`hidden sm:flex items-center gap-4 eyebrow text-[10px] ${
              isDark ? "text-sand" : "text-umber font-semibold"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isDark ? "bg-saffron" : "bg-brass"
                }`}
              />{" "}
              2 Origin Citadels
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isDark ? "bg-gold" : "bg-brass"
                }`}
              />{" "}
              19 Active States
            </span>
          </div>
        </div>

        {/* High-Performance SVG Canvas with Zero Frame Drops */}
        <div className="relative h-full w-full">
          <svg
            viewBox={MAP_DIMENSIONS.viewBox}
            className="h-full w-full overflow-visible"
            aria-label="Interactive Vector Map of India Supply Network"
          >
            <defs>
              {/* Hardware-accelerated radial gradient for nodes */}
              <radialGradient id={`hubGlow-${theme}`} cx="50%" cy="50%" r="50%">
                <stop
                  offset="0%"
                  stopColor={isDark ? "#ffd875" : "#d97706"}
                  stopOpacity="0.9"
                />
                <stop
                  offset="60%"
                  stopColor={isDark ? "#d7b264" : "#b45309"}
                  stopOpacity="0.4"
                />
                <stop
                  offset="100%"
                  stopColor={isDark ? "#d7b264" : "#b45309"}
                  stopOpacity="0"
                />
              </radialGradient>

              {/* Linear gradient for supply lines */}
              <linearGradient
                id={`routeGradKarnal-${theme}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  stopColor={isDark ? "#ffd700" : "#d97706"}
                  stopOpacity="0.85"
                />
                <stop
                  offset="100%"
                  stopColor={isDark ? "#d7b264" : "#92400e"}
                  stopOpacity="0.25"
                />
              </linearGradient>

              <linearGradient
                id={`routeGradWada-${theme}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  stopColor={isDark ? "#f39c12" : "#c2410c"}
                  stopOpacity="0.85"
                />
                <stop
                  offset="100%"
                  stopColor={isDark ? "#d7b264" : "#9a3412"}
                  stopOpacity="0.25"
                />
              </linearGradient>

              <linearGradient
                id={`routeGradNagpur-${theme}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  stopColor={isDark ? "#ff7a45" : "#ea580c"}
                  stopOpacity="0.85"
                />
                <stop
                  offset="100%"
                  stopColor={isDark ? "#d7b264" : "#9a3412"}
                  stopOpacity="0.25"
                />
              </linearGradient>

              <linearGradient
                id={`routeGradMiryala-${theme}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  stopColor={isDark ? "#00e5a3" : "#059669"}
                  stopOpacity="0.85"
                />
                <stop
                  offset="100%"
                  stopColor={isDark ? "#d7b264" : "#047857"}
                  stopOpacity="0.25"
                />
              </linearGradient>
            </defs>

            {/* Memoized Static Mainland, Islands, and State Borders */}
            <StaticMapCartography isDark={isDark} />

            {/* Inter-Citadel Express Spine Line (Nagpur to Miryalaguda) */}
            <g className="citadel-spine opacity-85">
              <line
                x1={nagpurHub.x * 6.1543}
                y1={nagpurHub.y * 6.93}
                x2={miryalagudaHub.x * 6.1543}
                y2={miryalagudaHub.y * 6.93}
                stroke={isDark ? "#ffd700" : "#d97706"}
                strokeWidth="2"
                strokeDasharray="5 5"
              />
            </g>

            {/* Supply Routes: Only animate the single active route to guarantee 60-120fps */}
            <g className="routes-layer">
              {supplyRoutes.map((route) => {
                const isSelected = activeState?.id === route.destId
                const isHoveredRoute = hoveredStateId === route.destId
                const isHighlight = isSelected || isHoveredRoute
                return (
                  <path
                    key={route.id}
                    d={route.path}
                    fill="none"
                    stroke={
                      isHighlight
                        ? isDark
                          ? "#ffffff"
                          : "#7a5410"
                        : route.originHub === "miryalaguda"
                          ? `url(#routeGradMiryala-${theme})`
                          : `url(#routeGradNagpur-${theme})`
                    }
                    strokeWidth={isHighlight ? 2.4 : 1.1}
                    strokeOpacity={isHighlight ? 1 : currentId ? 0.18 : 0.5}
                    strokeDasharray={isHighlight ? "6 4" : "3 4"}
                    style={
                      isHighlight
                        ? { animation: "dashFlow 1.2s linear infinite" }
                        : undefined
                    }
                  />
                )
              })}
            </g>

            {/* Interactive State Nodes (19 States) */}
            <g className="hubs-layer">
              {SUPPLY_HUBS.map((hub) => {
                const isOrigin = hub.isOrigin
                const isSelected = activeState?.id === hub.id
                const isStateHovered = hoveredStateId === hub.id
                const isActive = isSelected || isStateHovered
                const isMatchingRegion = filteredHubs.some(
                  (h) => h.id === hub.id,
                )

                const vx = hub.x * 6.1543
                const vy = hub.y * 6.93

                // Capital formatting
                const capitalLabel = hub.capital
                  .split("(")[0]
                  .split("/")[0]
                  .trim()
                const fullBadgeText = `${hub.code} • ${capitalLabel}`
                const badgeWidth = Math.max(82, fullBadgeText.length * 6.5 + 24)

                // Smart positioning:
                // Southern states place badge ABOVE pin to prevent clipping
                const placeAbove = vy > 580
                const badgeY = placeAbove ? vy - 28 : vy + 10
                const textY = placeAbove ? vy - 17 : vy + 21

                // Clamp badge horizontally within viewBox
                const rawBadgeX = vx - badgeWidth / 2
                const clampedBadgeX = Math.max(
                  12,
                  Math.min(rawBadgeX, 615 - badgeWidth - 12),
                )

                return (
                  <g
                    key={hub.id}
                    className="cursor-pointer"
                    onPointerEnter={() => setHoveredStateId(hub.id)}
                    onPointerLeave={() => setHoveredStateId(null)}
                    onClick={() => onSelectState(isSelected ? null : hub)}
                    tabIndex={0}
                    role="button"
                    aria-label={`${hub.name} supply hub, Capital ${capitalLabel}`}
                  >
                    {/* Invisible expanded tap target */}
                    <circle cx={vx} cy={vy} r={24} fill="transparent" />

                    {/* Outer Pulse Ring for Active / Origin */}
                    {(isActive || isOrigin) && (
                      <circle
                        cx={vx}
                        cy={vy}
                        r={isOrigin ? 18 : 13}
                        fill="none"
                        stroke={isDark ? "#ffd700" : "#b45309"}
                        strokeWidth="1.2"
                        strokeDasharray="3 3"
                        className={isActive ? "animate-pulse" : "opacity-70"}
                      />
                    )}

                    {/* Radial Glow Halo */}
                    <circle
                      cx={vx}
                      cy={vy}
                      r={isOrigin ? 14 : isActive ? 12 : 7}
                      fill={`url(#hubGlow-${theme})`}
                      opacity={isActive ? 1 : isMatchingRegion ? 0.75 : 0.25}
                    />

                    {/* Solid Core Dot */}
                    <circle
                      cx={vx}
                      cy={vy}
                      r={isOrigin ? 7 : isActive ? 6 : 4}
                      fill={
                        isOrigin
                          ? "#ffffff"
                          : isActive
                            ? isDark
                              ? "#fff0b3"
                              : "#ffffff"
                            : isDark
                              ? "#ffd770"
                              : "#a16207"
                      }
                      stroke={isDark ? "#140f0a" : "#ffffff"}
                      strokeWidth="1.4"
                    />

                    {/* Origin Hub Citadel Star */}
                    {isOrigin && (
                      <text
                        x={vx}
                        y={vy - 13}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="900"
                        fill={isDark ? "#ffd875" : "#9a3412"}
                        className="font-mono tracking-wider"
                      >
                        ★ {hub.code}
                      </text>
                    )}

                    {/* State Code & Capital Badge when active or origin */}
                    {(isActive || isOrigin) && (
                      <g className="pointer-events-none">
                        <rect
                          x={clampedBadgeX}
                          y={badgeY}
                          width={badgeWidth}
                          height={18}
                          rx={0}
                          fill={
                            isDark
                              ? "rgba(10, 8, 6, 0.96)"
                              : "rgba(255, 255, 255, 0.97)"
                          }
                          stroke={
                            isDark
                              ? isActive
                                ? "#ffd700"
                                : "#d7b264"
                              : isActive
                                ? "#b45309"
                                : "#8c5319"
                          }
                          strokeWidth={isActive ? "1.3" : "0.9"}
                        />
                        <text
                          x={clampedBadgeX + badgeWidth / 2}
                          y={textY}
                          textAnchor="middle"
                          fontSize="8.5"
                          fontFamily="monospace"
                          fontWeight="700"
                          fill={
                            isDark
                              ? isActive
                                ? "#ffd700"
                                : "#f8ecdc"
                              : isActive
                                ? "#9a3412"
                                : "#451a03"
                          }
                        >
                          {fullBadgeText}
                        </text>
                      </g>
                    )}

                    {/* Compact State Code for inactive nodes */}
                    {!isActive && !isOrigin && (
                      <text
                        x={vx}
                        y={vy - 7}
                        textAnchor="middle"
                        fontSize="7.5"
                        fontFamily="monospace"
                        fontWeight="700"
                        fill={
                          isDark
                            ? "rgba(248, 236, 220, 0.75)"
                            : "rgba(92, 38, 3, 0.88)"
                        }
                        className="pointer-events-none select-none"
                      >
                        {hub.code}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>
          </svg>
        </div>

        {/* Floating Quick-Telemetry Badge if State is Inspected */}
        {activeState && (
          <div
            className={`relative z-20 mt-1 flex flex-wrap items-center justify-between gap-3 border px-3.5 py-2.5 transition-all ${
              isDark
                ? "border-gold/25 bg-coal/90 text-ivory shadow-lg"
                : "border-brass/25 bg-parchment/90 text-earth shadow-md"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                  isDark
                    ? "border border-gold/30 bg-gold/10 text-gold"
                    : "border border-brass/30 bg-brass/10 text-brass"
                }`}
              >
                {activeState.code}
              </span>
              <span className="font-display italic text-sm">
                {activeState.name}
              </span>
              <span
                className={`font-mono text-xs ${
                  isDark ? "text-gold" : "text-brass font-medium"
                }`}
              >
                · 🏛 {activeState.capital.split("(")[0].split("/")[0].trim()}
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className={isDark ? "text-sand" : "text-umber"}>
                Transit:{" "}
                <strong
                  className={isDark ? "text-gold font-normal" : "text-brass"}
                >
                  {activeState.dispatchTime}
                </strong>
              </span>
              <span className={isDark ? "text-gold/30" : "text-brass/30"}>
                |
              </span>
              <span className={isDark ? "text-sand" : "text-umber"}>
                Partners:{" "}
                <strong
                  className={isDark ? "text-ivory font-normal" : "text-earth"}
                >
                  {activeState.partners}+ Mandis
                </strong>
              </span>
            </div>
          </div>
        )}

        {/* Legend */}
        <div
          className={`relative z-10 mt-2 flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-[10px] sm:text-[11px] font-mono ${
            isDark
              ? "border-gold/15 text-sand"
              : "border-brass/15 text-umber font-medium"
          }`}
        >
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 border ${
                  isDark ? "border-gold bg-white" : "border-brass bg-amber-400"
                }`}
              />
              <span>Origin Mill Citadel</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 ${isDark ? "bg-gold" : "bg-brass"}`} />
              <span>Wholesale Partner State</span>
            </span>
          </div>
          <div
            className={`hidden sm:block ${
              isDark ? "text-gold/80" : "text-brass"
            }`}
          >
            Interactive Cartography · Hover or click any state
          </div>
        </div>
      </div>
    </div>
  )
}
