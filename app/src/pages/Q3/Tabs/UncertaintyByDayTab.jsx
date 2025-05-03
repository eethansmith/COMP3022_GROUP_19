import { useState } from "react";
import styles from "./UncertaintyByDayTab.module.css";

export default function UncertaintyByDayTab({
    day,
    ...props
}) {

    const [selected, setSelected] = useState();
    
    return (<div>
        <h1>Uncertainty data for Day {day}</h1>

        <div className={styles["body"]}>
            <div className={styles["grid-container"]}>

                <div className={styles["radar-diagram"]} />
                <div className={styles["line-graph"]} />
                <div className={styles["box-plot"]} />

            </div>
        </div>
    </div>)
}