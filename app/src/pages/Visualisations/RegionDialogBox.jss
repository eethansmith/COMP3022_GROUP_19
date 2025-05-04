import React from "react";
import PropTypes from "prop-types";

const RegionDialogBox = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <div style={{
      position: "absolute",
      top: "80px",
      right: "40px",
      backgroundColor: "#fff",
      border: "1px solid #ccc",
      borderRadius: "8px",
      padding: "16px",
      zIndex: 1000,
      width: "300px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
    }}>
      <h4>Region {data.id}</h4>
      <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
        <tbody>
          <tr><td>Report Count:</td><td>{data.report_count}</td></tr>
          <tr><td>Std Dev (Buildings):</td><td>{data.std_dev_buildings}</td></tr>
          <tr><td>Missing Shake %:</td><td>{data.missing_shake_pct}</td></tr>
          <tr><td>Uncertainty Score:</td><td>{data.uncertainty_score}</td></tr>
          <tr><td>Reliability Score:</td><td>{data.reliability_score}</td></tr>
          <tr><td>Level:</td><td><strong>{data.uncertainty_level}</strong></td></tr>
        </tbody>
      </table>
      <button onClick={onClose} style={{ marginTop: "10px" }}>
        Close
      </button>
    </div>
  );
};

RegionDialogBox.propTypes = {
  data: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

export default RegionDialogBox;
