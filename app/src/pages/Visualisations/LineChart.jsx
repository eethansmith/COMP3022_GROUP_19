import React, { useRef, useState, useEffect } from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";

/* ---------------------------------------------------------------------------
 *  Multi-series line chart for the quake-severity timeline CSV.
 *  CSV columns:  datetime | area | severity
 * ------------------------------------------------------------------------- */
export default function LineChart({
  dataUrl,
  selectedRegion,
  setSelectedRegion,
  aspectRatio = 0.65,
  className  = "",
  style      = {},
}) {
  /* ─── refs & state ───────────────────────────────────────────────────── */
  const containerRef      = useRef(null);
  const [data, setData]   = useState([]);
  const [width, setWidth] = useState(0);

  /* ─── 1) load & parse CSV ────────────────────────────────────────────── */
  useEffect(() => {
    if (!dataUrl) return;

    const parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");

    d3.csv(dataUrl, row => {
      const sev  = row.severity?.trim();
      return {
        datetime: parseDate(row.datetime.trim()),
        area:     +row.area,                        // ← numeric!
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
    const m      = { top: 20, right: 28, bottom: 34, left: 48 };
    const w      = width  - m.left - m.right;
    const h      = height - m.top  - m.bottom;

    /* scales */
    const x = d3.scaleTime()
                .domain(d3.extent(data, d => d.datetime))
                .range([0, w]);

    const y = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.severity || 0)]).nice()
                .range([h, 0]);

    /* nest by area */
    const seriesData = Array.from(
      d3.group(data, d => d.area),
      ([area, values]) => ({ area, values: values.sort((a,b)=>a.datetime-b.datetime) })
    );

    const color = d3.scaleOrdinal(d3.schemeTableau10)
                    .domain(seriesData.map(d => d.area));

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
                  .attr("width",  width)
                  .attr("height", height)
                  .attr("viewBox", `0 0 ${width} ${height}`)
                  .style("overflow", "visible");

    /* main g */
    const g = svg.selectAll("g.main")
                 .data([null])
                 .join("g")
                 .attr("class", "main")
                 .attr("transform", `translate(${m.left},${m.top})`);

    /* axes */
    g.selectAll("g.x-axis")
      .data([null])
      .join("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(d3.timeDay.every(1)).tickFormat(d3.timeFormat("%d %b")))
      .call(g => g.select(".domain").remove());

    g.selectAll("g.y-axis")
      .data([null])
      .join("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").attr("x2", w).attr("stroke-opacity", 0.1));

    /* series paths – enter/update/exit */
    const paths = g.selectAll("path.series")
                   .data(seriesData, d => d.area);

    paths.exit().remove();

    paths.join(
        enter => enter.append("path")
                      .attr("class", "series")
                      .attr("fill", "none")
                      .attr("cursor", "pointer")
                      .attr("stroke", d => 
                        selectedRegion == null || selectedRegion === d.area
                          ? color(d.area)
                          : (() => {
                            const c = d3.hsl(color(d.area))
                            c.s = 0.2;
                            return c.toString();
                          })()
                      )
                      .on("click", (_, d) => {
                        setSelectedRegion(prev => (prev === d.area ? null : d.area));
                      })
                         // ← numeric
                      .on("mouseover", function () { d3.select(this).attr("stroke-width", 3); })
                      .on("mouseout",  function (_, d) {
                        d3.select(this).attr("stroke-width", selectedRegion === d.area ? 3 : 1.5);
                      }),
        update => update
      )
      .attr("stroke-width", d => (selectedRegion === d.area ? 3 : 1.5))
      .attr("d", d => line(d.values));
  }, [data, width, selectedRegion, setSelectedRegion, aspectRatio]);

  return <div ref={containerRef} className={className} style={style} />;
}

/* ─── prop-types & defaults ─────────────────────────────────────────────── */
LineChart.propTypes = {
  dataUrl:         PropTypes.string.isRequired,
  selectedRegion:  PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  setSelectedRegion: PropTypes.func.isRequired,
  aspectRatio:     PropTypes.number,
  className:       PropTypes.string,
  style:           PropTypes.object,
};
LineChart.defaultProps = {
  selectedRegion: null,
  aspectRatio:    0.65,
  className:      "",
  style:          {},
};
