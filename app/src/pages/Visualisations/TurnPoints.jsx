// src/Visualisations/TurnPoints.jsx
import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

const changepointsCSV = process.env.PUBLIC_URL + "/data/resources/Q3/changepoints.csv";

const TurnPoints = ({
  width = 800,
  height = 300,
  scheme = null   // optional filter on d.scheme
}) => {
  const svgRef = useRef();

  useEffect(() => {
    d3.csv(changepointsCSV, d => ({
      scheme: d.scheme,
      time: new Date(d.time_bin),
      composite_before: +d.composite_before,
      composite_after: +d.composite_after,
      delta: +d.delta,
      direction: d.direction.trim().toLowerCase()
    })).then(rawData => {
      const data = scheme
        ? rawData.filter(d => d.scheme === scheme)
        : rawData;

      const margin = { top: 20, right: 30, bottom: 30, left: 40 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;
      const markerHeight = innerHeight * 0.6;
      const barHeight = innerHeight * 0.35;

      const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.time))
        .range([0, innerWidth]);

      const yBar = d3.scaleLinear()
        .domain([
          d3.min(data, d => d.delta) * 1.1,
          d3.max(data, d => d.delta) * 1.1
        ])
        .range([markerHeight + barHeight, markerHeight]);

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Event markers
      g.selectAll("line.marker")
        .data(data)
        .enter().append("line")
          .attr("class", "marker")
          .attr("x1", d => x(d.time))
          .attr("x2", d => x(d.time))
          .attr("y1", 0)
          .attr("y2", markerHeight)
          .attr("stroke", "#666")
          .attr("stroke-dasharray", "4 2");

      g.selectAll("text.marker-label")
        .data(data)
        .enter().append("text")
          .attr("class", "marker-label")
          .attr("x", d => x(d.time) + 3)
          .attr("y", 12)
          .text(d => `Δ=${(d.delta * 100).toFixed(1)}%`)
          .attr("font-size", "10px")
          .attr("fill", "#333");

      // Delta bars
      const barWidth = innerWidth / data.length * 0.6;
      g.selectAll("rect.delta-bar")
        .data(data)
        .enter().append("rect")
          .attr("class", "delta-bar")
          .attr("x", d => x(d.time) - barWidth / 2)
          .attr("y", d => yBar(Math.max(0, d.delta)))
          .attr("width", barWidth)
          .attr("height", d => Math.abs(yBar(d.delta) - yBar(0)))
          .attr("fill", d => d.direction === "up" ? "#d62728" : "#2ca02c");

      // Axes
      const xAxis = d3.axisBottom(x).ticks(6);
      const yAxisLeft = d3.axisLeft(yBar)
        .ticks(4)
        .tickFormat(d => `${(d * 100).toFixed(0)}%`);

      g.append("g")
        .attr("transform", `translate(0,${markerHeight + barHeight})`)
        .call(xAxis);

      g.append("g")
        .call(yAxisLeft);

    }).catch(err => {
      console.error("Error loading/parsing changepoints CSV:", err);
    });
  }, [width, height, scheme]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ background: "#fafafa" }}
    />
  );
};

export default TurnPoints;
