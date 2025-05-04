import styles from "./Header.module.css";
import HomeButton from "./HomeButton";
import NavButton from "./NavButton";

const Header = () => {

    return (
        <div className={styles["header"]}>
            <HomeButton />
            <NavButton dest={"/Q1"}>Question 1</NavButton>
            <NavButton dest={"/Q2"}>Question 2</NavButton>
            <NavButton dest={"/Q3"}>Question 3</NavButton>
        </div>
    );

};

export default Header;