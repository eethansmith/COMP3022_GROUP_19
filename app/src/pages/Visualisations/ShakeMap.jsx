import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";

const ShakeMap = ({
  data,
  scoresMap,
  selectedRegion,
  setSelectedRegion,
  colorScale,
  className,
  ...props
}) => {
  const svgRef = useRef(null);
  const margin = { top: 25, right: 25, bottom: 35, left: 45 };

  // Enhanced color scale with better visual gradient
  const scale = colorScale || 
    d3.scaleLinear()
      .domain([0, 2, 4, 6, 8, 10])
      .range(["#F8F9FA", "#FFF3CD", "#FFDA6A", "#FD7E14", "#DC3545", "#8B0000"])
      .interpolate(d3.interpolateHcl)
      .clamp(true);

  useEffect(() => {
    if (!data || !scoresMap) return;
  
    const svgEl = svgRef.current;
    const { width, height } = svgEl.getBoundingClientRect();
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
  
    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();
  
    // Better map projection with slight rotation for visual interest
    const projection = d3.geoMercator()
      .fitSize([innerWidth, innerHeight], data)
      .precision(0.1);
      
    const path = d3.geoPath().projection(projection);
  
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    let hoveredRegion = null;

    // Add drop shadow filter for depth
    const defs = svg.append("defs");
    
    defs.append("filter")
      .attr("id", "drop-shadow")
      .attr("height", "130%")
      .append("feDropShadow")
      .attr("dx", 0)
      .attr("dy", 1)
      .attr("stdDeviation", 2)
      .attr("flood-opacity", 0.3);

    // Background for the map
    g.append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "#fff")
      .attr("rx", 8)
      .attr("ry", 8);

    // Draw outer boundary with smoother edges
    g.append("path")
      .datum({
        type: "Feature",
        geometry: {
          type: "MultiPolygon",
          coordinates: data.features.map(f => f.geometry.coordinates).flat(),
        },
      })
      .attr("fill", "none")
      .attr("stroke", "#495057")
      .attr("stroke-width", 4)
      .attr("stroke-linejoin", "round")
      .attr("filter", "url(#drop-shadow)")
      .attr("d", path);

    // Draw all regions with improved styling
    const regions = g.selectAll("path.region")
      .data(data.features)
      .enter()
      .append("path")
      .attr("class", "region")
      .attr("d", path)
      .attr("fill", d => {
        const v = scoresMap.get(+d.properties.Id);
        return v != null ? scale(v) : "#e9ecef";
      })
      .attr("stroke", "#495057")
      .attr("stroke-width", 0.5)
      .attr("stroke-linejoin", "round")
      .style("cursor", "pointer")
      .style("transition", "fill 0.2s ease-in-out")
      .on("click", (_, d) => setSelectedRegion(+d.properties.Id))
      .on("mouseover", function (_, d) {
        hoveredRegion = d;
        d3.select(this).attr("opacity", 0.9);
        drawOverlayPaths();
      })
      .on("mouseout", function () {
        hoveredRegion = null;
        d3.select(this).attr("opacity", 1);
        drawOverlayPaths();
      });
  
    // Overlay group for selected + hovered outlines with improved styling
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
            .attr("stroke", "#212529")
            .attr("stroke-width", 3)
            .attr("stroke-dasharray", "none")
            .attr("stroke-linejoin", "round");

          overlay.append("path")
            .attr("d", path(selected))
            .attr("fill", "none")
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 1.5)
            .attr("stroke-linejoin", "round");
        }
      }
  
      if (hoveredRegion != null) {
        overlay.append("path")
          .attr("d", path(hoveredRegion))
          .attr("fill", "none")
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "4,2")
          .attr("stroke-linejoin", "round");
      }
    }
  
    drawOverlayPaths();
  
    // Enhanced legend with better styling
    const legendWidth = 180;
    const legendHeight = 12;
    const legendScale = d3.scaleLinear().domain([0, 10]).range([0, legendWidth]);
  
    const legend = g.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${innerWidth - legendWidth - 10},15)`);
      
    // Legend title
    legend.append("text")
      .attr("x", 0)
      .attr("y", 40)
      .attr("text-anchor", "start")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "#495057")
      .text("");
  
    legend.append("defs")
      .append("linearGradient")
      .attr("id", "gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0)
      .attr("x2", legendWidth)
      .selectAll("stop")
      .data([0, 0.2, 0.4, 0.6, 0.8, 1])
      .enter()
      .append("stop")
      .attr("offset", d => `${d * 100}%`)
      .attr("stop-color", d => scale(d * 10));
  
    legend.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .attr("rx", 2)
      .attr("ry", 2)
      .style("fill", "url(#gradient)")
      .style("stroke", "#adb5bd")
      .style("stroke-width", 0.5);
  
    legend.append("g")
      .attr("transform", `translate(0,${legendHeight})`)
      .call(
        d3.axisBottom(legendScale)
          .ticks(5)
          .tickSize(4)
          .tickFormat(d3.format(".1f"))
      )
      .selectAll("text")
      .attr("font-size", "10px")
      .attr("fill", "#495057");
  
    const selectedScore = selectedRegion != null ? scoresMap.get(selectedRegion) : null;
    if (selectedScore != null) {
      const x = legendScale(selectedScore);
  
      // Selected score indicator
      legend.append("line")
        .attr("x1", x)
        .attr("x2", x)
        .attr("y1", -5)
        .attr("y2", legendHeight)
        .attr("stroke", "#212529")
        .attr("stroke-width", 2.5);
      
      legend.append("line")
        .attr("x1", x)
        .attr("x2", x)
        .attr("y1", -5)
        .attr("y2", legendHeight)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1);
        
      // Score value display
      legend.append("text")
        .attr("x", x)
        .attr("y", -8)
        .attr("text-anchor", "middle")
        .attr("font-size", "11px")
        .attr("font-weight", "bold")
        .attr("fill", "#212529")
        .text(selectedScore.toFixed(1));
    }
  }, [data, scoresMap, selectedRegion, scale]);
  
  return (
    <svg
      ref={svgRef}
      className={className}
      width="100%"
      height="100%"
      style={{ maxHeight: "100%", overflow: "visible" }}
      {...props}
    />
  );
};

ShakeMap.propTypes = {
  data:              PropTypes.object.isRequired,
  scoresMap:         PropTypes.instanceOf(Map).isRequired,
  selectedRegion:    PropTypes.any,
  setSelectedRegion: PropTypes.func.isRequired,
  colorScale:        PropTypes.func,
  className:         PropTypes.string
};

export default ShakeMap;