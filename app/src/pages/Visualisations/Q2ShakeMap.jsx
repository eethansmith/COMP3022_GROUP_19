import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";
import RegionDialogBox from "./RegionDialogBox";

const margin = { top: 20, right: 20, bottom: 30, left: 40 };

export default function Q2ShakeMap({
  data,
  scoresMap,
  selectedRegion,
  setSelectedRegion,
  className,
  ...props
}) {
  const svgRef = useRef(null);

  //Q2 threshold color scale
  const scale = d3.scaleThreshold()
    .domain([0.3, 0.6])
    .range(["blue", "orange", "red"]);

  useEffect(() => {
    if (!data || !scoresMap) return;

    const svgEl = svgRef.current;
    const { width, height } = svgEl.getBoundingClientRect();
    const innerWidth  = width  - margin.left - margin.right;
    const innerHeight = height - margin.top  - margin.bottom;

    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    const projection = d3.geoMercator().fitSize([innerWidth, innerHeight], data);
    const path = d3.geoPath().projection(projection);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.selectAll("path")
      .data(data.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", d => {
        const v = scoresMap.get(+d.properties.Id);
        return v != null ? scale(v) : "#ccc";
      })
      .attr("stroke", d => (+d.properties.Id === selectedRegion ? "#000" : "#fff"))
      .attr("stroke-width", d => (+d.properties.Id === selectedRegion ? 1 : 0.5))
      .style("cursor", "pointer")
      .on("click", (_, d) => setSelectedRegion(+d.properties.Id))
      .on("mouseover", function () { d3.select(this).attr("opacity", 0.7); })
      .on("mouseout", function () { d3.select(this).attr("opacity", 1); });

    // Legend for Q2 uncertainty colors
    const legend = g.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${innerWidth - 180}, 20)`);

    const legendData = [
      { color: "blue", label: "Low (0.0 – 0.3)" },
      { color: "orange", label: "Moderate (0.3 – 0.6)" },
      { color: "red", label: "High (0.6 – 1.0)" },
    ];

    legend.selectAll("rect")
      .data(legendData)
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("y", (_, i) => i * 20)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", d => d.color);

    legend.selectAll("text")
      .data(legendData)
      .enter()
      .append("text")
      .attr("x", 24)
      .attr("y", (_, i) => i * 20 + 14)
      .text(d => d.label);
  }, [data, scoresMap, selectedRegion, setSelectedRegion]);

  return(<div style={{ position: "relative" }}>
    <svg ref={svgRef} className={className} {...props} />



    {/* --------------------- FIX THESE VALUES ----------------------- */}
    <RegionDialogBox data={null} onClose={() => (null)} />



      
  </div>);

}

Q2ShakeMap.propTypes = {
  data: PropTypes.object.isRequired,
  scoresMap: PropTypes.instanceOf(Map).isRequired,
  scoresMeta: PropTypes.object.isRequired,
  selectedRegion: PropTypes.number,
  setSelectedRegion: PropTypes.func.isRequired,
  className: PropTypes.string,
};
