import React, { useRef, useState, useEffect } from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";

/* ---------------------------------------------------------------------------
 *  Enhanced multi-series line chart for the quake-severity timeline CSV.
 *  CSV columns:  datetime | area | severity
 * ------------------------------------------------------------------------- */
export default function LineChart({
  dataUrl,
  selectedRegion,
  setSelectedRegion,
  colorScale,
  aspectRatio = 0.65,
  className = "",
  style = {},
}) {
  /* ─── refs & state ───────────────────────────────────────────────────── */
  const containerRef = useRef(null);
  const [data, setData] = useState([]);
  const [width, setWidth] = useState(0);
  const [hoveredSeries, setHoveredSeries] = useState(null);

  /* ─── 1) load & parse CSV ────────────────────────────────────────────── */
  useEffect(() => {
    if (!dataUrl) return;

    const parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");

    d3.csv(dataUrl, row => {
      const sev = row.severity?.trim();
      return {
        datetime: parseDate(row.datetime.trim()),
        area: +row.area, // ← numeric!
        severity: sev === "" || sev === "NA" ? null : +sev,
      };
    })
      .then(rows => rows.filter(d => d.datetime instanceof Date))
      .then(setData)
      .catch(err => console.error("LineChart: data load error →", err));
  }, [dataUrl]);

  /* ─── 2) keep width in sync with container ──────────────────────────── */
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  /* ─── 3) draw / update chart ─────────────────────────────────────────── */
  useEffect(() => {
    if (!data.length || !width) return;

    const height = width * aspectRatio;
    const m = { top: 30, right: 35, bottom: 40, left: 55 };
    const w = width - m.left - m.right;
    const h = height - m.top - m.bottom;

    /* scales */
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.datetime))
      .range([0, w])
      .nice();

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.severity || 0) * 1.05]).nice()
      .range([h, 0]);

    /* nest by area */
    const seriesData = Array.from(
      d3.group(data, d => d.area),
      ([area, values]) => ({ area, values: values.sort((a, b) => a.datetime - b.datetime) })
    ).sort((a, b) => {
      if (selectedRegion == null) return 0;
      if (a.area === selectedRegion) return 1;
      if (b.area === selectedRegion) return -1;
      return 0;
    });

    const color = (area => {
      if (selectedRegion === null || selectedRegion === area) {
        // Use a brighter, more saturated color for selected/active lines
        return d3.hsl(colorScale(8)).brighter(0.2).toString();
      } else {
        // More muted colors for background lines
        const c = d3.hsl(colorScale(3));
        c.s = 0.15;
        c.l = 0.8;
        return c.toString();
      }
    });

    const line = d3.line()
      .defined(d => d.severity != null)
      .x(d => x(d.datetime))
      .y(d => y(d.severity))
      .curve(d3.curveMonotoneX);

    /* root svg */
    const svg = d3.select(containerRef.current)
      .selectAll("svg")
      .data([null])
      .join("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("overflow", "visible");

    // Add defs for filters and gradients
    const defs = svg.selectAll("defs")
      .data([null])
      .join("defs");

    // Add drop shadow filter
    const filter = defs.selectAll("filter#drop-shadow")
      .data([null])
      .join("filter")
      .attr("id", "drop-shadow")
      .attr("height", "130%");

    filter.selectAll("feGaussianBlur")
      .data([null])
      .join("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 2)
      .attr("result", "blur");

    filter.selectAll("feOffset")
      .data([null])
      .join("feOffset")
      .attr("in", "blur")
      .attr("dx", 0)
      .attr("dy", 2)
      .attr("result", "offsetBlur");

    const feMerge = filter.selectAll("feMerge")
      .data([null])
      .join("feMerge");

    feMerge.selectAll("feMergeNode:nth-child(1)")
      .data([null])
      .join("feMergeNode")
      .attr("in", "offsetBlur");

    feMerge.selectAll("feMergeNode:nth-child(2)")
      .data([null])
      .join("feMergeNode")
      .attr("in", "SourceGraphic");

    /* main g */
    const g = svg.selectAll("g.main")
      .data([null])
      .join("g")
      .attr("class", "main")
      .attr("transform", `translate(${m.left},${m.top})`);

    /* Background panel */
    g.selectAll("rect.chart-bg")
      .data([null])
      .join("rect")
      .attr("class", "chart-bg")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", w)
      .attr("height", h)
      .attr("fill", "#f8f9fa")
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("filter", "url(#drop-shadow)");



    /* Draw area under the lines for selected region */
    if (selectedRegion !== null) {
      const selectedData = seriesData.find(d => d.area === selectedRegion);
      
      if (selectedData) {
        const area = d3.area()
          .defined(d => d.severity != null)
          .x(d => x(d.datetime))
          .y0(h)
          .y1(d => y(d.severity))
          .curve(d3.curveMonotoneX);

        g.selectAll("path.area")
          .data([selectedData])
          .join("path")
          .attr("class", "area")
          .attr("fill", d => d3.hsl(color(d.area)).copy({opacity: 0.15}))
          .attr("d", d => area(d.values));
      }
    }

    /* series paths – enter/update/exit */
    const paths = g.selectAll("path.series")
      .data(seriesData, d => d.area);

    paths.exit().remove();

    paths.join(
      enter => enter.append("path")
        .attr("class", "series")
        .attr("fill", "none")
        .attr("cursor", "pointer")
        .attr("stroke", d => color(d.area))
        .on("click", (_, d) => {
          setSelectedRegion(prev => (prev === d.area ? null : d.area));
        }),
      update => update
    )
    .on("mouseover", function(_, d) {
      setHoveredSeries(d.area);
      d3.select(this)
        .attr("stroke-width", 5)
        .attr("stroke", d => d3.hsl(color(d.area)).brighter(0.5));
    })
    .on("mouseout", function(_, d) {
      setHoveredSeries(null);
      d3.select(this)
        .attr("stroke-width", selectedRegion === d.area ? 4 : 1.5)
        .attr("stroke", d => color(d.area));
    })
    .attr("stroke-width", d => (selectedRegion === d.area ? 4 : 1.5))
    .attr("stroke", d => color(d.area))
    .attr("d", d => line(d.values))
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round");

    /* Add points for the selected series */
    if (selectedRegion !== null) {
      const selectedData = seriesData.find(d => d.area === selectedRegion);
      
      if (selectedData) {
        g.selectAll("circle.point")
          .data(selectedData.values.filter(d => d.severity != null))
          .join("circle")
          .attr("class", "point")
          .attr("cx", d => x(d.datetime))
          .attr("cy", d => y(d.severity))
          .attr("r", 4)
          .attr("fill", "#ffffff")
          .attr("stroke", color(selectedData.area))
          .attr("stroke-width", 2);
      }
    }

        /* axes */
        g.selectAll("g.x-axis")
        .data([null])
        .join("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${h})`)
        .call(
          d3.axisBottom(x)
            .ticks(d3.timeDay.every(1))
            .tickFormat(d3.timeFormat("%d %b"))
            .tickSize(-5)
        )
        .call(g => {
          g.select(".domain")
            .attr("stroke", "#adb5bd")
            .attr("stroke-width", 1);
          g.selectAll(".tick text")
            .attr("font-size", "11px")
            .attr("fill", "#495057")
            .attr("font-weight", "500")
            .attr("dy", "1em");
          g.selectAll(".tick line")
            .attr("stroke", "#adb5bd");
        });
  
      // X-axis label
      g.selectAll("text.x-label")
        .data([null])
        .join("text")
        .attr("class", "x-label")
        .attr("x", w / 2)
        .attr("y", h + m.bottom - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#495057")
        .text("Date");
  
      g.selectAll("g.y-axis")
        .data([null])
        .join("g")
        .attr("class", "y-axis")
        .call(
          d3.axisLeft(y)
            .tickSize(-w)
            .ticks(5)
        )
        .call(g => {
          g.select(".domain").remove();
          g.selectAll(".tick line")
            .attr("stroke", "#dee2e6")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3,3");
          g.selectAll(".tick text")
            .attr("font-size", "11px")
            .attr("fill", "#495057")
            .attr("font-weight", "500")
            .attr("dx", "-0.5em");
        });
  
      // Y-axis label
      g.selectAll("text.y-label")
        .data([null])
        .join("text")
        .attr("class", "y-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -h / 2)
        .attr("y", -m.left + 15)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#495057")
        .text("Severity");

    /* Add tooltip for hover effects */
    if (hoveredSeries !== null) {
      const hoveredData = seriesData.find(d => d.area === hoveredSeries);
      
      if (hoveredData) {
        const lastPoint = hoveredData.values
          .filter(d => d.severity != null)
          .sort((a, b) => b.datetime - a.datetime)[0];
          
        if (lastPoint) {
          const tooltipX = x(lastPoint.datetime);
          const tooltipY = y(lastPoint.severity);
          
          g.selectAll("g.tooltip")
            .data([lastPoint])
            .join("g")
            .attr("class", "tooltip")
            .attr("transform", `translate(${tooltipX + 10},${tooltipY - 10})`)
            .call(g => {
              g.selectAll("rect")
                .data([null])
                .join("rect")
                .attr("x", -5)
                .attr("y", -20)
                .attr("width", 80)
                .attr("height", 30)
                .attr("fill", "#333")
                .attr("opacity", 0.8)
                .attr("rx", 3)
                .attr("ry", 3);
                
              g.selectAll("text.tooltip-text")
                .data([null])
                .join("text")
                .attr("class", "tooltip-text")
                .attr("fill", "#fff")
                .attr("text-anchor", "start")
                .attr("font-size", "11px")
                .attr("font-weight", "bold")
                .attr("dy", "-0.5em")
                .text(`Region: ${hoveredSeries}`);
                
              g.selectAll("text.tooltip-value")
                .data([null])
                .join("text")
                .attr("class", "tooltip-value")
                .attr("fill", "#fff")
                .attr("text-anchor", "start")
                .attr("font-size", "11px")
                .attr("dy", "1em")
                .text(`Severity: ${lastPoint.severity.toFixed(2)}`);
            });
        }
      }
    } else {
      g.selectAll("g.tooltip").remove();
    }

  }, [data, width, selectedRegion, setSelectedRegion, aspectRatio, hoveredSeries, colorScale]);

  return (
    <div 
      ref={containerRef} 
      className={`linechart-container ${className}`} 
      style={{
        ...style,
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        padding: "10px",
        backgroundColor: "#ffffff"
      }} 
    />
  );
}

/* ─── prop-types & defaults ─────────────────────────────────────────────── */
LineChart.propTypes = {
  dataUrl: PropTypes.string.isRequired,
  selectedRegion: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  setSelectedRegion: PropTypes.func.isRequired,
  colorScale: PropTypes.func,
  aspectRatio: PropTypes.number,
  className: PropTypes.string,
  style: PropTypes.object,
};

LineChart.defaultProps = {
  selectedRegion: null,
  aspectRatio: 0.65,
  className: "",
  style: {},
};