import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import styles from './Rescue.module.css';

import LineChart from '../../Visualisations/LineChart';
import ShakeMap from '../../Visualisations/ShakeMap';
import RadarGraph from '../../Visualisations/RadarGraph';
import SplitRow from '../../../components/SplitRow';

import geoJson from '../../../assets/geojson/StHimark.geo.json';

const Rescue = () => {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [scoresMap,     setScoresMap]     = useState(new Map());

  useEffect(() => {
    const csvUrl = '/data/resources/rescue-service-priority.csv';
    d3.csv(csvUrl, d3.autoType)
      .then(rows => setScoresMap(new Map(rows.map(r => [+r.location, +r.priorityScore]))))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <p>
          This dashboard shows which areas have been most impacted by building damage during the earthquake,
          based on resident reports. These are the locations where the risk to life is highest and where
          Rescue Services are most urgently needed.
        </p>
        <p>
          Severity scores are calculated using a weighted formula: 70% building damage and 30% shake
          intensity, averaged across all reports for each area. To emphasise urgency, the final score for
          each location is scaled by a factor of 2, highlighting zones that should be prioritised for
          emergency response.
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
        <div className={styles.radarContainer}>
          <RadarGraph                    
            className={styles.radarGraph}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
          />
        </div>
      </main>
    </div>
  );
};

export default Rescue;
