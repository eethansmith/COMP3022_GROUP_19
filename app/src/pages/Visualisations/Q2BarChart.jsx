import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";

export default function Q2BarChart({ scoresMap, selectedRegion, setSelectedRegion, className }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!scoresMap || scoresMap.size === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 500;
    const margin = { top: 30, right: 20, bottom: 50, left: 60 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Convert Map to sorted array of { id, score }
    const data = Array.from(scoresMap.entries())
      .map(([id, score]) => ({ id, score }))
      .sort((a, b) => b.score - a.score); // Highest uncertainty on top

    const x = d3.scaleBand()
      .domain(data.map(d => d.id))
      .range([0, innerWidth])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, 1])
      .range([innerHeight, 0]);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Axes
    g.append("g")
      .call(d3.axisLeft(y));

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickFormat(d => `ID ${d}`).tickValues(data.map(d => d.id).slice(0, 15)))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    // Bars
    g.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", d => x(d.id))
      .attr("y", d => y(d.score))
      .attr("width", x.bandwidth())
      .attr("height", d => innerHeight - y(d.score))
      .attr("fill", d => {
        if (d.score <= 0.3) return "blue";
        else if (d.score <= 0.6) return "orange";
        else return "red";
      })
      .attr("stroke", d => d.id === selectedRegion ? "black" : "none")
      .attr("stroke-width", d => d.id === selectedRegion ? 2 : 0)
      .style("cursor", "pointer")
      .on("click", (_, d) => setSelectedRegion(d.id));

    // Y-axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 15)
      .style("text-anchor", "middle")
      .text("Uncertainty Score");
  }, [scoresMap, selectedRegion, setSelectedRegion]);

  return <svg ref={svgRef} className={className} width={800} height={500} />;
}

Q2BarChart.propTypes = {
  scoresMap: PropTypes.instanceOf(Map).isRequired,
  selectedRegion: PropTypes.number,
  setSelectedRegion: PropTypes.func.isRequired,
  className: PropTypes.string,
};
