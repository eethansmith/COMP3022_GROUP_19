// Multiple box-plots per day – one for EACH weighting scheme
//
import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

const CSV_URL = process.env.PUBLIC_URL + "/data/resources/Q3/changepoints.csv";

const colours = d3.schemeSet2;       // up to 8 distinguishable colours

const ChangePointBoxPlotGrouped = ({
  width     = 960,
  height    = 420,
  schemes   = null,      // e.g. ["population","area-weighted"]; null = all
  title     = "Daily Distribution of Δ by Island-Weighting Scheme",
  subtitle  = "Each coloured box represents one weighting scheme; whiskers cover points inside 1.5×IQR; dots are outliers.",
}) => {
  const svgRef = useRef();

  useEffect(() => {
    /* ---------- 1. Load & shape ---------- */
    d3.csv(CSV_URL, d => ({
      scheme: d.scheme,
      day:    d3.timeDay.floor(new Date(d.time_bin)),
      delta:  +d.delta,
    })).then(rows => {

      const wantedSchemes = schemes ?? Array.from(new Set(rows.map(r => r.scheme)));

      const filtered = rows.filter(r => wantedSchemes.includes(r.scheme));

      /* group by (day, scheme) and compute Tukey stats */
      const grouped = Array.from(
        d3.group(filtered, r => `${+r.day}‖${r.scheme}`), // composite key
        ([key, values]) => {
          const [dayEpoch, scheme] = key.split("‖");
          const sorted = values.map(v => v.delta).sort(d3.ascending);

          const q1 = d3.quantileSorted(sorted, 0.25);
          const q2 = d3.quantileSorted(sorted, 0.50);
          const q3 = d3.quantileSorted(sorted, 0.75);
          const iqr = q3 - q1;

          const loW = d3.max([d3.min(sorted), q1 - 1.5 * iqr]);
          const hiW = d3.min([d3.max(sorted), q3 + 1.5 * iqr]);

          return {
            day: new Date(+dayEpoch),
            scheme,
            q1, q2, q3,
            loW, hiW,
            outliers: sorted.filter(v => v < loW || v > hiW)
          };
        }
      );

      /* ---------- 2. Scales ---------- */
      const days     = Array.from(new Set(grouped.map(d => +d.day))).sort();
      const schemesD = wantedSchemes;

      const margin = { top: 90, right: 40, bottom: 55, left: 70 };
      const innerW = width  - margin.left - margin.right;
      const innerH = height - margin.top  - margin.bottom;

      const xDay = d3.scaleBand()
        .domain(days)
        .range([0, innerW])
        .paddingInner(0.2);

      const xScheme = d3.scaleBand()
        .domain(schemesD)
        .range([0, xDay.bandwidth()])
        .paddingInner(0.15);

      const y = d3.scaleLinear()
        .domain([
          d3.min(grouped, d => d.loW) * 1.1,
          d3.max(grouped, d => d.hiW) * 1.1
        ])
        .nice()
        .range([innerH, 0]);

      const colour = d3.scaleOrdinal()
        .domain(schemesD)
        .range(colours);

      const pct = x => x * 100;

      /* ---------- 3. Draw ---------- */
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)
        .attr("font-family", "sans-serif");

      /* 3a. Whiskers */
      g.selectAll("line.whisker")
        .data(grouped)
        .enter()
        .append("line")
          .attr("class", "whisker")
          .attr("x1", d => xDay(+d.day) + xScheme(d.scheme) + xScheme.bandwidth()/2)
          .attr("x2", d => xDay(+d.day) + xScheme(d.scheme) + xScheme.bandwidth()/2)
          .attr("y1", d => y(d.loW))
          .attr("y2", d => y(d.hiW))
          .attr("stroke", "#555");

      /* 3b. Box */
      g.selectAll("rect.box")
        .data(grouped)
        .enter()
        .append("rect")
          .attr("class", "box")
          .attr("x", d => xDay(+d.day) + xScheme(d.scheme))
          .attr("width", xScheme.bandwidth())
          .attr("y", d => y(d.q3))
          .attr("height", d => Math.abs(y(d.q3) - y(d.q1)))
          .attr("fill", d => colour(d.scheme))
          .attr("opacity", 0.75);

      /* 3c. Median line */
      g.selectAll("line.median")
        .data(grouped)
        .enter()
        .append("line")
          .attr("x1", d => xDay(+d.day) + xScheme(d.scheme))
          .attr("x2", d => xDay(+d.day) + xScheme(d.scheme) + xScheme.bandwidth())
          .attr("y1", d => y(d.q2))
          .attr("y2", d => y(d.q2))
          .attr("stroke", "#111")
          .attr("stroke-width", 2);

      /* 3d. Whisker caps */
      g.selectAll("line.capTop")
        .data(grouped)
        .enter()
        .append("line")
          .attr("x1", d => xDay(+d.day) + xScheme(d.scheme) + xScheme.bandwidth()*0.25)
          .attr("x2", d => xDay(+d.day) + xScheme(d.scheme) + xScheme.bandwidth()*0.75)
          .attr("y1", d => y(d.hiW))
          .attr("y2", d => y(d.hiW))
          .attr("stroke", "#555");

      g.selectAll("line.capBot")
        .data(grouped)
        .enter()
        .append("line")
          .attr("x1", d => xDay(+d.day) + xScheme(d.scheme) + xScheme.bandwidth()*0.25)
          .attr("x2", d => xDay(+d.day) + xScheme(d.scheme) + xScheme.bandwidth()*0.75)
          .attr("y1", d => y(d.loW))
          .attr("y2", d => y(d.loW))
          .attr("stroke", "#555");

      /* 3e. Outliers */
      g.selectAll("circle.outlier")
        .data(grouped.flatMap(d =>
          d.outliers.map(v => ({ ...d, v }))
        ))
        .enter()
        .append("circle")
          .attr("cx", d => xDay(+d.day) + xScheme(d.scheme) + xScheme.bandwidth()/2)
          .attr("cy", d => y(d.v))
          .attr("r", 3)
          .attr("fill", d => colour(d.scheme))
          .attr("opacity", 0.7);

      /* 3f. Axes */
      const xAxis = d3.axisBottom(xDay)
        .tickFormat(d3.timeFormat("%a %d"));

      const yAxis = d3.axisLeft(y)
        .ticks(6)
        .tickFormat(d => `${pct(d).toFixed(0)} %`);

      g.append("g")
        .attr("transform", `translate(0,${innerH})`)
        .call(xAxis)
        .call(g => g.append("text")
          .attr("x", innerW/2)
          .attr("y", 42)
          .attr("fill", "#000")
          .attr("text-anchor", "middle")
          .attr("font-size", "13px")
          .text("Quake Timeline"));

      g.append("g")
        .call(yAxis)
        .call(g => g.append("text")
          .attr("transform", "rotate(-90)")
          .attr("x", -innerH/2)
          .attr("y", -55)
          .attr("fill", "#000")
          .attr("text-anchor", "middle")
          .attr("font-size", "13px")
          .text("Δ Composite (%-points)"));

      /* 3g. Titles */
      svg.append("text")
        .attr("x", margin.left)
        .attr("y", 26)
        .attr("font-size", "18px")
        .attr("font-weight", 600)
        .text(title);

      svg.append("text")
        .attr("x", margin.left)
        .attr("y", 46)
        .attr("font-size", "13px")
        .attr("fill", "#444")
        .text(subtitle);

      /* 3h. Legend */
      const legend = svg.append("g")
        .attr("transform", `translate(${width - margin.right + 10},${margin.top})`)
        .attr("font-size", "12px");

      schemesD.forEach((s, i) => {
        const row = legend.append("g").attr("transform", `translate(0,${i*20})`);
        row.append("rect")
          .attr("width", 14)
          .attr("height", 14)
          .attr("fill", colour(s));
        row.append("text")
          .attr("x", 20)
          .attr("y", 11)
          .text()
      });

    }).catch(err => console.error("ChangePointBoxPlotGrouped:", err));
  }, [width, height, schemes, title, subtitle]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ background: "#fafafa", borderRadius: 6 }}
    />
  );
};

export default ChangePointBoxPlotGrouped;
