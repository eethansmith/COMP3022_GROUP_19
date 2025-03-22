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

#### Plan for Question 1 currently
Ethan to go away, finalise plan and sort pre-processing to get to this stage with data.
<img width="523" alt="Screenshot 2025-03-21 at 14 18 44" src="https://github.com/user-attachments/assets/e8814565-799d-40fc-9329-6254f6e71a6c" />

Updated plan for Q1
<img width="665" alt="Screenshot 2025-03-22 at 15 03 33" src="https://github.com/user-attachments/assets/c1bd60f3-5340-4ffe-899d-0b8d89ebebf2" />


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

# Fianl Deliverables

### Written report (80%)
The final deliverable is an implementation of the proposed solution (code repositories) and a report with maximum 3,000 words (not including the visualisations). There is no limit on the number of images included in the report. 

The report should cover:
Methods/Design: 1) A detailed explanation of the techniques and algorithms you used to solve the problem (including data pre-processing), and 2) the rationale behind the visualisation and system interface design (storyboard, etc.).
Tool/Implementation: 1) A detailed description of all the visualisations (such as different charts included in the tool) and interactive features with screenshots, and 2) A detailed explanations on how you implement the visualisation (must include the details of all the libraries used).  
Results: detailed description of your visualisations and the answers to the three analysis tasks listed above.
Reflection/Future Work: 1) A reflection on the project, what went well and what did, covering both the technical (such as the charts used and their implementations) and non-technical aspect (such as project management), and 2) what is still missing/can be improved and how these could be added/further enhanced. 
Appendix: an optional appendix should include all the information needed to run the tool, such as what external libraries are need and any configurations.

Marking Criteria
#### Methods/Design (30%)

The effectiveness and sophistication of the data pre-processing and analysis algorithms.
The justification of the visualisation and interaction design based on data characteristics and analysis task.


#### Tool/Implementation (30%)

The sophistication and novelty of the design; new visual representations (first of its kind) and interactive dashboard are highly recommended.
The app architecture, implementation complexity, app robustness, and interaction responsiveness.


#### Results (10%)

How clear the answer is from the visualisation.
The accuracy of the answer.


#### Reflection/Future Work (10%)

The reflection should be in depth and cover all the aspects of the project.
The future work should cover all the weaknesses of the current app(s), both visual design and implementation, and the proposed solution should be effective and novel.

### Presentation (20%)
You will also need to record a presentation of your work of about 10 minutes, which should cover all the main aspects of the report (the first four bullet points above). Provide clear reference to the report where it is not possible to include all the details in the presentation.

Presentation submission:
A copy of the presentation slides.
A video of the visualisation app demonstration: maximum 10 minutes, in the mp4 format, no more than 250 MB


## Examples
[example 1](https://visualdata.wustl.edu/varepository/VAST%20Challenge%202019/challenges/Mini-Challenge%201/entries/Institute%20for%20the%20Promotion%20of%20Teaching%20Science%20and%20Technology/)
[example 2](https://idatavisualizationlab.github.io/N/VAST19/mc1/TTU-Vuong-MC1/index.htm)

Assumptions
- Every category is a facility i.e. medical = medical factilities rather than damage that require medical support
- Multiple types of emergency response teams , i.e. Rescue Teams - Buildings , Medical Teams - Buildings & Medical , Utility Companies - Sewage & Power, Traffic Control - Roads & Bridges.


Question to Ask

- What kind of transport is the response travelling in (by air , by land)
- Does medical mean medical facilities 
