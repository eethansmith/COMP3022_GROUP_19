import { useEffect, useMemo, useState } from "react";

const CSV_PATH =
  process.env.PUBLIC_URL + "/data/resources/Q3/island-series.csv";

// ---- helpers ---------------------------------------------------------------
const parseCSV = (raw) => {
  const [hdr, ...lines] = raw.trim().split(/\r?\n/);
  const cols = hdr.split(",");
  return lines.map((L) => {
    const vals = L.split(",");
    return cols.reduce((o, c, i) => {
      const v = vals[i];
      if (["composite", "samp_uncertainty", "cover_uncertainty", "combined_uncertainty"].includes(c))
        o[c] = parseFloat(v);
      else if (c === "n_reports") o[c] = parseInt(v, 10);
      else if (c === "time_bin") o[c] = new Date(v);
      else o[c] = v;
      return o;
    }, {});
  });
};

const schemeLabels = {
  equal:     "Locations Equally Weighted ",
  intensity: "Severity Intensity Weighting",
  sqrt_n : "√Number of Reports",
};

const scaleLinear = (d0, d1, r0, r1) => {
  const span = d1 - d0 || 1;
  const m = (r1 - r0) / span;
  return (x) => r0 + (x - d0) * m;
};

const SCHEME_COLORS = {
  equal: "#f59e0b",      // blue
  intensity: "#10b981",  // amber
  sqrt_n: "#2563eb",     // green
};

