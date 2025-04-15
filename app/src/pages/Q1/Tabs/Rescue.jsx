import { useState } from "react";
import styles from "./Rescue.module.css"
import ShakeMap from "../Visualisations/ShakeMap";
import LineChart from "../Visualisations/LineChart";
import RadarGraph from "../Visualisations/RadarGraph";

const RescueTab = () => {

    // Use this, and pass to charts.
    const [selectedRegion, setSelectedRegion] = useState();

    return (
        <div className={styles["body"]}>

            <h2>Rescue Services 1 overview.</h2>
            <p>Selected region: {selectedRegion}</p>
            
            <div className={styles["grid-container"]}>

                <div className={`${styles["grid-item-container"]} ${styles["map-container"]}`}>
                    {/* Place the interactive map visualisation here */}
                    <ShakeMap selectedRegion={selectedRegion} setSelectedRegion={setSelectedRegion} className={`${styles["grid-item"]} ${styles["map"]}`} />  
                </div>

                <div className={`${styles["grid-item-container"]} ${styles["line-chart-container"]}`}>
                    {/* Place the line chart visualisation here */}
                    <LineChart selectedRegion={selectedRegion} setSelectedRegion={setSelectedRegion} className={`${styles["grid-item"]} ${styles["line-chart"]}`} />
                </div>

                <div className={`${styles["grid-item-container"]} ${styles["radar-graph-container"]}`}>
                    {/* Place the radar graph visualisation here */}
                    <RadarGraph selectedRegion={selectedRegion} setSelectedRegion={setSelectedRegion} className={`${styles["grid-item"]} ${styles["radar-graph"]}`} />
                </div>

            </div>

        </div>
    )

}

export default RescueTab;