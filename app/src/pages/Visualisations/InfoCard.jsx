import React from "react";
import PropTypes from "prop-types";

export default function InfoCard({
  data,
  selectedRegion,
  ...props
}) {
  const region = data.get(selectedRegion);

  if (!region) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <p style={styles.message}>No region selected.</p>
        </div>
      </div>
    );
  }

  const levelColor = {
    High: "red",
    Moderate: "orange",
    Low: "green",
  }[region.level] || "#333";

  return (
    <div {...props} style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>{region.name}</h2>
        <table style={styles.table}>
          <tbody>

            <tr>
              <td style={styles.label}>ID:</td>
              <td style={styles.value}>{region.id}</td>
            </tr>

            <tr>
              <td style={styles.label}># of Reports:</td>
              <td style={styles.value}>{Math.round(region.report_count)}</td>
            </tr>

            <tr>
              <td style={styles.label}>Uncertainty Level:</td>
              <td style={{ ...styles.value, color: levelColor, fontWeight: "bold" }}>{region.level}</td>
            </tr>

            <tr>
              <td style={styles.label}>Reliability / Uncertainty</td>
              <td style={styles.value}>{Math.round(region.reliability * 10)} / {Math.round(region.uncertainty * 10)}</td>
            </tr>            

          </tbody>
        </table>
      </div>
    </div>
  );
}

InfoCard.propTypes = {
  data: PropTypes.instanceOf(Map).isRequired,
  selectedRegion: PropTypes.number,
};

const styles = {
  wrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "2rem",
    width: "100%",
  },
  card: {
    backgroundColor: "#fdfdfd",
    padding: "2rem 3rem",
    borderRadius: "1rem",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
    minWidth: "60%",
    width: "auto",
    textAlign: "center",
    fontSize: "1.2rem",
    fontFamily: "Segoe UI, sans-serif",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "1.5rem",
    color: "#222",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  label: {
    fontWeight: "600",
    paddingRight: "1rem",
    textAlign: "left",
    color: "#555",
    width: "80%",
    borderBottom: "1px dotted #aaa",  // ← adds the dotted line between the two <td>s
  },
  value: {
    borderBottom: "1px dotted #aaa",
    paddingLeft: "1rem",
    textAlign: "right"
  },
  message: {
    fontSize: "1.5rem",
    color: "#888",
  },
};
