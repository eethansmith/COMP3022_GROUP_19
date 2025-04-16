import Header from "../../components/Header";
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

            <Header />

            {/* Title */}
            <h3>"Emergency responders will base their initial response on the earthquake shake map. Use visual analytics to determine how their response should change based on damage reports from citizens on the ground. How would you prioritize neighborhoods for response? Which parts of the city are hardest hit?"</h3>

            <div className={styles["tabs"]}>
                <Tabular tabs={tabs}></Tabular>
            </div>

        </div>
    );
}

export default Question1;