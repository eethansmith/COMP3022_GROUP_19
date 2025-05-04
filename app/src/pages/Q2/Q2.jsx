import React, { useEffect, useState } from "react";
import * as d3 from "d3";
import Header from "../../components/Header";
import Q2ShakeMap from "../Visualisations/Q2ShakeMap.jsx";
import Q2BarChart from "../Visualisations/Q2BarChart";
import styles from "./Q2.module.css";

//Import StHimark map directly
import geoDataJson from "../../assets/geojson/StHimark.geo.json";
import Table from "../Visualisations/Table.jsx";

const Question2 = () => {

  const [geoData, setGeoData] = useState(null);
  const [scoresMap, setScoresMap] = useState(new Map());
  const [selectedRegion, setSelectedRegion] = useState(null);

  useEffect(() => {
    //Set GeoJSON directly
    setGeoData(geoDataJson);

    //Load Q2 Uncertainty Score CSV
    d3.csv(process.env.PUBLIC_URL + "/data/mc1-q2-uncertainty-scores.csv").then(data => {
      const map = new Map();
      data.forEach(row => {
        const id = +row.location;               // region ID from CSV
        const score = +row.uncertainty_score;   // uncertainty score
        map.set(id, score);
      });
      setScoresMap(map);
    });
  }, []);

  if (!geoData || scoresMap.size === 0) return <div>Loading Q2 Visualisation...</div>;

  return (
    <div className={styles.body}>
      <Header />
      <h3>Use visual analytics to show uncertainty in the data. Compare the reliability of neighborhood reports.</h3>

      <div className={styles["grid-container"]}>

        <div className={`${styles["grid-item"]} ${styles["bar-chart-container"]}`}>
          <Q2BarChart
            scoresMap={scoresMap}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            className="mt-10"
          />
        </div>

        <div className={`${styles["grid-item"]} ${styles["shake-map-container"]}`}>
          <Q2ShakeMap
            data={geoData}
            scoresMap={scoresMap}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            className="w-full h-[600px]"
          />
        </div>

        <div className={`${styles["grid-item"]} ${styles["table-container"]}`}>
          <Table />
        </div>

      </div>



    </div>
  );
};

export default Question2;
