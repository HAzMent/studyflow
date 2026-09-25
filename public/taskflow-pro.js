
(function(){

let initialized = false;

let taskSearch = "";
let priorityFilter = "All";

let calendarDate =
new Date(
new Date().getFullYear(),
new Date().getMonth(),
1
);

let editingTaskId = null;


/* =========================================================
   HELPERS
========================================================= */

function tfEscape(value){

return String(value ?? "")
.replaceAll("&","&amp;")
.replaceAll("<","&lt;")
.replaceAll(">","&gt;")
.replaceAll('"',"&quot;")
.replaceAll("'","&#039;");

}


function tfLoggedIn(){

try{

return (
typeof currentUser !==
"undefined"
&&
!!currentUser
);

}catch{

return false;

}

}


function tfTasks(){

try{

if(
typeof tasks !==
"undefined"
&&
Array.isArray(tasks)
){

return tasks;

}

}catch{}


return [];

}


function tfClasses(){

try{

if(
typeof classes !==
"undefined"
&&
Array.isArray(classes)
){

return classes;

}

}catch{}


return [];

}


function tfSave(){

try{

if(
typeof saveEverything ===
"function"
){

saveEverything();

return;

}

}catch{}


try{

if(
typeof key === "function"
){

localStorage.setItem(
key("tasks"),
JSON.stringify(
tfTasks()
)
);

}

}catch{}

}


function tfDateKey(date){

const y =
date.getFullYear();

const m =
String(
date.getMonth() + 1
).padStart(2,"0");

const d =
String(
date.getDate()
).padStart(2,"0");

return `${y}-${m}-${d}`;

}


function tfToday(){

return tfDateKey(
new Date()
);

}


function tfNormalizeStatus(value){

if(value === "done"){

return "done";

}

if(
value === "progress"
||
value === "inprogress"
){

return "progress";

}

return "todo";

}


function tfPriority(value){

if(value === "High") return "High";
if(value === "Low") return "Low";

return "Medium";

}


function tfFindTask(id){

return tfTasks()
.find(
task =>
String(task.id) ===
String(id)
);

}


function tfCourseOptions(
selected = ""
){

const names =
[
...new Set(
tfClasses()
.map(
course =>
course.name
)
.filter(Boolean)
)
];


return `
<option value="">
No class
</option>

${names.map(name => `

<option
value="${tfEscape(name)}"
${name === selected ? "selected" : ""}
>
${tfEscape(name)}
</option>

`).join("")}
`;

}


/* =========================================================
   CREATE PRO PAGES
========================================================= */

function tfCreatePages(){

const main =
document.querySelector(
"main"
);


if(!main){

return false;

}


if(
!document.getElementById(
"tasksPro"
)
){

const tasksPage =
document.createElement(
"section"
);


tasksPage.id =
"tasksPro";

tasksPage.className =
"page tf-page";


tasksPage.innerHTML = `

<div class="tf-page-header">

<div>

<p class="eyebrow">
TASK MANAGEMENT
</p>

<h1>
Tasks Pro
</h1>

<p class="tf-page-subtitle">
Plan, prioritize and move work through your semester.
</p>

</div>

<div class="tf-header-actions">

<button
type="button"
id="tfNewTask"
>
+ New Task
</button>

<button
type="button"
class="secondary"
id="tfOpenCalendar"
>
Calendar →
</button>

</div>

</div>


<div class="tf-summary">

<div class="tf-summary-card">
<strong id="tfOpenCount">0</strong>
<span>Open tasks</span>
</div>

<div class="tf-summary-card">
<strong id="tfProgressCount">0</strong>
<span>In progress</span>
</div>

<div class="tf-summary-card">
<strong id="tfDoneCount">0</strong>
<span>Completed</span>
</div>

<div class="tf-summary-card">
<strong id="tfDueSoonCount">0</strong>
<span>Due next 7 days</span>
</div>

</div>


<div class="tf-toolbar">

<div class="tf-search">

<span>⌕</span>

<input
id="tfTaskSearch"
placeholder="Search tasks, classes..."
>

</div>

<select id="tfPriorityFilter">

<option value="All">
All priorities
</option>

<option value="High">
High priority
</option>

<option value="Medium">
Medium priority
</option>

<option value="Low">
Low priority
</option>

</select>

</div>


<div class="tf-board">

<div
class="tf-column"
data-status="todo"
>

<div class="tf-column-head">

<div class="tf-column-name">
<span class="tf-status-dot todo"></span>
To Do
</div>

<span
class="tf-column-count"
id="tfTodoBadge"
>
0
</span>

</div>

<div
class="tf-dropzone"
id="tfTodoColumn"
data-status="todo"
></div>

</div>


<div
class="tf-column"
data-status="progress"
>

<div class="tf-column-head">

<div class="tf-column-name">
<span class="tf-status-dot progress"></span>
In Progress
</div>

<span
class="tf-column-count"
id="tfProgressBadge"
>
0
</span>

</div>

<div
class="tf-dropzone"
id="tfProgressColumn"
data-status="progress"
></div>

</div>


<div
class="tf-column"
data-status="done"
>

<div class="tf-column-head">

<div class="tf-column-name">
<span class="tf-status-dot done"></span>
Done
</div>

<span
class="tf-column-count"
id="tfDoneBadge"
>
0
</span>

</div>

<div
class="tf-dropzone"
id="tfDoneColumn"
data-status="done"
></div>

</div>

</div>

`;


main.appendChild(
tasksPage
);

}


if(
!document.getElementById(
"calendarPro"
)
){

const calendarPage =
document.createElement(
"section"
);


calendarPage.id =
"calendarPro";

calendarPage.className =
"page tf-page";


calendarPage.innerHTML = `

<div class="tf-page-header">

<div>

<p class="eyebrow">
SEMESTER SCHEDULE
</p>

<h1>
Calendar Pro
</h1>

<p class="tf-page-subtitle">
Drag tasks to another date to instantly reschedule them.
</p>

</div>

<div class="tf-header-actions">

<button
type="button"
id="tfCalendarNewTask"
>
+ New Task
</button>

<button
type="button"
class="secondary"
id="tfOpenTasks"
>
Tasks →
</button>

</div>

</div>


<div class="tf-calendar-shell">

<div class="tf-calendar-top">

<div
class="tf-calendar-title"
id="tfCalendarTitle"
>
Calendar
</div>

<div class="tf-calendar-nav">

<button
type="button"
id="tfCalPrev"
>
←
</button>

<button
type="button"
id="tfCalToday"
>
Today
</button>

<button
type="button"
id="tfCalNext"
>
→
</button>

</div>

</div>


<div class="tf-weekdays">

<div>SUN</div>
<div>MON</div>
<div>TUE</div>
<div>WED</div>
<div>THU</div>
<div>FRI</div>
<div>SAT</div>

</div>


<div
class="tf-calendar-grid"
id="tfCalendarGrid"
></div>

</div>

`;


main.appendChild(
calendarPage
);

}


return true;

}


/* =========================================================
   NAVIGATION
========================================================= */

function tfGo(page){

try{

if(
typeof showPage ===
"function"
){

showPage(page);

}else{

document
.querySelectorAll(
".page"
)
.forEach(
element =>
element.classList
.add("hidden")
);


document
.getElementById(page)
?.classList
.remove("hidden");

}

}catch{}


document
.querySelectorAll(
".nav"
)
.forEach(
button =>
button.classList
.toggle(
"active",
button.dataset.page ===
page
)
);


if(page === "tasksPro"){

tfRenderBoard();

}


if(page === "calendarPro"){

tfRenderCalendar();

}

}


function tfAddNav(){

const sidebar =
document.querySelector(
"aside"
);


if(!sidebar){

return;

}


if(
!sidebar.querySelector(
'[data-page="tasksPro"]'
)
){

const old =
sidebar.querySelector(
'[data-page="tasks"]'
);


const button =
document.createElement(
"button"
);


button.className =
"nav tf-pro-nav";

button.dataset.page =
"tasksPro";

button.innerHTML =
`🗂 Tasks Pro <span class="tf-new-badge">NEW</span>`;

button.onclick =
event => {

event.preventDefault();
event.stopPropagation();

tfGo(
"tasksPro"
);

};


if(old){

old.insertAdjacentElement(
"afterend",
button
);

}else{

sidebar.appendChild(
button
);

}

}


if(
!sidebar.querySelector(
'[data-page="calendarPro"]'
)
){

const old =
sidebar.querySelector(
'[data-page="calendar"]'
);


const button =
document.createElement(
"button"
);


button.className =
"nav tf-pro-nav";

button.dataset.page =
"calendarPro";

button.innerHTML =
`🗓 Calendar Pro <span class="tf-new-badge">NEW</span>`;

button.onclick =
event => {

event.preventDefault();
event.stopPropagation();

tfGo(
"calendarPro"
);

};


if(old){

old.insertAdjacentElement(
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
   FILTERED TASKS
========================================================= */

function tfVisibleTasks(){

return tfTasks()
.filter(
task => {

const search =
taskSearch
.trim()
.toLowerCase();


const matchesSearch =
!search
||
String(
task.name || ""
)
.toLowerCase()
.includes(search)
||
String(
task.course || ""
)
.toLowerCase()
.includes(search)
||
String(
task.details || ""
)
.toLowerCase()
.includes(search);


const matchesPriority =
priorityFilter === "All"
||
tfPriority(
task.priority
) ===
priorityFilter;


return (
matchesSearch
&&
matchesPriority
);

}
);

}


/* =========================================================
   BOARD
========================================================= */

function tfTaskCard(task){

const status =
tfNormalizeStatus(
task.status
);


const card =
document.createElement(
"div"
);


card.className =
"tf-task";

card.draggable =
true;

card.dataset.taskId =
task.id;


card.innerHTML = `

<div class="tf-task-top">

<div class="tf-task-title">
${tfEscape(task.name || "Untitled Task")}
</div>

<span class="tf-drag-handle">
⋮⋮
</span>

</div>

${task.course
? `
<div class="tf-task-course">
${tfEscape(task.course)}
</div>
`
: ""}

<div class="tf-task-meta">

<span class="tf-task-date">
${task.date
? tfEscape(task.date)
: "No deadline"}
</span>

<span class="tf-priority ${tfPriority(task.priority)}">
${tfPriority(task.priority)}
</span>

</div>

`;


card.addEventListener(
"click",
event => {

if(
event.defaultPrevented
){

return;

}


tfOpenDrawer(
task.id
);

}
);


card.addEventListener(
"dragstart",
event => {

card.classList.add(
"dragging"
);


event.dataTransfer
.setData(
"text/plain",
String(task.id)
);


event.dataTransfer
.effectAllowed =
"move";

}
);


card.addEventListener(
"dragend",
() => {

card.classList.remove(
"dragging"
);

}
);


return card;

}


function tfRenderBoard(){

const columns = {

todo:
document.getElementById(
"tfTodoColumn"
),

progress:
document.getElementById(
"tfProgressColumn"
),

done:
document.getElementById(
"tfDoneColumn"
)

};


if(
!columns.todo
||
!columns.progress
||
!columns.done
){

return;

}


Object.values(columns)
.forEach(
column =>
column.innerHTML = ""
);


const visible =
tfVisibleTasks();


const grouped = {

todo:[],

progress:[],

done:[]

};


visible.forEach(
task => {

const status =
tfNormalizeStatus(
task.status
);


grouped[
status
].push(task);

}
);


Object.entries(grouped)
.forEach(
([status,list]) => {

if(!list.length){

columns[
status
].innerHTML = `

<div class="tf-empty-column">
Drop a task here
</div>

`;

return;

}


list
.sort(
(a,b) =>
String(a.date || "9999")
.localeCompare(
String(b.date || "9999")
)
)
.forEach(
task => {

columns[
status
].appendChild(
tfTaskCard(task)
);

}
);

}
);


document
.getElementById(
"tfTodoBadge"
).textContent =
grouped.todo.length;


document
.getElementById(
"tfProgressBadge"
).textContent =
grouped.progress.length;


document
.getElementById(
"tfDoneBadge"
).textContent =
grouped.done.length;


tfRenderSummary();

}


function tfRenderSummary(){

const list =
tfTasks();


const open =
list.filter(
task =>
tfNormalizeStatus(
task.status
) !== "done"
);


const progress =
list.filter(
task =>
tfNormalizeStatus(
task.status
) === "progress"
);


const done =
list.filter(
task =>
tfNormalizeStatus(
task.status
) === "done"
);


const today =
new Date();

today.setHours(
0,0,0,0
);


const soon =
new Date(today);

soon.setDate(
today.getDate() + 7
);


const dueSoon =
open.filter(
task => {

if(!task.date){

return false;

}


const date =
new Date(
task.date + "T00:00:00"
);


return (
date >= today
&&
date <= soon
);

}
);


const map = {

tfOpenCount:
open.length,

tfProgressCount:
progress.length,

tfDoneCount:
done.length,

tfDueSoonCount:
dueSoon.length

};


Object.entries(map)
.forEach(
([id,value]) => {

const element =
document.getElementById(id);


if(element){

element.textContent =
value;

}

}
);

}


/* =========================================================
   DRAG DROP BOARD
========================================================= */

function tfInstallBoardDrop(){

document
.querySelectorAll(
".tf-dropzone"
)
.forEach(
zone => {

zone.addEventListener(
"dragover",
event => {

event.preventDefault();

event.dataTransfer
.dropEffect =
"move";


zone.closest(
".tf-column"
)
?.classList
.add(
"drag-over"
);

}
);


zone.addEventListener(
"dragleave",
() => {

zone.closest(
".tf-column"
)
?.classList
.remove(
"drag-over"
);

}
);


zone.addEventListener(
"drop",
event => {

event.preventDefault();


zone.closest(
".tf-column"
)
?.classList
.remove(
"drag-over"
);


const id =
event.dataTransfer
.getData(
"text/plain"
);


const task =
tfFindTask(id);


if(!task){

return;

}


task.status =
zone.dataset.status;


tfSave();

tfRenderBoard();

tfRenderCalendar();

}
);

}
);

}


/* =========================================================
   DRAWER
========================================================= */

function tfCreateDrawer(){

if(
document.getElementById(
"tfTaskDrawer"
)
){

return;

}


const backdrop =
document.createElement(
"div"
);


backdrop.id =
"tfDrawerBackdrop";


const drawer =
document.createElement(
"aside"
);


drawer.id =
"tfTaskDrawer";


drawer.innerHTML = `

<div class="tf-drawer-head">

<strong>
TASK DETAILS
</strong>

<button
type="button"
class="tf-close"
id="tfCloseDrawer"
>
×
</button>

</div>


<div class="tf-field">

<label>
TASK
</label>

<input
id="tfDrawerTitle"
class="tf-title-input"
placeholder="What needs to be done?"
>

</div>


<div class="tf-two-fields">

<div class="tf-field">

<label>
STATUS
</label>

<select id="tfDrawerStatus">

<option value="todo">
To Do
</option>

<option value="progress">
In Progress
</option>

<option value="done">
Done
</option>

</select>

</div>


<div class="tf-field">

<label>
PRIORITY
</label>

<select id="tfDrawerPriority">

<option value="Low">
Low
</option>

<option value="Medium">
Medium
</option>

<option value="High">
High
</option>

</select>

</div>

</div>


<div class="tf-two-fields">

<div class="tf-field">

<label>
COURSE
</label>

<select id="tfDrawerCourse"></select>

</div>


<div class="tf-field">

<label>
DUE DATE
</label>

<input
type="date"
id="tfDrawerDate"
>

</div>

</div>


<div class="tf-field">

<label>
NOTES
</label>

<textarea
id="tfDrawerDetails"
placeholder="Add context, instructions, links, study notes..."
></textarea>

</div>


<div class="tf-drawer-actions">

<button
type="button"
id="tfSaveTask"
>
Save Task
</button>

<button
type="button"
class="tf-delete"
id="tfDeleteTask"
>
Delete
</button>

</div>

`;


document.body.appendChild(
backdrop
);

document.body.appendChild(
drawer
);


backdrop.onclick =
tfCloseDrawer;


document
.getElementById(
"tfCloseDrawer"
)
.onclick =
tfCloseDrawer;


document
.getElementById(
"tfSaveTask"
)
.onclick =
tfSaveDrawer;


document
.getElementById(
"tfDeleteTask"
)
.onclick =
tfDeleteDrawer;

}


function tfOpenDrawer(
id = null,
presetDate = ""
){

editingTaskId =
id;


const task =
id
? tfFindTask(id)
: null;


document
.getElementById(
"tfDrawerTitle"
).value =
task?.name || "";


document
.getElementById(
"tfDrawerStatus"
).value =
tfNormalizeStatus(
task?.status
);


document
.getElementById(
"tfDrawerPriority"
).value =
tfPriority(
task?.priority
);


document
.getElementById(
"tfDrawerCourse"
).innerHTML =
tfCourseOptions(
task?.course || ""
);


document
.getElementById(
"tfDrawerDate"
).value =
task?.date ||
presetDate ||
"";


document
.getElementById(
"tfDrawerDetails"
).value =
task?.details || "";


document
.getElementById(
"tfDeleteTask"
).style.display =
task
? ""
: "none";


document
.getElementById(
"tfTaskDrawer"
)
.classList.add(
"open"
);


document
.getElementById(
"tfDrawerBackdrop"
)
.classList.add(
"open"
);


setTimeout(
() => {

document
.getElementById(
"tfDrawerTitle"
)
.focus();

},
180
);

}


function tfCloseDrawer(){

document
.getElementById(
"tfTaskDrawer"
)
?.classList
.remove(
"open"
);


document
.getElementById(
"tfDrawerBackdrop"
)
?.classList
.remove(
"open"
);


editingTaskId =
null;

}


function tfSaveDrawer(){

const name =
document
.getElementById(
"tfDrawerTitle"
)
.value
.trim();


if(!name){

alert(
"Enter a task name."
);

return;

}


const array =
tfTasks();


let task =
editingTaskId
? tfFindTask(
editingTaskId
)
: null;


if(!task){

task = {

id:
(
window.crypto
&&
crypto.randomUUID
)
? crypto.randomUUID()
: Date.now(),

name,

course:"",

date:"",

priority:"Medium",

status:"todo",

details:""

};


array.push(
task
);

}


task.name =
name;


task.status =
document
.getElementById(
"tfDrawerStatus"
).value;


task.priority =
document
.getElementById(
"tfDrawerPriority"
).value;


task.course =
document
.getElementById(
"tfDrawerCourse"
).value;


task.date =
document
.getElementById(
"tfDrawerDate"
).value;


task.details =
document
.getElementById(
"tfDrawerDetails"
).value
.trim();


tfSave();

tfCloseDrawer();

tfRenderBoard();

tfRenderCalendar();

}


function tfDeleteDrawer(){

if(!editingTaskId){

return;

}


const array =
tfTasks();


const index =
array.findIndex(
task =>
String(task.id) ===
String(editingTaskId)
);


if(index === -1){

return;

}


if(
!confirm(
"Delete this task?"
)
){

return;

}


array.splice(
index,
1
);


tfSave();

tfCloseDrawer();

tfRenderBoard();

tfRenderCalendar();

}


/* =========================================================
   CALENDAR
========================================================= */

function tfRenderCalendar(){

const grid =
document.getElementById(
"tfCalendarGrid"
);


if(!grid){

return;

}


const year =
calendarDate
.getFullYear();


const month =
calendarDate
.getMonth();


document
.getElementById(
"tfCalendarTitle"
).textContent =
calendarDate
.toLocaleDateString(
undefined,
{
month:"long",
year:"numeric"
}
);


const first =
new Date(
year,
month,
1
);


const gridStart =
new Date(
year,
month,
1 -
first.getDay()
);


grid.innerHTML =
"";


for(
let i = 0;
i < 42;
i++
){

const date =
new Date(
gridStart
);


date.setDate(
gridStart.getDate() + i
);


const dateKey =
tfDateKey(date);


const outside =
date.getMonth() !==
month;


const today =
dateKey ===
tfToday();


const cell =
document.createElement(
"div"
);


cell.className =
[
"tf-day",
outside
? "outside"
: "",
today
? "today"
: ""
]
.filter(Boolean)
.join(" ");


cell.dataset.date =
dateKey;


cell.innerHTML = `

<div class="tf-day-number">
${date.getDate()}
</div>

`;


const events =
tfTasks()
.filter(
task =>
task.date ===
dateKey
);


events.forEach(
task => {

const event =
document.createElement(
"div"
);


event.className =
[
"tf-calendar-event",
tfPriority(task.priority) ===
"High"
? "high"
: "",
tfNormalizeStatus(
task.status
) === "done"
? "done"
: ""
]
.filter(Boolean)
.join(" ");


event.textContent =
task.name ||
"Untitled";


event.draggable =
true;


event.addEventListener(
"click",
clickEvent => {

clickEvent.stopPropagation();

tfOpenDrawer(
task.id
);

}
);


event.addEventListener(
"dragstart",
dragEvent => {

dragEvent.stopPropagation();


dragEvent
.dataTransfer
.setData(
"text/plain",
String(task.id)
);

}
);


cell.appendChild(
event
);

}
);


cell.addEventListener(
"click",
event => {

if(
event.target.closest(
".tf-calendar-event"
)
){

return;

}


tfOpenDrawer(
null,
dateKey
);

}
);


cell.addEventListener(
"dragover",
event => {

event.preventDefault();

cell.classList.add(
"drag-over"
);

}
);


cell.addEventListener(
"dragleave",
() => {

cell.classList.remove(
"drag-over"
);

}
);


cell.addEventListener(
"drop",
event => {

event.preventDefault();


cell.classList.remove(
"drag-over"
);


const id =
event.dataTransfer
.getData(
"text/plain"
);


const task =
tfFindTask(id);


if(!task){

return;

}


task.date =
dateKey;


tfSave();

tfRenderCalendar();

tfRenderBoard();

}
);


grid.appendChild(
cell
);

}

}


/* =========================================================
   EVENT BINDINGS
========================================================= */

function tfBind(){

document
.getElementById(
"tfNewTask"
)
.onclick =
() => tfOpenDrawer();


document
.getElementById(
"tfCalendarNewTask"
)
.onclick =
() => tfOpenDrawer();


document
.getElementById(
"tfOpenCalendar"
)
.onclick =
() => tfGo(
"calendarPro"
);


document
.getElementById(
"tfOpenTasks"
)
.onclick =
() => tfGo(
"tasksPro"
);


document
.getElementById(
"tfTaskSearch"
)
.addEventListener(
"input",
event => {

taskSearch =
event.target.value;

tfRenderBoard();

}
);


document
.getElementById(
"tfPriorityFilter"
)
.addEventListener(
"change",
event => {

priorityFilter =
event.target.value;

tfRenderBoard();

}
);


document
.getElementById(
"tfCalPrev"
)
.onclick =
() => {

calendarDate =
new Date(
calendarDate.getFullYear(),
calendarDate.getMonth() - 1,
1
);


tfRenderCalendar();

};


document
.getElementById(
"tfCalNext"
)
.onclick =
() => {

calendarDate =
new Date(
calendarDate.getFullYear(),
calendarDate.getMonth() + 1,
1
);


tfRenderCalendar();

};


document
.getElementById(
"tfCalToday"
)
.onclick =
() => {

calendarDate =
new Date(
new Date().getFullYear(),
new Date().getMonth(),
1
);


tfRenderCalendar();

};


tfInstallBoardDrop();

}


/* =========================================================
   INITIALIZATION
========================================================= */

function tfInitialize(){

if(
initialized
||
!tfLoggedIn()
){

return;

}


if(
!tfCreatePages()
){

return;

}


tfCreateDrawer();

tfAddNav();

tfBind();

tfRenderBoard();

tfRenderCalendar();


initialized =
true;


console.log(
"✅ StudyFlow Tasks Pro + Calendar Pro ready"
);

}


/*
Wait until the real StudyFlow account is logged in.

This intentionally does NOTHING on the login screen,
so PART 13 cannot interfere with Email / Password.
*/

const tfTimer =
setInterval(
() => {

if(
tfLoggedIn()
){

tfInitialize();

}


if(initialized){

clearInterval(
tfTimer
);

}

},
400
);

})();
