import React, { useState, useEffect, useMemo } from "react";
import * as d3 from "d3";

import SplitRow   from "../../../components/SplitRow";
import LineChart  from "../../Visualisations/LineChart";
import ShakeMap   from "../../Visualisations/ShakeMap";
import RadarGraph from "../../Visualisations/RadarGraph";
import BarChart   from "../../Visualisations/BarChart";

import geoJson from "../../../assets/geojson/StHimark.geo.json";
import styles  from "./ServicesDashboard.module.css";

/**
 * Re-usable dashboard that drives every emergency-service tab.
 */
export default function ServicesDashboard({
  priorityCsv,
  timelineCsv,
  blurb,
  colorRange = ["#ffffff", "#ff0000"] // <-- fallback if nothing passed
}) {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [scoresMap,      setScoresMap]      = useState(new Map());
  const [scoresData,     setScoresData]     = useState([]);

  /* ---------- shared colour scale (min 0, max 10) ---------- */
  const colorScale = useMemo(
    () =>
      d3.scaleLinear()
        .domain([0, 10])
        .range(colorRange)
        .clamp(true),
    [colorRange]
  );

  /* ---------- load & enrich the priority CSV ---------- */
  useEffect(() => {
    d3.csv(priorityCsv, d3.autoType)
      .then(rows => {
        const enriched = rows.map(r => {
          const feat = geoJson.features.find(
            f => +f.properties.Id === +r.location
          );
          return {
            id:        r.location,
            name:      feat?.properties?.Nbrhood ?? `#${r.location}`,
            rating:    r.rating,
            n:         r.n,
            mean_sev:  r.mean_sev,
            adjusted:  r.adjusted
          };
        });
        setScoresData(enriched);
        setScoresMap(new Map(enriched.map(d => [d.id, d.rating])));
      })
      .catch(console.error);
  }, [priorityCsv]);

  /* ------------------------------ UI ------------------------------ */
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        {blurb.map((txt, i) => <p key={i}>{txt}</p>)}
      </div>

      <main className={styles.content}>
        <SplitRow leftWidth="50%" rightWidth="50%" height="70%">
          <LineChart
            dataUrl={timelineCsv}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            colorScale={colorScale}
          />
          <ShakeMap
            data={geoJson}
            scoresMap={scoresMap}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            colorScale={colorScale}
          />
        </SplitRow>

        <SplitRow leftWidth="60%" rightWidth="40%" height="25%">
          <RadarGraph
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            scoresMap={scoresMap}
            colorScale={colorScale}
          />
          <BarChart
            data={scoresData}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            colorScale={colorScale}
          />
        </SplitRow>
      </main>
    </div>
  );
}
