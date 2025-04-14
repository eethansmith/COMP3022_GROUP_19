import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard/Dashboard";
import ExamplePage from "../pages/ExamplePage/ExamplePage";
import Question1 from "../pages/Q1/Q1";

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/example" element={<ExamplePage />} />
        <Route path="/Q1" element={<Question1 />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
