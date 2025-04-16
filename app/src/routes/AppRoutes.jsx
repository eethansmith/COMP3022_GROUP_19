import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard/Dashboard";
import ExamplePage from "../pages/ExamplePage/ExamplePage";
import Question1 from "../pages/Q1/Q1";
import Question2 from "../pages/Q2/Q2";
import Question3 from "../pages/Q3/Q3";

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/example" element={<ExamplePage />} />
        
        <Route path="/Q1" element={<Question1 />} />
        <Route path="/Q2" element={<Question2 />} />
        <Route path="/Q3" element={<Question3 />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
