import React, { useState, useEffect } from "react";
// adjust path if your CSV lives elsewhere
import csvUrl from "..location-time-matrix.csv";

const CSV_PATH =
  process.env.PUBLIC_URL + "/data/resources/Q3/location-time-matrix.csv";

const HeatmapPlot = () => {
  const [dataMap, setDataMap] = useState({});
  const [locations, setLocations] = useState([]);
  const [timeBins, setTimeBins] = useState([]);

  useEffect(() => {
    fetch(csvUrl)
      .then((r) => r.text())
      .then((text) => {
        const rows = parseCSV(text);
        const map = {};
        const locSet = new Set();
        const timeSet = new Set();

        rows.forEach((row) => {
          const loc = row.location;
          const time = row.time_bin;
          locSet.add(loc);
          timeSet.add(time);

          if (!map[loc]) map[loc] = {};
          map[loc][time] = {
            n_reports: parseInt(row.n_reports, 10),
            composite_severity: parseFloat(row.composite_severity),
            missing_rate: parseFloat(row.missing_rate),
            local_uncertainty: parseFloat(row.local_uncertainty),
          };
        });

        const times = Array.from(timeSet).sort();
        // sort locations by their worst‐ever severity (desc)
        const locs = Array.from(locSet).sort((a, b) => {
          const maxA = Math.max(
            ...times.map((t) => map[a][t]?.composite_severity || 0)
          );
          const maxB = Math.max(
            ...times.map((t) => map[b][t]?.composite_severity || 0)
          );
          return maxB - maxA;
        });

        setDataMap(map);
        setTimeBins(times);
        setLocations(locs);
      });
  }, []);

  // linear green→red scale
  const getColor = (v) => {
    if (v == null) return "#eee";
    const r = Math.round(255 * v);
    const g = Math.round(255 * (1 - v));
    return `rgb(${r},${g},0)`;
  };

  // simple CSV parser (no quotes/commas-in-fields)
  const parseCSV = (text) => {
    const [headerLine, ...lines] = text.trim().split("\n");
    const headers = headerLine.split(",");
    return lines.map((line) => {
      const parts = line.split(",");
      return headers.reduce((o, h, i) => {
        o[h] = parts[i];
        return o;
      }, {});
    });
  };

  return (
    <div style={{ overflow: "auto", fontFamily: "sans-serif" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `150px repeat(${timeBins.length}, 20px)`,
          gridAutoRows: "20px",
        }}
      >
        {/* top‐left empty cell */}
        <div style={{ gridColumn: 1, gridRow: 1 }} />

        {/* time‐bin headers */}
        {timeBins.map((time, i) => (
          <div
            key={time}
            style={{
              gridColumn: i + 2,
              gridRow: 1,
              textAlign: "center",
              fontSize: "8px",
              padding: "1px",
            }}
          >
            {time.slice(11, 16)}
          </div>
        ))}

        {/* rows */}
        {locations.map((loc, ri) => (
          <React.Fragment key={loc}>
            {/* row label */}
            <div
              style={{
                gridColumn: 1,
                gridRow: ri + 2,
                fontSize: "10px",
                padding: "2px",
                whiteSpace: "nowrap",
              }}
            >
              {loc}
            </div>
            {/* cells */}
            {timeBins.map((time, ci) => {
              const cell = dataMap[loc]?.[time];
              const sev = cell?.composite_severity;
              const unc = cell?.local_uncertainty;
              // make uncertain cells “fuzzier”
              const opacity = unc != null ? 1 - Math.min(unc / 2, 1) : 1;
              const bg = getColor(sev);
              const title = cell
                ? `Reports: ${cell.n_reports}
Missing rate: ${cell.missing_rate}
Composite severity: ${sev}`
                : "";
              return (
                <div
                  key={time}
                  style={{
                    gridColumn: ci + 2,
                    gridRow: ri + 2,
                    width: "20px",
                    height: "20px",
                    backgroundColor: bg,
                    opacity,
                  }}
                  title={title}
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
