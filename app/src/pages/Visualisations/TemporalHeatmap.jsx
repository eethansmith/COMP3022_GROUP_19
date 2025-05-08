// D3Heatmap.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import styles from './TemporalHeatmap.module.css';

const CSV_PATH = process.env.PUBLIC_URL + "/data/resources/Q3/location-time-matrix.csv";
const AREA_NAME = {
  1: "Palace Hills",
  2: "Northwest",
  3: "Old Town",
  4: "Safe Town",
  5: "Southwest",
  6: "Downtown",
  7: "Wilson Forest",
  8: "Scenic Vista",
  9: "Broadview",
 10: "Chapparal",
 11: "Terrapin Springs",
 12: "Pepper Mill",
 13: "Cheddarford",
 14: "Easton",
 15: "Weston",
 16: "Southton",
 17: "Oak Willow",
 18: "East Parton",
 19: "West Parton"
};

export default function TemporalHeatmap({ currentIdx, setCurrentIdx }) {
  const containerRef = useRef();
  const svgRef = useRef();
  const tooltipRef = useRef();

  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('composite_severity');
  const [dimensions, setDimensions] = useState({
    margin: { top: 50, right: 25, bottom: 20, left: 160 },
    width: 20,
    height: 20,
    cellSize: 12
  });

  // Parse CSV text into array of objects
  const parseCSV = (text) => {
    const [headerLine, ...lines] = text.trim().split(/\r?\n/);
    const headers = headerLine.split(',');
    return lines.map(line => {
      const cols = line.split(',');
      return headers.reduce((obj, h, i) => {
        obj[h] = cols[i];
        return obj;
      }, {});
    });
  };

  // Convert strings to numbers and map names
  const processData = (rawData) =>
    rawData.map(d => ({
      location: d.location,
      name: AREA_NAME[d.location],
      time_bin: d.time_bin,
      n_reports: +d.n_reports,
      composite_severity: +d.composite_severity,
      missing_rate: +d.missing_rate,
      local_uncertainty: +d.local_uncertainty
    }));

  // Fetch and parse CSV on mount
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(CSV_PATH);
        if (!resp.ok) throw new Error(`Failed to load data: ${resp.status}`);
        const text = await resp.text();
        setData(processData(parseCSV(text)));
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);

  // Update container width on resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      setDimensions(d => ({
        ...d,
        width: Math.max(600, w - 40)
      }));
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Draw heatmap whenever data, metric, or currentIdx changes
  useEffect(() => {
    if (error || !data.length) return;

    d3.select(svgRef.current).selectAll('*').remove();
    const { margin, cellSize, width: stateW, height: stateH } = dimensions;

    // Derive times and sort locations
    const times = Array.from(new Set(data.map(d => d.time_bin))).sort();
    const sortedLocs = Array.from(new Set(data.map(d => d.location))).sort((a, b) => +a - +b);

    const svgW = Math.max(
      stateW,
      times.length * cellSize + margin.left + margin.right
    );
    const svgH = Math.max(
      stateH,
      sortedLocs.length * cellSize + margin.top + margin.bottom
    );

    // Setup SVG
    d3.select(svgRef.current)
      .attr('width', svgW)
      .attr('height', svgH);

    const g = d3.select(svgRef.current)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleBand()
      .domain(times)
      .range([0, times.length * cellSize])
      .padding(0.05);

    const yScale = d3.scaleBand()
      .domain(sortedLocs)
      .range([0, sortedLocs.length * cellSize])
      .padding(0.05);

    const colorScale = d3.scaleSequential(d3.interpolateInferno).domain([0, 1]);

    // Tooltip
    const tooltip = d3.select(tooltipRef.current)
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', '#ffffff')
      .style('border', '1px solid #e2e8f0')
      .style('border-radius', '8px')
      .style('padding', '12px')
      .style('box-shadow', '0 8px 16px rgba(0,0,0,0.15)')
      .style('font-size', '13px')
      .style('transition', 'opacity 0.2s ease-in-out')
      .style('opacity', 0);

    // X labels
    const tickInterval = Math.ceil(times.length / 8);
    g.append('g')
      .selectAll('text')
      .data(times)
      .enter()
      .filter((_, i) => i % tickInterval === 0)
      .append('text')
      .attr('x', d => xScale(d) + xScale.bandwidth() / 2)
      .attr('y', -10)
      .attr('transform', d => `rotate(-45,${xScale(d) + xScale.bandwidth()/2},-10)`)    
      .style('text-anchor', 'start')
      .style('font-size', '11px')
      .style('fill', '#4a5568')
      .text(d => d.slice(11, 16));

    // Y labels
    g.append('g')
      .selectAll('text')
      .data(sortedLocs)
      .enter()
      .append('text')
      .attr('x', -10)
      .attr('y', d => yScale(d) + yScale.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '12px')
      .style('fill', '#2d3748')
      .text(d => AREA_NAME[d]);

    // Cells
    g.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', d => xScale(d.time_bin))
      .attr('y', d => yScale(d.location))
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => d[selectedMetric] ? colorScale(d[selectedMetric] / 10) : '#cbd5e0')
      .attr('opacity', d => d.local_uncertainty ? 1 - Math.min(d.local_uncertainty / 2, 1) : 1)
      .attr('stroke', d => d.time_bin === times[currentIdx] ? '#FFF' : null)
      .attr('stroke-width', d => d.time_bin === times[currentIdx] ? 2 : 0)
      .on('mouseover', function(event, d) {
        d3.select(this).attr('stroke', '#FFF').attr('stroke-width', 4);
        tooltip.html(`
          <div style="font-weight:bold;margin-bottom:6px;border-bottom:1px solid #e2e8f0; padding-bottom:4px;">
            ${d.name}
          </div>
          <div style="display:grid;grid-template-columns:auto auto;gap:6px;font-size:13px;">
            <span style="color:#4a5568">Time:</span><span style="font-weight:500">${d.time_bin.slice(11,16)}</span>
            <span style="color:#4a5568">Reports:</span><span style="font-weight:500">${d.n_reports}</span>
            <span style="color:#4a5568">Severity:</span><span style="font-weight:500">${d.composite_severity.toFixed(2)}</span>
            <span style="color:#4a5568">Missing:</span><span style="font-weight:500">${(d.missing_rate*100).toFixed(1)}%</span>
            <span style="color:#4a5568">Uncertainty:</span><span style="font-weight:500">${d.local_uncertainty.toFixed(2)}</span>
          </div>
        `);
        const bbox = tooltip.node().getBoundingClientRect();
        let x = event.pageX + 12;
        let y = event.pageY + 12;
        if (x + bbox.width > window.innerWidth) x = event.pageX - bbox.width - 12;
        if (y + bbox.height > window.innerHeight) y = event.pageY - bbox.height - 12;
        tooltip.style('left', `${x}px`).style('top', `${y}px`).style('visibility','visible').style('opacity', 1);
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .attr('stroke', d => d.time_bin === times[currentIdx] ? '#FFF' : null)
          .attr('stroke-width', d => d.time_bin === times[currentIdx] ? 2 : 0);
        tooltip.style('visibility','hidden').style('opacity', 0);
      })
      .on('click', function(event, d) {
        setCurrentIdx(times.indexOf(d.time_bin))
      });

    // Legend omitted for brevity
  }, [data, error, dimensions.width, selectedMetric, currentIdx]);

  const metrics = [
    { value: 'composite_severity', label: 'Severity' },
    { value: 'n_reports', label: 'Number of Reports' },
    { value: 'missing_rate', label: 'Missing Rate' },
    { value: 'local_uncertainty', label: 'Uncertainty' }
  ];

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-64 text-red-500">
        <span>Error: {error}</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full font-sans">
      <div className={styles.controls}>
        <div className={styles.metricSelector}>
          <label htmlFor="metric-select" className={styles.label}>Metric</label>
          <select
            id="metric-select"
            value={selectedMetric}
            onChange={e => setSelectedMetric(e.target.value)}
            className={styles.select}
          >
            {metrics.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.info}>Hover cells for details</div>
      </div>
      <div className="relative overflow-auto border rounded-md max-h-96 shadow-inner">
        <svg ref={svgRef} />
        <div ref={tooltipRef} />
      </div>
    </div>
  );
}
