import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import styles from "./RadarGraph.module.css";

export const METRICS = [
  "sewer_and_water",
  "power",
  "roads_and_bridges",
  "medical",
  "buildings",
  "shake_intensity",
];

const LABELS = {
  sewer_and_water   : "Sewer & Water",
  power             : "Power",
  roads_and_bridges : "Roads & Bridges",
  medical           : "Medical",
  buildings         : "Buildings",
  shake_intensity   : "Shake Intensity",
};

const INNER_SCALE = 0.80;   // 80 % of the available radius

function RadarSVG({
  data,
  size         = 120,
  onClick,
  selected     = false,
  showAxes     = false,
  showLabels   = false,
  showVertices = false,
  colourFn,
  ...props
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!data) return;

    /* ---------- derived geometry ---------------------------------------- */
    const PADDING = 4;                       // inner padding in px
    const R       = size / 2 - PADDING;      // outer radius of SVG
    const Rin     = R * INNER_SCALE;         // radius we actually draw at
    const k       = METRICS.length;
    const ang     = i => (i / k) * 2 * Math.PI;

    const r    = d3.scaleLinear().domain([0, 1]).range([0, Rin]);
    const mean = d3.mean(METRICS, m => data[`${m}_score`]);
    const fill = selected ? "#FDB863" : colourFn(mean);

    /* ---------- compute polygon vertices --------------------------------- */
    const pts = METRICS.map((m, i) => {
      const a = ang(i) - Math.PI / 2;        // rotate so 0 is up
      const s = r(data[`${m}_score`]);
      return [R + s * Math.cos(a), R + s * Math.sin(a)];
    });

    /* ---------- draw ----------------------------------------------------- */
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();             // clear previous render

    // main polygon
    svg.append("polygon")
       .attr("points", pts.map(p => p.join(",")).join(" "))
       .attr("fill",   fill)
       .attr("stroke", selected ? "#CA6702" : d3.color(fill).darker(0.6))
       .attr("stroke-width", selected ? 2 : 1)
       .attr("opacity", 0.8);

    // grey spokes
    if (showAxes) {
      svg.selectAll(".axis")
         .data(METRICS)
         .enter()
         .append("line")
           .attr("class", styles.axis)
           .attr("x1", R).attr("y1", R)
           .attr("x2", (_, i) => R + Rin * Math.cos(ang(i) - Math.PI / 2))
           .attr("y2", (_, i) => R + Rin * Math.sin(ang(i) - Math.PI / 2));
    }

    // vertex dots (draw last so they sit on top)
    if (showVertices) {
      svg.selectAll(".vertex")
         .data(pts)
         .enter()
         .append("circle")
           .attr("class", styles.vertex)
           .attr("cx", d => d[0])
           .attr("cy", d => d[1])
           .attr("r", 3);
    }

    // metric labels
    if (showLabels) {
      const fontSize = size / 20;            // scales with overall SVG size

      svg.selectAll(".metricLabel")
         .data(METRICS)
         .enter()
         .append("text")
           .attr("class", styles.metricLabel)
           .attr("font-size", fontSize)
           .attr("x", (_, i) =>
               R + (Rin + fontSize) * Math.cos(ang(i) - Math.PI / 2))
           .attr("y", (_, i) =>
               R + (Rin + fontSize) * Math.sin(ang(i) - Math.PI / 2))
           .attr("dy", "0.35em")
           .attr("text-anchor", (_, i) => {
             const a = ang(i);
             return a === 0 || a === Math.PI ? "middle"
                  : a < Math.PI ? "start" : "end";
           })
           .text(m => LABELS[m]);
    }

    // tooltip
    svg.append("title").text(
      data.Nbrhood ? data.Nbrhood : `Area ${data.area}`
    );
  }, [data, size, colourFn, selected, showAxes, showLabels, showVertices]);

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      onClick={onClick}
      className={selected ? styles.bigSvg : styles.smallSvg}
      {...props}
    />
  );
}

export default RadarSVG;
