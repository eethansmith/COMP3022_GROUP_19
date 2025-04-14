import Tabular, { createTab } from "../../components/Tabular";

// Just testing if the tabs work
const Question1 = () => {

    const tabs = [
        createTab("Overview", <p>This is the overview tab.</p>),
        createTab("Details", <p>This is the details tab.</p>),
        createTab("MORE DETAILS", <p>This is the MORE details tab.</p>)
    ];

    return <Tabular tabs={tabs}></Tabular>
}

export default Question1;