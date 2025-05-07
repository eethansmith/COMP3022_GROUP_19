// src/Visualisations/TimelineMap.jsx
import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";

// still load only the CSV yourself:
const CSV_PATH =
  process.env.PUBLIC_URL + "/data/resources/Q3/timeline-shake-intensity.csv";

const TimelineMap = ({ geoJson }) => {
  const svgRef = useRef(null);

  // geoJson comes in from props:
  const geoData = geoJson;

  const [records, setRecords] = useState([]);
  const [times, setTimes] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [scoresMap, setScoresMap] = useState(new Map());

  const margin = { top: 25, right: 25, bottom: 35, left: 45 };

  // same enhanced color scale:
  const colorScale = d3.scaleLinear()
    .domain([0, 2, 4, 6, 8, 10])
    .range(["#F8F9FA", "#FFF3CD", "#FFDA6A", "#FD7E14", "#DC3545", "#8B0000"])
    .interpolate(d3.interpolateHcl)
    .clamp(true);

  // 1) fetch only the CSV on mount
  useEffect(() => {
    d3.csv(CSV_PATH, row => ({
      location: +row.location,
      time: new Date(row.time),
      value: row.shake_intensity === "" ? NaN : +row.shake_intensity
    }))
      .then(csvData => {
        setRecords(csvData);

        // build sorted unique timestamps
        const uniq = Array.from(new Set(csvData.map(d => +d.time)))
          .map(ts => new Date(ts))
          .sort((a, b) => a - b);
        setTimes(uniq);
        setCurrentIdx(0);
      })
      .catch(err => console.error("CSV load error:", err));
  }, []);

  // 2) rebuild our lookup Map when time index changes
  useEffect(() => {
    if (!records.length || !times.length) return;
    const t = times[currentIdx].valueOf();
    const m = new Map();
    records
      .filter(r => r.time.valueOf() === t && !isNaN(r.value))
      .forEach(r => m.set(r.location, r.value));
    setScoresMap(m);
  }, [records, times, currentIdx]);

  // 3) draw / re-draw map when geoData or scoresMap changes
  useEffect(() => {
    if (!geoData) return;

    const svgEl = svgRef.current;
    const { width, height } = svgEl.getBoundingClientRect();
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    // projection + path generator
    const projection = d3.geoMercator()
      .fitSize([innerW, innerH], geoData)
      .precision(0.1);
    const path = d3.geoPath().projection(projection);

    // drop-shadow filter
    const defs = svg.append("defs");
    defs.append("filter")
      .attr("id", "drop-shadow")
      .attr("height", "130%")
      .append("feDropShadow")
      .attr("dx", 0)
      .attr("dy", 1)
      .attr("stdDeviation", 2)
      .attr("flood-opacity", 0.3);

    // container g
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // background
    g.append("rect")
      .attr("width", innerW)
      .attr("height", innerH)
      .attr("fill", "#f0f9ff")
      .attr("rx", 8)
      .attr("ry", 8);

    // outer boundary
    g.append("path")
      .datum({
        type: "Feature",
        geometry: {
          type: "MultiPolygon",
          coordinates: geoData.features.map(f => f.geometry.coordinates).flat()
        }
      })
      .attr("fill", "none")
      .attr("stroke", "#495057")
      .attr("stroke-width", 4)
      .attr("stroke-linejoin", "round")
      .attr("filter", "url(#drop-shadow)")
      .attr("d", path);

    // regions
    g.selectAll("path.region")
      .data(geoData.features)
      .enter()
      .append("path")
      .attr("class", "region")
      .attr("d", path)
      .attr("fill", d => {
        const v = scoresMap.get(+d.properties.Id);
        return v != null ? colorScale(v) : "#e9ecef";
      })
      .attr("stroke", "#495057")
      .attr("stroke-width", 0.5)
      .attr("stroke-linejoin", "round");

    // legend
    const lw = 180, lh = 12;
    const lscale = d3.scaleLinear().domain([0, 10]).range([0, lw]);
    const legend = g.append("g")
      .attr("transform", `translate(${innerW - lw - 10},15)`);

    legend.append("text")
      .attr("x", 0).attr("y", 40)
      .attr("text-anchor", "start")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "#495057")
      .text("Intensity");

    const grad = legend.append("defs")
      .append("linearGradient")
      .attr("id", "gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0).attr("x2", lw);

    grad.selectAll("stop")
      .data([0, 0.2, 0.4, 0.6, 0.8, 1])
      .enter()
      .append("stop")
      .attr("offset", d => `${d * 100}%`)
      .attr("stop-color", d => colorScale(d * 10));

    legend.append("rect")
      .attr("width", lw)
      .attr("height", lh)
      .attr("rx", 2)
      .attr("ry", 2)
      .style("fill", "url(#gradient)")
      .style("stroke", "#adb5bd")
      .style("stroke-width", 0.5);

    legend.append("g")
      .attr("transform", `translate(0,${lh})`)
      .call(
        d3.axisBottom(lscale)
          .ticks(5)
          .tickSize(4)
          .tickFormat(d3.format(".1f"))
      )
      .selectAll("text")
      .attr("font-size", "10px")
      .attr("fill", "#495057");

  }, [geoData, scoresMap]);

  const onSlider = e => setCurrentIdx(+e.target.value);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <svg ref={svgRef} width="100%" height="85%" style={{ overflow: "visible" }} />
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: "50%",
          transform: "translateX(-50%)",
          width: "80%"
        }}
      >
        <input
          type="range"
          min={0}
          max={times.length - 1}
          step={1}
          value={currentIdx}
          onChange={onSlider}
          style={{ width: "100%" }}
        />
        <div style={{ textAlign: "center", marginTop: 4, fontSize: "0.9em" }}>
          {times[currentIdx]?.toLocaleString() || ""}
        </div>
      </div>
    </div>
  );
};

TimelineMap.propTypes = {
  geoJson: PropTypes.object.isRequired
};

export default TimelineMap;
