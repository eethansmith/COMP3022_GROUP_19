import { useState } from "react";
import styles from "./UncertaintyTab.module.css";
import BoxPlot from "../../Visualisations/BoxPlot";
import HeatmapPlot from "../../Visualisations/HeatmapPlot";
import StatusOvertime from "../../Visualisations/StatusOvertime";
import TurnPoints from "../../Visualisations/BoxPlot";


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
                    <StatusOvertime
                        day={day}
                    />
                </div>
                <div className={styles["grid-item"]}>
                    <BoxPlot
                    />
                </div>
            </div>
            <div className={styles["grid-item"]}>
                    <HeatmapPlot
                    />
                </div>
        </div>
    </div>)
}