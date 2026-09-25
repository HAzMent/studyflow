
(function(){

let sf14Initialized = false;

let selectedCourse = "";

let selectedCourseTab =
"overview";


/* =========================================================
   SAFE HELPERS
========================================================= */

function sf14User(){

try{

return (
typeof currentUser !==
"undefined"
)
? currentUser
: null;

}catch{

return null;

}

}


function sf14Tasks(){

try{

return (
typeof tasks !==
"undefined"
&& Array.isArray(tasks)
)
? tasks
: [];

}catch{

return [];

}

}


function sf14Classes(){

try{

return (
typeof classes !==
"undefined"
&& Array.isArray(classes)
)
? classes
: [];

}catch{

return [];

}

}


function sf14Grades(){

try{

return (
typeof grades !==
"undefined"
&& Array.isArray(grades)
)
? grades
: [];

}catch{

return [];

}

}


function sf14Notes(){

try{

return (
typeof notes !==
"undefined"
&& Array.isArray(notes)
)
? notes
: [];

}catch{

return [];

}

}


function sf14Escape(value){

return String(value ?? "")
.replaceAll("&","&amp;")
.replaceAll("<","&lt;")
.replaceAll(">","&gt;")
.replaceAll('"',"&quot;")
.replaceAll("'","&#039;");

}


function sf14Key(name){

try{

if(
typeof key ===
"function"
){

return key(name);

}

}catch{}


const user =
sf14User();


return `studyflow_${
user?.id || "guest"
}_${name}`;

}


function sf14DateKey(date){

const y =
date.getFullYear();

const m =
String(
date.getMonth() + 1
)
.padStart(
2,
"0"
);

const d =
String(
date.getDate()
)
.padStart(
2,
"0"
);

return `${y}-${m}-${d}`;

}


function sf14Today(){

return sf14DateKey(
new Date()
);

}


function sf14FirstName(){

const user =
sf14User();


if(
user?.name
){

return user
.name
.trim()
.split(/\s+/)[0];

}


return "Student";

}


function sf14Greeting(){

const hour =
new Date()
.getHours();


if(hour < 12){

return "Good morning";

}


if(hour < 18){

return "Good afternoon";

}


return "Good evening";

}


function sf14Priority(task){

if(task.priority === "High"){

return "High";

}


if(task.priority === "Low"){

return "Low";

}


return "Medium";

}


function sf14OpenTasks(){

return sf14Tasks()
.filter(
task =>
task.status !==
"done"
);

}


function sf14CourseTasks(
course
){

return sf14Tasks()
.filter(
task =>
task.course ===
course
);

}


function sf14CourseGrades(
course
){

return sf14Grades()
.filter(
grade =>
grade.course ===
course
);

}


function sf14CourseNotes(
course
){

return sf14Notes()
.filter(
note =>
note.course ===
course
);

}


function sf14GradePercent(
course
){

const list =
sf14CourseGrades(
course
);


let earned = 0;
let possible = 0;


list.forEach(
grade => {

earned +=
Number(
grade.earned
) || 0;


possible +=
Number(
grade.possible
) || 0;

}
);


if(possible <= 0){

return null;

}


return earned /
possible *
100;

}


function sf14CourseNameList(){

const names =
sf14Classes()
.map(
course =>
course.name
)
.filter(Boolean);


sf14Tasks()
.forEach(
task => {

if(
task.course
&&
!names.includes(
task.course
)
){

names.push(
task.course
);

}

}
);


return [
...new Set(names)
];

}


function sf14NextDeadline(
course
){

const today =
sf14Today();


const upcoming =
sf14CourseTasks(
course
)
.filter(
task =>
task.status !== "done"
&&
task.date
&&
task.date >= today
)
.sort(
(a,b) =>
a.date.localeCompare(
b.date
)
);


return upcoming[0] || null;

}


/* =========================================================
   API
========================================================= */

async function sf14Api(
path,
options = {}
){

try{

if(
typeof api ===
"function"
){

return await api(
path,
options
);

}

}catch{}


const response =
await fetch(
path,
{
...options,
headers:{
"Content-Type":
"application/json",
...(options.headers || {})
}
}
);


const data =
await response.json();


if(!response.ok){

throw new Error(
data.error ||
"Request failed."
);

}


return data;

}


/* =========================================================
   CREATE PAGES
========================================================= */

function sf14CreateToday(){

if(
document.getElementById(
"todayPro"
)
){

return;

}


const main =
document.querySelector(
"main"
);


if(!main){

return;

}


const page =
document.createElement(
"section"
);


page.id =
"todayPro";


page.className =
"page sf14-page hidden";


page.innerHTML = `

<div class="sf14-head">

<div>

<p class="eyebrow">
YOUR DAY
</p>

<h1>
Today
</h1>

<p class="sf14-subtitle">
Your deadlines, priorities and study plan in one place.
</p>

</div>

<div class="sf14-actions">

<button
type="button"
id="sf14OpenTasks"
>
+ Add Task
</button>

<button
type="button"
class="secondary"
id="sf14TodayCalendar"
>
Calendar
</button>

</div>

</div>


<div class="sf14-today-hero">

<div>

<div
class="sf14-date"
id="sf14Date"
></div>

<div class="sf14-greeting">

<span id="sf14Greeting"></span>,
<span id="sf14FirstName"></span>.

</div>

<p class="sf14-hero-text">
StudyFlow looks at your deadlines and workload so you can focus on what matters most.
</p>

<div class="sf14-hero-buttons">

<button
type="button"
id="sf14PlanAI"
>
✦ Plan my day with AI
</button>

<button
type="button"
class="secondary"
id="sf14CourseHubButton"
>
Open Course Hub
</button>

</div>

</div>


<div class="sf14-today-stats">

<div class="sf14-today-stat">

<strong id="sf14DueToday">
0
</strong>

<span>
Due today
</span>

</div>


<div class="sf14-today-stat">

<strong id="sf14DueSoon">
0
</strong>

<span>
Due this week
</span>

</div>


<div class="sf14-today-stat">

<strong id="sf14OpenTasksCount">
0
</strong>

<span>
Open tasks
</span>

</div>


<div class="sf14-today-stat">

<strong id="sf14HighPriority">
0
</strong>

<span>
High priority
</span>

</div>

</div>

</div>


<div class="sf14-today-grid">

<div>

<div class="sf14-card">

<div class="sf14-card-head">

<h2>
Priority Queue
</h2>

<span>
Next up
</span>

</div>

<div
id="sf14PriorityQueue"
class="sf14-task-list"
></div>

</div>


<div
class="sf14-card"
style="margin-top:14px"
>

<div class="sf14-card-head">

<h2>
7-Day Workload
</h2>

<span>
Assignments due
</span>

</div>

<div
id="sf14WeekLoad"
class="sf14-week"
></div>

</div>

</div>


<div class="sf14-card">

<div class="sf14-card-head">

<h2>
Smart Study Plan
</h2>

<span>
Suggested schedule
</span>

</div>

<div
id="sf14LocalPlan"
class="sf14-plan"
></div>


<div
id="sf14AIPlanBox"
class="sf14-ai-plan hidden"
>

<div class="sf14-ai-plan-label">
STUDYFLOW AI PLAN
</div>

<div
id="sf14AIPlanOutput"
class="sf14-ai-plan-output"
></div>

</div>

</div>

</div>

`;


main.appendChild(
page
);

}


function sf14CreateCourseHub(){

if(
document.getElementById(
"courseHub"
)
){

return;

}


const main =
document.querySelector(
"main"
);


if(!main){

return;

}


const page =
document.createElement(
"section"
);


page.id =
"courseHub";


page.className =
"page sf14-page hidden";


page.innerHTML = `

<div class="sf14-head">

<div>

<p class="eyebrow">
COURSE WORKSPACE
</p>

<h1>
Course Hub
</h1>

<p class="sf14-subtitle">
Every task, grade, note and study tool for each course.
</p>

</div>

<div class="sf14-actions">

<button
type="button"
id="sf14CourseTasksButton"
>
Tasks Pro
</button>

<button
type="button"
class="secondary"
id="sf14CourseCalendarButton"
>
Calendar
</button>

</div>

</div>


<div class="sf14-course-layout">


<div class="sf14-course-sidebar">

<input
id="sf14CourseSearch"
class="sf14-course-search"
placeholder="Search courses..."
>

<div
id="sf14CourseList"
class="sf14-course-list"
></div>

</div>


<div
id="sf14CourseMain"
class="sf14-course-main"
></div>


</div>

`;


main.appendChild(
page
);

}


/* =========================================================
   NAVIGATION
========================================================= */

function sf14Go(
pageId
){

document
.querySelectorAll(
".page"
)
.forEach(
page =>
page.classList
.add(
"hidden"
)
);


document
.getElementById(
pageId
)
?.classList
.remove(
"hidden"
);


document
.querySelectorAll(
".nav"
)
.forEach(
button => {

button.classList
.toggle(
"active",
button.dataset.page ===
pageId
);

}
);


if(
pageId === "todayPro"
){

sf14RenderToday();

}


if(
pageId === "courseHub"
){

sf14RenderCourseHub();

}

}


function sf14AddNav(){

const sidebar =
document.querySelector(
"aside"
);


if(!sidebar){

return;

}


if(
!sidebar.querySelector(
'[data-page="todayPro"]'
)
){

const button =
document.createElement(
"button"
);


button.className =
"nav sf14-nav";


button.dataset.page =
"todayPro";


button.innerHTML =
`☀️ Today <span class="sf14-new">NEW</span>`;


button.onclick =
event => {

event.preventDefault();

event.stopPropagation();

sf14Go(
"todayPro"
);

};


const dashboard =
sidebar.querySelector(
'[data-page="dashboard"]'
);


if(dashboard){

dashboard.insertAdjacentElement(
"afterend",
button
);

}else{

sidebar.prepend(
button
);

}

}


if(
!sidebar.querySelector(
'[data-page="courseHub"]'
)
){

const button =
document.createElement(
"button"
);


button.className =
"nav sf14-nav";


button.dataset.page =
"courseHub";


button.innerHTML =
`🎓 Course Hub <span class="sf14-new">NEW</span>`;


button.onclick =
event => {

event.preventDefault();

event.stopPropagation();

sf14Go(
"courseHub"
);

};


const classesButton =
sidebar.querySelector(
'[data-page="classes"]'
);


if(classesButton){

classesButton.insertAdjacentElement(
"afterend",
button
);

}else{

sidebar.appendChild(
button
);

}

}

}


/* =========================================================
   TODAY
========================================================= */

function sf14RenderToday(){

const today =
new Date();


const todayKey =
sf14DateKey(
today
);


const open =
sf14OpenTasks();


const dueToday =
open.filter(
task =>
task.date ===
todayKey
);


const weekEnd =
new Date(today);


weekEnd.setDate(
today.getDate() + 7
);


const weekKey =
sf14DateKey(
weekEnd
);


const dueSoon =
open.filter(
task =>
task.date
&&
task.date >= todayKey
&&
task.date <= weekKey
);


const high =
open.filter(
task =>
sf14Priority(task) ===
"High"
);


document
.getElementById(
"sf14Date"
).textContent =
today.toLocaleDateString(
undefined,
{
weekday:"long",
month:"long",
day:"numeric"
}
)
.toUpperCase();


document
.getElementById(
"sf14Greeting"
).textContent =
sf14Greeting();


document
.getElementById(
"sf14FirstName"
).textContent =
sf14FirstName();


document
.getElementById(
"sf14DueToday"
).textContent =
dueToday.length;


document
.getElementById(
"sf14DueSoon"
).textContent =
dueSoon.length;


document
.getElementById(
"sf14OpenTasksCount"
).textContent =
open.length;


document
.getElementById(
"sf14HighPriority"
).textContent =
high.length;


sf14RenderPriorityQueue();

sf14RenderLocalPlan();

sf14RenderWeek();

}


function sf14PriorityScore(
task
){

let score = 0;


if(
sf14Priority(task) ===
"High"
){

score += 100;

}


if(
sf14Priority(task) ===
"Medium"
){

score += 50;

}


if(task.date){

const now =
new Date(
sf14Today() +
"T00:00:00"
);


const date =
new Date(
task.date +
"T00:00:00"
);


const days =
Math.round(
(date - now) /
86400000
);


if(days <= 0){

score += 100;

}else if(days <= 2){

score += 70;

}else if(days <= 7){

score += 30;

}

}


return score;

}


function sf14SortedOpen(){

return [
...sf14OpenTasks()
]
.sort(
(a,b) =>
sf14PriorityScore(b) -
sf14PriorityScore(a)
);

}


function sf14RenderPriorityQueue(){

const container =
document.getElementById(
"sf14PriorityQueue"
);


if(!container){

return;

}


const list =
sf14SortedOpen()
.slice(
0,
6
);


if(!list.length){

container.innerHTML = `

<div class="sf14-empty">
🎉 Nothing urgent right now.
</div>

`;

return;

}


container.innerHTML =
list
.map(
task => `

<div
class="sf14-task-row"
data-task-id="${sf14Escape(task.id)}"
>

<span
class="sf14-task-priority ${sf14Priority(task)}"
></span>

<div>

<strong>
${sf14Escape(task.name || "Untitled")}
</strong>

<small>
${sf14Escape(task.course || "No class")}
</small>

</div>

<time>
${task.date
? sf14Escape(task.date)
: "No date"}
</time>

</div>

`
)
.join("");


container
.querySelectorAll(
".sf14-task-row"
)
.forEach(
row => {

row.onclick =
() => {

const id =
row.dataset.taskId;


if(
typeof tfOpenDrawer ===
"function"
){

tfOpenDrawer(id);

}else{

sf14Go(
document.getElementById(
"tasksPro"
)
? "tasksPro"
: "tasks"
);

}

};

}
);

}


function sf14RenderLocalPlan(){

const container =
document.getElementById(
"sf14LocalPlan"
);


if(!container){

return;

}


const list =
sf14SortedOpen()
.slice(
0,
4
);


if(!list.length){

container.innerHTML = `

<div class="sf14-empty">
No study blocks needed yet.
</div>

`;

return;

}


const slots = [
"4:00 PM",
"5:00 PM",
"6:15 PM",
"7:30 PM"
];


container.innerHTML =
list
.map(
(task,index) => `

<div class="sf14-plan-block">

<div class="sf14-plan-time">
${slots[index]}
</div>

<div>

<strong>
${sf14Escape(task.name)}
</strong>

<small>
${sf14Escape(task.course || "Study session")}
 ·
 ${sf14Priority(task)} priority
</small>

</div>

</div>

`
)
.join("");

}


function sf14RenderWeek(){

const container =
document.getElementById(
"sf14WeekLoad"
);


if(!container){

return;

}


const today =
new Date();


const html = [];


for(
let i = 0;
i < 7;
i++
){

const date =
new Date(today);


date.setDate(
today.getDate() + i
);


const dateKey =
sf14DateKey(date);


const count =
sf14OpenTasks()
.filter(
task =>
task.date ===
dateKey
)
.length;


html.push(`

<div
class="sf14-week-day ${
i === 0
? "today"
: ""
}"
>

<strong>
${date
.toLocaleDateString(
undefined,
{
weekday:"short"
}
)
.toUpperCase()}
</strong>

<span>
${count}
</span>

<small>
${date.getDate()}
</small>

</div>

`);

}


container.innerHTML =
html.join("");

}


/* =========================================================
   AI DAILY PLAN
========================================================= */

async function sf14PlanWithAI(){

const button =
document.getElementById(
"sf14PlanAI"
);


const box =
document.getElementById(
"sf14AIPlanBox"
);


const output =
document.getElementById(
"sf14AIPlanOutput"
);


button.disabled =
true;


button.textContent =
"✦ Planning...";


box.classList
.remove(
"hidden"
);


output.textContent =
"StudyFlow AI is building your plan...";


const relevant =
sf14SortedOpen()
.slice(
0,
10
)
.map(
task => ({
task:
task.name,
course:
task.course || "",
due:
task.date || "",
priority:
sf14Priority(task)
})
);


const prompt = `
Create a concise study plan for today for a college student.

Today is ${new Date().toLocaleDateString()}.

Open tasks:
${JSON.stringify(relevant,null,2)}

Rules:
- Prioritize urgent and high-priority work.
- Give realistic study blocks.
- Include short breaks.
- Do not schedule more than about 4 hours unless necessary.
- Keep the answer concise.
- Use times and short task names.
`;


try{

const data =
await sf14Api(
"/api/ai",
{
method:"POST",
body:
JSON.stringify({
message:
prompt
})
}
);


output.textContent =
data.answer ||
"Your plan is ready.";


}catch(error){

output.textContent =
`AI planning is unavailable right now.

Use the suggested schedule above:
1. Start with the highest-priority deadline.
2. Work for 45–50 minutes.
3. Take a 10-minute break.
4. Continue with the next urgent course.`;

}


button.disabled =
false;


button.textContent =
"✦ Plan my day with AI";

}


/* =========================================================
   COURSE HUB LIST
========================================================= */

function sf14RenderCourseList(
search = ""
){

const container =
document.getElementById(
"sf14CourseList"
);


if(!container){

return;

}


const courses =
sf14CourseNameList()
.filter(
name =>
!search
||
name
.toLowerCase()
.includes(
search
.toLowerCase()
)
);


if(
!selectedCourse
&&
courses.length
){

selectedCourse =
courses[0];

}


if(!courses.length){

container.innerHTML = `

<div class="sf14-empty">
No courses yet.
</div>

`;

return;

}


container.innerHTML =
courses
.map(
name => {

const original =
sf14Classes()
.find(
course =>
course.name ===
name
);


return `

<button
type="button"
class="sf14-course-item ${
selectedCourse === name
? "active"
: ""
}"
data-course="${sf14Escape(name)}"
>

<span class="sf14-course-icon">
📚
</span>

<span style="min-width:0">

<strong>
${sf14Escape(name)}
</strong>

<small>
${sf14Escape(
original?.professor ||
"Course workspace"
)}
</small>

</span>

</button>

`;

}
)
.join("");


container
.querySelectorAll(
".sf14-course-item"
)
.forEach(
button => {

button.onclick =
() => {

selectedCourse =
button.dataset.course;


localStorage.setItem(
sf14Key(
"selectedCourseHub"
),
selectedCourse
);


selectedCourseTab =
"overview";


sf14RenderCourseHub();

};

}
);

}


/* =========================================================
   COURSE HUB
========================================================= */

function sf14RenderCourseHub(){

const courseNames =
sf14CourseNameList();


if(!courseNames.length){

const main =
document.getElementById(
"sf14CourseMain"
);


if(main){

main.innerHTML = `

<div class="sf14-card">

<div class="sf14-empty">

📚 You don't have any classes yet.

<br><br>

Add a class first to build your Course Hub.

</div>

</div>

`;

}


sf14RenderCourseList();

return;

}


if(
!selectedCourse
||
!courseNames.includes(
selectedCourse
)
){

const saved =
localStorage.getItem(
sf14Key(
"selectedCourseHub"
)
);


selectedCourse =
courseNames.includes(
saved
)
? saved
: courseNames[0];

}


sf14RenderCourseList(
document
.getElementById(
"sf14CourseSearch"
)
?.value || ""
);


sf14RenderCourseMain();

}


function sf14RenderCourseMain(){

const container =
document.getElementById(
"sf14CourseMain"
);


if(!container){

return;

}


const course =
sf14Classes()
.find(
item =>
item.name ===
selectedCourse
);


const tasksForCourse =
sf14CourseTasks(
selectedCourse
);


const openTasks =
tasksForCourse
.filter(
task =>
task.status !==
"done"
);


const notesForCourse =
sf14CourseNotes(
selectedCourse
);


const grade =
sf14GradePercent(
selectedCourse
);


const next =
sf14NextDeadline(
selectedCourse
);


container.innerHTML = `

<div class="sf14-course-hero">

<div class="sf14-course-code">
COURSE HUB
</div>

<h2>
${sf14Escape(selectedCourse)}
</h2>

<div class="sf14-course-prof">

${course?.professor
? `Professor ${sf14Escape(course.professor)}`
: "Your course workspace"}

${course?.room
? ` · ${sf14Escape(course.room)}`
: ""}

</div>


<div class="sf14-course-stats">

<div class="sf14-course-stat">

<strong>
${grade === null
? "—"
: Math.round(grade) + "%"}
</strong>

<span>
Current grade
</span>

</div>


<div class="sf14-course-stat">

<strong>
${openTasks.length}
</strong>

<span>
Open tasks
</span>

</div>


<div class="sf14-course-stat">

<strong>
${notesForCourse.length}
</strong>

<span>
Notes
</span>

</div>


<div class="sf14-course-stat">

<strong>
${next?.date
? sf14Escape(
next.date.slice(5)
)
: "—"}
</strong>

<span>
Next deadline
</span>

</div>

</div>

</div>


<div class="sf14-tabs">

${[
["overview","Overview"],
["tasks","Tasks"],
["grades","Grades"],
["notes","Notes"],
["study","✦ Study AI"]
]
.map(
([id,label]) => `

<button
type="button"
class="sf14-tab ${
selectedCourseTab === id
? "active"
: ""
}"
data-tab="${id}"
>
${label}
</button>

`
)
.join("")}

</div>


<div
id="sf14CourseTabContent"
class="sf14-tab-content"
></div>

`;


container
.querySelectorAll(
".sf14-tab"
)
.forEach(
button => {

button.onclick =
() => {

selectedCourseTab =
button.dataset.tab;


sf14RenderCourseMain();

};

}
);


sf14RenderCourseTab();

}


function sf14RenderCourseTab(){

const container =
document.getElementById(
"sf14CourseTabContent"
);


if(!container){

return;

}


if(
selectedCourseTab ===
"overview"
){

sf14CourseOverview(
container
);

return;

}


if(
selectedCourseTab ===
"tasks"
){

sf14CourseTasksTab(
container
);

return;

}


if(
selectedCourseTab ===
"grades"
){

sf14CourseGradesTab(
container
);

return;

}


if(
selectedCourseTab ===
"notes"
){

sf14CourseNotesTab(
container
);

return;

}


sf14CourseAITab(
container
);

}


/* =========================================================
   COURSE OVERVIEW TAB
========================================================= */

function sf14CourseOverview(
container
){

const tasksForCourse =
sf14CourseTasks(
selectedCourse
);


const upcoming =
tasksForCourse
.filter(
task =>
task.status !== "done"
)
.sort(
(a,b) =>
String(
a.date || "9999"
)
.localeCompare(
String(
b.date || "9999"
)
)
)
.slice(
0,
5
);


const notesForCourse =
sf14CourseNotes(
selectedCourse
)
.slice(
0,
4
);


container.innerHTML = `

<div class="sf14-overview-grid">


<div class="sf14-mini-card">

<h3>
Upcoming
</h3>

${upcoming.length
? upcoming
.map(
task => `

<div class="sf14-course-task">

<strong>
${sf14Escape(task.name)}
</strong>

<span>
${task.date
? sf14Escape(task.date)
: "No date"}
</span>

</div>

`
)
.join("")
: `
<div class="sf14-empty">
No upcoming tasks.
</div>
`}

</div>


<div class="sf14-mini-card">

<h3>
Recent Notes
</h3>

${notesForCourse.length
? notesForCourse
.map(
note => `

<div class="sf14-note">

<strong>
${sf14Escape(
note.title ||
"Untitled note"
)}
</strong>

<p>
${sf14Escape(
String(
note.text || ""
)
.slice(
0,
130
)
)}
</p>

</div>

`
)
.join("")
: `
<div class="sf14-empty">
No course notes yet.
</div>
`}

</div>


</div>

`;

}


/* =========================================================
   COURSE TASK TAB
========================================================= */

function sf14CourseTasksTab(
container
){

const list =
sf14CourseTasks(
selectedCourse
)
.sort(
(a,b) =>
String(
a.date || "9999"
)
.localeCompare(
String(
b.date || "9999"
)
)
);


container.innerHTML = `

<div class="sf14-card">

<div class="sf14-card-head">

<h2>
${sf14Escape(selectedCourse)} Tasks
</h2>

<button
type="button"
id="sf14GoTasksPro"
class="secondary"
>
Open Tasks Pro
</button>

</div>


<div class="sf14-task-list">

${list.length
? list
.map(
task => `

<div class="sf14-task-row">

<span
class="sf14-task-priority ${sf14Priority(task)}"
></span>

<div>

<strong>
${sf14Escape(task.name)}
</strong>

<small>
${sf14Escape(task.status || "todo")}
</small>

</div>

<time>
${task.date
? sf14Escape(task.date)
: "No date"}
</time>

</div>

`
)
.join("")
: `
<div class="sf14-empty">
No tasks for this course.
</div>
`}

</div>

</div>

`;


document
.getElementById(
"sf14GoTasksPro"
)
.onclick =
() =>
sf14Go(
document.getElementById(
"tasksPro"
)
? "tasksPro"
: "tasks"
);

}


/* =========================================================
   COURSE GRADES TAB
========================================================= */

function sf14CourseGradesTab(
container
){

const list =
sf14CourseGrades(
selectedCourse
);


container.innerHTML = `

<div class="sf14-card">

<div class="sf14-card-head">

<h2>
Gradebook
</h2>

<button
type="button"
id="sf14GoGrades"
class="secondary"
>
Full Grades
</button>

</div>


${list.length
? list
.map(
grade => {

const earned =
Number(
grade.earned
) || 0;


const possible =
Number(
grade.possible
) || 0;


const percent =
possible > 0
? earned /
possible *
100
: 0;


return `

<div class="sf14-grade-row">

<strong>
${sf14Escape(
grade.assignment ||
"Assignment"
)}
</strong>

<span>
${earned}/${possible}
</span>

<span class="sf14-grade-percent">
${Math.round(percent)}%
</span>

</div>

`;

}
)
.join("")
: `
<div class="sf14-empty">
No grades recorded yet.
</div>
`}

</div>

`;


document
.getElementById(
"sf14GoGrades"
)
.onclick =
() =>
sf14Go(
"grades"
);

}


/* =========================================================
   COURSE NOTES TAB
========================================================= */

function sf14CourseNotesTab(
container
){

const list =
sf14CourseNotes(
selectedCourse
);


container.innerHTML = `

<div class="sf14-card">

<div class="sf14-card-head">

<h2>
Course Notes
</h2>

<button
type="button"
id="sf14GoNotes"
class="secondary"
>
Open Notes
</button>

</div>


${list.length
? list
.map(
note => `

<div class="sf14-note">

<strong>
${sf14Escape(
note.title ||
"Untitled Note"
)}
</strong>

<p>
${sf14Escape(
note.text ||
""
)}
</p>

</div>

`
)
.join("")
: `
<div class="sf14-empty">
No notes for this course yet.
</div>
`}

</div>

`;


document
.getElementById(
"sf14GoNotes"
)
.onclick =
() =>
sf14Go(
"notes"
);

}


/* =========================================================
   COURSE AI TAB
========================================================= */

function sf14CourseAITab(
container
){

container.innerHTML = `

<div class="sf14-course-ai">

<p class="eyebrow">
COURSE ASSISTANT
</p>

<h2 style="margin-top:5px">
Ask about ${sf14Escape(selectedCourse)}
</h2>

<p class="sf14-subtitle">

StudyFlow will use your course name,
upcoming tasks and grade context when answering.

</p>

<textarea
id="sf14CourseAIInput"
placeholder="Explain a concept, make a study plan, quiz me, help me prepare for the next exam..."
></textarea>

<button
type="button"
id="sf14CourseAIButton"
>
✦ Ask Course AI
</button>


<div
id="sf14CourseAIOutput"
class="sf14-course-ai-output hidden"
></div>

</div>

`;


document
.getElementById(
"sf14CourseAIButton"
)
.onclick =
sf14AskCourseAI;

}


async function sf14AskCourseAI(){

const input =
document.getElementById(
"sf14CourseAIInput"
);


const button =
document.getElementById(
"sf14CourseAIButton"
);


const output =
document.getElementById(
"sf14CourseAIOutput"
);


const question =
input.value
.trim();


if(!question){

input.focus();

return;

}


const tasksForCourse =
sf14CourseTasks(
selectedCourse
)
.filter(
task =>
task.status !== "done"
)
.slice(
0,
8
);


const grade =
sf14GradePercent(
selectedCourse
);


const prompt = `
You are the StudyFlow course assistant.

Course: ${selectedCourse}
Current grade: ${grade === null ? "unknown" : Math.round(grade) + "%"}
Upcoming tasks:
${JSON.stringify(tasksForCourse,null,2)}

Student question:
${question}

Help the student understand and study the material clearly.
Be concise but useful.
`;


button.disabled =
true;


button.textContent =
"✦ Thinking...";


output.classList
.remove(
"hidden"
);


output.textContent =
"StudyFlow AI is thinking...";


try{

const data =
await sf14Api(
"/api/ai",
{
method:"POST",
body:
JSON.stringify({
message:
prompt
})
}
);


output.textContent =
data.answer ||
"No response returned.";


}catch(error){

output.textContent =
`AI error: ${error.message}`;

}


button.disabled =
false;


button.textContent =
"✦ Ask Course AI";

}


/* =========================================================
   BINDINGS
========================================================= */

function sf14Bind(){

document
.getElementById(
"sf14PlanAI"
)
.onclick =
sf14PlanWithAI;


document
.getElementById(
"sf14OpenTasks"
)
.onclick =
() =>
sf14Go(
document.getElementById(
"tasksPro"
)
? "tasksPro"
: "tasks"
);


document
.getElementById(
"sf14TodayCalendar"
)
.onclick =
() =>
sf14Go(
document.getElementById(
"calendarPro"
)
? "calendarPro"
: "calendar"
);


document
.getElementById(
"sf14CourseHubButton"
)
.onclick =
() =>
sf14Go(
"courseHub"
);


document
.getElementById(
"sf14CourseTasksButton"
)
.onclick =
() =>
sf14Go(
document.getElementById(
"tasksPro"
)
? "tasksPro"
: "tasks"
);


document
.getElementById(
"sf14CourseCalendarButton"
)
.onclick =
() =>
sf14Go(
document.getElementById(
"calendarPro"
)
? "calendarPro"
: "calendar"
);


document
.getElementById(
"sf14CourseSearch"
)
.addEventListener(
"input",
event => {

sf14RenderCourseList(
event.target.value
);

}
);

}


/* =========================================================
   INIT
========================================================= */

function sf14Initialize(){

if(
sf14Initialized
||
!sf14User()
){

return;

}


sf14CreateToday();

sf14CreateCourseHub();

sf14AddNav();

sf14Bind();


const saved =
localStorage.getItem(
sf14Key(
"selectedCourseHub"
)
);


if(saved){

selectedCourse =
saved;

}


sf14RenderToday();

sf14RenderCourseHub();


sf14Initialized =
true;


console.log(
"✅ StudyFlow Today + Course Hub ready"
);

}


const timer =
setInterval(
() => {

if(
sf14User()
){

sf14Initialize();

}


if(
sf14Initialized
){

clearInterval(
timer
);

}

},
400
);

})();
