import React, { useState, useEffect, useMemo } from "react";
import * as d3 from "d3";

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

  const selectedRegionData = scoresData.find((data, index) => data.id === selectedRegion);

  /* ------------------------------ UI ------------------------------ */
  return (
    <div className={styles["wrapper"]}>
      <div className={styles["header"]}>
        {blurb.map((txt, i) => <p key={i}>{txt}</p>)}
      </div>

      <h2
        className={`${styles["region-title"]} ${
          selectedRegionData ? styles["region-selected"] : styles["region-prompt"]
        }`}
      >
        {selectedRegionData ? (
          <><span className={styles["region-name"]}>{selectedRegionData.name}</span> selected</>
        ) : (
          <>⚠️ <span className={styles["select-prompt"]}>SELECT A REGION FOR MORE INFORMATION</span></>
        )}
      </h2>


      <div className={styles["grid-container"]}>

        <div className={`${styles["grid-item"]} ${styles["line-chart-container"]}`}>
          <LineChart
            dataUrl={timelineCsv}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            colorScale={colorScale}
          />
        </div>

        <div className={`${styles["grid-item"]} ${styles["shake-map-container"]}`}>
          <ShakeMap
            data={geoJson}
            scoresMap={scoresMap}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            colorScale={colorScale}
          />
        </div>

        <div className={`${styles["grid-item"]} ${styles["radar-graph-container"]}`}>
          <RadarGraph
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            scoresMap={scoresMap}
            colorScale={colorScale}
          />
        </div>

        <div className={`${styles["grid-item"]} ${styles["bar-chart-container"]}`}>
          <BarChart
            data={scoresData}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            colorScale={colorScale}
          />
        </div>

      </div>
    </div>
  );
}
