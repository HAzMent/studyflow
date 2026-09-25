
(function(){

let initialized = false;


/* =========================================================
   SAFE DATA ACCESS
========================================================= */

function getUser(){

try{

return (
typeof currentUser !== "undefined"
)
? currentUser
: null;

}catch{

return null;

}

}


function getTasks(){

try{

return (
typeof tasks !== "undefined"
&&
Array.isArray(tasks)
)
? tasks
: [];

}catch{

return [];

}

}


function getClasses(){

try{

return (
typeof classes !== "undefined"
&&
Array.isArray(classes)
)
? classes
: [];

}catch{

return [];

}

}


function getGrades(){

try{

return (
typeof grades !== "undefined"
&&
Array.isArray(grades)
)
? grades
: [];

}catch{

return [];

}

}


function sfKey(name){

try{

if(
typeof key === "function"
){

return key(name);

}

}catch{}


return `studyflow_${
getUser()?.id || "guest"
}_${name}`;

}


function getLocalArray(name){

try{

const parsed =
JSON.parse(
localStorage.getItem(
sfKey(name)
)
);


return Array.isArray(parsed)
? parsed
: [];

}catch{

return [];

}

}


function escapeHTML(value){

return String(value ?? "")
.replaceAll("&","&amp;")
.replaceAll("<","&lt;")
.replaceAll(">","&gt;")
.replaceAll('"',"&quot;")
.replaceAll("'","&#039;");

}


function firstName(){

const value =
getUser()?.name ||
getUser()?.email ||
"Student";


return String(value)
.split(/[ @]/)[0];

}


function dateKey(date){

const y =
date.getFullYear();

const m =
String(
date.getMonth() + 1
).padStart(
2,
"0"
);

const d =
String(
date.getDate()
).padStart(
2,
"0"
);


return `${y}-${m}-${d}`;

}


function todayKey(){

return dateKey(
new Date()
);

}


function dayIndex(){

const day =
new Date()
.getDay();


return day === 0
? 6
: day - 1;

}


function daysUntil(value){

if(!value){

return null;

}


const now =
new Date();

now.setHours(
0,0,0,0
);


const date =
new Date(
value +
"T00:00:00"
);


return Math.ceil(
(date - now) /
86400000
);

}


function priorityScore(task){

let score = 0;


if(
task.priority === "High"
){

score += 100;

}


if(
task.priority === "Medium"
){

score += 50;

}


if(task.date){

const days =
daysUntil(
task.date
);


if(days !== null){

if(days < 0){

score += 160;

}else if(days === 0){

score += 140;

}else if(days <= 2){

score += 100;

}else if(days <= 7){

score += 50;

}

}

}


return score;

}


function openTasks(){

return getTasks()
.filter(
task =>
task.status !==
"done"
);

}


/* =========================================================
   GRADE HELPERS
========================================================= */

function courseGrade(course){

const list =
getGrades()
.filter(
grade =>
grade.course ===
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


/* =========================================================
   EXAM HELPERS
========================================================= */

function exams(){

return getLocalArray(
"examMode"
)
.sort(
(a,b) =>
String(a.date || "9999")
.localeCompare(
String(b.date || "9999")
)
);

}


function nextExam(){

const today =
todayKey();


return exams()
.find(
exam =>
exam.date &&
exam.date >= today
)
||
null;

}


function examReadiness(exam){

if(!exam){

return 0;

}


const topics =
Array.isArray(
exam.topics
)
? exam.topics
: [];


let mastery = 0;


if(topics.length){

mastery =
topics.reduce(
(total,topic) =>
total +
(Number(topic.mastery) || 1),
0
) /
(topics.length * 5) *
100;

}


const scores =
(
Array.isArray(
exam.practiceScores
)
? exam.practiceScores
: []
)
.map(Number)
.filter(Number.isFinite);


if(!scores.length){

return Math.round(
mastery
);

}


const avg =
scores.reduce(
(a,b) =>
a + b,
0
) /
scores.length;


return Math.round(
mastery * .55 +
avg * .45
);

}


/* =========================================================
   SCHEDULE HELPERS
========================================================= */

function todaySchedule(){

const index =
dayIndex();


return getLocalArray(
"scheduleBlocks"
)
.filter(
block =>
Array.isArray(
block.days
)
&&
block.days.includes(
index
)
)
.sort(
(a,b) =>
String(a.start)
.localeCompare(
String(b.start)
)
);

}


function formatTime(value){

if(!value){

return "";

}


const parts =
value.split(":")
.map(Number);


const date =
new Date();

date.setHours(
parts[0] || 0,
parts[1] || 0,
0,
0
);


return date.toLocaleTimeString(
undefined,
{
hour:"numeric",
minute:"2-digit"
}
);

}


/* =========================================================
   CREATE PAGE
========================================================= */

function createPage(){

if(
document.getElementById(
"homePro"
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
"homePro";


page.className =
"page sf22-page hidden";


page.innerHTML = `

<div class="sf22-top">

<div>

<div
id="sf22Date"
class="sf22-date"
></div>

<h1>
<span id="sf22Greeting"></span>,
<span id="sf22Name"></span>
</h1>

<p class="sf22-sub">
Everything important in StudyFlow, in one place.
</p>

</div>


<div class="sf22-top-actions">

<button
type="button"
id="sf22Brief"
>
✦ AI Briefing
</button>

<button
type="button"
class="secondary"
id="sf22Search"
>
⌕ Search
</button>

</div>

</div>


<div class="sf22-hero">

<div>

<div class="sf22-hero-label">
TODAY'S FOCUS
</div>

<h2 id="sf22FocusTitle">
You're all caught up.
</h2>

<p id="sf22FocusText">
StudyFlow will surface your most important task here.
</p>

<div class="sf22-hero-actions">

<button
type="button"
id="sf22FocusButton"
>
Open priority
</button>

<button
type="button"
class="secondary"
id="sf22ScheduleButton"
>
View schedule
</button>

</div>

</div>


<div class="sf22-hero-right">

<div class="sf22-hero-stat">

<strong id="sf22DueToday">
0
</strong>

<span>
Due today
</span>

</div>


<div class="sf22-hero-stat">

<strong id="sf22DueWeek">
0
</strong>

<span>
Due in 7 days
</span>

</div>


<div class="sf22-hero-stat">

<strong id="sf22ExamDays">
—
</strong>

<span>
Days to next exam
</span>

</div>


<div class="sf22-hero-stat">

<strong id="sf22TodayBlocks">
0
</strong>

<span>
Today's blocks
</span>

</div>

</div>

</div>


<div
id="sf22AI"
class="sf22-ai"
>

<div class="sf22-ai-head">

<strong>
✦ StudyFlow Briefing
</strong>

<span>
Based on your current data
</span>

</div>

<div
id="sf22AIOutput"
class="sf22-ai-output"
></div>

</div>


<div class="sf22-grid">


<div class="sf22-stack">


<div class="sf22-card">

<div class="sf22-card-head">

<h3>
Priorities
</h3>

<button
type="button"
class="secondary"
id="sf22AllTasks"
>
All tasks
</button>

</div>

<div
id="sf22Priorities"
class="sf22-priority-list"
></div>

</div>


<div class="sf22-card">

<div class="sf22-card-head">

<h3>
Today's schedule
</h3>

<button
type="button"
class="secondary"
id="sf22FullSchedule"
>
Full schedule
</button>

</div>

<div
id="sf22Schedule"
class="sf22-schedule"
></div>

</div>


</div>


<div class="sf22-stack">


<div class="sf22-card">

<div class="sf22-card-head">

<h3>
Next exam
</h3>

<button
type="button"
class="secondary"
id="sf22ExamMode"
>
Exam Mode
</button>

</div>

<div id="sf22Exam"></div>

</div>


<div class="sf22-card">

<div class="sf22-card-head">

<h3>
Courses
</h3>

<button
type="button"
class="secondary"
id="sf22CourseHub"
>
Course Hub
</button>

</div>

<div
id="sf22Courses"
class="sf22-course-list"
></div>

</div>


<div class="sf22-card">

<div class="sf22-card-head">

<h3>
Quick actions
</h3>

</div>


<div class="sf22-quick">

<button
type="button"
data-page="tasksPro"
>
<span>✓</span>
<strong>New task</strong>
</button>

<button
type="button"
data-page="knowledgeBase"
>
<span>◉</span>
<strong>Study files</strong>
</button>

<button
type="button"
data-page="smartSchedule"
>
<span>◷</span>
<strong>Plan week</strong>
</button>

<button
type="button"
data-page="examMode"
>
<span>◎</span>
<strong>Prepare exam</strong>
</button>

</div>

</div>


</div>


</div>

`;


main.appendChild(
page
);

}


/* =========================================================
   NAV
========================================================= */

function addNav(){

const sidebar =
document.querySelector(
"aside"
);


if(
!sidebar ||
sidebar.querySelector(
'[data-page="homePro"]'
)
){

return;

}


const button =
document.createElement(
"button"
);


button.type =
"button";


button.className =
"nav sf22-nav";


button.dataset.page =
"homePro";


button.innerHTML = `

⌂ Home

<span class="sf22-new">
NEW
</span>

`;


button.onclick =
event => {

event.preventDefault();

event.stopPropagation();


openPage(
"homePro"
);

};


const search =
sidebar.querySelector(
".sf21-nav"
);


if(search){

search.insertAdjacentElement(
"afterend",
button
);

return;

}


const dashboard =
sidebar.querySelector(
'[data-page="dashboard"]'
);


if(dashboard){

dashboard.insertAdjacentElement(
"beforebegin",
button
);

}else{

sidebar.prepend(
button
);

}

}


/* =========================================================
   NAVIGATION
========================================================= */

function openPage(pageId){

const target =
document.getElementById(
pageId
);


if(!target){

return;

}


try{

if(
typeof showPage ===
"function"
&&
[
"dashboard",
"classes",
"tasks",
"calendar",
"grades",
"notes",
"ai",
"focus"
].includes(
pageId
)
){

showPage(
pageId
);

}else{

document
.querySelectorAll(
".page"
)
.forEach(
page =>
page.classList.add(
"hidden"
)
);


target.classList.remove(
"hidden"
);

}

}catch{

document
.querySelectorAll(
".page"
)
.forEach(
page =>
page.classList.add(
"hidden"
)
);


target.classList.remove(
"hidden"
);

}


document
.querySelectorAll(
".nav"
)
.forEach(
button => {

button.classList.toggle(
"active",
button.dataset.page ===
pageId
);

}
);


if(
pageId === "homePro"
){

render();

}

}


/* =========================================================
   RENDER HEADER
========================================================= */

function renderHeader(){

const now =
new Date();


document
.getElementById(
"sf22Date"
).textContent =
now.toLocaleDateString(
undefined,
{
weekday:"long",
month:"long",
day:"numeric"
}
);


const hour =
now.getHours();


document
.getElementById(
"sf22Greeting"
).textContent =
hour < 12
? "Good morning"
: hour < 18
? "Good afternoon"
: "Good evening";


document
.getElementById(
"sf22Name"
).textContent =
firstName();

}


/* =========================================================
   RENDER STATS / FOCUS
========================================================= */

function renderHero(){

const open =
openTasks();


const today =
todayKey();


const week =
new Date();

week.setDate(
week.getDate() + 7
);


const weekKey =
dateKey(
week
);


const dueToday =
open.filter(
task =>
task.date === today
);


const dueWeek =
open.filter(
task =>
task.date &&
task.date >= today &&
task.date <= weekKey
);


const sorted =
[
...open
]
.sort(
(a,b) =>
priorityScore(b) -
priorityScore(a)
);


const focus =
sorted[0];


document
.getElementById(
"sf22DueToday"
).textContent =
dueToday.length;


document
.getElementById(
"sf22DueWeek"
).textContent =
dueWeek.length;


const exam =
nextExam();


const examDays =
exam
? daysUntil(exam.date)
: null;


document
.getElementById(
"sf22ExamDays"
).textContent =
examDays === null
? "—"
: Math.max(
0,
examDays
);


document
.getElementById(
"sf22TodayBlocks"
).textContent =
todaySchedule().length;


const title =
document.getElementById(
"sf22FocusTitle"
);


const text =
document.getElementById(
"sf22FocusText"
);


const button =
document.getElementById(
"sf22FocusButton"
);


if(!focus){

title.textContent =
"You're all caught up.";


text.textContent =
"No open task is currently competing for your attention.";


button.textContent =
"Open Tasks";


button.onclick =
() =>
openPage(
document.getElementById(
"tasksPro"
)
? "tasksPro"
: "tasks"
);


return;

}


title.textContent =
focus.name ||
"Priority task";


let message =
focus.course
? `${focus.course}. `
: "";


if(focus.date){

const days =
daysUntil(
focus.date
);


if(days < 0){

message +=
`This task is overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}.`;

}else if(days === 0){

message +=
"Due today.";

}else if(days === 1){

message +=
"Due tomorrow.";

}else{

message +=
`Due in ${days} days.`;

}

}else{

message +=
"No deadline set.";

}


if(focus.priority){

message +=
` ${focus.priority} priority.`;

}


text.textContent =
message;


button.textContent =
"Open Tasks";


button.onclick =
() =>
openPage(
document.getElementById(
"tasksPro"
)
? "tasksPro"
: "tasks"
);

}


/* =========================================================
   PRIORITIES
========================================================= */

function renderPriorities(){

const container =
document.getElementById(
"sf22Priorities"
);


const list =
[
...openTasks()
]
.sort(
(a,b) =>
priorityScore(b) -
priorityScore(a)
)
.slice(
0,
6
);


if(!list.length){

container.innerHTML = `

<div class="sf22-empty">
No open tasks right now.
</div>

`;

return;

}


container.innerHTML =
list.map(
task => {

let dateText =
"No date";


if(task.date){

const days =
daysUntil(
task.date
);


dateText =
days < 0
? "Overdue"
: days === 0
? "Today"
: days === 1
? "Tomorrow"
: task.date;

}


return `

<div class="sf22-task">

<span
class="sf22-task-dot ${
task.priority === "High"
? "high"
: ""
}"
></span>

<div class="sf22-task-main">

<strong>
${escapeHTML(
task.name ||
"Untitled Task"
)}
</strong>

<small>
${escapeHTML(
task.course ||
task.priority ||
"Task"
)}
</small>

</div>

<span class="sf22-task-date">
${escapeHTML(dateText)}
</span>

</div>

`;

}
)
.join("");


container
.querySelectorAll(
".sf22-task"
)
.forEach(
element => {

element.onclick =
() =>
openPage(
document.getElementById(
"tasksPro"
)
? "tasksPro"
: "tasks"
);

}
);

}


/* =========================================================
   SCHEDULE
========================================================= */

function renderSchedule(){

const container =
document.getElementById(
"sf22Schedule"
);


const list =
todaySchedule()
.slice(
0,
7
);


if(!list.length){

container.innerHTML = `

<div class="sf22-empty">
Nothing scheduled today.
</div>

`;

return;

}


container.innerHTML =
list.map(
block => `

<div class="sf22-schedule-row">

<div class="sf22-schedule-time">

${escapeHTML(
formatTime(
block.start
)
)}

</div>

<div>

<strong>
${escapeHTML(
block.title ||
"Scheduled block"
)}
</strong>

<small>
${escapeHTML(
block.course ||
block.type ||
""
)}
</small>

</div>

</div>

`
)
.join("");

}


/* =========================================================
   EXAM
========================================================= */

function renderExam(){

const container =
document.getElementById(
"sf22Exam"
);


const exam =
nextExam();


if(!exam){

container.innerHTML = `

<div class="sf22-empty">
No upcoming exams have been added.
</div>

`;

return;

}


const days =
Math.max(
0,
daysUntil(
exam.date
) || 0
);


const readiness =
examReadiness(
exam
);


container.innerHTML = `

<div class="sf22-exam">

<div class="sf22-exam-top">

<div>

<div class="sf22-exam-course">
${escapeHTML(
exam.course ||
"Course"
)}
</div>

<h4>
${escapeHTML(
exam.name ||
"Exam"
)}
</h4>

</div>


<div class="sf22-exam-days">

<strong>
${days}
</strong>

<span>
DAYS
</span>

</div>

</div>


<div class="sf22-progress">

<div
class="sf22-progress-fill"
style="width:${Math.min(
100,
Math.max(
0,
readiness
)
)}%"
></div>

</div>

<div
style="
margin-top:7px;
font-size:8px;
color:var(--sf-muted);
"
>
Readiness ${readiness}%
</div>

</div>

`;


container
.querySelector(
".sf22-exam"
)
.onclick =
() =>
openPage(
"examMode"
);

}


/* =========================================================
   COURSES
========================================================= */

function renderCourses(){

const container =
document.getElementById(
"sf22Courses"
);


const list =
getClasses()
.slice(
0,
6
);


if(!list.length){

container.innerHTML = `

<div class="sf22-empty">
Add classes to see course progress here.
</div>

`;

return;

}


container.innerHTML =
list.map(
course => {

const grade =
courseGrade(
course.name
);


const count =
openTasks()
.filter(
task =>
task.course ===
course.name
)
.length;


return `

<div
class="sf22-course"
data-course="${escapeHTML(
course.name
)}"
>

<div>

<strong>
${escapeHTML(
course.name ||
"Course"
)}
</strong>

<small>
${count} open task${
count === 1
? ""
: "s"
}
</small>

</div>

<div class="sf22-course-grade">

${grade === null
? "—"
: Math.round(grade) + "%"}

</div>

</div>

`;

}
)
.join("");


container
.querySelectorAll(
".sf22-course"
)
.forEach(
element => {

element.onclick =
() =>
openCourse(
element.dataset.course
);

}
);

}


function openCourse(course){

openPage(
"courseHub"
);


setTimeout(
() => {

const wanted =
String(
course || ""
)
.toLowerCase();


const button =
[
...document
.querySelectorAll(
".sf14-course-item"
)
]
.find(
item => {

const value =
String(
item.dataset.course ||
item.textContent ||
""
)
.toLowerCase();


return (
value === wanted
||
value.includes(wanted)
||
wanted.includes(value)
);

}
);


button?.click();

},
100
);

}


/* =========================================================
   AI BRIEFING
========================================================= */

async function generateBriefing(){

const section =
document.getElementById(
"sf22AI"
);


const output =
document.getElementById(
"sf22AIOutput"
);


const button =
document.getElementById(
"sf22Brief"
);


section.classList.add(
"show"
);


output.textContent =
"StudyFlow is reviewing your day…";


button.disabled =
true;


button.textContent =
"✦ Preparing…";


const context = {

date:
new Date()
.toLocaleDateString(),

openTasks:
openTasks()
.slice(
0,
12
),

todaySchedule:
todaySchedule()
.slice(
0,
10
),

nextExams:
exams()
.filter(
exam =>
exam.date >= todayKey()
)
.slice(
0,
3
),

courses:
getClasses()
.slice(
0,
10
)
.map(
course => ({
name:
course.name,

grade:
courseGrade(
course.name
),

openTasks:
openTasks()
.filter(
task =>
task.course ===
course.name
)
.length
})
)

};


const prompt = `
You are StudyFlow's daily academic briefing assistant.

Student data:
${JSON.stringify(
context,
null,
2
)}

Write a short morning-style briefing.

Include:
- the single most important thing to do
- deadlines that need attention
- today's schedule
- upcoming exam risk if relevant
- one practical recommendation

Keep it concise.
Do not invent information.
`;


try{

let data;


if(
typeof api ===
"function"
){

data =
await api(
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

}else{

const response =
await fetch(
"/api/ai",
{
method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:
JSON.stringify({
message:
prompt
})
}
);


data =
await response.json();


if(!response.ok){

throw new Error(
data.error ||
"AI request failed."
);

}

}


output.textContent =
data.answer ||
"No briefing returned.";


}catch(error){

output.textContent =
`AI briefing unavailable: ${error.message}`;

}


button.disabled =
false;


button.textContent =
"✦ AI Briefing";

}


/* =========================================================
   EVENTS
========================================================= */

function bind(){

document
.getElementById(
"sf22Brief"
)
.onclick =
generateBriefing;


document
.getElementById(
"sf22Search"
)
.onclick =
() => {

const searchButton =
document.querySelector(
".sf21-nav"
);


if(searchButton){

searchButton.click();

return;

}


document.dispatchEvent(
new KeyboardEvent(
"keydown",
{
key:"k",
metaKey:true,
bubbles:true
}
)
);

};


document
.getElementById(
"sf22ScheduleButton"
)
.onclick =
() =>
openPage(
"smartSchedule"
);


document
.getElementById(
"sf22AllTasks"
)
.onclick =
() =>
openPage(
document.getElementById(
"tasksPro"
)
? "tasksPro"
: "tasks"
);


document
.getElementById(
"sf22FullSchedule"
)
.onclick =
() =>
openPage(
"smartSchedule"
);


document
.getElementById(
"sf22ExamMode"
)
.onclick =
() =>
openPage(
"examMode"
);


document
.getElementById(
"sf22CourseHub"
)
.onclick =
() =>
openPage(
"courseHub"
);


document
.querySelectorAll(
".sf22-quick button"
)
.forEach(
button => {

button.onclick =
() => {

const page =
button.dataset.page;


if(
document.getElementById(
page
)
){

openPage(
page
);

}

};

}
);

}


/* =========================================================
   RENDER
========================================================= */

function render(){

renderHeader();

renderHero();

renderPriorities();

renderSchedule();

renderExam();

renderCourses();

}


/* =========================================================
   INIT
========================================================= */

function initialize(){

if(
initialized ||
!getUser()
){

return;

}


createPage();

addNav();

bind();

render();


initialized =
true;


console.log(
"✅ StudyFlow Home Dashboard ready"
);

}


const timer =
setInterval(
() => {

if(
getUser()
){

initialize();

}


if(initialized){

clearInterval(
timer
);

}

},
400
);

})();
