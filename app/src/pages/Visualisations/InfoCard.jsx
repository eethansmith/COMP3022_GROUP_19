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
              <td>{region.id}</td>
            </tr>
            <tr>
              <td style={styles.label}>Level:</td>
              <td style={{ color: levelColor, fontWeight: "bold" }}>{region.level}</td>
            </tr>
            <tr>
              <td style={styles.label}>Score:</td>
              <td>{Math.round(region.score * 100)} / 100</td>
            </tr>            
            <tr>
              <td style={styles.label}>Reports:</td>
              <td>{Math.round(region.report_count)}</td>
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
    minWidth: "320px",
    maxWidth: "500px",
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
    width: "40%",
  },
  message: {
    fontSize: "1.5rem",
    color: "#888",
  },
};
