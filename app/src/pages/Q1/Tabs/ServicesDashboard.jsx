import React, { useState, useEffect } from "react";
import * as d3 from "d3";

import SplitRow   from "../../../components/SplitRow";
import LineChart  from "../../Visualisations/LineChart";
import ShakeMap   from "../../Visualisations/ShakeMap";
import RadarGraph from "../../Visualisations/RadarGraph";
import BarChart   from "../../Visualisations/BarChart";

import geoJson    from "../../../assets/geojson/StHimark.geo.json";
import styles     from "./ServicesDashboard.module.css";

/**
 * Generic dashboard used by every emergency-service tab.
 *
 * @param {string} priorityCsv – path to “…-priority.csv”
 * @param {string} timelineCsv – path to “…-timeline.csv”
 * @param {string[]} blurb     – paragraphs that appear above the charts
 */
export default function ServicesDashboard({ priorityCsv, timelineCsv, blurb }) {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [scoresMap,      setScoresMap]      = useState(new Map());
  const [scoresData,     setScoresData]     = useState([]);

  /* --- fetch and enrich the “priority” CSV whenever its path changes --- */
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
        {blurb.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
      </div>

      <main className={styles.content}>
        <SplitRow leftWidth="50%" rightWidth="50%" height="70%">
          <LineChart
            dataUrl={timelineCsv}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
          />
          <ShakeMap
            data={geoJson}
            scoresMap={scoresMap}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
          />
        </SplitRow>

        <SplitRow leftWidth="60%" rightWidth="40%" height="25%">
          <RadarGraph
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            scoresMap={scoresMap}
          />
          <BarChart
            data={scoresData}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
          />
        </SplitRow>
      </main>
    </div>
  );
}
