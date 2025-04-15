
/**
 * Creates a ShakeMap displaying the provided field.
 * @param {*} field The attribute to display on the map (whatever column we want to display)
 * @param {*} selectedRegion The region in which the user has currently selected.
 * @param {*} setSelectedRegion The function which updates the selected region state
 * @param {*} props Any other HTML stuff
 */
const ShakeMap = ({ field, selectedRegion, setSelectedRegion, ...props }) => {

    // Keep this
    const handleSelectRegion = (region) => {
        setSelectedRegion(region);
    };

    // ALL OF THIS IS JUST PLACEHOLDER
    return (
        <div {...props} style={{display: "grid"}}>
            <h3>Displaying shake map for: {selectedRegion}</h3>
            <button onClick={() => handleSelectRegion('Region 1')}>Region 1</button>
            <button onClick={() => handleSelectRegion('Region 2')}>Region 2</button>
            <button onClick={() => handleSelectRegion('Region 3')}>Region 3</button>
        </div>
    );
};

export default ShakeMap;