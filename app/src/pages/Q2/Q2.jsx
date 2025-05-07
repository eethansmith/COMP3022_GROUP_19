import React, { useEffect, useMemo, useState } from "react";
import * as d3 from "d3";
import Header from "../../components/Header";
import styles from "./Q2.module.css";

//Import StHimark map directly
import geoDataJson from "../../assets/geojson/StHimark.geo.json";
import InfoCard from "../Visualisations/InfoCard.jsx";
import ShakeMap from "../Visualisations/ShakeMap.jsx";
import BarChart from "../Visualisations/BarChart.jsx";

const Question2 = () => {

  const [geoData, setGeoData] = useState(null);
  const [scoresData, setScoresData]     = useState([]);
  const [scoresMap, setScoresMap] = useState(new Map());
  const [infocardMap, setInfocardMap] = useState(new Map());
  const [selectedRegion, setSelectedRegion] = useState(null);

  const colorScale = useMemo(
    () =>
      d3.scaleLinear()
        .domain([0, 10])
        .range(["#63d12c", "#c93030"])
        .clamp(true),
    []
  );
  

  useEffect(() => {
    //Set GeoJSON directly
    setGeoData(geoDataJson);

    //Load Q2 Uncertainty Score CSV
    d3.csv(process.env.PUBLIC_URL + "/data/resources/mc1-q2-uncertainty-scores.csv").then(data => {

      const d = [];
      const map = new Map();
      const infoCardData = new Map();
      
      data.forEach(row => {

        const feat = geoDataJson.features.find(
          f => +f.properties.Id === +row.location
        );

        const id = +row.location;
        const score =  +(row.uncertainty_score) * 10;

        d.push({

          id: id,
          name: feat?.properties?.Nbrhood ?? `#${row.location}`,
          rating: score,

        });

        map.set(id, score)

        infoCardData.set(id, {
          id: id,
          report_count: +row.report_count,
          name: feat?.properties?.Nbrhood ?? `#${row.location}`,
          level: row.uncertainty_level,
          score: +row.uncertainty_score
        })
      });
      
      setScoresData(d)
      setScoresMap(map);
      setInfocardMap(infoCardData);
    });
  }, []);

  

  return (
    <div className={styles.body}>
      <Header />
      <h3>Use visual analytics to show uncertainty in the data. Compare the reliability of neighborhood reports.</h3>
      <p>Selected region: {selectedRegion}</p>

      <div className={styles["grid-container"]}>

        <div className={`${styles["grid-item"]} ${styles["bar-chart-container"]}`}>
          <BarChart
            data={scoresData}
            scoresMap={scoresMap}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            colorScale={colorScale}
            className="mt-10"
          />
        </div>

        <div className={`${styles["grid-item"]} ${styles["shake-map-container"]}`}>
          <ShakeMap
            data={geoData}
            scoresMap={scoresMap}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            colorScale={colorScale}
            className="w-full h-[600px]"
          />
        </div>

        <div className={`${styles["grid-item"]} ${styles["table-container"]}`}>
          <InfoCard 
            data={infocardMap}
            selectedRegion={selectedRegion}
          />
        </div>

      </div>



    </div>
  );
};

export default Question2;
