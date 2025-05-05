import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";

const margin = { top: 20, right: 20, bottom: 30, left: 40 };

export default function ShakeMap({
  data,
  scoresMap,
  selectedRegion,
  setSelectedRegion,
  colorScale,
  className,
  ...props
}) {
  const svgRef = useRef(null);

  const scale =
    colorScale ||
    d3.scaleLinear().domain([0, 10]).range(["#FFFBEA", "#8B0000"]).clamp(true);

  useEffect(() => {
    if (!data || !scoresMap) return;
  
    const svgEl = svgRef.current;
    const { width, height } = svgEl.getBoundingClientRect();
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
  
    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();
  
    const projection = d3.geoMercator().fitSize([innerWidth, innerHeight], data);
    const path = d3.geoPath().projection(projection);
  
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    let hoveredRegion = null;

    // Draw outer boundary (single outline around the entire map)
    g.append("path")
      .datum({
        type: "Feature",
        geometry: {
          type: "MultiPolygon",
          coordinates: data.features.map(f => f.geometry.coordinates).flat(),
        },
      })
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-width", 5)
      .attr("d", path);

  
    // Draw all regions
    const regions = g.selectAll("path.region")
      .data(data.features)
      .enter()
      .append("path")
      .attr("class", "region")
      .attr("d", path)
      .attr("fill", d => {
        const v = scoresMap.get(+d.properties.Id);
        return v != null ? scale(v) : "#ccc";
      })
      .attr("stroke", "#111")
      .attr("stroke-width", 0.5)
      .style("cursor", "pointer")
      .on("click", (_, d) => setSelectedRegion(+d.properties.Id))
      .on("mouseover", function (_, d) {
        hoveredRegion = d;
        drawOverlayPaths();
      })
      .on("mouseout", function () {
        hoveredRegion = null;
        drawOverlayPaths();
      });
  
    // Overlay group for selected + hovered outlines
    const overlay = g.append("g").attr("class", "overlay");
  
    function drawOverlayPaths() {
      overlay.selectAll("*").remove();
  
      if (selectedRegion != null) {
        const selected = data.features.find(
          f => +f.properties.Id === selectedRegion
        );
        if (selected) {
          overlay.append("path")
            .attr("d", path(selected))
            .attr("fill", "none")
            .attr("stroke", "#000")
            .attr("stroke-width", 4);

          overlay.append("path")
            .attr("d", path(selected))
            .attr("fill", "none")
            .attr("stroke", "#FFF")
            .attr("stroke-width", 2);
        }
      }
  
      if (hoveredRegion != null) {
        overlay.append("path")
          .attr("d", path(hoveredRegion))
          .attr("fill", "none")
          .attr("stroke", "#FFF")
          .attr("stroke-width", 2);
      }
    }
  
    drawOverlayPaths();
  
    // Legend remains unchanged
    const legendWidth = 160;
    const legendScale = d3.scaleLinear().domain([0, 10]).range([0, legendWidth]);
  
    const legend = g.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${innerWidth - legendWidth},20)`);
  
    legend.append("defs")
      .append("linearGradient")
      .attr("id", "gradient")
      .selectAll("stop")
      .data(d3.range(0, 101))
      .enter()
      .append("stop")
      .attr("offset", d => `${d}%`)
      .attr("stop-color", d => scale(d / 10));
  
    legend.append("rect")
      .attr("width", legendWidth)
      .attr("height", 10)
      .style("fill", "url(#gradient)");
  
    legend.append("g")
      .attr("transform", "translate(0,15)")
      .call(
        d3.axisBottom(legendScale)
          .ticks(5)
          .tickSize(6)
          .tickFormat(d3.format(".1f"))
      );
  
    const selectedScore = selectedRegion != null ? scoresMap.get(selectedRegion) : null;
    if (selectedScore != null) {
      const x = legendScale(selectedScore);
  
      legend.append("line")
        .attr("x1", x)
        .attr("x2", x)
        .attr("y1", -4)
        .attr("y2", 10)
        .attr("stroke", "#000")
        .attr("stroke-width", 2);
    }
  }, [data, scoresMap, selectedRegion, scale]);
  

  return (
    <svg
      ref={svgRef}
      className={className}
      width="100%"
      height="100%"
      {...props}
    />
  );
}

ShakeMap.propTypes = {
  data:              PropTypes.object.isRequired,
  scoresMap:         PropTypes.instanceOf(Map).isRequired,
  selectedRegion:    PropTypes.any,
  setSelectedRegion: PropTypes.func.isRequired,
  colorScale:        PropTypes.func,
  className:         PropTypes.string
};
