// src/Visualisations/RadarGraph.jsx
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import styles from "./RadarGraph.module.css";   // add a new css-module

const METRICS = [
  "sewer_and_water",
  "power",
  "roads_and_bridges",
  "medical",
  "buildings",
  "shake_intensity"
];

/* ─────────── Small reusable SVG radar ─────────── */
function RadarSVG({ data, size = 120, onClick, selected = false }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!data) return;
    const R   = size / 2 - 4;               // outer radius
    const k   = METRICS.length;
    const ang = (_, i) => (i / k) * (2 * Math.PI);

    // scale 0-1 → 0-R (input file already rounded & 0-1)
    const r = d3.scaleLinear().domain([0, 1]).range([0, R]);

    // convert metric scores to [x,y] pairs
    const pts = METRICS.map((m, i) => {
      const a = ang(null, i) - Math.PI / 2; // rotate so first axis is up
      const s = r(data[`${m}_score`]);
      return [R + s * Math.cos(a), R + s * Math.sin(a)];
    });

    // draw
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();            // clear

    svg                                          // polygon
      .append("polygon")
      .attr("points", pts.map(p => p.join(",")).join(" "))
      .attr("class", selected ? styles.bigFill : styles.smallFill);

    svg.selectAll(".axis")                       // axes
      .data(METRICS)
      .enter()
      .append("line")
      .attr("class", styles.axis)
      .attr("x1", R).attr("y1", R)
      .attr("x2", (_, i) => R + r(1) * Math.cos(ang(null, i) - Math.PI / 2))
      .attr("y2", (_, i) => R + r(1) * Math.sin(ang(null, i) - Math.PI / 2));

    svg.append("title").text(`Area ${data.area}`);
  }, [data, size, selected]);

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      onClick={onClick}
      className={selected ? styles.bigSvg : styles.smallSvg}
    />
  );
}

const RadarGraph = ({ selectedRegion, setSelectedRegion }) => {
  const [rows, setRows] = useState([]);  
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    d3.csv("/data/resources/radar-graph-areas.csv", d3.autoType).then(all => {
      all.sort((a, b) => d3.ascending(+a.area, +b.area));
      setRows(all);
      if (!selectedRegion) {
        setSelectedRegion(+all[0].area);
      }
    });
  }, []);

  /* keep internal selected state in sync with parent */
  useEffect(() => setSelected(selectedRegion), [selectedRegion]);

  return (
    <div className={styles.container}>
      {/* grid of 18 (4 rows × 5 cols = 20, but we leave one slot blank) */}
      <div className={styles.grid}>
        {rows.map(d => (
          <RadarSVG
            key={d.area}
            data={d}
            onClick={() => setSelectedRegion(+d.area)}
            selected={+d.area === selected}
          />
        ))}
      </div>

      {/* big radar on the right */}
      <div className={styles.bigChart}>
        {rows.length && (
          <RadarSVG
            key={selected}
            data={rows.find(d => +d.area === selected) || rows[0]}
            size={260}
            selected
          />
        )}
      </div>
    </div>
  );
};

export default RadarGraph;