// ---------------------------------------------------------------------------
export default function StatusOvertime() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch(CSV_PATH)
      .then((r) => r.text())
      .then((txt) => setRows(parseCSV(txt)))
      .catch(console.error);
  }, []);

  // 1-hour binning + aggregation
  const { byScheme, extents } = useMemo(() => {
    if (!rows.length) return { byScheme: {}, extents: {} };

    const BIN_MS = 1 * 3600 * 1000;             // 1-hour bins
    const START = new Date("2020-04-05T00:00:00Z"); // fixed start
    const buckets = {};

    rows.forEach((d) => {
      const tms = d.time_bin.getTime();
      const b0 = Math.floor(tms / BIN_MS) * BIN_MS;
      const key = `${d.scheme}|${b0}`;
      if (!buckets[key]) {
        buckets[key] = {
          scheme: d.scheme,
          time: new Date(b0),
          comps: [],
          uncs: [],
          reps: 0,
        };
      }
      buckets[key].comps.push(d.composite);
      buckets[key].uncs.push(d.combined_uncertainty);
      buckets[key].reps += d.n_reports;
    });

    const byScheme = {};
    let yMin = Infinity,
      yMax = -Infinity,
      maxRep = 0,
      xMax = -Infinity;

    Object.values(buckets).forEach((b) => {
      const avgC = b.comps.reduce((a, v) => a + v, 0) / b.comps.length;
      const avgU = b.uncs.reduce((a, v) => a + v, 0) / b.uncs.length;
      const rec = {
        time: b.time,
        composite: avgC,
        combined_uncertainty: avgU,
        n_reports: b.reps,
      };
      byScheme[b.scheme] = byScheme[b.scheme] || [];
      byScheme[b.scheme].push(rec);

      // extents
      const lo = avgC - 1.96 * avgU;
      const hi = avgC + 1.96 * avgU;
      if (lo < yMin) yMin = lo;
      if (hi > yMax) yMax = hi;
      if (b.reps > maxRep) maxRep = b.reps;
      const tms0 = b.time.getTime();
      if (tms0 > xMax) xMax = tms0;
    });

    Object.values(byScheme).forEach((arr) =>
      arr.sort((a, b) => a.time - b.time)
    );

    return {
      byScheme,
      extents: {
        yMin,
        yMax,
        maxRep,
        xMin: START,            // force start at 2020-04-05T00:00Z
        xMax: new Date(xMax),
      },
    };
  }, [rows]);

  if (!Object.keys(byScheme).length)
    return <p style={{ textAlign: "center" }}>Loading…</p>;

  // ---- layout ----
  const M = { top: 50, right: 20, bottom: 60, left: 70 };
  const W = 800,
    H = 350;
  const fullW = W + M.left + M.right;
  const fullH = H + M.top + M.bottom;

  // ---- scales ----
  const xScale = scaleLinear(
    extents.xMin.getTime(),
    extents.xMax.getTime(),
    0,
    W
  );
  const yScale = scaleLinear(extents.yMin, extents.yMax, H, 0);
  const rScale = scaleLinear(0, extents.maxRep, H, 0);

  // x-ticks every 6h
  const TICK_MS = 6 * 3600 * 1000;
  const ticks = [];
  for (
    let t = Math.floor(extents.xMin.getTime() / TICK_MS) * TICK_MS;
    t <= extents.xMax.getTime();
    t += TICK_MS
  ) {
    ticks.push(new Date(t));
  }

  const makeLine = (arr) =>
    arr
      .map((d, i) =>
        `${i === 0 ? "M" : "L"}${xScale(d.time.getTime())},${yScale(
          d.composite
        )}`
      )
      .join(" ");

  const makeRibbon = (arr) => {
    if (!arr.length) return "";
    const up = arr
      .map(
        (d) =>
          `L${xScale(d.time.getTime())},${yScale(
            d.composite + 1.96 * d.combined_uncertainty
          )}`
      )
      .join(" ")
      .replace(/^L/, "M");
    const dn = arr
      .slice()
      .reverse()
      .map(
        (d) =>
          `L${xScale(d.time.getTime())},${yScale(
            d.composite - 1.96 * d.combined_uncertainty
          )}`
      )
      .join(" ");
    return `${up} ${dn} Z`;
  };

  return (
    <div style={{ width: "100%" }}>
      {/* Title */}
      <h4 style={{ textAlign: "center", marginBottom: "8px" }}>
        Reported Severity &amp; Report Volume
      </h4>

      <svg
        width={fullW}
        height={fullH}
        viewBox={`0 0 ${fullW} ${fullH}`}
        style={{ maxWidth: "100%", height: "auto" }}
      >
        <g transform={`translate(${M.left},${M.top})`}>
          {/* Grey bars = report volume */}
          {Object.values(byScheme).flatMap((arr, si) =>
            arr.map((d, i) => {
              const bw = (W / arr.length) * 0.9;
              const x = xScale(d.time.getTime()) - bw / 2;
              const y = rScale(d.n_reports);
              return (
                <rect
                  key={`bar-${si}-${i}`}
                  x={x}
                  y={y}
                  width={bw}
                  height={H - y}
                  fill="#ddd"
                />
              );
            })
          )}

          {/* Ribbons & Lines */}
          {Object.entries(byScheme).map(([scheme, arr]) => {
            const color = SCHEME_COLORS[scheme] || "#666";
            return (
              <g key={scheme}>
                <path
                  d={makeRibbon(arr)}
                  fill={color}
                  opacity={0.25}
                />
                <path
                  d={makeLine(arr)}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                />
              </g>
            );
          })}

          {/* X-axis */}
          <line
            x1={0}
            x2={W}
            y1={H}
            y2={H}
            stroke="#000"
            strokeWidth={0.7}
          />
          {ticks.map((t, i) => {
            const x = xScale(t.getTime());
            return (
              <g key={i} transform={`translate(${x},${H})`}>
                <line y2={6} stroke="#000" strokeWidth={0.7} />
                <text
                  y={20}
                  fontSize={11}
                  textAnchor="middle"
                  style={{ userSelect: "none" }}
                >
                  {t.getUTCDate()}-{t.getUTCHours().toString().padStart(2, "0")}
                </text>
              </g>
            );
          })}

          {/* Y-axis */}
          <line
            x1={0}
            x2={0}
            y1={0}
            y2={H}
            stroke="#000"
            strokeWidth={0.7}
          />

          {/* Axis Labels */}
          <text
            x={W / 2}
            y={H + 50}
            textAnchor="middle"
            fontSize={25}
            fontWeight="500"
          >
            Time (UTC)
          </text>
          <text
            transform={`translate(${-50},${H / 2}) rotate(-90)`}
            textAnchor="middle"
            fontSize={25}
            fontWeight="500"
          >
            Reported Severity
          </text>
        </g>
      </svg>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "24px",
          marginTop: "12px",
        }}
      >
        {/* schemes */}
        {Object.entries(SCHEME_COLORS).map(([scheme, color]) => (
          <div
            key={scheme}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <svg width="16" height="16">
              <rect width="16" height="16" fill={color} opacity={0.4} />
            </svg>
            <small>{schemeLabels[scheme] ?? scheme}</small>
          </div>
        ))}
        {/* bars */}
        <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
          <svg width="20" height="20">
            <rect width="16" height="16" fill="#ddd" />
          </svg>
          <small>Total reports</small>
        </div>
      </div>
    </div>
  );
}

// ------- ------------------------------------------------------------------
/*
column	type	description
scheme	factor	Weighting recipe used when rolling the 19 locations up to one island value.
• equal — every location gets weight 1
• sqrt_n — weight = √(number of reports)
• intensity — weight proportional to that location’s average shake_intensity
time_bin	ISO-8601	Start-time of the 1-hour bin (YYYY-MM-DDThh:mm:ssZ, always UTC)
composite	numeric [0–1]	Severity index for the island at that hour, averaged with the chosen weights. It is a weighted mean of the 6 normalised attributes.
samp_uncertainty	numeric [0–1]	Island-level sampling uncertainty = weighted mean of location SEs (each SE scaled 0–1). Captures volatility caused by small sample sizes.
cover_uncertainty	numeric [0–1]	Island-level coverage uncertainty = weighted mean of missing-rate (fraction of blank cells). Flags hours where attributes were often unreported.
combined_uncertainty	numeric [0–2]	samp_uncertainty + cover_uncertainty — a single uncertainty envelope for quick plotting.
n_reports	integer	Total number of resident reports that landed in this hour, all locations combined.

*/