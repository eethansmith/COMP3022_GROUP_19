import Header from "../../components/Header";
import Tabular, { TabFactory } from "../../components/Tabular";
import styles from "./Q3.module.css";
import UncertaintyByDayTab from "./Tabs/UncertaintyByDayTab";

/**
 * Creates a tab for the day specified
 * @param {string} day 
 */
const DayTabFactory = (day, i, arr) => TabFactory(`Day ${day}`, <UncertaintyByDayTab day={day} />)

const Question3 = () => {

    return (
        <div className={styles["body"]}>

            <Header />

            <h3>How do conditions change over time? How does uncertainty in change over time? Describe the key changes you see.</h3>

            <div className={styles.tabs}>
                <Tabular tabs={[1, 2, 3].map(DayTabFactory)} />
            </div>

        </div>
    )
};

export default Question3;