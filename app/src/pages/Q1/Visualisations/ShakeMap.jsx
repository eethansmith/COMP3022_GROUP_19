// src/pages/Q1/Visualisations/ShakeMap.jsx
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import PropTypes from 'prop-types';

/* ------------------------------------------------------------------+
|  Piece-wise colour scale                                            |
|  0–3.5 → creams, 3.5–7.5 → oranges, 7.5–10 → “old” red              |
+-------------------------------------------------------------------*/
const colourScale = d3
  .scaleLinear()
  .domain([0, 3.5, 7.5, 10])
  .range(['#FFFBEA', '#FFE9C9', '#FF9A4D', '#8B0000'])
  .interpolate(d3.interpolateRgb.gamma(1.8)) // perceptual γ
  .clamp(true);

// Pull margin out of the component so it isn’t re-created every render
const margin = { top: 20, right: 20, bottom: 30, left: 40 };

const ShakeMap = ({
  data,
  scoresMap,
  selectedRegion,
  setSelectedRegion,
  width  = 800,
  height = 600,
  ...props
}) => {
  const svgRef = useRef(null);

  useEffect(() => {
    // Don’t draw until we have both geo-data and scores
    if (!data || !scoresMap) return;

    const innerWidth  = width  - margin.left - margin.right;
    const innerHeight = height - margin.top  - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();               // clear previous frame

    const projection = d3.geoMercator()
      .fitSize([innerWidth, innerHeight], data);

    const path = d3.geoPath().projection(projection);

    /* ---------- draw map ---------- */
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    g.selectAll('path')
      .data(data.features)
      .enter()
      .append('path')
        .attr('d', path)
        .attr('fill', d => {
          const id = +d.properties.Id;       // coerce string → number
          const v  = scoresMap.get(id);
          return (v != null && !isNaN(v))
            ? colourScale(v)
            : '#ccc';                      // grey fallback
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .attr('opacity', 1)
        .on('mouseover', function () { d3.select(this).attr('opacity', 0.7); })
        .on('mouseout',  function () { d3.select(this).attr('opacity', 1); })
        .on('click',    (_, d) => setSelectedRegion(d.properties.Id))
        .style('cursor', 'pointer');

    /* ---------- labels ---------- */
    g.selectAll('text')
      .data(data.features)
      .enter()
      .append('text')
        .attr('x', d => path.centroid(d)[0])
        .attr('y', d => path.centroid(d)[1])
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .style('font-size', '10px')
        .style('fill', '#fff')
        .style('pointer-events', 'none')
        .text(d => d.properties.Nbrhood);

    /* ---------- legend ---------- */
    const legendWidth = 160;
    const legendScale = d3.scaleLinear()
      .domain([0, 10])
      .range([0, legendWidth]);

    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${innerWidth - legendWidth},20)`);

    legend.append('defs')
      .append('linearGradient')
      .attr('id', 'gradient')
      .selectAll('stop')
      .data(d3.range(0, 101))
      .enter()
      .append('stop')
        .attr('offset', d => `${d}%`)
        .attr('stop-color', d => colourScale(d / 10));

    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', 10)
      .style('fill', 'url(#gradient)');

    legend.append('g')
      .attr('transform', 'translate(0,15)')
      .call(
        d3.axisBottom(legendScale)
          .ticks(5)
          .tickSize(6)
          .tickFormat(d3.format('.1f'))
      );

  // we now list every external value we reference inside this effect:
  }, [data, scoresMap, selectedRegion, setSelectedRegion, width, height]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      {...props}
    />
  );
};

ShakeMap.propTypes = {
  data:             PropTypes.object.isRequired,
  scoresMap:        PropTypes.instanceOf(Map).isRequired,
  selectedRegion:   PropTypes.any,
  setSelectedRegion:PropTypes.func.isRequired,
  width:            PropTypes.number,
  height:           PropTypes.number,
};

export default ShakeMap;
