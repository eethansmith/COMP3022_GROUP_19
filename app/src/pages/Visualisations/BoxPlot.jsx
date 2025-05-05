import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";

const margin = { top: 20, right: 20, bottom: 30, left: 40 };

export default function BoxPlot({
    day,
    data,
    selectedRegion,
    setSelectedRegion,
    className,
    ...props
}) {

    const svgRef = useRef();

    useEffect(() => {
      if (!data.length) return;
  
      const svgEl = svgRef.current;
      const { width, height } = svgEl.getBoundingClientRect();
      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;
  
      const svg = d3.select(svgEl);
      svg.selectAll("*").remove();
  
      const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
  
      /* Compute statistics for box plot (Q1, Q2, Q3, min, max, etc.) */
      const boxData = data.map(d => {
        const sorted = d.values.sort((a, b) => a - b);
        const q1 = d3.quantile(sorted, 0.25);
        const q2 = d3.quantile(sorted, 0.5);
        const q3 = d3.quantile(sorted, 0.75);
        const min = d3.min(sorted);
        const max = d3.max(sorted);
        const iqr = q3 - q1;
  
        return {
          id: d.id,
          name: d.name,
          min,
          q1,
          median: q2,
          q3,
          max,
          iqr
        };
      });
  
      /* Scales */
      const x = d3.scaleBand()
        .domain(boxData.map(d => d.name))
        .range([0, innerW])
        .padding(0.5);
  
      const y = d3.scaleLinear()
        .domain([d3.min(data, d => d3.min(d.values)), d3.max(data, d => d3.max(d.values))])
        .nice()
        .range([innerH, 0]);
  
      /* axes */
      g.append("g").call(d3.axisLeft(y));
      g
        .append("g")
        .attr("transform", `translate(0,${innerH})`)
        .call(d3.axisBottom(x));
  
      /* boxes */
      g.selectAll(".box")
        .data(boxData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.name))
        .attr("y", d => y(d.q3))
        .attr("width", x.bandwidth())
        .attr("height", d => y(d.q1) - y(d.q3))
        .attr("stroke", "black")
        .style("cursor", "pointer")
        .on("click", (_, d) => setSelectedRegion(d.id));
  
      /* median line */
      g.selectAll(".median")
        .data(boxData)
        .enter()
        .append("line")
        .attr("x1", d => x(d.name))
        .attr("x2", d => x(d.name) + x.bandwidth())
        .attr("y1", d => y(d.median))
        .attr("y2", d => y(d.median))
        .attr("stroke", "black")
        .attr("stroke-width", 2);
  
      /* whiskers (min and max lines) */
      g.selectAll(".whisker")
        .data(boxData)
        .enter()
        .append("line")
        .attr("x1", d => x(d.name) + x.bandwidth() / 2)
        .attr("x2", d => x(d.name) + x.bandwidth() / 2)
        .attr("y1", d => y(d.min))
        .attr("y2", d => y(d.q1))
        .attr("stroke", "black");
  
      g.selectAll(".whisker-max")
        .data(boxData)
        .enter()
        .append("line")
        .attr("x1", d => x(d.name) + x.bandwidth() / 2)
        .attr("x2", d => x(d.name) + x.bandwidth() / 2)
        .attr("y1", d => y(d.q3))
        .attr("y2", d => y(d.max))
        .attr("stroke", "black");
  
    }, [data, selectedRegion, setSelectedRegion,]);
  
    return (
      <svg
        ref={svgRef}
        className={className}
        width="100%"
        height="100%"
      />
    );
  }
  
  BoxPlot.propTypes = {
    data: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        values: PropTypes.arrayOf(PropTypes.number).isRequired, // <-- Data is an array of values
      })
    ).isRequired,
    selectedRegion: PropTypes.number,
    setSelectedRegion: PropTypes.func.isRequired,
    className: PropTypes.string
  };