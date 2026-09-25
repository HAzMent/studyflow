
(function(){

let sf15Initialized = false;

let sf15WeekStart =
sf15Monday(
new Date()
);

let sf15EditingId =
null;


/* =========================================================
   HELPERS
========================================================= */

function sf15User(){

try{

return (
typeof currentUser !== "undefined"
? currentUser
: null
);

}catch{

return null;

}

}


function sf15Key(name){

try{

if(
typeof key ===
"function"
){

return key(name);

}

}catch{}


return `studyflow_${
sf15User()?.id || "guest"
}_${name}`;

}


function sf15Tasks(){

try{

return (
typeof tasks !== "undefined"
&& Array.isArray(tasks)
)
? tasks
: [];

}catch{

return [];

}

}


function sf15Classes(){

try{

return (
typeof classes !== "undefined"
&& Array.isArray(classes)
)
? classes
: [];

}catch{

return [];

}

}


function sf15Escape(value){

return String(value ?? "")
.replaceAll("&","&amp;")
.replaceAll("<","&lt;")
.replaceAll(">","&gt;")
.replaceAll('"',"&quot;")
.replaceAll("'","&#039;");

}


function sf15Monday(date){

const result =
new Date(date);

result.setHours(
0,0,0,0
);


const day =
result.getDay();


const diff =
day === 0
? -6
: 1 - day;


result.setDate(
result.getDate() + diff
);


return result;

}


function sf15DateKey(date){

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


function sf15TimeToMinutes(value){

if(!value){

return 0;

}


const [
hour,
minute
] =
value
.split(":")
.map(Number);


return hour * 60 + minute;

}


function sf15MinutesToTime(minutes){

const hour =
Math.floor(
minutes / 60
);


const minute =
minutes % 60;


return `${String(hour)
.padStart(2,"0")}:${String(minute)
.padStart(2,"0")}`;

}


function sf15FormatTime(value){

if(!value){

return "";

}


const [
hour,
minute
] =
value
.split(":")
.map(Number);


const date =
new Date();

date.setHours(
hour,
minute,
0,
0
);


return date
.toLocaleTimeString(
undefined,
{
hour:"numeric",
minute:"2-digit"
}
);

}


function sf15DayIndex(date){

const day =
date.getDay();


return day === 0
? 6
: day - 1;

}


function sf15WeekDates(){

return Array
.from(
{
length:7
},
(_,index) => {

const date =
new Date(
sf15WeekStart
);

date.setDate(
sf15WeekStart.getDate() +
index
);


return date;

}
);

}


/* =========================================================
   STORAGE
========================================================= */

function sf15LoadBlocks(){

try{

const parsed =
JSON.parse(
localStorage.getItem(
sf15Key(
"scheduleBlocks"
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


function sf15SaveBlocks(
blocks
){

localStorage.setItem(
sf15Key(
"scheduleBlocks"
),
JSON.stringify(
blocks
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


function sf15Blocks(){

return sf15LoadBlocks();

}


/* =========================================================
   CREATE PAGE
========================================================= */

function sf15CreatePage(){

if(
document.getElementById(
"smartSchedule"
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
"smartSchedule";


page.className =
"page sf15-page hidden";


page.innerHTML = `

<div class="sf15-head">

<div>

<p class="eyebrow">
SMART PLANNING
</p>

<h1>
Smart Schedule
</h1>

<p class="sf15-sub">
Build your real weekly schedule and let StudyFlow fit study sessions around your life.
</p>

</div>


<div class="sf15-actions">

<button
type="button"
id="sf15AddBlock"
>
+ Add Block
</button>

<button
type="button"
id="sf15AutoPlan"
>
✦ Auto Plan Tasks
</button>

<button
type="button"
class="secondary"
id="sf15Notify"
>
🔔 Reminders
</button>

</div>

</div>


<div class="sf15-summary">

<div class="sf15-stat">

<strong id="sf15ClassHours">
0h
</strong>

<span>
Class this week
</span>

</div>


<div class="sf15-stat">

<strong id="sf15StudyHours">
0h
</strong>

<span>
Planned study
</span>

</div>


<div class="sf15-stat">

<strong id="sf15OpenCount">
0
</strong>

<span>
Open tasks
</span>

</div>


<div class="sf15-stat">

<strong id="sf15FreeSlots">
0
</strong>

<span>
Free study slots
</span>

</div>

</div>


<div class="sf15-control">

<div class="sf15-week-title"
id="sf15WeekTitle">
This Week
</div>


<div class="sf15-week-nav">

<button
type="button"
id="sf15PrevWeek"
>
←
</button>

<button
type="button"
id="sf15ThisWeek"
>
Today
</button>

<button
type="button"
id="sf15NextWeek"
>
→
</button>

</div>

</div>


<div
id="sf15Week"
class="sf15-week"
></div>


<div class="sf15-lower">


<div class="sf15-card">

<div class="sf15-card-head">

<h2>
Weekly Workload
</h2>

<span>
Scheduled hours
</span>

</div>

<div
id="sf15Workload"
class="sf15-load-list"
></div>

</div>


<div class="sf15-card">

<div class="sf15-card-head">

<h2>
✦ AI Weekly Coach
</h2>

<button
type="button"
class="secondary"
id="sf15CoachButton"
>
Analyze
</button>

</div>

<div
id="sf15Coach"
class="sf15-coach"
>
Ask StudyFlow to review your workload and deadlines.
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

function sf15AddNav(){

const sidebar =
document.querySelector(
"aside"
);


if(
!sidebar ||
sidebar.querySelector(
'[data-page="smartSchedule"]'
)
){

return;

}


const button =
document.createElement(
"button"
);


button.className =
"nav sf15-nav";


button.dataset.page =
"smartSchedule";


button.innerHTML =
`🗓 Smart Schedule <span class="sf15-new">NEW</span>`;


button.onclick =
event => {

event.preventDefault();

event.stopPropagation();

sf15Go();

};


const today =
sidebar.querySelector(
'[data-page="todayPro"]'
);


if(today){

today.insertAdjacentElement(
"afterend",
button
);

}else{

const calendar =
sidebar.querySelector(
'[data-page="calendar"]'
);


if(calendar){

calendar.insertAdjacentElement(
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


function sf15Go(){

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
"smartSchedule"
)
.classList
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
"smartSchedule"
);

}
);


sf15Render();

}


/* =========================================================
   DRAWER
========================================================= */

function sf15CreateDrawer(){

if(
document.getElementById(
"sf15Drawer"
)
){

return;

}


const backdrop =
document.createElement(
"div"
);


backdrop.id =
"sf15Backdrop";


const drawer =
document.createElement(
"aside"
);


drawer.id =
"sf15Drawer";


drawer.innerHTML = `

<div class="sf15-drawer-head">

<strong>
SCHEDULE BLOCK
</strong>

<button
type="button"
id="sf15Close"
class="sf15-close"
>
×
</button>

</div>


<div class="sf15-field">

<label>
TITLE
</label>

<input
id="sf15Title"
placeholder="Calculus lecture, Work, Gym..."
>

</div>


<div class="sf15-field">

<label>
TYPE
</label>

<select id="sf15Type">

<option value="class">
Class
</option>

<option value="work">
Work
</option>

<option value="study">
Study
</option>

<option value="personal">
Personal
</option>

</select>

</div>


<div class="sf15-field">

<label>
REPEAT ON
</label>

<div class="sf15-days">

${[
["Mon",0],
["Tue",1],
["Wed",2],
["Thu",3],
["Fri",4],
["Sat",5],
["Sun",6]
]
.map(
([label,index]) => `

<label class="sf15-day-check">

<input
type="checkbox"
value="${index}"
>

<span>
${label}
</span>

</label>

`
)
.join("")}

</div>

</div>


<div class="sf15-two">

<div class="sf15-field">

<label>
START
</label>

<input
type="time"
id="sf15Start"
value="09:00"
>

</div>


<div class="sf15-field">

<label>
END
</label>

<input
type="time"
id="sf15End"
value="10:00"
>

</div>

</div>


<div class="sf15-field">

<label>
COURSE
</label>

<select id="sf15Course">
</select>

</div>


<div class="sf15-field">

<label>
NOTES
</label>

<textarea
id="sf15Notes"
placeholder="Room, professor, location, reminder..."
></textarea>

</div>


<div class="sf15-drawer-actions">

<button
type="button"
id="sf15Save"
>
Save Block
</button>

<button
type="button"
id="sf15Delete"
class="sf15-delete"
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
sf15CloseDrawer;


document
.getElementById(
"sf15Close"
)
.onclick =
sf15CloseDrawer;


document
.getElementById(
"sf15Save"
)
.onclick =
sf15SaveDrawer;


document
.getElementById(
"sf15Delete"
)
.onclick =
sf15DeleteDrawer;

}


function sf15CourseOptions(
selected = ""
){

const names =
[
...new Set(
sf15Classes()
.map(
course =>
course.name
)
.filter(Boolean)
)
];


return `

<option value="">
None
</option>

${names.map(name => `

<option
value="${sf15Escape(name)}"
${name === selected ? "selected" : ""}
>
${sf15Escape(name)}
</option>

`).join("")}

`;

}


function sf15OpenDrawer(
id = null
){

sf15EditingId =
id;


const block =
id
? sf15Blocks()
.find(
item =>
String(item.id) ===
String(id)
)
: null;


document
.getElementById(
"sf15Title"
).value =
block?.title || "";


document
.getElementById(
"sf15Type"
).value =
block?.type || "class";


document
.getElementById(
"sf15Start"
).value =
block?.start || "09:00";


document
.getElementById(
"sf15End"
).value =
block?.end || "10:00";


document
.getElementById(
"sf15Course"
).innerHTML =
sf15CourseOptions(
block?.course || ""
);


document
.getElementById(
"sf15Notes"
).value =
block?.notes || "";


document
.querySelectorAll(
'.sf15-day-check input'
)
.forEach(
input => {

input.checked =
block?.days
?.includes(
Number(input.value)
)
||
false;

}
);


document
.getElementById(
"sf15Delete"
).style.display =
block
? ""
: "none";


document
.getElementById(
"sf15Backdrop"
)
.classList.add(
"open"
);


document
.getElementById(
"sf15Drawer"
)
.classList.add(
"open"
);


setTimeout(
() => {

document
.getElementById(
"sf15Title"
)
.focus();

},
150
);

}


function sf15CloseDrawer(){

document
.getElementById(
"sf15Backdrop"
)
?.classList
.remove(
"open"
);


document
.getElementById(
"sf15Drawer"
)
?.classList
.remove(
"open"
);


sf15EditingId =
null;

}


function sf15SaveDrawer(){

const title =
document
.getElementById(
"sf15Title"
)
.value
.trim();


if(!title){

alert(
"Enter a title."
);

return;

}


const days =
[
...document
.querySelectorAll(
'.sf15-day-check input:checked'
)
]
.map(
input =>
Number(
input.value
)
);


if(!days.length){

alert(
"Choose at least one day."
);

return;

}


const start =
document
.getElementById(
"sf15Start"
).value;


const end =
document
.getElementById(
"sf15End"
).value;


if(
sf15TimeToMinutes(end) <=
sf15TimeToMinutes(start)
){

alert(
"End time must be after start time."
);

return;

}


const blocks =
sf15Blocks();


let block =
sf15EditingId
? blocks.find(
item =>
String(item.id) ===
String(sf15EditingId)
)
: null;


if(!block){

block = {

id:
crypto.randomUUID
? crypto.randomUUID()
: Date.now(),

source:
"manual"

};


blocks.push(
block
);

}


block.title =
title;


block.type =
document
.getElementById(
"sf15Type"
).value;


block.days =
days;


block.start =
start;


block.end =
end;


block.course =
document
.getElementById(
"sf15Course"
).value;


block.notes =
document
.getElementById(
"sf15Notes"
).value
.trim();


sf15SaveBlocks(
blocks
);


sf15CloseDrawer();

sf15Render();

}


function sf15DeleteDrawer(){

if(!sf15EditingId){

return;

}


if(
!confirm(
"Delete this schedule block?"
)
){

return;

}


const blocks =
sf15Blocks()
.filter(
item =>
String(item.id) !==
String(sf15EditingId)
);


sf15SaveBlocks(
blocks
);


sf15CloseDrawer();

sf15Render();

}


/* =========================================================
   RENDER WEEK
========================================================= */

function sf15BlocksForDay(
date
){

const dayIndex =
sf15DayIndex(
date
);


return sf15Blocks()
.filter(
block =>
block.days
?.includes(
dayIndex
)
)
.sort(
(a,b) =>
sf15TimeToMinutes(
a.start
) -
sf15TimeToMinutes(
b.start
)
);

}


function sf15Render(){

sf15RenderWeek();

sf15RenderSummary();

sf15RenderWorkload();

}


function sf15RenderWeek(){

const container =
document.getElementById(
"sf15Week"
);


if(!container){

return;

}


const dates =
sf15WeekDates();


const end =
dates[6];


document
.getElementById(
"sf15WeekTitle"
).textContent =
`${dates[0].toLocaleDateString(
undefined,
{
month:"short",
day:"numeric"
}
)} — ${end.toLocaleDateString(
undefined,
{
month:"short",
day:"numeric",
year:"numeric"
}
)}`;


const todayKey =
sf15DateKey(
new Date()
);


container.innerHTML =
dates
.map(
date => {

const blocks =
sf15BlocksForDay(
date
);


const dateKey =
sf15DateKey(
date
);


const minutes =
blocks.reduce(
(total,block) =>
total +
Math.max(
0,
sf15TimeToMinutes(
block.end
) -
sf15TimeToMinutes(
block.start
)
),
0
);


return `

<div
class="sf15-day ${
dateKey === todayKey
? "today"
: ""
}"
>

<div class="sf15-day-head">

<div class="sf15-day-name">
${date
.toLocaleDateString(
undefined,
{
weekday:"short"
}
)
.toUpperCase()}
</div>

<div class="sf15-day-date">
${date.getDate()}
</div>

<div class="sf15-day-load">
${Math.round(
minutes / 60 * 10
) / 10}h scheduled
</div>

</div>


${blocks.length
? blocks
.map(
block => `

<div
class="sf15-block ${sf15Escape(block.type)}"
data-block-id="${sf15Escape(block.id)}"
>

<div class="sf15-block-time">

${sf15FormatTime(
block.start
)}
–
${sf15FormatTime(
block.end
)}

</div>

<strong>
${sf15Escape(block.title)}
</strong>

${block.course
? `
<small>
${sf15Escape(block.course)}
</small>
`
: ""}

${block.source === "auto"
? `
<span class="sf15-ai-tag">
AUTO PLANNED
</span>
`
: ""}

</div>

`
)
.join("")
: `
<div class="sf15-empty">
Free day
</div>
`}

</div>

`;

}
)
.join("");


container
.querySelectorAll(
".sf15-block"
)
.forEach(
block => {

block.onclick =
() =>
sf15OpenDrawer(
block.dataset.blockId
);

}
);

}


/* =========================================================
   SUMMARY
========================================================= */

function sf15DurationByType(
type
){

return sf15Blocks()
.filter(
block =>
block.type === type
)
.reduce(
(total,block) => {

const duration =
Math.max(
0,
sf15TimeToMinutes(
block.end
) -
sf15TimeToMinutes(
block.start
)
);


return total +
duration *
(block.days?.length || 0);

},
0
);

}


function sf15EstimateFreeSlots(){

const blocks =
sf15Blocks();


let count = 0;


for(
let day = 0;
day < 7;
day++
){

for(
let start = 16 * 60;
start <= 21 * 60;
start += 60
){

const end =
start + 50;


const collision =
blocks.some(
block =>
block.days
?.includes(day)
&&
sf15TimeToMinutes(
block.start
) < end
&&
sf15TimeToMinutes(
block.end
) > start
);


if(!collision){

count++;

}

}

}


return count;

}


function sf15RenderSummary(){

const classMinutes =
sf15DurationByType(
"class"
);


const studyMinutes =
sf15DurationByType(
"study"
);


const openTasks =
sf15Tasks()
.filter(
task =>
task.status !==
"done"
)
.length;


document
.getElementById(
"sf15ClassHours"
).textContent =
`${Math.round(
classMinutes / 60 * 10
) / 10}h`;


document
.getElementById(
"sf15StudyHours"
).textContent =
`${Math.round(
studyMinutes / 60 * 10
) / 10}h`;


document
.getElementById(
"sf15OpenCount"
).textContent =
openTasks;


document
.getElementById(
"sf15FreeSlots"
).textContent =
sf15EstimateFreeSlots();

}


/* =========================================================
   WORKLOAD
========================================================= */

function sf15RenderWorkload(){

const container =
document.getElementById(
"sf15Workload"
);


if(!container){

return;

}


const dates =
sf15WeekDates();


const data =
dates.map(
date => {

const blocks =
sf15BlocksForDay(
date
);


const minutes =
blocks.reduce(
(total,block) =>
total +
Math.max(
0,
sf15TimeToMinutes(
block.end
) -
sf15TimeToMinutes(
block.start
)
),
0
);


return {
date,
minutes
};

}
);


const max =
Math.max(
...data.map(
item =>
item.minutes
),
60
);


container.innerHTML =
data
.map(
item => {

const width =
Math.min(
100,
item.minutes /
max *
100
);


return `

<div class="sf15-load-row">

<strong>
${item.date
.toLocaleDateString(
undefined,
{
weekday:"short"
}
)}
</strong>

<div class="sf15-load-track">

<div
class="sf15-load-fill"
style="width:${width}%"
></div>

</div>

<span>
${Math.round(
item.minutes / 60 * 10
) / 10}h
</span>

</div>

`;

}
)
.join("");

}


/* =========================================================
   AUTO PLANNER
========================================================= */

function sf15ClearAutoStudyBlocks(){

const manual =
sf15Blocks()
.filter(
block =>
block.source !==
"auto"
);


sf15SaveBlocks(
manual
);

}


function sf15TaskScore(
task
){

let score = 0;


if(
task.priority ===
"High"
){

score += 100;

}


if(
task.priority ===
"Medium"
){

score += 50;

}


if(task.date){

const today =
new Date();

today.setHours(
0,0,0,0
);


const due =
new Date(
task.date +
"T00:00:00"
);


const days =
Math.round(
(due - today) /
86400000
);


if(days <= 0){

score += 120;

}else if(days <= 2){

score += 90;

}else if(days <= 7){

score += 50;

}else{

score += 10;

}

}


return score;

}


function sf15FindSlot(
day,
duration,
blocks
){

const ranges = [

[9 * 60,12 * 60],

[13 * 60,17 * 60],

[17 * 60,21 * 60]

];


for(
const [
rangeStart,
rangeEnd
] of ranges
){

for(
let start = rangeStart;
start + duration <=
rangeEnd;
start += 30
){

const end =
start + duration;


const collision =
blocks.some(
block =>
block.days
?.includes(day)
&&
sf15TimeToMinutes(
block.start
) < end
&&
sf15TimeToMinutes(
block.end
) > start
);


if(!collision){

return {
start,
end
};

}

}

}


return null;

}


function sf15AutoPlan(){

const openTasks =
sf15Tasks()
.filter(
task =>
task.status !==
"done"
)
.sort(
(a,b) =>
sf15TaskScore(b) -
sf15TaskScore(a)
);


if(!openTasks.length){

alert(
"No open tasks to schedule."
);

return;

}


sf15ClearAutoStudyBlocks();


const blocks =
sf15Blocks();


const newBlocks =
[
...blocks
];


const today =
new Date();

today.setHours(
0,0,0,0
);


let created = 0;


openTasks
.slice(
0,
12
)
.forEach(
task => {

let duration =
task.priority === "High"
? 60
: 50;


let preferredDays =
[0,1,2,3,4,5,6];


if(task.date){

const due =
new Date(
task.date +
"T00:00:00"
);


const dueIndex =
sf15DayIndex(
due
);


preferredDays =
preferredDays
.filter(
day =>
day <= dueIndex
);


if(!preferredDays.length){

preferredDays =
[0,1,2,3,4,5,6];

}

}


for(
const day of preferredDays
){

const slot =
sf15FindSlot(
day,
duration,
newBlocks
);


if(!slot){

continue;

}


newBlocks.push({

id:
crypto.randomUUID
? crypto.randomUUID()
: Date.now() +
Math.random(),

title:
`Study: ${
task.name ||
"Assignment"
}`,

type:
"study",

days:[
day
],

start:
sf15MinutesToTime(
slot.start
),

end:
sf15MinutesToTime(
slot.end
),

course:
task.course || "",

notes:
task.date
? `Task due ${task.date}`
: "Auto-planned by StudyFlow",

source:
"auto",

taskId:
task.id

});


created++;

break;

}

}
);


sf15SaveBlocks(
newBlocks
);


sf15Render();


alert(
`StudyFlow created ${created} study block${
created === 1
? ""
: "s"
}.`
);

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

async function sf15Notifications(){

if(
!("Notification" in window)
){

alert(
"Notifications are not supported by this browser."
);

return;

}


const permission =
await Notification
.requestPermission();


if(
permission !==
"granted"
){

alert(
"Notification permission was not granted."
);

return;

}


new Notification(
"StudyFlow reminders enabled 🎓",
{
body:
"We'll remind you about important deadlines while StudyFlow is open."
}
);


sf15CheckDeadlines();

}


function sf15CheckDeadlines(){

if(
!("Notification" in window)
||
Notification.permission !==
"granted"
){

return;

}


const tomorrow =
new Date();

tomorrow.setDate(
tomorrow.getDate() + 1
);


const tomorrowKey =
sf15DateKey(
tomorrow
);


const due =
sf15Tasks()
.filter(
task =>
task.status !==
"done"
&&
task.date ===
tomorrowKey
);


if(due.length){

new Notification(
"StudyFlow — Due Tomorrow",
{
body:
`${due.length} task${
due.length === 1
? ""
: "s"
} due tomorrow.`
}
);

}

}


/* =========================================================
   AI COACH
========================================================= */

async function sf15Api(
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


async function sf15Coach(){

const button =
document.getElementById(
"sf15CoachButton"
);


const output =
document.getElementById(
"sf15Coach"
);


button.disabled =
true;


button.textContent =
"Analyzing...";


output.textContent =
"StudyFlow is reviewing your week...";


const schedule =
sf15Blocks()
.map(
block => ({
title:
block.title,
type:
block.type,
days:
block.days,
start:
block.start,
end:
block.end,
course:
block.course
})
);


const taskList =
sf15Tasks()
.filter(
task =>
task.status !==
"done"
)
.slice(
0,
15
)
.map(
task => ({
task:
task.name,
course:
task.course,
due:
task.date,
priority:
task.priority
})
);


const prompt = `
You are StudyFlow's weekly planning coach.

Review this student's weekly commitments:
${JSON.stringify(schedule,null,2)}

Open tasks:
${JSON.stringify(taskList,null,2)}

Give a concise weekly planning analysis.

Include:
- busiest day
- biggest deadline risk
- one suggestion for moving study time
- whether workload looks balanced
- one concrete action for today

Keep it concise and practical.
`;


try{

const result =
await sf15Api(
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
result.answer ||
"No analysis returned.";


}catch(error){

output.textContent =
`AI Coach unavailable right now.

Your schedule is still saved and Auto Plan works without AI.`;

}


button.disabled =
false;


button.textContent =
"Analyze";

}


/* =========================================================
   EVENTS
========================================================= */

function sf15Bind(){

document
.getElementById(
"sf15AddBlock"
)
.onclick =
() =>
sf15OpenDrawer();


document
.getElementById(
"sf15AutoPlan"
)
.onclick =
sf15AutoPlan;


document
.getElementById(
"sf15Notify"
)
.onclick =
sf15Notifications;


document
.getElementById(
"sf15CoachButton"
)
.onclick =
sf15Coach;


document
.getElementById(
"sf15PrevWeek"
)
.onclick =
() => {

sf15WeekStart =
new Date(
sf15WeekStart
);


sf15WeekStart.setDate(
sf15WeekStart.getDate() -
7
);


sf15Render();

};


document
.getElementById(
"sf15NextWeek"
)
.onclick =
() => {

sf15WeekStart =
new Date(
sf15WeekStart
);


sf15WeekStart.setDate(
sf15WeekStart.getDate() +
7
);


sf15Render();

};


document
.getElementById(
"sf15ThisWeek"
)
.onclick =
() => {

sf15WeekStart =
sf15Monday(
new Date()
);


sf15Render();

};

}


/* =========================================================
   INIT
========================================================= */

function sf15Initialize(){

if(
sf15Initialized ||
!sf15User()
){

return;

}


sf15CreatePage();

sf15CreateDrawer();

sf15AddNav();

sf15Bind();

sf15Render();

sf15CheckDeadlines();


sf15Initialized =
true;


console.log(
"✅ StudyFlow Smart Schedule ready"
);

}


const timer =
setInterval(
() => {

if(sf15User()){

sf15Initialize();

}


if(sf15Initialized){

clearInterval(
timer
);

}

},
400
);

})();
