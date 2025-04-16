import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import PropTypes from 'prop-types';

const ShakeMap = ({ field, selectedRegion, setSelectedRegion, ...props }) => {
    const svgRef = useRef(null);
    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd);
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    // Keep this
    const handleSelectRegion = (region) => {
        setSelectedRegion(region);
    };

    useEffect(() => {
        if (!props.data || !svgRef.current) return;

        // Clear previous render
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();
      
        // Validate dimensions
        const width = Number(props.width) || 800;
        const height = Number(props.height) || 600;
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
      
        // Validate data structure
        if (!props.data.features || !Array.isArray(props.data.features)) {
          console.error('Invalid GeoJSON features array');
          return;
        }
      
        // Create projection
        const projection = d3.geoMercator()
          .fitSize([innerWidth, innerHeight], props.data);
      
        // Create path generator
        const path = d3.geoPath()
          .projection(projection);
      
        // Check for valid coordinates
        console.log('Sample coordinates:', props.data.features[0].geometry.coordinates[0][0]);
        
        // Set color domain based on field values
        const fieldValues = props.data.features.map(f => f.properties[field]);
        colorScale.domain(d3.extent(fieldValues));

        // Create main group
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Draw regions
        g.selectAll("path")
            .data(props.data.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", d => colorScale(d.properties[field]))
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5)
            .attr("opacity", 1)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("opacity", 0.7);
            })
            .on("mouseout", function(event, d) {
                d3.select(this).attr("opacity", 1);
            })
            .on("click", (event, d) => {
                handleSelectRegion(d.properties.Id);
            })
            .style("cursor", "pointer");

        // Add region labels
        g.selectAll("text")
            .data(props.data.features)
            .enter()
            .append("text")
            .attr("x", d => path.centroid(d)[0])
            .attr("y", d => path.centroid(d)[1])
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .style("font-size", "10px")
            .style("fill", "#fff")
            .style("pointer-events", "none")
            .text(d => d.properties.name);

        // Add color legend
        const legend = g.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width - 120}, 20)`);

        const legendScale = d3.scaleLinear()
            .domain(colorScale.domain())
            .range([0, 100]);

        legend.append("defs")
            .append("linearGradient")
            .attr("id", "gradient")
            .selectAll("stop")
            .data(d3.range(0, 1.01, 0.1))
            .enter()
            .append("stop")
            .attr("offset", d => d)
            .attr("stop-color", d => colorScale(d3.interpolate(...colorScale.domain())(d)));

        legend.append("rect")
            .attr("width", 100)
            .attr("height", 10)
            .style("fill", "url(#gradient)");

        legend.append("g")
            .attr("transform", "translate(0, 15)")
            .call(d3.axisBottom(legendScale)
                .ticks(5)
                .tickSize(6)
                .tickFormat(d3.format(".2f")));

    }, [props.data, field, selectedRegion, colorScale, margin.left, margin.right, margin.top, margin.bottom]);

    return (
        <svg
            ref={svgRef}
            width={props.width}
            height={props.height}
            {...props}
        />
    );
};

ShakeMap.propTypes = {
    field: PropTypes.string.isRequired,
    selectedRegion: PropTypes.object,
    setSelectedRegion: PropTypes.func.isRequired,
    data: PropTypes.object.isRequired,
    width: PropTypes.number,
    height: PropTypes.number,
};

ShakeMap.defaultProps = {
    width: 800,
    height: 600,
};

export default ShakeMap;