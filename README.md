# COMP3022 Data Visualisation Project

#### Group 19:

- Abdul
- Ethan
- Jacob
- Nithya

# Installation & Running React

1. Clone the repository
```bash
$ git clone "https://github.com/JcbSm/COMP3022_GROUP_19.git" coursework 
$ cd coursework
```

2. You may need to install the **node.js** stuff.
```bash
$ cd app
$ npm install
```

3. Start the application. *(You must be in the `app` directory).*
```bash
$ npm start
```

You don't need to restart the application every time you make changes.

# Plan of Action

### Question 1
#### Emergency responders will base their initial response on the earthquake shake map. Use visual analytics to determine how their response should change based on damage reports from citizens on the ground. How would you prioritize neighborhoods for response? Which parts of the city are hardest hit?

Buildings-data heading used to check which location would take priority-(A big bar chart with x-axis location,y-axis:building (impact))

Priorities Visualisation based on 'buildings'
Bar Charts for Comparison - 'Building' Category first, then option to swap categories to other things for like medical, shake intensity etc. 


Use map for showing which area is hardest hit and colour code it to show severity
- If a user clicks on the area use the circular scale to show why it is at the current severity

  Can use button system to change category for different types of emergency response teams. i.e if the medical facilities are not damaged highly in one area it might not be necessary to be to send an emergency medical team to the area.

Multiple types of emergency response teams , i.e. Rescue Teams - Buildings , Medical Teams - Buildings & Medical , Utility Companies - Sewage & Power, Traffic Control - Roads & Bridges.
<img width="523" alt="Screenshot 2025-03-21 at 14 18 44" src="https://github.com/user-attachments/assets/e8814565-799d-40fc-9329-6254f6e71a6c" />


### Question 2
#### Use visual analytics to show uncertainty in the data. Compare the reliability of neighborhood reports. Which neighborhoods are providing reliable reports? Provide a rationale for your response.

Show uncertainity in data by colour coding the intensity of the hit.0 to 10 range 0,3 and4 to 7,8-10
have variation in colour based on duration and impact

A graph for data points being impact values for a certain hour-standard deviation being calculated from that mean to each data point.

### Question 3
#### How do conditions change over time? How does uncertainty in change over time? Describe the key changes you see. 

Conditions changing over time-Scroll bar of time-so its easier for emergency responder to pause and check

19locations in dataset-refer to example 1-dpst 
Scroll bar to show how magnitude of earthquake changes based on time


### Data summary 

## Examples
[example 1](https://visualdata.wustl.edu/varepository/VAST%20Challenge%202019/challenges/Mini-Challenge%201/entries/Institute%20for%20the%20Promotion%20of%20Teaching%20Science%20and%20Technology/)
[example 2](https://idatavisualizationlab.github.io/N/VAST19/mc1/TTU-Vuong-MC1/index.htm)

Assumptions
- Every category is a facility i.e. medical = medical factilities rather than damage that require medical support
- Multiple types of emergency response teams , i.e. Rescue Teams - Buildings , Medical Teams - Buildings & Medical , Utility Companies - Sewage & Power, Traffic Control - Roads & Bridges.


Question to Ask

- What kind of transport is the response travelling in (by air , by land)
- Does medical mean medical facilities 
