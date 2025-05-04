import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";

const margin = { top: 10, right: 20, bottom: 30, left: 120 };

export default function BarChart({
  data,
  selectedRegion,
  setSelectedRegion,
  colorScale,           // <-- new prop
  className
}) {
  const svgRef = useRef();

  // default if parent forgets
  const scale =
    colorScale ||
    d3.scaleLinear()
      .domain([0, 10])
      .range(["#FFFBEA", "#8B0000"])
      .clamp(true);

  useEffect(() => {
    if (!data.length) return;

    const svgEl = svgRef.current;
    const { width, height } = svgEl.getBoundingClientRect();
    const innerW = width  - margin.left - margin.right;
    const innerH = height - margin.top  - margin.bottom;

    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    /* sort descending by rating */
    const sorted = [...data].sort((a, b) => b.rating - a.rating);

    /* scales */
    const x = d3.scaleLinear().domain([0, 10]).range([0, innerW]);
    const y = d3
      .scaleBand()
      .domain(sorted.map(d => d.name))
      .range([0, innerH])
      .padding(0.1);

    /* axes */
    g.append("g").call(d3.axisLeft(y));
    g
      .append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".1f")));

    /* bars */
    g.selectAll("rect")
      .data(sorted, d => d.id)
      .enter()
      .append("rect")
      .attr("y", d => y(d.name))
      .attr("height", y.bandwidth())
      .attr("x", 0)
      .attr("width", d => x(d.rating))
      .attr("fill", d => scale(d.rating))
      .attr("stroke", d => (d.id === selectedRegion ? "#000" : "none"))
      .attr("stroke-width", d => (d.id === selectedRegion ? 2 : 0))
      .style("cursor", "pointer")
      .on("click", (_, d) => setSelectedRegion(d.id));
  }, [data, selectedRegion, setSelectedRegion, scale]);

  return (
    <svg
      ref={svgRef}
      className={className}
      width="100%"
      height="100%"
    />
  );
}

BarChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id:       PropTypes.number.isRequired,
      name:     PropTypes.string.isRequired,
      rating:   PropTypes.number.isRequired,
      n:        PropTypes.number.isRequired,
      mean_sev: PropTypes.number.isRequired,
      adjusted: PropTypes.number.isRequired
    })
  ).isRequired,
  selectedRegion:    PropTypes.number,
  setSelectedRegion: PropTypes.func.isRequired,
  colorScale:        PropTypes.func, // ← new
  className:         PropTypes.string
};
