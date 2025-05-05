import React, { useEffect, useState, useMemo } from "react";
import * as d3 from "d3";
import RadarSVG from "./RadarSVG";
import styles  from "./RadarGraph.module.css";

const AREA_NAME = {
  1 : "Palace Hills",
  2 : "Northwest",
  3 : "Old Town",
  4 : "Safe Town",
  5 : "Southwest",
  6 : "Downtown",
  7 : "Wilson Forest",
  8 : "Scenic Vista",
  9 : "Broadview",
 10 : "Chapparal",
 11 : "Terrapin Springs",
 12 : "Pepper Mill",
 13 : "Cheddarford",
 14 : "Easton",
 15 : "Weston",
 16 : "Southton",
 17 : "Oak Willow",
 18 : "East Parton",
 19 : "West Parton"
};

const RadarGraph = ({
  selectedRegion,
  setSelectedRegion,
  smallSize = 75,
  gap       = 8,
}) => {
  const [rows, setRows]     = useState([]);
  const [selected, setSel]  = useState(null);

  const colourFn = useMemo(
    () => d3.scaleSequential(d3.interpolateYlGnBu).domain([0, 1]),
    []
  );

  useEffect(() => {
    d3.csv("/data/resources/radar-graph-areas.csv", d3.autoType).then(all => {
      all.sort((a, b) => d3.ascending(+a.area, +b.area));
      all.forEach(d => { d.Nbrhood = AREA_NAME[d.area]; });   // ← add name
      setRows(all);
      if (!selectedRegion) setSelectedRegion(+all[0].area);
    });
  }, []);

  useEffect(() => setSel(selectedRegion), [selectedRegion]);

  const visibleRows = useMemo(
    () => rows.filter(d => +d.area !== selected),
    [rows, selected]
  );

  const bigSize = useMemo(
    () => smallSize * 3 + gap * 2,
    [smallSize, gap]
  );

  return (
    <div className={styles.container}>
      <div
        className={styles.grid}
        style={{
          "--small-radar": `${smallSize}px`,
          "--radar-gap":   `${gap}px`,
        }}
      >
        {visibleRows.map(d => (
          <div
            key={d.area}
            className={styles.item}
            onClick={() => setSelectedRegion(+d.area)}
          >
            <RadarSVG
              data={d}
              size={smallSize}
              colourFn={colourFn}
              showAxes={false}
              showLabels={false}
            />
            <span className={styles.caption}>{AREA_NAME[d.area]}</span>
          </div>
        ))}
      </div>

      <div className={styles.bigChart}>
        {!!rows.length && (
          <RadarSVG
            key={selected}
            data={rows.find(d => +d.area === selected) || rows[0]}
            size={bigSize}
            selected
            colourFn={colourFn}
            showAxes={true}
            showLabels={true}
            showVertices={true}
            style={{ overflow: 'visible' }} 
          />
        )}
      </div>
    </div>
  );
};

export default RadarGraph;
