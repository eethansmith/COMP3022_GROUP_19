import { useState } from 'react';
// Using the styles from the enhanced CSS module we created
import styles from "./Tabular.module.css";

// Tab Factory for creating tabs
export const TabFactory = (header, content) => ({header, content});

// Enhanced Tabular component with improved design
const Tabular = ({ tabs }) => {
  const [activeTabIndex, setActiveTab] = useState(0);

  // Demo tabs for preview
  const demoTabs = tabs || [
    TabFactory('Dashboard', <div className="p-4">Dashboard Content</div>),
    TabFactory('Analytics', <div className="p-4">Analytics Content</div>),
    TabFactory('Settings', <div className="p-4">Settings Content</div>)
  ];

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className={styles["container"]}>
        <div className={styles["header-container"]}>
          {demoTabs.map((tab, index) => (
            <button
              key={index}
              className={`${styles["header-button"]} ${
                index === activeTabIndex ? styles["active"] : styles["inactive"]
              }`}
              onClick={() => setActiveTab(index)}
            >
              {tab.header}
            </button>
          ))}
          <div className={styles["header-fill"]}></div>
        </div>

        <div className={styles["content"]}>
          {demoTabs[activeTabIndex]?.content}
        </div>
      </div>
    </div>
  );
};

// Default export for the component
export default Tabular;

// Also export the styles so they can be accessed directly
export { styles };