import React, { useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';
import PropTypes from 'prop-types';

const LineChart = ({
  dataUrl,
  selectedRegion,
  setSelectedRegion,
  aspectRatio = 0.65,        
  className  = '',
  style      = {},
}) => {
    
  const containerRef     = useRef(null);
  const [data, setData]  = useState([]);
  const [width, setWidth] = useState(0);          

  useEffect(() => {
    if (!dataUrl) return;
    d3.csv(dataUrl, d3.autoType)
      .then(setData)
      .catch(err => console.error('LineChart: data load error →', err));
  }, [dataUrl]);

  useEffect(() => {
    const ro = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width)
    );
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!data.length || !width) return;

    const height  = width * aspectRatio;
    const margin  = { top: 20, right: 30, bottom: 30, left: 40 };
    const wPlot   = width  - margin.left - margin.right;
    const hPlot   = height - margin.top  - margin.bottom;

    const nested  = d3.group(data, d => d.area);
    const areas   = Array.from(nested.keys());

    const x       = d3.scaleLinear()
                      .domain(d3.extent(data, d => d.hour))
                      .range([0, wPlot]);

    const y       = d3.scaleLinear()
                      .domain([0, d3.max(data, d => d.severity_score)])
                      .nice()
                      .range([hPlot, 0]);

    const color   = d3.scaleOrdinal(d3.schemeCategory10).domain(areas);

    const lineGen = d3.line()
                      .x(d => x(d.hour))
                      .y(d => y(d.severity_score))
                      .curve(d3.curveMonotoneX);

    const svg = d3.select(containerRef.current)
      .selectAll('svg')
      .data([null])
      .join('svg')
        .attr('width',  width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)   
        .style('overflow', 'visible');


    svg.selectAll('*').remove();

    const g = svg.append('g')
                 .attr('transform', `translate(${margin.left},${margin.top})`);


    g.append('g')
      .attr('transform', `translate(0,${hPlot})`)
      .call(d3.axisBottom(x).ticks(10));

    g.append('g')
      .call(d3.axisLeft(y));

    nested.forEach((values, area) => {
      g.append('path')
        .datum(values.sort((a, b) => a.hour - b.hour))
        .attr('fill', 'none')
        .attr('stroke', color(area))
        .attr('stroke-width', selectedRegion === area ? 3 : 1.5)
        .attr('d', lineGen)
        .attr('cursor', 'pointer')
        .on('click', () => setSelectedRegion(area))
        .on('mouseover', function () {
          d3.select(this).attr('stroke-width', 3);
        })
        .on('mouseout', function () {
          d3.select(this)
            .attr('stroke-width', selectedRegion === area ? 3 : 1.5);
        });
    });
  }, [data, width, selectedRegion, setSelectedRegion, aspectRatio]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
    />
  );
};


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
  aspectRatio:    0.6,
  className:      '',
  style:          {},
};

export default LineChart;
