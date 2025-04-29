// src/pages/Visualisations/ShakeMap.jsx
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import PropTypes from 'prop-types';

// colour-scale unchanged
const colourScale = d3
  .scaleLinear()
  .domain([0, 3.5, 7.5, 10])
  .range(['#FFFBEA', '#FFE9C9', '#FF9A4D', '#8B0000'])
  .interpolate(d3.interpolateRgb.gamma(1.8))
  .clamp(true);

// define margin here so it's in scope
const margin = { top: 20, right: 20, bottom: 30, left: 40 };

const ShakeMap = ({
  data,
  scoresMap,
  selectedRegion,
  setSelectedRegion,
  className,     // now destructured
  ...props
}) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || !scoresMap) return;

    // measure the actual container size
    const svgEl = svgRef.current;
    const { width, height } = svgEl.getBoundingClientRect();
    const innerWidth  = width  - margin.left - margin.right;
    const innerHeight = height - margin.top  - margin.bottom;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const projection = d3.geoMercator()
      .fitSize([innerWidth, innerHeight], data);

    const path = d3.geoPath().projection(projection);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // draw the features
    g.selectAll('path')
      .data(data.features)
      .enter().append('path')
        .attr('d', path)
        .attr('fill', d => {
          const id = +d.properties.Id;
          const v  = scoresMap.get(id);
          return (v != null && !isNaN(v))
            ? colourScale(v)
            : '#ccc';
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .on('mouseover', function() { d3.select(this).attr('opacity', 0.7); })
        .on('mouseout',  function() { d3.select(this).attr('opacity', 1); })
        .on('click',    (_, d) => setSelectedRegion(d.properties.Id))
        .style('cursor', 'pointer');

    // labels
    g.selectAll('text')
      .data(data.features)
      .enter().append('text')
        .attr('x', d => path.centroid(d)[0])
        .attr('y', d => path.centroid(d)[1])
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .style('font-size', '10px')
        .style('fill', '#fff')
        .style('pointer-events', 'none')
        .text(d => d.properties.Nbrhood);

    // legend
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
      .selectAll('stop').data(d3.range(0, 101)).enter().append('stop')
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

  // width/height come from getBoundingClientRect()—they’re not React deps,
  // so we omit them here and disable the lint rule for this line:
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, scoresMap, selectedRegion, setSelectedRegion, className]);

  return (
    <svg
      ref={svgRef}
      className={className}
      width="100%"
      height="100%"
      {...props}
    />
  );
};

ShakeMap.propTypes = {
  data:              PropTypes.object.isRequired,
  scoresMap:         PropTypes.instanceOf(Map).isRequired,
  selectedRegion:    PropTypes.any,
  setSelectedRegion: PropTypes.func.isRequired,
  className:         PropTypes.string,
};

export default ShakeMap;
