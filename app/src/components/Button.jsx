import styles from "./Button.module.css";

const Button = ({ active, ...props }) => {

    return (
        <button className={styles["button"]} {...props}></button>
    )

};

export default Button;