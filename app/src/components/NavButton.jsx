import { useNavigate } from "react-router-dom";
import Button from "./Button";
import styles from "./NavButton.module.css";

const NavButton = ({ dest, ...props }) => {

    const navigate = useNavigate();

    return <Button className={styles["nav-button"]} onClick={() => navigate(dest)} {...props}/>;
};

export default NavButton;