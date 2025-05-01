// src/pages/Visualisations/BarChart.jsx
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import PropTypes from 'prop-types';

// match your ShakeMap colourScale
const colourScale = d3
  .scaleLinear()
  .domain([0, 3.5, 7.5, 10])
  .range(['#FFFBEA', '#FFE9C9', '#FF9A4D', '#8B0000'])
  .interpolate(d3.interpolateRgb.gamma(1.8))
  .clamp(true);

const margin = { top: 10, right: 20, bottom: 30, left: 120 };

export default function BarChart({
  data,
  selectedRegion,
  setSelectedRegion,
  className
}) {
  const svgRef = useRef();

  useEffect(() => {
    if (!data.length) return;

    const svgEl = svgRef.current;
    const { width, height } = svgEl.getBoundingClientRect();
    const innerW = width  - margin.left - margin.right;
    const innerH = height - margin.top  - margin.bottom;

    const svg = d3.select(svgEl).selectAll('*').remove() && d3.select(svgEl);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // sort descending by rating
    const sorted = [...data].sort((a, b) => b.rating - a.rating);

    // scales
    const x = d3.scaleLinear().domain([0, 10]).range([0, innerW]);
    const y = d3
      .scaleBand()
      .domain(sorted.map(d => d.name))
      .range([0, innerH])
      .padding(0.1);

    // axes
    g.append('g').call(d3.axisLeft(y));
    g
      .append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('.1f')));

    // bars + interaction
    g.selectAll('rect')
      .data(sorted, d => d.id)
      .enter()
      .append('rect')
        .attr('y', d => y(d.name))
        .attr('height', y.bandwidth())
        .attr('x', 0)
        .attr('width', d => x(d.rating))
        .attr('fill', d => colourScale(d.rating))
        .attr('stroke', d => d.id === selectedRegion ? '#000' : 'none')
        .attr('stroke-width', d => d.id === selectedRegion ? 2 : 0)
        .style('cursor', 'pointer')
        .on('click', (_, d) => setSelectedRegion(d.id))
        .on('mouseover', function(_, d) {
          d3.select(this).attr('opacity', 0.7);

          // simple tooltip
          const tip = d3.select('body')
            .append('div')
            .attr('class', 'bar-tooltip')
            .style('position', 'absolute')
            .style('pointer-events', 'none')
            .style('padding', '6px')
            .style('background', 'rgba(0,0,0,0.7)')
            .style('color', '#fff')
            .style('border-radius', '4px')
            .html(`
              <strong>${d.name}</strong><br/>
              Reports: ${d.n}<br/>
              Mean: ${d.mean_sev.toFixed(2)}<br/>
              Adjusted: ${d.adjusted.toFixed(2)}<br/>
              Rating: ${d.rating.toFixed(2)}
            `);

          d3.select('body').on('mousemove.tooltip', event => {
            tip
              .style('left',  `${event.pageX + 10}px`)
              .style('top',   `${event.pageY + 10}px`);
          });
        })
        .on('mouseout', function() {
          d3.select(this).attr('opacity', 1);
          d3.selectAll('.bar-tooltip').remove();
          d3.select('body').on('mousemove.tooltip', null);
        });

  }, [data, selectedRegion, setSelectedRegion]);

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
  data: PropTypes.arrayOf(PropTypes.shape({
    id:       PropTypes.number.isRequired,
    name:     PropTypes.string.isRequired,
    rating:   PropTypes.number.isRequired,
    n:        PropTypes.number.isRequired,
    mean_sev: PropTypes.number.isRequired,
    adjusted: PropTypes.number.isRequired
  })).isRequired,
  selectedRegion: PropTypes.number,
  setSelectedRegion: PropTypes.func.isRequired,
  className: PropTypes.string
};
