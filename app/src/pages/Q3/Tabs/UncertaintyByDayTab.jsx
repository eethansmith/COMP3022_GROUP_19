import { useState } from "react";
import styles from "./UncertaintyByDayTab.module.css";
import BoxPlot from "../../Visualisations/BoxPlot";
import UncertaintyLineChart from "../../Visualisations/UncertaintyLineChart";
import RadarDiagram from "../../Visualisations/RadarDiagram";

export default function UncertaintyByDayTab({
    day,
    ...props
}) {

    const [selected, setSelected] = useState();

    return (<div>
        <h1>Uncertainty data for Day {day}</h1>

        <div className={styles["body"]}>
            <div className={styles["grid-container"]}>

                <div className={styles["grid-item"]}>
                    <RadarDiagram
                        day={day}
                    />
                </div>

                <div className={`${styles["grid-item"]} ${styles["line-chart-container"]}`}>
                    <UncertaintyLineChart
                        day={day}
                    />
                </div>
                
                <div className={styles["grid-item"]}>
                    <BoxPlot
                        day={day}
                    />
                </div>
            </div>
        </div>
    </div>)
}