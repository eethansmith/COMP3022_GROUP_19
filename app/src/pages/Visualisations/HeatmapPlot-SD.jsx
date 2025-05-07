import React, { useState, useEffect } from "react";

// adjust to wherever your CSV now lives:
const CSV_PATH =
  process.env.PUBLIC_URL + "/data/resources/mc1-q2-uncertainty-scores.csv";

const HeatmapPlot = () => {
  const [dataMap, setDataMap] = useState({});
  const [locations, setLocations] = useState([]);
  const [maxVals, setMaxVals] = useState({ std: 0, missing: 0, reports: 0 });

  useEffect(() => {
    fetch(CSV_PATH)
      .then((r) => r.text())
      .then((text) => {
        const rows = parseCSV(text);

        const map = {};
        const locSet = new Set();
        let maxStd = 0,
          maxMissing = 0,
          maxReports = 0;

        rows.forEach((row) => {
          const loc = row.location;
          if (!loc) return; // skip blank lines or malformed

          // pull the real CSV columns:
          const std = parseFloat(row.std_dev_buildings);
          const missing = parseFloat(row.missing_shake_pct);
          const reports = parseInt(row.report_count, 10);

          // track them
          map[loc] = { std, missing, reports };
          locSet.add(loc);

          if (!isNaN(std) && std > maxStd) maxStd = std;
          if (!isNaN(missing) && missing > maxMissing) maxMissing = missing;
          if (!isNaN(reports) && reports > maxReports)
            maxReports = reports;
        });

        setDataMap(map);
        // sort numerically if possible
        setLocations(
          Array.from(locSet).sort((a, b) => {
            const na = Number(a),
              nb = Number(b);
            if (!isNaN(na) && !isNaN(nb)) return na - nb;
            return a.localeCompare(b);
          })
        );
        setMaxVals({ std: maxStd, missing: maxMissing, reports: maxReports });
      });
  }, []);

  // A tiny CSV parser that strips outer quotes
  const parseCSV = (text) => {
    const [headerLine, ...lines] = text.trim().split("\n");
    const headers = headerLine
      .split(",")
      .map((h) => h.replace(/^"|"$/g, ""));

    return lines.map((line) => {
      const cols = line.split(",");
      const obj = {};
      headers.forEach((h, i) => {
        let v = cols[i] ?? "";
        // strip quotes off values too
        v = v.replace(/^"|"$/g, "");
        obj[h] = v;
      });
      return obj;
    });
  };

  // unified colour function
  const getColor = (v, max, channel) => {
    if (v == null || isNaN(v) || max === 0) return "#eee";
    const norm = v / max;
    const c = Math.round(255 * (1 - norm));
    switch (channel) {
      case "blue":
        return `rgb(${c},${c},255)`; // white→blue
      case "magenta":
        return `rgb(255,${c},255)`; // white→magenta
      case "green":
        return `rgb(${c},255,${c})`; // white→green
      default:
        return "#000";
    }
  };

  const metrics = [
    { key: "std", label: "Std Dev", channel: "blue" },
    { key: "missing", label: "Missing Shake %", channel: "magenta" },
    { key: "reports", label: "Report Count", channel: "green" },
  ];

  return (
    <div style={{ width: "100%", overflow: "auto", fontFamily: "sans-serif" }}>
      {/* header row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `150px repeat(${metrics.length}, 80px)`,
          marginBottom: 4,
        }}
      >
        <div /> {/* empty top-left */}
        {metrics.map((m) => (
          <div
            key={m.key}
            style={{ textAlign: "center", fontSize: 12, padding: "4px 0" }}
          >
            {m.label}
          </div>
        ))}
      </div>

      {/* heatmap grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `150px repeat(${metrics.length}, 80px)`,
          gridAutoRows: "20px",
        }}
      >
        {locations.map((loc, ri) => (
          <React.Fragment key={loc}>
            {/* location label */}
            <div
              style={{
                gridColumn: 1,
                gridRow: ri + 1,
                fontSize: 10,
                padding: "2px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={`Location ${loc}`}
            >
              {loc}
            </div>

            {/* metric cells */}
            {metrics.map((m, ci) => {
              const val = dataMap[loc]?.[m.key];
              return (
                <div
                  key={m.key}
                  style={{
                    gridColumn: ci + 2,
                    gridRow: ri + 1,
                    width: "80px",
                    height: "20px",
                    backgroundColor: getColor(
                      val,
                      maxVals[m.key],
                      m.channel
                    ),
                  }}
                  title={`${m.label}: ${
                    val == null || isNaN(val) ? "n/a" : val
                  }`}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default HeatmapPlot;
