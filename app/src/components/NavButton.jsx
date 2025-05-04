import { useLocation, useNavigate } from "react-router-dom";
import Button from "./Button";
import styles from "./NavButton.module.css";

const NavButton = ({ dest, ...props }) => {

    const location = useLocation();
    const navigate = useNavigate();
    
    const isSelected = location.pathname === dest;

    return <Button className={isSelected ? styles["active-nav-button"] : styles["nav-button"]} onClick={() => navigate(dest)} {...props}/>;
};

export default NavButton;