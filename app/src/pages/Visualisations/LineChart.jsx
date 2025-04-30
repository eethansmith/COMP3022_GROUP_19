import React, { useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';
import PropTypes from 'prop-types';

const LineChart = ({
  dataUrl,
  selectedRegion,
  setSelectedRegion,
  className = '',
  style = {},
}) => {
  const containerRef = useRef(null);
  const [data, setData] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Load and parse CSV data from the provided URL
  useEffect(() => {
    if (!dataUrl) return;
    d3.csv(dataUrl, d3.autoType)
      .then(rows => setData(rows))
      .catch(err => console.error('Error loading data:', err));
  }, [dataUrl]);

  // Observe container size changes for responsiveness
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Draw or update the chart whenever data, dimensions, or selection changes
  useEffect(() => {
    if (!data.length || !dimensions.width || !dimensions.height) return;

    // Clear any existing SVG
    const container = d3.select(containerRef.current);
    container.selectAll('svg').remove();

    // Chart margins
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    // Group data by area
    const nested = d3.group(data, d => d.area);
    const areas = Array.from(nested.keys());

    // Scales
    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.hour))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.severity_score)])
      .nice()
      .range([height, 0]);

    // Color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(areas);

    // Line generator
    const lineGen = d3.line()
      .x(d => x(d.hour))
      .y(d => y(d.severity_score))
      .curve(d3.curveMonotoneX);

    // Create SVG
    const svg = container.append('svg')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // X axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(10).tickFormat(d => d));

    // Y axis
    svg.append('g')
      .call(d3.axisLeft(y));

    // Draw lines for each area
    nested.forEach((values, area) => {
      const sorted = values.sort((a, b) => a.hour - b.hour);
      svg.append('path')
        .datum(sorted)
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
  }, [data, dimensions, selectedRegion, setSelectedRegion]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
    />
  );
};

LineChart.propTypes = {
  dataUrl: PropTypes.string.isRequired,
  selectedRegion: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  setSelectedRegion: PropTypes.func.isRequired,
  className: PropTypes.string,
};

LineChart.defaultProps = {
  selectedRegion: null,
  className: '',
};

export default LineChart;
