import Tabular, { createTab } from "../../components/Tabular";
import styles from "./Q1.module.css"

// Tabs
import RescueTab from "./Tabs/Rescue";

// Just testing if the tabs work
const Question1 = () => {

    const tabs = [
        createTab("Rescue Team", <RescueTab />),
        createTab("Medical Services", <p>This is the details tab.</p>),
        createTab("Utilities", <p>This is the MORE details tab.</p>),
        createTab("Traffic Control", <p>Theres nothing here.</p>)
    ];

    return (
        <div className={styles["body"]}>

            {/* Title */}
            <h1>Question 1</h1>
            <h3>"Whatever Question 1 is goes here."</h3>

            <div className={styles["tabs"]}>
                <Tabular tabs={tabs}></Tabular>
            </div>

        </div>
    );
}

export default Question1;