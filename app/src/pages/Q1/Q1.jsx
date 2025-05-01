import React from "react";
import Header from "../../components/Header";
import Tabular, { createTab } from "../../components/Tabular";
import styles from "./Q1.module.css";

import makeServicesTab from "./Tabs/makeServicesTab";

const services = [
    { label: "Rescue Team",     slug: "rescue"    },
    { label: "Medical Services",slug: "medical"   },
    { label: "Utilities",       slug: "utilities" },
    { label: "Traffic Control", slug: "traffic"   }
  ];
  
  const tabs = services.map(({ label, slug }) =>
    createTab(label, makeServicesTab(slug))
  );
  
  export default function Question1() {
    return (
      <div className={styles.body}>
        <Header />
  
        <h3>
          "Emergency responders will base their initial response on the earthquake
          shake map. Use visual analytics to determine how their response should
          change based on damage reports from citizens on the ground. How would
          you prioritise neighbourhoods for response? Which parts of the city are
          hardest hit?"
        </h3>
  
        <div className={styles.tabs}>
          <Tabular tabs={tabs} />
        </div>
      </div>
    );
  }