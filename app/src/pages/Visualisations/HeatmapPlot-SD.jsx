import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

// Adjust to wherever your CSV lives:
const CSV_PATH =
  process.env.PUBLIC_URL + "/data/resources/mc1-q2-uncertainty-scores.csv";

const HeatmapPlot = ({
  selectedRegion,
  setSelectedRegion,
  infocardMap,
  colorScale,
}) => {
  const [dataMap, setDataMap] = useState({});
  const [locations, setLocations] = useState([]);
  const [maxVals, setMaxVals] = useState({
    std: 0,
    missing: 0,
    reports: 0,
    uncertainty: 0,
  });
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    fetch(CSV_PATH)
      .then((r) => r.text())
      .then((text) => {
        const rows = parseCSV(text);
        const map = {};
        const locSet = new Set();
        let maxStd = 0,
          maxMissing = 0,
          maxReports = 0,
          maxUnc = 0;

        rows.forEach((row) => {
          const loc = row.location;
          if (!loc) return;

          const std = parseFloat(row.std_dev_buildings);
          const missing = parseFloat(row.missing_shake_pct);
          const reports = parseInt(row.report_count, 10);
          const uncertainty = parseFloat(row.uncertainty_score);

          map[loc] = { std, missing, reports, uncertainty };
          locSet.add(loc);

          if (!isNaN(std) && std > maxStd) maxStd = std;
          if (!isNaN(missing) && missing > maxMissing) maxMissing = missing;
          if (!isNaN(reports) && reports > maxReports) maxReports = reports;
          if (!isNaN(uncertainty) && uncertainty > maxUnc) maxUnc = uncertainty;
        });

        setDataMap(map);
        setLocations(
          Array.from(locSet).sort((a, b) => {
            const na = Number(a),
              nb = Number(b);
            return !isNaN(na) && !isNaN(nb)
              ? na - nb
              : a.localeCompare(b);
          })
        );
        setMaxVals({ std: maxStd, missing: maxMissing, reports: maxReports, uncertainty: maxUnc });
      });
  }, []);

  // Simple CSV parser that strips quotes
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
        obj[h] = v.replace(/^"|"$/g, "");
      });
      return obj;
    });
  };

  // Define your metrics
  const metrics = [
    { key: "std", label: "Std Dev" },
    { key: "missing", label: "Missing Shake %" },
    { key: "reports", label: "Report Count" },
    { key: "uncertainty", label: "Uncertainty" },
  ];

  // Cell colour: grey ramp for most, custom colorScale for uncertainty
    // Cell colour: grey ramp for most, custom colorScale for uncertainty
  const getCellColor = (key, val) => {
    if (val == null || isNaN(val)) return "#eee";
    if (key === "uncertainty") {
      // uncertainty_score originally 0–1; scale expects 0–10
      return colorScale(val * 10);
    }
    const max = maxVals[key];
    if (max === 0) return "#CED3D3";
    const norm = val / max;

    const interpolateHex = (startHex, endHex, t) => {
      const s = parseInt(startHex.slice(1), 16);
      const e = parseInt(endHex.slice(1), 16);

      const sr = (s >> 16) & 0xff,
            sg = (s >> 8) & 0xff,
            sb = s & 0xff;

      const er = (e >> 16) & 0xff,
            eg = (e >> 8) & 0xff,
            eb = e & 0xff;

      const r = Math.round(sr + (er - sr) * t);
      const g = Math.round(sg + (eg - sg) * t);
      const b = Math.round(sb + (eb - sb) * t);

      return `#${r.toString(16).padStart(2, '0')}${g
        .toString(16)
        .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };

    return interpolateHex("#CED3D3", "#47586C", norm);
  };

  return (
    <div style={{ width: "100%", overflowX: "auto", fontFamily: "sans-serif" }}>
      {/* Header row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `150px repeat(${metrics.length}, 80px)`,
          marginBottom: 8,
        }}
      >
        <div />
        {metrics.map((m) => (
          <div
            key={m.key}
            style={{ textAlign: "center", fontSize: 12, fontWeight: 600 }}
          >
            {m.label}
          </div>
        ))}
      </div>

      {/* Rows */}
      {locations.map((locStr) => {
        const id = Number(locStr);
        const regionName = infocardMap.get(id)?.name || locStr;
        const isSel = id === selectedRegion;
        const isHover = id === hovered;

        return (
          <div
            key={id}
            onClick={() => setSelectedRegion(id)}
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: "grid",
              gridTemplateColumns: `150px repeat(${metrics.length}, 80px)`,
              backgroundColor: isSel
                ? "rgba(100,150,255,0.2)"
                : isHover
                ? "rgba(200,200,200,0.1)"
                : "transparent",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                padding: "4px",
                fontSize: 10,
                fontWeight: isSel ? 600 : 400,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={regionName}
            >
              {regionName}
            </div>

            {metrics.map((m) => {
              const val = dataMap[locStr]?.[m.key];
              return (
                <div
                  key={m.key}
                  style={{
                    width: "80px",
                    height: "20px",
                    backgroundColor: getCellColor(m.key, val),
                  }}
                  title={`${m.label}: ${
                    val == null || isNaN(val) ? "n/a" : val
                  }`}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

HeatmapPlot.propTypes = {
  selectedRegion:    PropTypes.number,
  setSelectedRegion: PropTypes.func.isRequired,
  infocardMap:       PropTypes.instanceOf(Map).isRequired,
  colorScale:        PropTypes.func.isRequired,
};

export default HeatmapPlot;
