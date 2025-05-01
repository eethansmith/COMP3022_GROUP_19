import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import styles from './Rescue.module.css';

import LineChart from '../../Visualisations/LineChart';
import ShakeMap from '../../Visualisations/ShakeMap';
import RadarGraph from '../../Visualisations/RadarGraph';
import BarChart from '../../Visualisations/BarChart';
import SplitRow from '../../../components/SplitRow';

import geoJson from '../../../assets/geojson/StHimark.geo.json';

const Rescue = () => {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [scoresMap,  setScoresMap]  = useState(new Map());
  const [scoresData, setScoresData] = useState([]); 


  useEffect(() => {
    const csvUrl = '/data/resources/rescue-service-priority.csv';
    d3.csv(csvUrl, d3.autoType)
      .then(rows => {
        // pull name out of geoJson.features
        const enriched = rows.map(r => {
          const feat = geoJson.features.find(f => +f.properties.Id === +r.location);
          return {
            id:       r.location,
            name:     feat?.properties?.Nbrhood ?? `#${r.location}`,
            rating:   r.rating,
            n:        r.n,
            mean_sev: r.mean_sev,
            adjusted: r.adjusted
          };
        });
        setScoresData(enriched);
        setScoresMap(new Map(enriched.map(d => [d.id, d.rating])));
      })
      .catch(console.error);
  }, []);
  

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <p>
        This dashboard shows which areas need rescue services most urgently, based on 
        thousands of resident reports submitted during the earthquake. Each report is 
        scored using a weighted formula that prioritises building damage (70%), alongside 
        medical emergencies, road blockages, power outages, and shaking intensity. These 
        scores are averaged for every 3-hour period in each location.
        </p>
        <p>
        To ensure fairness, areas with fewer reports are adjusted using national averages for that time, 
        so no location is over- or under-represented. This creates a reliable timeline of severity across 
        all regions, helping rescue teams focus efforts where the risk to life is highest.
        </p>
      </div>

      <main className={styles.content}>
        <SplitRow leftWidth='50%' rightWidth='50%' height='70%'>
          <LineChart
            dataUrl='/data/resources/rescue-service-timeline.csv'
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
          />
          <ShakeMap
            data={geoJson}
            scoresMap={scoresMap}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
          />
        </SplitRow>
        <SplitRow leftWidth="60%" rightWidth="40%" height="25%">
          <RadarGraph
            className={styles.radarGraph}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            scoresMap={scoresMap}
          />
          <BarChart
            className={styles.barChart}
            data={scoresData}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
          />
        </SplitRow>
      </main>
    </div>
  );
};

export default Rescue;
