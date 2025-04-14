import { useState } from 'react';
import styles from "./Tabular.module.css";

// Tab Factory for creating tabs
export const createTab = (header, content) => ({header, content});

// The tabular view itself
const Tabular = ({ tabs }) => {

    const [activeTabIndex, setActiveTab] = useState(0); // Create a state initially 0.

    return (
        <div className = {styles["container"]}>
            <div className = {styles["header-container"]}>

                {/* Map tabs by their header */}
                {tabs.map((tab, index) => {
                    // Create a btton for each tab labelled with its header
                    return (
                        <button
                            key = {index}
                            className = {`${styles["header-button"]} ${index === activeTabIndex ? styles["active"] : styles["inactive"]}`}
                            onClick = {(() => setActiveTab(index))}
                        >
                            {tab.header} {/* Set the Header as the label */}
                        </button>
                    );
                })}
                <div className={styles["header-fill"]}></div>
            </div>

            {/* Display the selected tab's content */}
            <div className= {styles["content"]}>

                {/* Set the content as the active tab's content */}
                {tabs[activeTabIndex]?.content}
            </div>
        </div>
    )

}

export default Tabular;