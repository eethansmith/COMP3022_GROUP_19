import { useState } from "react";
import styles from "./UncertaintyTab.module.css";
import HeatmapPlot from "../../Visualisations/HeatmapPlot";
import StatusOvertime from "../../Visualisations/StatusOvertime";
import CandleSeverityCanvas from "../../Visualisations/CandleSeverity";
import TimelineMap from "../../Visualisations/TimelineMap";

import geoJson from "../../../assets/geojson/StHimark.geo.json";

export default function UncertaintyByDayTab({
    day,
    ...props
}) {

    const [selected, setSelected] = useState();

    return (
        <div>
          <h1>Change in Conditions over Period</h1>
          <div className={styles.body}>
            <div className={styles["grid-container"]}>
              <div className={styles["grid-item"]}>
                <CandleSeverityCanvas />
              </div>
              <div className={styles["grid-item"]}>
                <HeatmapPlot />
              </div>
              <div className={styles["grid-item"]}>
                {/* Pass the geoJson as a prop */}
                <TimelineMap geoJson={geoJson} />
              </div>
            </div>
          </div>
        </div>
      );
    }