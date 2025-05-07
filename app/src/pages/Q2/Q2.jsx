import React, { useEffect, useMemo, useState } from "react";
import * as d3 from "d3";
import Header from "../../components/Header";
import styles from "./Q2.module.css";

//Import StHimark map directly
import geoDataJson from "../../assets/geojson/StHimark.geo.json";
import InfoCard from "../Visualisations/InfoCard.jsx";
import ShakeMap from "../Visualisations/ShakeMap.jsx";
import BarChart from "../Visualisations/BarChart.jsx";
import HeatmapPlot from "../Visualisations/HeatmapPlot-SD.jsx";

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


const Question2 = () => {

  const [geoData, setGeoData] = useState(null);
  const [uncertaintyData, setUncertaintyData]     = useState([]);
  const [reliablityData, setReliabilityData] = useState([]);
  const [scoresMap, setScoresMap] = useState(new Map());
  const [infocardMap, setInfocardMap] = useState(new Map());
  const [selectedRegion, setSelectedRegion] = useState(null);

  const Colors = {
    GREEN: "#63d12c",
    RED: "#c93030"
  }

  const colorScale = useMemo(
    () =>
      d3.scaleLinear()
        .domain([0, 10])
        .range([Colors.GREEN, Colors.RED])
        .clamp(true),
    [Colors.GREEN, Colors.RED]
  );

  const colorScaleReverse = useMemo(
    () =>
      d3.scaleLinear()
        .domain([0, 10])
        .range([Colors.RED, Colors.GREEN])
        .clamp(true),
    [Colors.GREEN, Colors.RED]
  );

  useEffect(() => {
    //Set GeoJSON directly
    setGeoData(geoDataJson);

    //Load Q2 Uncertainty Score CSV
    d3.csv(process.env.PUBLIC_URL + "/data/resources/Q2/uncertainty-scores.csv").then(data => {

      const u = [], r = [];
      const map = new Map();
      const infoCardData = new Map();
      
      data.forEach(row => {

        const feat = geoDataJson.features.find(
          f => +f.properties.Id === +row.location
        );

        const id = +row.location;
        const uncertainty =  +(row.uncertainty_score) * 10;
        const reliability = +(row.reliability_score) * 10;
        const name = feat?.properties?.Nbrhood ?? `#${row.location}`

        const std_dev = +row.normalized_std_dev;
        const missingPct = +row.missing_shake_pct;
        const report_count = +row.report_count;
        const reliability_score = +row.reliability_score;
        const uncertainty_score = +row.uncertainty_score;

        u.push({

          id: id,
          name,
          rating: uncertainty,

        });

        r.push({
          id: id,
          name,
          rating: reliability
        })

        map.set(id, uncertainty)

        infoCardData.set(id, {
          id,
          report_count,
          name,
          level: row.uncertainty_level,
          std_dev,
          uncertainty,
          reliability,
          reliability_score,
          uncertainty_score,
          missing_report_pct: missingPct
        })
      });
      
      setUncertaintyData(u)
      setReliabilityData(r)
      setScoresMap(map);
      setInfocardMap(infoCardData);
    });
  }, []);

  

  return (
    <div className={styles.body}>
      <Header />

      <h1>Report Analytics Dashboard</h1>
      <p>This section helps you evaluate the trustworthiness of damage reports across different regions by visualising uncertainty scores.
Uncertainty scores are based on: variability in damage, missing shake data, and low report counts.
Formula: 0.4 × StdDev + 0.3 × Missing% + 0.3 × (1 − Normalised Report Count)
Regions are labelled as Low, Moderate, or High uncertainty.</p>

      <div className={styles["grid-container"]}>


        <div className={`${styles["grid-item"]} ${styles["heatmap-container"]}`}>
          <h3>Breakdown by Region</h3>
          <HeatmapPlot
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            infocardMap={infocardMap}
            colorScale={colorScale}
          />
        </div>

        <div className={`${styles["grid-item"]} ${styles["shake-map-container"]}`}>
        <h3>St. Himark Region Map</h3>
          <ShakeMap
            data={geoData}
            scoresMap={scoresMap}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            colorScale={colorScale}
            className="w-full h-[600px]"
            title="Uncertainty Score"
          />
        </div>

        <div className={`${styles["grid-item"]} ${styles["table-container"]}`}>
          <InfoCard 
            data={infocardMap}
            selectedRegion={selectedRegion}
          />
        </div>

        <div className={`${styles["grid-item"]} ${styles["bar-chart-container"]}`}>
        <h3>Regions by Reliability Scoring</h3>
          <BarChart
            data={reliablityData}
            scoresMap={scoresMap}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            colorScale={colorScaleReverse}
            className="mt-10"
          />
        </div>
      </div>



    </div>
  );
};

export default Question2;
