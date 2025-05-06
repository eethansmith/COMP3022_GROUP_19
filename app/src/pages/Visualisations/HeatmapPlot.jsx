import React, { useState, useEffect } from "react";

// Path to your CSV in the public folder
const CSV_PATH = process.env.PUBLIC_URL + "/data/resources/Q3/location-time-matrix.csv";

const HeatmapPlot = () => {
  const [dataMap, setDataMap] = useState({});
  const [locations, setLocations] = useState([]);
  const [timeBins, setTimeBins] = useState([]);

  useEffect(() => {
    fetch(CSV_PATH)
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

  // simple green→red severity ramp
  const getColor = (v) => {
    if (v == null) return "#eee";
    const r = Math.round(255 * v);
    const g = Math.round(255 * (1 - v));
    return `rgb(${r},${g},0)`;
  };

  // naive CSV parser
  const parseCSV = (text) => {
    const [headerLine, ...lines] = text.trim().split("\n");
    const headers = headerLine.split(",");
    return lines.map((line) => {
      const cols = line.split(",");
      return headers.reduce((obj, h, i) => {
        obj[h] = cols[i];
        return obj;
      }, {});
    });
  };

  // decide tick interval to show ~10 labels
  const tickInterval = Math.ceil(timeBins.length / 10);

  return (
    <div style={{ width: '100%', overflow: 'auto', fontFamily: 'sans-serif' }}>
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0', fontSize: '12px' }}>
        <span style={{ marginRight: '8px' }}>Low</span>
        <div style={{ flex: 1, height: '8px', background: 'linear-gradient(to right, green, red)' }} />
        <span style={{ marginLeft: '8px' }}>High</span>
      </div>

      {/* Axis Labels */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
        <div style={{ width: '150px', textAlign: 'center', fontSize: '12px' }}>Location</div>
        <div style={{ flex: 1, textAlign: 'center', fontSize: '12px' }}>Time (HH:MM)</div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `150px repeat(${timeBins.length}, 12px)`,
          gridAutoRows: '12px',
        }}
      >
        {/* top-left blank */}
        <div style={{ gridColumn: 1, gridRow: 1 }} />

        {/* Time ticks */}
        {timeBins.map((t, i) => (
          <div
            key={t}
            style={{
              gridColumn: i + 2,
              gridRow: 1,
              textAlign: 'center',
              fontSize: '8px',
              padding: '1px',
              visibility: i % tickInterval === 0 ? 'visible' : 'hidden',
            }}
          >
            {t.slice(11, 16)}
          </div>
        ))}

        {/* Data Cells */}
        {locations.map((loc, ri) => (
          <React.Fragment key={loc}>
            {/* Location Labels */}
            <div
              style={{
                gridColumn: 1,
                gridRow: ri + 2,
                fontSize: '10px',
                padding: '1px',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
              title={loc}
            >
              {loc}
            </div>

            {/* Cells */}
            {timeBins.map((t, ci) => {
              const c = dataMap[loc]?.[t];
              const sev = c?.composite_severity;
              const unc = c?.local_uncertainty;
              const opacity = unc != null ? 1 - Math.min(unc / 2, 1) : 1;
              const bg = getColor(sev);
              const title = c
                ? `Reports: ${c.n_reports}\nMissing rate: ${c.missing_rate}\nSeverity: ${sev}`
                : '';

              return (
                <div
                  key={t}
                  style={{
                    gridColumn: ci + 2,
                    gridRow: ri + 2,
                    width: '12px',
                    height: '12px',
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
