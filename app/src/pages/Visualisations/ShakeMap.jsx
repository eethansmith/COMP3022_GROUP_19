import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";

const margin = { top: 20, right: 20, bottom: 30, left: 40 };

export default function ShakeMap({
  data,
  scoresMap,
  selectedRegion,
  setSelectedRegion,
  colorScale,            // <-- new prop
  className,
  ...props
}) {
  const svgRef = useRef(null);

  // fall back to a built-in scale if parent forgets to send one
  const scale =
    colorScale ||
    d3.scaleLinear()
      .domain([0, 10])
      .range(["#FFFBEA", "#8B0000"])
      .clamp(true);

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

    const g = svg.append("g").attr(
      "transform",
      `translate(${margin.left},${margin.top})`
    );

    /* --- neighbourhood shapes --- */
    g.selectAll("path")
      .data(data.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", d => {
        const v = scoresMap.get(+d.properties.Id);
        return v != null ? scale(v) : "#ccc";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .style("cursor", "pointer")
      .on("click", (_, d) => setSelectedRegion(+d.properties.Id))
      .on("mouseover", function () { d3.select(this).attr("opacity", 0.7); })
      .on("mouseout",  function () { d3.select(this).attr("opacity", 1); });

    /* --- simple legend --- */
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, scoresMap, selectedRegion, setSelectedRegion, scale]);

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
  colorScale:        PropTypes.func, // ← new
  className:         PropTypes.string
};
