import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import PropTypes from 'prop-types';

/**
 * HeatmapPlot.jsx
 * Renders a sortable heatmap of regions vs. metrics (std_dev, missing_report_pct, report_count, reliability_score).
 * - Dynamic dimensions with a 15:10 aspect ratio
 * - Clickable headers and row labels to sort ascending/descending or select region
 * - Tooltip on hover
 * - Highlight selected row with subtle overlay
 */
const HeatmapPlot = ({ infocardMap, selectedRegion, setSelectedRegion, colorScale }) => {
  const svgRef = useRef();
  const [sortConfig, setSortConfig] = useState({ key: 'std_dev', direction: 'asc' });

  useEffect(() => {
    // Prepare data array
    const data = Array.from(infocardMap.values()).map(region => ({
      id: region.id,
      name: region.name,
      std_dev: region.std_dev,
      missing_report_pct: region.missing_report_pct,
      report_count: region.report_count,
      reliability_score: region.reliability_score,
      uncertainty_score: region.uncertainty_score
    }));

    // Sort
    const sorted = [...data].sort((a, b) => {
      const dir = sortConfig.direction === 'asc' ? 1 : -1;
      return (a[sortConfig.key] - b[sortConfig.key]) * dir;
    });

    // Metrics + labels
    const metrics = [
      { key: 'std_dev',             label: 'Std. Deviation',    display: (val) => (Math.round(val * 100) / 100) },
      { key: 'missing_report_pct',  label: '% Reports Missing', display: (val) => `${Math.round(val * 100)}%` },
      { key: 'report_count',        label: '# Reports',         display: (val) => val },
      { key: 'uncertainty_score',   label: 'Reliability',       display: (val) => (Math.round((1 - val) * 100) / 100) }
    ];
    const keys = metrics.map(m => m.key);
    const labelMap = metrics.reduce((acc, { key, label }) => { acc[key] = label; return acc; }, {});
    const displayMap = metrics.reduce((acc, {key, display }) => { acc[key] = display; return acc }, {});

    console.log(displayMap)

    // Build color scales per metric
    const colorScales = {};
    metrics.forEach(({ key }) => {
      const [min, max] = d3.extent(sorted, d => d[key]);
      colorScales[key] = colorScale.copy().domain([min, max]);
    });

    // SVG & dimensions
    const svg = d3.select(svgRef.current);
    const container = svgRef.current.parentNode;
    const { width } = container.getBoundingClientRect();
    const height = (width * 10) / 15;
    svg.attr('width', width).attr('height', height);

    const margin = { top: 60, right: 30, bottom: 50, left: 120 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    svg.selectAll('*').remove();
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleBand().domain(keys).range([0, innerW]).padding(0.1);
    const yScale = d3.scaleBand().domain(sorted.map(d => d.name)).range([0, innerH]).padding(0.1);

    // Axes with lighter strokes
    const xAxis = d3.axisTop(xScale)
      .tickFormat(key => {
        let lab = labelMap[key];
        if (sortConfig.key === key) {
          lab += sortConfig.direction === 'desc' ? ' ↑' : ' ↓';
        }
        return lab;
      })
      .tickSize(0);
    const yAxis = d3.axisLeft(yScale).tickSize(0);

    // Render X axis
    const xg = g.append('g').attr('class', 'axis x-axis').call(xAxis);
    xg.selectAll('path, line').style('stroke', '#fff');
    xg.selectAll('text')
      .style('cursor', 'pointer')
      .style('font-size', '14px')
      .style('font-weight', (d) => d === sortConfig.key ? 'bold' : 'normal')
      .on('click', (event, key) => {
        let dir = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') dir = 'desc';
        setSortConfig({ key, direction: dir });
      });

    // Render Y axis
    const yg = g.append('g').attr('class', 'axis y-axis').call(yAxis);
    yg.selectAll('path, line').style('stroke', '#fff');
    yg.selectAll('text')
      .style('cursor', 'pointer')
      .style('font-size', '12px')
      .style('font-weight', d => (sorted.find(item => item.name === d).id === selectedRegion ? 'bold' : 'normal'))
      .on('click', (event, name) => {
        const itm = sorted.find(item => item.name === name);
        if (itm) setSelectedRegion(itm.id);
      });

    // Tooltip
    const tooltip = d3.select(container).append('div')
      .attr('class', 'heatmap-tooltip')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('background', '#fff')
      .style('padding', '6px 8px')
      .style('border', '1px solid #ddd')
      .style('border-radius', '4px')
      .style('font-size', '12px');

    // Draw cells
    g.selectAll('g.row').data(sorted).enter()
      .append('g')
      .attr('class', 'row')
      .attr('transform', d => `translate(0,${yScale(d.name)})`)
      .each(function(rowData) {
        const row = d3.select(this);
        // subtle highlight overlay for selected
        if (rowData.id === selectedRegion) {
          row.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', innerW)
            .attr('height', yScale.bandwidth())
            .attr('fill', 'rgba(132, 132, 132, 0.5)');
        }
        // cells
        row.selectAll('rect.cell')
          .data(keys.map(key => ({ key, value: rowData[key], id: rowData.id, name: rowData.name })))
          .enter()
          .append('rect')
          .attr('class', 'cell')
          .attr('x', d => xScale(d.key))
          .attr('y', 0)
          .attr('width', xScale.bandwidth())
          .attr('height', yScale.bandwidth())
          .attr('fill', d => colorScales[d.key](d.value))
          .style('cursor', 'pointer')
          .on('click', (event, d) => setSelectedRegion(d.id))
          .on('mouseover', (event, d) => {
            tooltip
              .style('opacity', 1)
              .html(`<strong>${d.name}</strong><br/>${labelMap[d.key]}: ${displayMap[d.key](d.value)}`)
              .style('left', `${event.pageX + 10}px`)
              .style('top', `${event.pageY + 10}px`);
          })
          .on('mouseout', () => tooltip.style('opacity', 0));
      });

    // Cleanup
    return () => tooltip.remove();
  }, [infocardMap, sortConfig, selectedRegion, setSelectedRegion, colorScale]);

  return (<svg ref={svgRef} style={{ width: '100%', height: 'auto' }} />);
};

HeatmapPlot.propTypes = {
  infocardMap: PropTypes.instanceOf(Map).isRequired,
  selectedRegion: PropTypes.number,
  setSelectedRegion: PropTypes.func.isRequired,
  colorScale: PropTypes.func.isRequired,
};

export default HeatmapPlot;
