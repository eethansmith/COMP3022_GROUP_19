import React from "react";
import ServicesDashboard from "./ServicesDashboard";

/**
 * Factory that returns a <ServicesDashboard /> configured for one service.
 * Valid slugs: "rescue" | "medical" | "utilities" | "traffic"
 */
export default function makeServiceTab(slug) {
  /* ---------- explanatory copy for the header ---------- */
  const copyMap = {
    rescue: [
      "This dashboard shows which areas need rescue services most urgently, based on thousands of resident reports submitted during the earthquake. Each report is scored using a weighted formula that prioritises building damage (70%), alongside medical emergencies, road blockages, power outages, and shaking intensity.",
      "To ensure fairness, areas with fewer reports are adjusted using national averages for that time, so no location is over- or under-represented. This creates a reliable timeline of severity across all regions, helping rescue teams focus efforts where the risk to life is highest."
    ],
    medical: [
      "This dashboard highlights neighbourhoods with the highest concentration of medical emergencies following the quake. Incoming citizen reports are weighted toward life-threatening injuries, trapped victims and collapsing healthcare facilities.",
      "An adjustment layer evens out areas with sparse data so field hospitals and ambulance crews can be staged where they will save the most lives."
    ],
    utilities: [
      "This dashboard prioritises regions suffering power cuts, burst water mains and gas leaks. Scores blend outage duration, population affected and proximity to critical infrastructure.",
      "Utility crews can use the timeline to position repair teams and restore essential services quicker."
    ],
    traffic: [
      "This dashboard analyses road-blockage and traffic-flow reports. Obstructions (collapsed bridges, debris, sinkholes) are weighted more heavily than congestion.",
      "Transport authorities can plan detours and clear bottlenecks, ensuring emergency vehicles reach the hardest-hit areas."
    ]
  };

  /* ---------- two-colour ranges (light ➜ dark) ---------- */
  const colorMap = {
    rescue:    ["#FFFBEA", "#8B0000"], // cream → red
    medical:   ["#EAF5FF", "#004B9B"], // light blue → navy
    utilities: ["#FFFCF0", "#E8B400"], // off-white → amber
    traffic:   ["#F7F4FF", "#5D32B3"]  // very pale lilac → purple
  };

  const stem = `/data/resources/${slug}-service`;

  return (
    <ServicesDashboard
      priorityCsv={`${stem}-priority.csv`}
      timelineCsv={`${stem}-timeline.csv`}
      blurb={copyMap[slug]}
      colorRange={colorMap[slug]}
    />
  );
}
