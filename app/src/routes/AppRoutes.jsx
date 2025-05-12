import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Question1 from "../pages/Q1/Q1";
import Question2 from "../pages/Q2/Q2";
import Question3 from "../pages/Q3/Q3";

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
      <Route path="/" element={<Navigate to="/Q1" replace />} />
        <Route path="/Q1" element={<Question1 />} />
        <Route path="/Q2" element={<Question2 />} />
        <Route path="/Q3" element={<Question3 />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
