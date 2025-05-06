import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

const CSV_URL = process.env.PUBLIC_URL + "/data/resources/Q3/changepoints.csv";

const BoxPlot = ({
  width  = 900,
  height = 380,
  scheme = null,          // e.g. "population"   (null = all schemes)

  /* ── NEW, PLAIN-ENGLISH COPY ───────────────────────────────────── */
  title    = "How big were the jumps each day?",
  subtitle = "Coloured box shows the usual range of jump sizes, "
           + "the thick line is the typical size, whiskers show normal spread, "
           + "dots highlight unusually large or small jumps. "
           + "Red = conditions got worse, green = conditions improved.",
  /* ──────────────────────────────────────────────────────────────── */
}) => {
  const svgRef = useRef();

  useEffect(() => {
    /* ---------- 1. Load & prepare ---------- */
    d3.csv(CSV_URL, d => ({
      scheme: d.scheme,
      day:    d3.timeDay.floor(new Date(d.time_bin)),
      delta:  +d.delta,
    })).then(rows => {

      const data = scheme ? rows.filter(r => r.scheme === scheme) : rows;

      /* ---------- 1a. Group by day & summarise ---------- */
      const grouped = Array.from(
        d3.group(data, d => +d.day),
        ([key, values]) => {
          const sorted = values.map(d => d.delta).sort(d3.ascending);
          const q1 = d3.quantileSorted(sorted, 0.25);
          const q2 = d3.quantileSorted(sorted, 0.50);
          const q3 = d3.quantileSorted(sorted, 0.75);
          const iqr = q3 - q1;
          const loW = Math.max(d3.min(sorted), q1 - 1.5 * iqr);
          const hiW = Math.min(d3.max(sorted), q3 + 1.5 * iqr);
          const outliers = sorted.filter(v => v < loW || v > hiW);

          return {                           // keep only what we need
            day: new Date(+key),
            q1, q2, q3,
            loW, hiW,
            outliers,
          };
        }
      ).sort((a, b) => a.day - b.day);

      /* ---------- 2. Scales ---------- */
      const margin = { top: 70, right: 40, bottom: 50, left: 70 };
      const innerW = width  - margin.left - margin.right;
      const innerH = height - margin.top  - margin.bottom;

      const x = d3.scaleBand()
        .domain(grouped.map(d => d.day))
        .range([0, innerW])
        .paddingInner(0.3)
        .paddingOuter(0.2);

      const y = d3.scaleLinear()
        .domain([
          d3.min(grouped, d => d.loW) * 1.1,
          d3.max(grouped, d => d.hiW) * 1.1
        ])
        .nice()
        .range([innerH, 0]);

      const pct = v => v * 100;   // convert to percentage points

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
          .attr("x1", d => x(d.day) + x.bandwidth() / 2)
          .attr("x2", d => x(d.day) + x.bandwidth() / 2)
          .attr("y1", d => y(d.loW))
          .attr("y2", d => y(d.hiW))
          .attr("stroke", "#555");

      /* 3b. Box */
      g.selectAll("rect.box")
        .data(grouped)
        .enter()
        .append("rect")
          .attr("class", "box")
          .attr("x", d => x(d.day))
          .attr("width", x.bandwidth())
          .attr("y", d => y(d.q3))
          .attr("height", d => Math.abs(y(d.q3) - y(d.q1)))
          .attr("fill", d => (d.q2 >= 0 ? "#d62728" : "#2ca02c"))
          .attr("opacity", 0.75)
          .append("title")                 // tooltip, friendlier wording
            .text(d =>
              `${d.day.toDateString()}\n`
            + `Lower quartile: ${pct(d.q1).toFixed(1)} %\n`
            + `Typical (median): ${pct(d.q2).toFixed(1)} %\n`
            + `Upper quartile: ${pct(d.q3).toFixed(1)} %`
            );

      /* 3c. Median line */
      g.selectAll("line.median")
        .data(grouped)
        .enter()
        .append("line")
          .attr("class", "median")
          .attr("x1", d => x(d.day))
          .attr("x2", d => x(d.day) + x.bandwidth())
          .attr("y1", d => y(d.q2))
          .attr("y2", d => y(d.q2))
          .attr("stroke", "#111")
          .attr("stroke-width", 2);

      /* 3d. Whisker caps */
      ["hiW", "loW"].forEach((k, i) =>
        g.selectAll(`line.cap${i}`)
          .data(grouped)
          .enter()
          .append("line")
            .attr("x1", d => x(d.day) + x.bandwidth() * 0.25)
            .attr("x2", d => x(d.day) + x.bandwidth() * 0.75)
            .attr("y1", d => y(d[k]))
            .attr("y2", d => y(d[k]))
            .attr("stroke", "#555")
      );

      /* 3e. Outliers */
      g.selectAll("circle.outlier")
        .data(grouped.flatMap(d =>
          d.outliers.map(v => ({ day: d.day, v }))
        ))
        .enter()
        .append("circle")
          .attr("class", "outlier")
          .attr("cx", d => x(d.day) + x.bandwidth() / 2)
          .attr("cy", d => y(d.v))
          .attr("r", 3)
          .attr("fill", d => (d.v >= 0 ? "#d62728" : "#2ca02c"))
          .attr("opacity", 0.6)
          .append("title")
            .text(d =>
              `${d.day.toDateString()}\n`
            + `Unusual jump: ${pct(d.v).toFixed(1)} %`
            );

      /* 3f. Axes — friendlier labels */
      const xAxis = d3.axisBottom(x)
        .tickFormat(d3.timeFormat("%a %d"));

      const yAxis = d3.axisLeft(y)
        .ticks(6)
        .tickFormat(v => `${pct(v).toFixed(0)} %`);

      g.append("g")
        .attr("transform", `translate(0,${innerH})`)
        .call(xAxis)
        .call(g => g.append("text")
          .attr("x", innerW / 2)
          .attr("y", 38)
          .attr("fill", "#000")
          .attr("text-anchor", "middle")
          .attr("font-size", "16px")
          .text("Threat Timeline"));

      g.append("g")
        .call(yAxis)
        .call(g => g.append("text")
          .attr("transform", "rotate(-90)")
          .attr("x", -innerH / 2)
          .attr("y", -50)
          .attr("fill", "#000")
          .attr("text-anchor", "middle")
          .attr("font-size", "13px")
          .text("Jump size (percentage points)"));

      /* 3g. Title & subtitle */
      svg.append("text")
        .attr("x", margin.left)
        .attr("y", 24)
        .attr("font-size", "18px")
        .attr("font-weight", "600")
        .text(title);

      svg.append("text")
        .attr("x", margin.left)
        .attr("y", 44)
        .attr("font-size", "13px")
        .attr("fill", "#444")
        .text(subtitle);

    }).catch(err =>
      console.error("BoxPlot: could not load / parse CSV", err)
    );
  }, [width, height, scheme, title, subtitle]);

  /* ---------- 4. Render ---------- */
  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ background: "#fafafa", borderRadius: 6 }}
    />
  );
};

export default BoxPlot;
