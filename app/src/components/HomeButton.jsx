import NavButton from "./NavButton";
import styles from "./HomeButton.module.css";

const HomeButton = ({ ...props }) => {

    return <NavButton className={styles["home-button"]} dest={"/"} {...props}>Home</NavButton>

};

export default HomeButton;