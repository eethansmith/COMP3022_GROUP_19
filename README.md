# St. Himarks Quake Responders Dashboard

**COMP3022 Data Visualization Project**

**Group 19:** Abdul, Ethan, Jacob, Nithya

**Link to GitHub Pages:** https://eethansmith.github.io/COMP3022_GROUP_19/

---

## Project Overview

The **St. Himarks Quake Responders Dashboard** is an interactive web application designed to assist emergency response teams in assessing and prioritizing neighborhoods on the island of St. Himark following seismic events. The dashboard integrates citizen damage reports with seismic shake data to provide:

* **Priority mapping** for different emergency services (rescue, medical, utilities, traffic control).
* **Uncertainty analysis** to evaluate the reliability of neighborhood reports.
* **Temporal visualization** of damage and reporting trends over time.

The tool addresses three key analytical tasks:

1. **Response Prioritization 🦺** Determine how emergency response should adapt based on ground-level damage reports.
2. **Uncertainty Quantification 📈**: Compare the reliability of neighborhood reports.
3. **Temporal Dynamics ⌚**: Explore how damage severity and reporting consistency evolve throughout the seismic event.

---

## Installation and Setup ⚙️

### Prerequisites

* [Node.js (v14+)](https://nodejs.org/)
* npm (comes bundled with Node.js)

### Clone and Install

```bash
# Clone the repository
git clone https://github.com/JcbSm/COMP3022_GROUP_19.git st-himark-dashboard
cd st-himark-dashboard

# Install dependencies
cd app
npm install
```

### Running the Application ▶️

```bash
# From the `app` directory:
npm start
```

The development server will launch at `http://localhost:3000`. Live reloading is enabled; changes to source files will refresh the dashboard automatically.

---

## Project Structure 📁

```
app/
├ src/                   # React application source code
│   ├── assets              # Assets (StHimark Geo Json) 
│   ├── components          # Components, styles, and utilities
│   ├── pages               # Pages, Tabs and Visualisations
│   └── routes              # Route for moving around application
│
├── .gitignore          
├── package.json         # Front-end dependencies and scripts  
│
└── public/
    ├── data/              # Data ready for visualisation

data/
├── Q1 Processing/         # R Code for processing Q1 Data
├── Q2 Processing/         # R Code for processing Q2 Data
└── Q3 Processing/         # R Code for processing Q3 Data

```

---

## Dashboard Modules 🗂️

### 1. Emergency Response Prioritization 🛟

This module helps first responders allocate resources based on combined shake intensity and citizen damage reports.

* **Service Tabs:** Four tabs correspond to distinct services:

  * **Rescue Teams 🛟** (focus on building damage)
  * **Medical Services 🚨** (buildings & medical infrastructure)
  * **Utilities ⚡** (sewer, water, power)
  * **Traffic Control 🚗** (roads & bridges)

* **Choropleth Map:** Island map colored by priority score, automatically recomputed when selecting a service category.

* **Priority Bar Chart:** Ranks neighborhoods by the selected damage category.

* **Radar Chart:** Displays multi-dimensional damage metrics (sewer, power, roads, medical, buildings, shake intensity) for a chosen neighborhood.

* **Timeline Sequence:** Illustrates evolving response severity across locations over the reporting period.

This view directly addresses:

> *Emergency responders will base their initial response on the earthquake shake map. Use visual analytics to determine how their response should change based on damage reports from citizens on the ground. How would you prioritize neighborhoods for response? Which parts of the city are hardest hit?*

---

### 2. Report Uncertainty Analysis 📈

This module quantifies and visualizes the trustworthiness of neighborhood damage reports.

* **Uncertainty Score Calculation:** Combines three normalized metrics:

  1. **Report Count:** Fewer entries imply higher uncertainty (weight: 0.30)
  2. **Standard Deviation of Building Damage:** High variability implies inconsistent reporting (weight: 0.50)
  3. **Missing Shake Intensity Percentage:** Gaps in data reduce reliability (weight: 0.20)

* **Heatmap Overlay:** Island map with neighborhoods colored by uncertainty level (green = low; orange = medium; red = high).

* **Bar Chart Ranking:** Neighborhoods sorted by uncertainty, allowing quick comparison.

* **Info Panel:** Detailed explanation of score components, formula rationale, and interpretation guidelines.

This view supports the question:

> *Use visual analytics to show uncertainty in the data. Compare the reliability of neighborhood reports.*

---

### 3. Temporal Data Exploration ⌚

This module enables analysis of how damage severity and reporting activity evolve over time.

* **Time Slider:** Controls day/hour selection to update all visualizations dynamically.
* **Candle–style Chart:** Displays hourly summary of average severity (open/high/low/close metrics) alongside report volume.
* **Temporal Heatmap:** Illustrates report volume per neighborhood across the event timeline.
* **Dynamic Map Playback:** Animated choropleth showing shake intensity progression and reporting clusters over time.

Key questions answered:

> *How do conditions change over time? How does uncertainty change over time? Describe the key changes you see.*

---

## Data Preprocessing and Methods 🔍

* **Data Cleaning:** Handling of missing shake intensity values, timestamp parsing, and neighborhood grouping.
* **Normalization:** Linear scaling of metrics to \[0,1] for composite score calculations.
* **Statistical Analysis:** Computation of mean, standard deviation, and missing data percentages per location.
* **Visualization Design:** Selection of chart types and interaction patterns justified by user tasks and data properties.

Detailed algorithmic approaches and rationale are documented in the final report under **Methods & Design**.

---

*For detailed implementation instructions and library dependencies, please consult the written report.*
