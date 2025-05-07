import Header from "../../components/Header";
import CandleSeverityCanvas from "../Visualisations/CandleSeverity";
import HeatmapPlot from "../Visualisations/HeatmapPlot";
import TimelineMap from "../Visualisations/TimelineMap";
import styles from "./Q3.module.css";
import { useEffect, useState } from "react";
import * as d3 from "d3";



/**
 * Creates a tab for the day specified
 * @param {string} day 
*/
import geoJson from "../../assets/geojson/StHimark.geo.json";

const CSV_PATH = process.env.PUBLIC_URL + "/data/resources/Q3/timeline-shake-intensity.csv";

const Question3 = () => {

    const [currentIdx, setCurrentIdx] = useState(0);
    const [times, setTimes] = useState([]);

    // Fetch CSV on mount
    useEffect(() => {
    d3.csv(CSV_PATH, (row) => ({
        location: +row.location,
        time: new Date(row.time),
        value: row.shake_intensity === "" ? NaN : +row.shake_intensity,
    }))
        .then((csvData) => {
        const uniq = Array.from(new Set(csvData.map((d) => +d.time)))
            .map((ts) => new Date(ts))
            .sort((a, b) => a - b);
        setTimes(uniq);
        setCurrentIdx(0);
        })
        .catch((err) => console.error("CSV load error:", err));
    }, [setCurrentIdx]);

    return (
        <div className={styles["body"]}>

            <Header />

            <div>
                <h1>Change in Conditions over Period</h1>
                <div className={styles.body}>
                    <div className={styles["grid-container"]}>
                        <div className={`${styles["grid-item"]} ${styles["candle-container"]}`}>
                            <h3>Reported Severity to Volume of Reports</h3>
                            <CandleSeverityCanvas currentIdx={currentIdx} setCurrentIdx={setCurrentIdx}  />
                        </div>

                        <div className={`${styles["grid-item"]} ${styles["heatmap-container"]}`}>
                            <h3>Temporal trends by Region</h3>
                            <HeatmapPlot currentIdx={currentIdx} setCurrentIdx={setCurrentIdx}/>
                        </div>

                        <div className={`${styles["grid-item"]} ${styles["slider-container"]}`}>
                            <h3>Time Controls</h3>
                            <input
                                type="range"
                                min={0}
                                max={times.length - 1}
                                step={1}
                                value={currentIdx}
                                onChange={e => setCurrentIdx(+e.target.value)}
                                style={{ width: "100%" }}
                            />
                            <div
                                style={{ textAlign: "center", marginTop: 4, fontSize: "0.9em" }}
                            >
                                {times[currentIdx]?.toLocaleString() || ""}
                            </div>
                        </div>

                        <div className={`${styles["grid-item"]} ${styles["timeline-container"]}`}>
                            <h3>St. Himark Map</h3>
                            <TimelineMap geoJson={geoJson} currentIdx={currentIdx} setCurrentIdx={setCurrentIdx} />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
};

export default Question3;