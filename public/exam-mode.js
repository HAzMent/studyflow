
(function(){

let initialized = false;
let selectedExamId = null;
let editingExamId = null;


/* =========================================================
   HELPERS
========================================================= */

function getUser(){

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


function storeKey(name){

try{

if(
typeof key ===
"function"
){

return key(name);

}

}catch{}


return `studyflow_${
getUser()?.id || "guest"
}_${name}`;

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


function getNotes(){

try{

return (
typeof notes !== "undefined"
&&
Array.isArray(notes)
)
? notes
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


function escapeHTML(value){

return String(value ?? "")
.replaceAll("&","&amp;")
.replaceAll("<","&lt;")
.replaceAll(">","&gt;")
.replaceAll('"',"&quot;")
.replaceAll("'","&#039;");

}


function makeId(){

if(
window.crypto &&
typeof window.crypto.randomUUID ===
"function"
){

return window.crypto.randomUUID();

}


return `${Date.now()}-${Math.random()}`;

}


function todayDate(){

const date =
new Date();

date.setHours(
0,0,0,0
);

return date;

}


function dateKey(date){

const year =
date.getFullYear();

const month =
String(
date.getMonth() + 1
).padStart(
2,
"0"
);

const day =
String(
date.getDate()
).padStart(
2,
"0"
);

return `${year}-${month}-${day}`;

}


function daysUntil(value){

if(!value){

return 0;

}


const exam =
new Date(
`${value}T00:00:00`
);


const today =
todayDate();


return Math.max(
0,
Math.ceil(
(exam - today) /
86400000
)
);

}


function exams(){

try{

const parsed =
JSON.parse(
localStorage.getItem(
storeKey(
"examMode"
)
)
);


return Array.isArray(
parsed
)
? parsed
: [];

}catch{

return [];

}

}


function saveExams(list){

localStorage.setItem(
storeKey(
"examMode"
),
JSON.stringify(
list
)
);


try{

if(
typeof markStudyFlowCloudDirty ===
"function"
){

markStudyFlowCloudDirty();

}

}catch{}

}


function selectedExam(){

return exams()
.find(
exam =>
String(exam.id) ===
String(selectedExamId)
);

}


function courseNames(){

const names =
getClasses()
.map(
course =>
course.name
)
.filter(Boolean);


getTasks()
.forEach(
task => {

if(
task.course &&
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


function percentageAverage(list){

if(!list.length){

return null;

}


const numbers =
list
.map(Number)
.filter(
value =>
Number.isFinite(value)
);


if(!numbers.length){

return null;

}


return numbers.reduce(
(total,value) =>
total + value,
0
) /
numbers.length;

}


function masteryAverage(exam){

const topics =
exam.topics || [];


if(!topics.length){

return 0;

}


const total =
topics.reduce(
(sum,topic) =>
sum +
(Number(topic.mastery) || 1),
0
);


return (
total /
(topics.length * 5)
) *
100;

}


function readiness(exam){

const mastery =
masteryAverage(
exam
);


const scoreAverage =
percentageAverage(
exam.practiceScores ||
[]
);


if(scoreAverage === null){

return Math.round(
mastery
);

}


return Math.round(
mastery * .55 +
scoreAverage * .45
);

}


function courseContext(course){

const courseTasks =
getTasks()
.filter(
task =>
task.course === course
)
.slice(
0,
15
);


const courseNotes =
getNotes()
.filter(
note =>
note.course === course
)
.slice(
0,
10
)
.map(
note => ({
title:
note.title || "",

text:
String(
note.text || ""
)
.slice(
0,
1200
)
})
);


let knowledge = [];


try{

knowledge =
JSON.parse(
localStorage.getItem(
storeKey(
"knowledgeFiles"
)
)
) || [];


knowledge =
knowledge
.filter(
item =>
item.course === course
&&
item.lastResult
)
.slice(
0,
6
)
.map(
item => ({
file:
item.name,

studyMaterial:
String(
item.lastResult
)
.slice(
0,
1800
)
})
);

}catch{

knowledge = [];

}


return {
tasks:
courseTasks,
notes:
courseNotes,
knowledge
};

}


/* =========================================================
   API
========================================================= */

async function callAI(message){

try{

if(
typeof api ===
"function"
){

return await api(
"/api/ai",
{
method:"POST",
body:
JSON.stringify({
message
})
}
);

}

}catch{}


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
message
})
}
);


const data =
await response.json();


if(!response.ok){

throw new Error(
data.error ||
"AI request failed."
);

}


return data;

}


/* =========================================================
   CREATE PAGE
========================================================= */

function createPage(){

if(
document.getElementById(
"examMode"
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
"examMode";


page.className =
"page sf17-page hidden";


page.innerHTML = `

<div class="sf17-head">

<div>

<p class="eyebrow">
EXAM PREPARATION
</p>

<h1>
Exam Mode
</h1>

<p class="sf17-sub">
Turn an upcoming exam into a clear study plan and track your readiness.
</p>

</div>


<div class="sf17-actions">

<button
type="button"
id="sf17NewExam"
>
+ Add Exam
</button>

</div>

</div>


<div class="sf17-layout">


<div class="sf17-sidebar">

<div
id="sf17ExamList"
class="sf17-exam-list"
></div>

</div>


<div
id="sf17Main"
class="sf17-main"
></div>


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
'[data-page="examMode"]'
)
){

return;

}


const button =
document.createElement(
"button"
);


button.className =
"nav sf17-nav";


button.dataset.page =
"examMode";


button.innerHTML =
`🎯 Exam Mode <span class="sf17-new">NEW</span>`;


button.onclick =
event => {

event.preventDefault();

event.stopPropagation();

go();

};


const knowledge =
sidebar.querySelector(
'[data-page="knowledgeBase"]'
);


if(knowledge){

knowledge.insertAdjacentElement(
"afterend",
button
);

}else{

const grades =
sidebar.querySelector(
'[data-page="grades"]'
);


if(grades){

grades.insertAdjacentElement(
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


function go(){

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


document
.getElementById(
"examMode"
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
"examMode"
);

}
);


render();

}


/* =========================================================
   DRAWER
========================================================= */

function createDrawer(){

if(
document.getElementById(
"sf17Drawer"
)
){

return;

}


const backdrop =
document.createElement(
"div"
);


backdrop.id =
"sf17Backdrop";


const drawer =
document.createElement(
"aside"
);


drawer.id =
"sf17Drawer";


drawer.innerHTML = `

<div class="sf17-drawer-head">

<strong>
EXAM DETAILS
</strong>

<button
type="button"
id="sf17Close"
class="sf17-close"
>
×
</button>

</div>


<div class="sf17-field">

<label>
COURSE
</label>

<select id="sf17Course"></select>

</div>


<div class="sf17-field">

<label>
EXAM NAME
</label>

<input
id="sf17Name"
placeholder="Midterm 1, Final Exam..."
>

</div>


<div class="sf17-two">

<div class="sf17-field">

<label>
EXAM DATE
</label>

<input
type="date"
id="sf17Date"
>

</div>


<div class="sf17-field">

<label>
TARGET GRADE
</label>

<input
type="number"
id="sf17Target"
min="0"
max="100"
value="90"
>

</div>

</div>


<div class="sf17-field">

<label>
TOPICS
</label>

<textarea
id="sf17Topics"
placeholder="Inverse functions, graph transformations, domain and range..."
></textarea>

</div>


<div class="sf17-drawer-actions">

<button
type="button"
id="sf17Save"
>
Save Exam
</button>

<button
type="button"
id="sf17Delete"
class="sf17-delete"
>
Delete
</button>

</div>

`;


document.body
.appendChild(
backdrop
);


document.body
.appendChild(
drawer
);


backdrop.onclick =
closeDrawer;


document
.getElementById(
"sf17Close"
)
.onclick =
closeDrawer;


document
.getElementById(
"sf17Save"
)
.onclick =
saveDrawer;


document
.getElementById(
"sf17Delete"
)
.onclick =
deleteExam;

}


function courseOptions(
selected = ""
){

const names =
courseNames();


return `

<option value="">
Choose course
</option>

${names.map(
name => `

<option
value="${escapeHTML(name)}"
${name === selected ? "selected" : ""}
>
${escapeHTML(name)}
</option>

`
).join("")}

`;

}


function openDrawer(
id = null
){

editingExamId =
id;


const exam =
id
? exams().find(
item =>
String(item.id) ===
String(id)
)
: null;


document
.getElementById(
"sf17Course"
).innerHTML =
courseOptions(
exam?.course || ""
);


document
.getElementById(
"sf17Name"
).value =
exam?.name || "";


document
.getElementById(
"sf17Date"
).value =
exam?.date || "";


document
.getElementById(
"sf17Target"
).value =
exam?.target ?? 90;


document
.getElementById(
"sf17Topics"
).value =
(exam?.topics || [])
.map(
topic =>
topic.name
)
.join(", ");


document
.getElementById(
"sf17Delete"
).style.display =
exam
? ""
: "none";


document
.getElementById(
"sf17Backdrop"
)
.classList.add(
"open"
);


document
.getElementById(
"sf17Drawer"
)
.classList.add(
"open"
);


setTimeout(
() => {

document
.getElementById(
"sf17Name"
)
.focus();

},
150
);

}


function closeDrawer(){

document
.getElementById(
"sf17Backdrop"
)
?.classList
.remove(
"open"
);


document
.getElementById(
"sf17Drawer"
)
?.classList
.remove(
"open"
);


editingExamId =
null;

}


function saveDrawer(){

const course =
document
.getElementById(
"sf17Course"
).value;


const name =
document
.getElementById(
"sf17Name"
).value.trim();


const date =
document
.getElementById(
"sf17Date"
).value;


const target =
Math.min(
100,
Math.max(
0,
Number(
document
.getElementById(
"sf17Target"
).value
) || 0
)
);


if(!course){

alert(
"Choose a course."
);

return;

}


if(!name){

alert(
"Enter an exam name."
);

return;

}


if(!date){

alert(
"Choose the exam date."
);

return;

}


const topicNames =
document
.getElementById(
"sf17Topics"
)
.value
.split(/,|\n/)
.map(
value =>
value.trim()
)
.filter(Boolean);


const list =
exams();


let exam =
editingExamId
? list.find(
item =>
String(item.id) ===
String(editingExamId)
)
: null;


if(!exam){

exam = {

id:
makeId(),

createdAt:
new Date().toISOString(),

practiceScores:[],

aiOutput:"",

plan:[]

};


list.push(
exam
);

}


const oldTopics =
exam.topics || [];


exam.course =
course;

exam.name =
name;

exam.date =
date;

exam.target =
target;


exam.topics =
topicNames.map(
topicName => {

const previous =
oldTopics.find(
topic =>
topic.name
.toLowerCase() ===
topicName.toLowerCase()
);


return {

id:
previous?.id ||
makeId(),

name:
topicName,

mastery:
previous?.mastery || 1

};

}
);


exam.plan =
buildPlan(
exam
);


saveExams(
list
);


selectedExamId =
exam.id;


localStorage.setItem(
storeKey(
"selectedExam"
),
String(
exam.id
)
);


closeDrawer();

render();

}


function deleteExam(){

if(!editingExamId){

return;

}


if(
!confirm(
"Delete this exam?"
)
){

return;

}


const list =
exams()
.filter(
exam =>
String(exam.id) !==
String(editingExamId)
);


saveExams(
list
);


if(
String(selectedExamId) ===
String(editingExamId)
){

selectedExamId =
list[0]?.id || null;

}


closeDrawer();

render();

}


/* =========================================================
   PLAN
========================================================= */

function buildPlan(exam){

const remaining =
Math.max(
1,
daysUntil(
exam.date
)
);


const topics =
[
...(exam.topics || [])
]
.sort(
(a,b) =>
(Number(a.mastery) || 1) -
(Number(b.mastery) || 1)
);


if(!topics.length){

return [];

}


const totalDays =
Math.min(
remaining,
14
);


const plan = [];


for(
let index = 0;
index < totalDays;
index++
){

const date =
new Date(
todayDate()
);


date.setDate(
date.getDate() +
index
);


const firstTopic =
topics[
index %
topics.length
];


const secondTopic =
topics[
(index + 1) %
topics.length
];


const isLast =
index ===
totalDays - 1;


plan.push({

date:
dateKey(
date
),

title:
isLast
? "Final review"
: firstTopic.name,

detail:
isLast
? "Review weak topics, formulas, definitions and previous mistakes."
: (
firstTopic.id ===
secondTopic.id
? `Practice ${firstTopic.name}.`
: `Focus on ${firstTopic.name}, then review ${secondTopic.name}.`
),

minutes:
isLast
? 60
: (
Number(firstTopic.mastery) <= 2
? 60
: 45
)

});

}


return plan;

}


/* =========================================================
   EXAM LIST
========================================================= */

function renderList(){

const container =
document.getElementById(
"sf17ExamList"
);


if(!container){

return;

}


const list =
exams()
.sort(
(a,b) =>
String(a.date)
.localeCompare(
String(b.date)
)
);


if(!list.length){

container.innerHTML = `

<div class="sf17-sidebar-empty">
No exams yet.
</div>

`;

return;

}


container.innerHTML =
list.map(
exam => `

<button
type="button"
class="sf17-exam-item ${
String(exam.id) ===
String(selectedExamId)
? "active"
: ""
}"
data-id="${escapeHTML(exam.id)}"
>

<strong>
${escapeHTML(exam.name)}
</strong>

<small>
${escapeHTML(exam.course)}
 ·
 ${daysUntil(exam.date)} days
</small>

</button>

`
).join("");


container
.querySelectorAll(
".sf17-exam-item"
)
.forEach(
button => {

button.onclick =
() => {

selectedExamId =
button.dataset.id;


localStorage.setItem(
storeKey(
"selectedExam"
),
String(
selectedExamId
)
);


render();

};

}
);

}


/* =========================================================
   MAIN
========================================================= */

function renderMain(){

const container =
document.getElementById(
"sf17Main"
);


if(!container){

return;

}


const exam =
selectedExam();


if(!exam){

container.innerHTML = `

<div class="sf17-empty">

<div>

<div class="sf17-empty-icon">
🎯
</div>

<strong>
Create your first exam
</strong>

<p>
Add the exam date and topics. StudyFlow will build a preparation plan and track your readiness.
</p>

<button
type="button"
id="sf17EmptyCreate"
>
+ Add Exam
</button>

</div>

</div>

`;


document
.getElementById(
"sf17EmptyCreate"
)
.onclick =
() =>
openDrawer();


return;

}


const days =
daysUntil(
exam.date
);


const mastery =
Math.round(
masteryAverage(
exam
)
);


const scoreAverage =
percentageAverage(
exam.practiceScores ||
[]
);


const ready =
readiness(
exam
);


container.innerHTML = `

<div class="sf17-hero">

<div class="sf17-course">
${escapeHTML(exam.course).toUpperCase()}
</div>

<h2>
${escapeHTML(exam.name)}
</h2>

<div class="sf17-date">
${new Date(
exam.date +
"T00:00:00"
)
.toLocaleDateString(
undefined,
{
weekday:"long",
month:"long",
day:"numeric",
year:"numeric"
}
)}
</div>


<div class="sf17-countdown">

<strong>
${days}
</strong>

<span>
${days === 1
? "DAY LEFT"
: "DAYS LEFT"}
</span>

</div>


<div class="sf17-hero-actions">

<button
type="button"
class="secondary"
id="sf17EditExam"
>
Edit
</button>

</div>

</div>


<div class="sf17-metrics">

<div class="sf17-metric">

<strong>
${exam.target || 0}%
</strong>

<span>
Target grade
</span>

</div>


<div class="sf17-metric">

<strong>
${exam.topics?.length || 0}
</strong>

<span>
Topics
</span>

</div>


<div class="sf17-metric">

<strong>
${mastery}%
</strong>

<span>
Topic mastery
</span>

</div>


<div class="sf17-metric">

<strong>
${scoreAverage === null
? "—"
: Math.round(scoreAverage) + "%"}
</strong>

<span>
Practice average
</span>

</div>

</div>


<div class="sf17-readiness">

<div class="sf17-readiness-top">

<span>
Exam readiness
</span>

<strong>
${ready}%
</strong>

</div>

<div class="sf17-track">

<div
class="sf17-fill"
style="width:${Math.min(100,ready)}%"
></div>

</div>

</div>


<div class="sf17-grid">


<div class="sf17-card">

<div class="sf17-card-head">

<h3>
Topic Mastery
</h3>

<span>
1 = weak · 5 = confident
</span>

</div>

<div
id="sf17TopicsList"
class="sf17-topic-list"
></div>


<div class="sf17-add-topic">

<input
id="sf17NewTopic"
placeholder="Add another topic..."
>

<button
type="button"
id="sf17AddTopic"
>
+
</button>

</div>

</div>


<div class="sf17-card">

<div class="sf17-card-head">

<h3>
Practice Scores
</h3>

<span>
Track improvement
</span>

</div>


<div class="sf17-score-form">

<input
type="number"
min="0"
max="100"
id="sf17PracticeScore"
placeholder="Practice score %"
>

<button
type="button"
id="sf17SaveScore"
>
Add
</button>

</div>


<div
id="sf17ScoreHistory"
class="sf17-score-history"
></div>

</div>


<div class="sf17-card full">

<div class="sf17-card-head">

<h3>
Preparation Plan
</h3>

<button
type="button"
class="secondary"
id="sf17RebuildPlan"
>
Rebuild Plan
</button>

</div>

<div
id="sf17Plan"
class="sf17-plan"
></div>

</div>


<div class="sf17-card full">

<div class="sf17-card-head">

<h3>
✦ Exam AI
</h3>

<span>
Uses your StudyFlow course context
</span>

</div>


<div class="sf17-ai-actions">

<button
type="button"
id="sf17AIPlan"
>
✦ Build AI Study Plan
</button>

<button
type="button"
class="secondary"
id="sf17MockExam"
>
🧪 Generate Mock Exam
</button>

<button
type="button"
class="secondary"
id="sf17WeakTopics"
>
🧠 Explain Weak Topics
</button>

</div>


<div
id="sf17AIOutput"
class="sf17-ai-output"
>

${exam.aiOutput
? escapeHTML(exam.aiOutput)
: `
<span class="sf17-ai-placeholder">
Choose an AI tool above. StudyFlow will use your exam topics, course tasks, notes and saved Knowledge Base results.
</span>
`}

</div>

</div>


</div>

`;


document
.getElementById(
"sf17EditExam"
)
.onclick =
() =>
openDrawer(
exam.id
);


renderTopics(
exam
);


renderScores(
exam
);


renderPlan(
exam
);


bindMainActions(
exam
);

}


/* =========================================================
   TOPICS
========================================================= */

function renderTopics(exam){

const container =
document.getElementById(
"sf17TopicsList"
);


if(!container){

return;

}


if(
!exam.topics?.length
){

container.innerHTML = `

<div class="sf17-sidebar-empty">
Add the topics that will be on your exam.
</div>

`;

return;

}


container.innerHTML =
exam.topics
.map(
topic => `

<div class="sf17-topic">

<div>

<strong>
${escapeHTML(topic.name)}
</strong>

<small>
Mastery ${topic.mastery || 1}/5
</small>

</div>


<div
class="sf17-mastery"
data-topic="${escapeHTML(topic.id)}"
>

${[1,2,3,4,5]
.map(
level => `

<button
type="button"
data-level="${level}"
class="${
Number(topic.mastery) === level
? "active"
: ""
}"
>
${level}
</button>

`
).join("")}

</div>

</div>

`
)
.join("");


container
.querySelectorAll(
".sf17-mastery button"
)
.forEach(
button => {

button.onclick =
() => {

const parent =
button.closest(
".sf17-mastery"
);


const topic =
exam.topics
.find(
item =>
String(item.id) ===
String(
parent.dataset.topic
)
);


if(!topic){

return;

}


topic.mastery =
Number(
button.dataset.level
);


exam.plan =
buildPlan(
exam
);


updateExam(
exam
);


renderMain();

};

}
);

}


/* =========================================================
   SCORES
========================================================= */

function renderScores(exam){

const container =
document.getElementById(
"sf17ScoreHistory"
);


if(!container){

return;

}


const scores =
exam.practiceScores ||
[];


if(!scores.length){

container.innerHTML = `

<span style="
font-size:9px;
color:#5f7088;
">
No practice scores yet.
</span>

`;

return;

}


container.innerHTML =
scores
.slice()
.reverse()
.map(
score => `

<span class="sf17-score">
${Number(score)}%
</span>

`
)
.join("");

}


/* =========================================================
   PLAN
========================================================= */

function renderPlan(exam){

const container =
document.getElementById(
"sf17Plan"
);


if(!container){

return;

}


if(
!exam.plan ||
!exam.plan.length
){

exam.plan =
buildPlan(
exam
);


updateExam(
exam
);

}


if(
!exam.plan.length
){

container.innerHTML = `

<div class="sf17-sidebar-empty">
Add exam topics to build a study plan.
</div>

`;

return;

}


container.innerHTML =
exam.plan
.map(
item => `

<div class="sf17-plan-row">

<div class="sf17-plan-date">
${new Date(
item.date +
"T00:00:00"
)
.toLocaleDateString(
undefined,
{
month:"short",
day:"numeric",
weekday:"short"
}
)}
</div>


<div>

<strong>
${escapeHTML(item.title)}
</strong>

<small>
${escapeHTML(item.detail)}
</small>

</div>


<div class="sf17-plan-time">
${item.minutes} min
</div>

</div>

`
)
.join("");

}


/* =========================================================
   UPDATE
========================================================= */

function updateExam(updated){

const list =
exams();


const index =
list.findIndex(
exam =>
String(exam.id) ===
String(updated.id)
);


if(index === -1){

return;

}


list[index] =
updated;


saveExams(
list
);

}


/* =========================================================
   MAIN ACTIONS
========================================================= */

function bindMainActions(exam){

document
.getElementById(
"sf17AddTopic"
)
.onclick =
() => {

const input =
document
.getElementById(
"sf17NewTopic"
);


const value =
input.value.trim();


if(!value){

input.focus();

return;

}


exam.topics =
exam.topics || [];


exam.topics.push({

id:
makeId(),

name:
value,

mastery:
1

});


exam.plan =
buildPlan(
exam
);


updateExam(
exam
);


renderMain();

};


document
.getElementById(
"sf17SaveScore"
)
.onclick =
() => {

const input =
document
.getElementById(
"sf17PracticeScore"
);


const value =
Number(
input.value
);


if(
!Number.isFinite(value) ||
value < 0 ||
value > 100
){

alert(
"Enter a score between 0 and 100."
);

return;

}


exam.practiceScores =
exam.practiceScores || [];


exam.practiceScores.push(
value
);


updateExam(
exam
);


renderMain();

};


document
.getElementById(
"sf17RebuildPlan"
)
.onclick =
() => {

exam.plan =
buildPlan(
exam
);


updateExam(
exam
);


renderMain();

};


document
.getElementById(
"sf17AIPlan"
)
.onclick =
() =>
runAI(
exam,
"plan"
);


document
.getElementById(
"sf17MockExam"
)
.onclick =
() =>
runAI(
exam,
"mock"
);


document
.getElementById(
"sf17WeakTopics"
)
.onclick =
() =>
runAI(
exam,
"weak"
);

}


/* =========================================================
   AI
========================================================= */

async function runAI(
exam,
mode
){

const output =
document.getElementById(
"sf17AIOutput"
);


if(!output){

return;

}


output.textContent =
"StudyFlow AI is preparing your exam material...";


const context =
courseContext(
exam.course
);


const weakTopics =
(exam.topics || [])
.filter(
topic =>
Number(topic.mastery) <= 2
)
.map(
topic =>
topic.name
);


let instruction = "";


if(mode === "plan"){

instruction = `
Create a practical exam preparation plan from today until the exam.

For each study day include:
- topic
- approximate minutes
- what to review
- what to practice

Prioritize weak topics and urgent course work.
Finish with a final review before the exam.
`;

}


if(mode === "mock"){

instruction = `
Create a college-level mock exam.

Include:
- 12 questions
- mostly multiple choice
- 4 choices for multiple-choice questions
- a few harder application questions
- an answer key at the END
- short explanations in the answer key

Do not reveal the answers immediately after each question.
`;

}


if(mode === "weak"){

instruction = `
Teach the student's weakest exam topics.

For each weak topic:
- explain it simply
- give one example
- identify a common mistake
- give one short practice question

Focus especially on:
${weakTopics.join(", ") || "the lowest-mastery topics"}
`;

}


const prompt = `
You are StudyFlow Exam Coach.

Course:
${exam.course}

Exam:
${exam.name}

Exam date:
${exam.date}

Days remaining:
${daysUntil(exam.date)}

Target grade:
${exam.target}%

Exam topics and mastery:
${JSON.stringify(exam.topics || [],null,2)}

Practice scores:
${JSON.stringify(exam.practiceScores || [])}

Course context from StudyFlow:
${JSON.stringify(context,null,2)}

TASK:
${instruction}

Be useful, accurate and organized.
`;


try{

const result =
await callAI(
prompt
);


const answer =
result.answer ||
"No response returned.";


output.textContent =
answer;


exam.aiOutput =
answer;


updateExam(
exam
);


}catch(error){

output.textContent =
`AI error: ${error.message}`;

}

}


/* =========================================================
   RENDER
========================================================= */

function render(){

let list =
exams();


if(
!selectedExamId &&
list.length
){

const saved =
localStorage.getItem(
storeKey(
"selectedExam"
)
);


selectedExamId =
list.some(
exam =>
String(exam.id) ===
String(saved)
)
? saved
: list[0].id;

}


if(
selectedExamId &&
!list.some(
exam =>
String(exam.id) ===
String(selectedExamId)
)
){

selectedExamId =
list[0]?.id || null;

}


renderList();

renderMain();

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

createDrawer();

addNav();


document
.getElementById(
"sf17NewExam"
)
.onclick =
() =>
openDrawer();


render();


initialized =
true;


console.log(
"✅ StudyFlow Exam Mode ready"
);

}


const timer =
setInterval(
() => {

if(getUser()){

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
