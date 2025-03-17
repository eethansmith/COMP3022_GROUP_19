import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard/Dashboard";
import ExamplePage from "../pages/ExamplePage/ExamplePage";

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/example" element={<ExamplePage />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
