import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import styles from './Rescue.module.css';
import ShakeMap from '../../Visualisations/ShakeMap';
import LineChart from '../../Visualisations/LineChart';
import RadarGraph from '../../Visualisations/RadarGraph';
import geoJson from '../../../assets/geojson/StHimark.geo.json';

const Rescue = () => {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [scoresMap, setScoresMap]           = useState(new Map());

  useEffect(() => {
    const csvUrl = `/data/resources/rescue-service-priority.csv`;

    d3.csv(csvUrl, d3.autoType)
      .then(rows => {
        // Each `r` has { location: number, priorityScore: number }
        const m = new Map(
          rows.map(r => {
            console.log('  row.region=', r.location, '  row.score=', r.priorityScore);
            return [+r.location, +r.priorityScore];
          }));
          setScoresMap(m);
      })
  }, []); 

  return (
    <div className={styles.body}>
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

      <div className={styles['grid-container']}>
        <div className={`${styles['grid-item-container']} ${styles['map-container']}`}>
          <ShakeMap
            data={geoJson}
            scoresMap={scoresMap}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            width={800}
            height={600}
          />
        </div>

        <div className={`${styles['grid-item-container']} ${styles['line-chart-container']}`}>
          <LineChart
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
          />
        </div>

        <div className={`${styles['grid-item-container']} ${styles['radar-graph-container']}`}>
          <RadarGraph
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
          />
        </div>
      </div>
    </div>
  );
};

export default Rescue;
