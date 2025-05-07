import React from "react";
import ServicesDashboard from "./ServicesDashboard";

export default function makeServiceTab(slug) {
  /* ---------- explanatory copy for the header ---------- */
  const copyMap = {
    rescue: [
      "Every citizen report is converted to a single ‘rescue-severity’ score using a weighted mean: building damage 70 %, medical emergencies 10 %, roads & bridges 5 %, power outages 5 %, and a 10 % physics check from shake-intensity.  Missing answers are ignored and the remaining weights are renormalised, so partial reports still count.",
      "Location averages are then empirically-Bayes-shrunken toward the national mean, protecting rural districts with only a handful of reports from wild statistical swings.  Finally, scores are rescaled to a 0–10 index: 10 = worst hit.  The hotspots you see are therefore the places where trapped or injured people are most likely and where rescue teams should be dispatched first."
    ],
  
    medical: [
      "For medical-response scoring the weight vector shifts: injuries and health-related distress carry 55 %, followed by damaged buildings 15 %, blocked roads 15 %, grid failure 5 %, and the same 10 % shake-intensity anchor.  The identical row-by-row weighted-mean formula turns every report into a comparable ‘medical severity’ value.",
      "As with rescue, small-sample districts are shrink-adjusted toward the national average before being stretched onto the 0–10 scale.  The darkest areas mark the greatest expected surge in casualties and the highest likelihood of hospitals or clinics being offline — prime zones for field hospitals, triage posts and ambulance staging."
    ],
  
    utilities: [
      "Utility priority flips the emphasis to lifeline infrastructure: power disruption 40 %, sewer & water failures 35 %, road damage 15 %, plus 10 % shake-intensity.  Each report becomes a utilities-severity score by the same weighted-mean rule of thumb.",
      "Shrinkage for uneven report counts and the 0–10 rescale follow exactly the rescue model.  High-rating districts are where prolonged blackouts, water loss or gas-main breaks will most jeopardise public health; restoration crews targeting these sectors first will restore essential services to the largest at-risk population fastest."
    ],
  
    traffic: [
      "Traffic-control scoring targets mobility: roads & bridges damage 60 %, sewer/water flooding 15 %, debris from buildings 10 %, power-dependent signalling 5 %, and 10 % shake-intensity.  The same weighted-mean → shrinkage → 0-to-10 pipeline produces a blockage severity for each location.",
      "Regions tinted deep red are statistically the most obstructed routes for emergency vehicles and supply convoys.  Clearing debris, repairing bridges or setting up detours in these zones first keeps relief operations — and the economy — moving."
    ]
  };

  /* ---------- two-colour ranges (light ➜ dark) ---------- */
  const colorMap = {
    rescue:    ["#FFFBEA", "#8B0000"], // cream → red
    medical:   ["#EAF5FF", "#004B9B"], // light blue → navy
    utilities: ["#FFFCF0", "#E8B400"], // off-white → amber
    traffic:   ["#F7F4FF", "#5D32B3"]  // very pale lilac → purple
  };

  const stem = `/data/resources/Q1/${slug}`;

  return (
    <ServicesDashboard
      priorityCsv={`${stem}-priority.csv`}
      timelineCsv={`${stem}-service-timeline.csv`}
      blurb={copyMap[slug]}
      colorRange={colorMap[slug]}
    />
  );
}
