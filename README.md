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

Updated plan for Q1, Severity Timeline, graph for damage to buildings, map of severity to buildings, and radar charts for 19 locations, selected is enlarged.
<img width="523" alt="Screenshot 2025-03-22 at 15 03 33" src="https://github.com/user-attachments/assets/c1bd60f3-5340-4ffe-899d-0b8d89ebebf2" />


### Question 2
#### Use visual analytics to show uncertainty in the data. Compare the reliability of neighborhood reports. Which neighborhoods are providing reliable reports? Provide a rationale for your response.

Show uncertainity in data by colour coding the intensity of the hit.0 to 10 range 0,3 and4 to 7,8-10
have variation in colour based on duration and impact

A graph for data points being impact values for a certain hour-standard deviation being calculated from that mean to each data point.

#New edit 23/03/2025

#### Use visual analytics to show uncertainty in the data-Use colour coding:

<img width="497" alt="image" src="https://github.com/user-attachments/assets/7edde486-38b9-4c8e-bf9c-4e7cb36bc295" />

0.0–0.3=Blue Low uncertainty(very consistent reports)

0.3–0.6=Orange	Moderate uncertainty

0.6–1.0=Red	High uncertainty (reports are conflicting / sparse)

How is uncertainity score calculated:

1)Variability in citizen reports

2)Report count (sample size)

3)Missing or incomplete data

Data columns to be used for calculation.

1)location-To group data by neighborhood 

2)buildings	Main metric for damage severity

3)shake_intensity	Often missing → indicates data gaps

5)time	(Optional) Use for later time-based consistency

6)Report count	Derived: Number of entries per neighborhood


Metrics to be calculted:

report_count=Count of rows in each location group=Fewer reports → more uncertainty
std_dev_buildings=Standard deviation of buildings column per location =	High variability ->inconsistent reports
missing_shake_pct=% of rows in a location with shake_intensity as NaN =	More missing data  less reliable info


It needs to be normalised to be in a 0-1 scale

normalized_report_count = 1 - (count - min_count) / (max_count - min_count)

normalized_std_dev = (std_dev - min_std) / (max_std - min_std)

missing_shake_pct = num_missing / total_reports

Final Uncertainity Score:
uncertainty_score = (
    0.3 * normalized_report_count +
    0.5 * normalized_std_dev +
    0.2 * missing_shake_pct
)

We can decide on the weights and justify it.
0.0–0.3 → Low Uncertainty
0.3–0.6 → Medium
0.6–1.0 → High

#### Compare the reliability of neighborhood reports. Which neighborhoods are providing reliable reports?
For the reliability part of question:
reliability_score = 1 - uncertainty_score
If the map is clicked-say location 3 is clicked,it will have a pop up a dialogue box with reliability score.
On the side of the map,there could be a ranking of the neighbourhoods from most reliable to least reliable to provide comaprison(This could also be a bar chart if needed)

#### Provide a rationale for your response
We can explain how we decided on the formula and how the visualisation will help emergency responder know hwo reliable the data from a location is.


### Question 3
#### How do conditions change over time? How does uncertainty in change over time? Describe the key changes you see. 

Conditions changing over time-Scroll bar of time-so its easier for emergency responder to pause and check we have 3 days, 6 - 8th april, so new map representations for each day. (i.e. map 1 for april 6 with its own scroll bar, then can click to change the date to april 7 which shows a new map, and 1 map that summarises all data).

19 locations in dataset-refer to example 1-dpst 
Scroll bar to show how magnitude of earthquake changes based on time

# Change added 17/04/2025

Visualizing Uncertainty
Shading/Opacity: Lighter color = less reliable (fewer reports or high variance)

Confidence Intervals: On time-series charts to reflect uncertainty 

Tooltip Info: Hover to show data reliability metrics per neighborhood -> when you hover over an area, a graph will show up with uncertainty on the y axis and time on the x, displaying how uncertainty changes over time.

Scroll through time to observe changes in reported damage.
Overlay shake map intensity with report data.

City Time Series Graph

For each neighborhood:
X-axis = time (hourly)
Y-axis = average reported damage level
Confidence/uncertainty band = shows reliability of reports over time

Uncertainty Over Time

Show how report variance changes pre-quake, during quake and post quake.

![image](https://github.com/user-attachments/assets/a7ba156f-899e-46b5-a427-e849ddbb53cb)

![Screenshot 2025-05-04 at 13 35 32](https://github.com/user-attachments/assets/a9c8cd99-13fd-44d7-a0fc-86c9022cba20)


##Question 3 Visualisation Sketch

![image](https://github.com/user-attachments/assets/4df0064d-0b20-4c1c-b83b-bca184a9bf5e)


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
