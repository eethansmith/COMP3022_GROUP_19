import { useNavigate } from "react-router-dom";
import styles from "./Dashboard.module.css";

const Dashboard = () => {

    const navigate = useNavigate(); // Hook for navigation

    return (
        <div className={styles["dashboard-container"]}>
            <h1 className={styles["dashboard-header"]}>Dashboard</h1>
            <button
                className={styles["navigate-button"]}
                onClick={() => navigate("/example")}
            >
                Go to Example Page
            </button>
            <button
                className={styles["navigate-button"]}
                onClick={() => navigate("/Q1")}
            >
                Question 1
            </button>
        </div>
    );
};

export default Dashboard;
