import { useNavigate } from "react-router-dom";
import styles from "./ExamplePage.module.css";

const Dashboard = () => {

    const navigate = useNavigate();

    return (
        <div className={styles["header-container"]}>
            <h1 className={styles["header"]}>Hello World!</h1>
            <p className={styles["subheader"]}>This is an exmaple page.</p>
            <button
                className={styles["navigate-button"]}
                onClick={() => navigate("/")}
            >
                Back to Dashboard
            </button>
        </div>
    );
};

export default Dashboard;
