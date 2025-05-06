import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";

const margin = { top: 10, right: 20, bottom: 30, left: 120 };

export default function BarChart({
  data,
  selectedRegion,
  setSelectedRegion,
  colorScale,           
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
      .padding(0.2); // Increased padding for nicer spacing between bars

    /* axes */
    g.append("g")
     .attr("class", "y-axis")
     .call(d3.axisLeft(y))
     .selectAll("text")
     .style("font-size", "11px")
     .style("font-weight", d => {
       const item = sorted.find(item => item.name === d);
       return item && item.id === selectedRegion ? "bold" : "normal";
     });

    g.append("g")
     .attr("class", "x-axis")
     .attr("transform", `translate(0,${innerH})`)
     .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".1f")))
     .selectAll("text")
     .style("font-size", "10px");

    // Add grid lines
    g.selectAll("line.grid")
     .data(x.ticks(5))
     .enter()
     .append("line")
     .attr("class", "grid")
     .attr("x1", d => x(d))
     .attr("x2", d => x(d))
     .attr("y1", 0)
     .attr("y2", innerH)
     .attr("stroke", "#e0e0e0")
     .attr("stroke-width", 0.5);


    // Define a group for each bar to contain bar and label
    const barGroups = g.selectAll(".bar-group")
      .data(sorted, d => d.id)
      .enter()
      .append("g")
      .attr("class", "bar-group")
      .style("cursor", "pointer")
      .on("click", (_, d) => setSelectedRegion(d.id))
      .on("mouseover", function() {
        d3.select(this).select("rect.bar-background")
          .transition()
          .duration(150)
          .attr("opacity", 0.2);
          
        d3.select(this).select("rect.bar")
          .transition()
          .duration(150)
          .attr("opacity", 1);
          
        d3.select(this).select("text.bar-label")
          .transition()
          .duration(150)
          .attr("opacity", 1);
      })
      .on("mouseout", function(_, d) {
        if (d.id !== selectedRegion) {
          d3.select(this).select("rect.bar-background")
            .transition()
            .duration(250)
            .attr("opacity", 0);
            
          d3.select(this).select("rect.bar")
            .transition()
            .duration(250)
            .attr("opacity", 0.8);
            
          d3.select(this).select("text.bar-label")
            .transition()
            .duration(250)
            .attr("opacity", 0.7);
        }
      });

    // Add background hover rectangles
    barGroups.append("rect")
      .attr("class", "bar-background")
      .attr("y", d => y(d.name))
      .attr("height", y.bandwidth())
      .attr("x", 0)
      .attr("width", innerW)
      .attr("fill", d => d.id === selectedRegion ? scale(d.rating) : "#f0f0f0")
      .attr("opacity", d => d.id === selectedRegion ? 0.2 : 0);

    // Add the actual bars
    barGroups.append("rect")
      .attr("class", "bar")
      .attr("y", d => y(d.name))
      .attr("height", y.bandwidth())
      .attr("x", 0)
      .attr("width", d => x(d.rating))
      .attr("fill", d => {
        const baseColor = scale(d.rating);
        return d.id === selectedRegion 
          ? d3.color(baseColor).brighter(0.3) 
          : baseColor;
      })
      .attr("opacity", d => d.id === selectedRegion ? 1 : 0.8)
      .attr("rx", 3) // Rounded corners
      .attr("ry", 3);

    // Add value labels on the bars
    barGroups.append("text")
      .attr("class", "bar-label")
      .attr("y", d => y(d.name) + y.bandwidth() / 2)
      .attr("x", d => Math.min(x(d.rating) - 5, innerW - 45))
      .attr("text-anchor", "end")
      .attr("dy", "0.35em")
      .style("font-size", "11px")
      .style("font-weight", d => d.id === selectedRegion ? "bold" : "normal")
      .style("fill", "#333")
      .attr("opacity", d => d.id === selectedRegion ? 1 : 0.7)
      .text(d => d3.format(".2f")(d.rating));

    // Add indicator for selected bar
    if (selectedRegion !== null) {
      const selectedItem = sorted.find(d => d.id === selectedRegion);
      if (selectedItem) {
        // Highlight marker for selected bar
        // g.append("path")
        //   .attr("d", d3.symbol().type(d3.symbolTriangle).size(80))
        //   .attr("transform", `translate(${-8}, ${y(selectedItem.name) + y.bandwidth() / 2}) rotate(-90)`)
        //   .attr("fill", d3.color(scale(selectedItem.rating)).darker(1));
          
        // Add background pulse animation for the selected bar
        const pulseBar = barGroups
          .filter(d => d.id === selectedRegion)
          .append("rect")
          .attr("class", "pulse-bar")
          .attr("y", d => y(d.name))
          .attr("height", y.bandwidth())
          .attr("x", 0)
          .attr("width", d => x(d.rating))
          .attr("fill", "none")
          .attr("stroke", d3.color(scale(selectedItem.rating)).darker(0.5))
          .attr("stroke-width", 2.5)
          .attr("rx", 3)
          .attr("ry", 3);
          
        // Pulse animation
        function pulseAnimation() {
          pulseBar
            .transition()
            .duration(750)
            .attr("stroke-opacity", 0.9)
            .attr("stroke-width", 3)
            .transition()
            .duration(750)
            .attr("stroke-opacity", 0.3)
            .attr("stroke-width", 2)
            .on("end", pulseAnimation);
        }
        
        pulseAnimation();
      }
    }

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
      name:     PropTypes.string,
      rating:   PropTypes.number.isRequired,
      mean_sev: PropTypes.number.isRequired,
      adjusted: PropTypes.number.isRequired
    })
  ).isRequired,
  selectedRegion:    PropTypes.number,
  setSelectedRegion: PropTypes.func.isRequired,
  colorScale:        PropTypes.func,
  className:         PropTypes.string
};