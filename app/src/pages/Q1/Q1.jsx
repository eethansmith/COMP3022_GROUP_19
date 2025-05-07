import React from "react";
import Header from "../../components/Header";
import Tabular, { TabFactory } from "../../components/Tabular";
import styles from "./Q1.module.css";

import makeServicesTab from "./Tabs/makeServicesTab";

const services = [
    { label: "🛟 Rescue Team",     slug: "rescue"    },
    { label: "🚨 Medical Services",slug: "medical"   },
    { label: "⚡ Utilities",       slug: "utilities" },
    { label: "🚗 Traffic Control", slug: "traffic"   }
  ];
  
  const tabs = services.map(({ label, slug }) =>
    TabFactory(label, makeServicesTab(slug))
  );
  
  export default function Question1() {
    return (
      <div className={styles.body}>
        <Header />
  
        <h1>Emergency Responder Dashboard</h1>
  
        <div className={styles.tabs}>
          <Tabular tabs={tabs} />
        </div>
      </div>
    );
  }