import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";

const AREA_NAME = {
    1 : "Palace Hills",
    2 : "Northwest",
    3 : "Old Town",
    4 : "Safe Town",
    5 : "Southwest",
    6 : "Downtown",
    7 : "Wilson Forest",
    8 : "Scenic Vista",
    9 : "Broadview",
   10 : "Chapparal",
   11 : "Terrapin Springs",
   12 : "Pepper Mill",
   13 : "Cheddarford",
   14 : "Easton",
   15 : "Weston",
   16 : "Southton",
   17 : "Oak Willow",
   18 : "East Parton",
   19 : "West Parton"
  };

/**
 * A radar graph visualization that shows both a grid of small radar charts for all regions
 * and an enlarged version of the selected region with more details.
 */
export default function RadarGraph({
  selectedRegion,
  setSelectedRegion,
  scoresMap,
  colorScale,
  className,
  ...props
}) {
  const svgRef = useRef(null);
  const [radarData, setRadarData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load radar data from CSV
  useEffect(() => {
    d3.csv("/data/resources/radar-graph-areas.csv", d3.autoType)
      .then(data => {
        // Process the data to create radar chart data for each region
        const processedData = data.map(d => ({
          area: +d.area,
          metrics: [
            { axis: "Sewer & Water", value: d.sewer_and_water_score },
            { axis: "Power", value: d.power_score },
            { axis: "Roads & Bridges", value: d.roads_and_bridges_score },
            { axis: "Medical", value: d.medical_score },
            { axis: "Buildings", value: d.buildings_score },
            { axis: "Shake Intensity", value: d.shake_intensity_score }
          ]
        }));
        setRadarData(processedData);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error loading radar data:", error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (loading || !radarData.length) return;

    const svgEl = svgRef.current;
    const { width, height } = svgEl.getBoundingClientRect();

    // Clear previous content
    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    // Define layout dimensions
    const gridColumns = 4;
    const gridRows = 5;
    const headerFooterHeight = 100; // Reserve space for header and footer text
    const smallChartSize = Math.min(width / (gridColumns * 2), (height - headerFooterHeight) / gridRows) * 0.8;
    const largeChartSize = Math.min(width * 0.3, height * 0.5);
    
    // Grid area dimensions (left side)
    const gridWidth = width * 0.45;
    const gridHeight = height;
    
    // Create main group
    const mainGroup = svg.append("g")
      .attr("class", "radar-container");
      
    // Helper function to create a radar chart
    function createRadarChart(data, size, detailed = false, x = 0, y = 0) {
      if (!data || !data.metrics) return;
      
      const group = mainGroup.append("g")
        .attr("transform", `translate(${x}, ${y})`);
        
      const radius = size / 2;
      const centerX = radius;
      const centerY = radius;
      
      // Create radar axes
      const axisCount = data.metrics.length;
      const angleSlice = (Math.PI * 2) / axisCount;
      
      // Scale for the radar
      const rScale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, radius]);
        
      // Draw background circles for reference
      if (detailed) {
        const levels = 5;
        for (let j = 0; j < levels; j++) {
          const levelFactor = radius * ((j + 1) / levels);
          
          group.append("circle")
            .attr("cx", centerX)
            .attr("cy", centerY)
            .attr("r", levelFactor)
            .attr("class", "grid-circle")
            .style("fill", "none")
            .style("stroke", "gray")
            .style("stroke-opacity", "0.2");
            
          // Add labels for levels on the right side axis
          if (j < levels - 1) {
            group.append("text")
              .attr("x", centerX + levelFactor * Math.cos(0))
              .attr("y", centerY - levelFactor * Math.sin(0) + 4)
              .attr("font-size", "10px")
              .attr("text-anchor", "middle")
              .text(d3.format(".1f")((j + 1) / levels));
          }
        }
      }
      
      // Draw axes
      for (let i = 0; i < axisCount; i++) {
        const angle = angleSlice * i - Math.PI / 2;
        const lineX = centerX + radius * Math.cos(angle);
        const lineY = centerY + radius * Math.sin(angle);
        
        group.append("line")
          .attr("x1", centerX)
          .attr("y1", centerY)
          .attr("x2", lineX)
          .attr("y2", lineY)
          .attr("class", "radar-axis")
          .style("stroke", "gray")
          .style("stroke-opacity", detailed ? "0.6" : "0.3")
          .style("stroke-width", detailed ? 1 : 0.5);
          
        // Add axis labels for detailed view
        if (detailed) {
          const labelDistance = radius * 1.15; // Place labels slightly outside the radar
          const labelX = centerX + labelDistance * Math.cos(angle);
          const labelY = centerY + labelDistance * Math.sin(angle);
          
          // Adjust text anchor based on position
          let textAnchor = "middle";
          if (Math.abs(Math.cos(angle)) > 0.7) {
            textAnchor = Math.cos(angle) > 0 ? "start" : "end";
          }
          
          group.append("text")
            .attr("x", labelX)
            .attr("y", labelY)
            .attr("dy", "0.35em")
            .attr("text-anchor", textAnchor)
            .attr("font-size", "12px")
            .text(data.metrics[i].axis);
        }
      }
      
      // Draw radar polygon
      const points = data.metrics.map((d, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const pointRadius = rScale(d.value);
        return {
          x: centerX + pointRadius * Math.cos(angle),
          y: centerY + pointRadius * Math.sin(angle),
          value: d.value
        };
      });
      
      // Create polygon path
      const radarLine = d3.lineRadial()
        .radius(d => d.value)
        .angle((d, i) => i * angleSlice)
        .curve(d3.curveLinearClosed);
        
      const pathData = points.map(p => [p.x, p.y]).flat();
      
      // Draw the radar polygon
      group.append("path")
        .datum(points)
        .attr("d", d => {
          let path = "M " + d[0].x + "," + d[0].y;
          for (let i = 1; i < d.length; i++) {
            path += " L " + d[i].x + "," + d[i].y;
          }
          path += " Z";
          return path;
        })
        .style("fill", colorScale(data.area === selectedRegion ? 8 : 3))
        .style("fill-opacity", 0.5)
        .style("stroke", colorScale(data.area === selectedRegion ? 9 : 5))
        .style("stroke-width", data.area === selectedRegion ? 2 : 1);
        
      // Add vertices for detailed view
      if (detailed) {
        points.forEach((point, i) => {
          group.append("circle")
            .attr("cx", point.x)
            .attr("cy", point.y)
            .attr("r", 4)
            .style("fill", colorScale(9))
            .style("stroke", "#fff")
            .style("stroke-width", 1);
            
          // Add value labels
          group.append("text")
            .attr("x", point.x)
            .attr("y", point.y - 10)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("font-weight", "bold")
            .text(d3.format(".2f")(data.metrics[i].value));
        });
      }
      
      // Add area ID below small charts
      if (!detailed) {
        group.append("text")
          .attr("x", centerX)
          .attr("y", size + 5)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .style("font-weight", data.area === selectedRegion ? "bold" : "normal")
          .text(AREA_NAME[data.area]);
      }
      
      // Create a transparent overlay for click events on small charts
      if (!detailed) {
        group.append("circle")
          .attr("cx", centerX)
          .attr("cy", centerY)
          .attr("r", radius)
          .style("fill", "transparent")
          .style("cursor", "pointer")
          .on("click", () => {
            setSelectedRegion(data.area);
          })
          .on("mouseover", function() {
            d3.select(this.parentNode).select("path")
              .style("stroke-width", 3)
              .style("fill-opacity", 0.7);
          })
          .on("mouseout", function() {
            d3.select(this.parentNode).select("path")
              .style("stroke-width", data.area === selectedRegion ? 2 : 1)
              .style("fill-opacity", 0.5);
          });
      }
      
      // Add title for detailed chart
    //   if (detailed) {
    //     group.append("text")
    //       .attr("x", centerX)
    //       .attr("y", -50)
    //       .attr("text-anchor", "middle")
    //       .attr("font-size", "18px")
    //       .attr("font-weight", "bold")
    //       .text(`${AREA_NAME[data.area]} Details`);
    //   }
    }
    
    // Create grid of small radar charts
    const padding = 10;
    const cellWidth = gridWidth / gridColumns;
    const cellHeight = (gridHeight - 100) / gridRows; // Reserve space for header and footer
    
    // Layout grid with information text at the last position
    radarData.forEach((d, i) => {
      if (i < 19) { // Only show up to 19 regions
        const col = i % gridColumns;
        const row = Math.floor(i / gridColumns);
        
        const x = col * cellWidth + (cellWidth - smallChartSize) / 2;
        const y = row * cellHeight + (cellHeight - smallChartSize) / 2 + 50; // Add more space for title
        
        createRadarChart(d, smallChartSize, false, x, y);
      }
    });
    
    // Create detailed radar chart for selected region
    const selectedData = radarData.find(d => d.area === selectedRegion);
    if (selectedData) {
      const detailedX = width * 0.6;
      const detailedY = (height - largeChartSize) / 2;
      createRadarChart(selectedData, largeChartSize, true, detailedX, detailedY);
    } else {
      // If no region selected, show prompt
      mainGroup.append("g")
        .attr("transform", `translate(${width * 0.75}, ${height * 0.5})`)
        .append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .text("Select a region to see detailed radar chart");
    }
    
    // Add information text
    const infoX = gridWidth / 2;
    const infoY = height - 28;
    
    mainGroup.append("text")
      .attr("x", infoX)
      .attr("y", infoY)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .text("Each radar chart shows infrastructure status scores");
      
    mainGroup.append("text")
      .attr("x", infoX)
      .attr("y", infoY + 16)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .text("Click on any region to see detailed metrics");
    
  }, [radarData, selectedRegion, setSelectedRegion, loading, colorScale]);

  return (
    <svg
      ref={svgRef}
      className={className}
      width="100%"
      height="100%"
      {...props}
    >
      {loading && (
        <text x="50%" y="50%" textAnchor="middle" fontSize="16px">
          Loading radar data...
        </text>
      )}
    </svg>
  );
}

RadarGraph.propTypes = {
  selectedRegion: PropTypes.number,
  setSelectedRegion: PropTypes.func.isRequired,
  scoresMap: PropTypes.instanceOf(Map).isRequired,
  colorScale: PropTypes.func,
  className: PropTypes.string
};