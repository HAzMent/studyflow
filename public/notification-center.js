
(function(){

let initialized = false;
let notifications = [];


/* =========================================
   DATA
========================================= */

function getUser(){
try{
return typeof currentUser !== "undefined"
? currentUser
: null;
}catch{
return null;
}
}


function getTasks(){
try{
return (
typeof tasks !== "undefined" &&
Array.isArray(tasks)
)
? tasks
: [];
}catch{
return [];
}
}


function userKey(name){
try{
if(typeof key === "function"){
return key(name);
}
}catch{}

return `studyflow_${getUser()?.id || "guest"}_${name}`;
}


function getJSON(name){
try{
const parsed = JSON.parse(
localStorage.getItem(
userKey(name)
)
);

return Array.isArray(parsed)
? parsed
: [];
}catch{
return [];
}
}


function dateKey(date){

const y = date.getFullYear();

const m = String(
date.getMonth() + 1
).padStart(2,"0");

const d = String(
date.getDate()
).padStart(2,"0");

return `${y}-${m}-${d}`;
}


function todayKey(){
return dateKey(new Date());
}


function daysUntil(value){

if(!value){
return null;
}

const today = new Date();
today.setHours(0,0,0,0);

const target = new Date(
value + "T00:00:00"
);

return Math.ceil(
(target - today) /
86400000
);
}


/* =========================================
   NAVIGATION
========================================= */

function openPage(pageId){

const target =
document.getElementById(pageId);

if(!target){
return;
}


if(
typeof window.sf23ActivatePage ===
"function"
){

window.sf23ActivatePage(
pageId
);

}else{

document
.querySelectorAll("main .page")
.forEach(page => {

page.classList.remove("active");
page.classList.add("hidden");

});

target.classList.remove("hidden");
target.classList.add("active");

}


document
.getElementById("sf25Panel")
?.classList
.remove("open");

}


/* =========================================
   BUILD NOTIFICATIONS
========================================= */

function buildNotifications(){

const result = [];

const openTasks =
getTasks()
.filter(
task =>
task.status !== "done"
);


openTasks.forEach(task => {

const days =
daysUntil(task.date);


if(days === null){
return;
}


if(days < 0){

result.push({

section:"Needs attention",

icon:"!",

title:
task.name || "Overdue task",

text:
`Overdue by ${Math.abs(days)} day${
Math.abs(days) === 1 ? "" : "s"
}.`,

meta:
task.course || "Task",

page:
document.getElementById("tasksPro")
? "tasksPro"
: "tasks",

weight:1000 + Math.abs(days)

});

return;
}


if(days === 0){

result.push({

section:"Today",

icon:"✓",

title:
task.name || "Task due today",

text:
"Due today.",

meta:
task.course || "Task",

page:
document.getElementById("tasksPro")
? "tasksPro"
: "tasks",

weight:900

});

return;
}


if(days === 1){

result.push({

section:"Coming up",

icon:"→",

title:
task.name || "Task due tomorrow",

text:
"Due tomorrow.",

meta:
task.course || "Task",

page:
document.getElementById("tasksPro")
? "tasksPro"
: "tasks",

weight:800

});

return;
}


if(
days <= 3 &&
task.priority === "High"
){

result.push({

section:"Coming up",

icon:"↑",

title:
task.name || "High priority task",

text:
`Due in ${days} days.`,

meta:
`${task.course || "Task"} · High priority`,

page:
document.getElementById("tasksPro")
? "tasksPro"
: "tasks",

weight:700

});

}

});


/* EXAMS */

getJSON("examMode")
.forEach(exam => {

const days =
daysUntil(exam.date);


if(
days === null ||
days < 0 ||
days > 14
){
return;
}


let text = "";


if(days === 0){

text =
"Exam is today.";

}else if(days === 1){

text =
"Exam is tomorrow.";

}else{

text =
`${days} days until exam.`;

}


result.push({

section:
days <= 3
? "Needs attention"
: "Upcoming exams",

icon:"◎",

title:
exam.name || "Exam",

text,

meta:
exam.course || "Exam",

page:"examMode",

weight:
850 - days

});

});


/* TODAY'S SCHEDULE */

const today =
new Date()
.getDay();

const dayIndex =
today === 0
? 6
: today - 1;


const blocks =
getJSON("scheduleBlocks")
.filter(block =>
Array.isArray(block.days) &&
block.days.includes(dayIndex)
);


if(blocks.length){

result.push({

section:"Today",

icon:"◷",

title:
`${blocks.length} scheduled block${
blocks.length === 1
? ""
: "s"
} today`,

text:
blocks
.slice(0,3)
.map(block =>
`${block.start || ""} ${block.title || "Study"}`
)
.join(" · "),

meta:"Smart Schedule",

page:"smartSchedule",

weight:500

});

}


return result
.sort(
(a,b) =>
b.weight - a.weight
);

}


/* =========================================
   READ STATE
========================================= */

function readState(){

try{

return JSON.parse(
localStorage.getItem(
userKey("notificationRead")
)
) || {};

}catch{

return {};

}

}


function markAllRead(){

const read = {};


notifications.forEach(
(_,index) => {

read[index] = true;

}
);


localStorage.setItem(
userKey("notificationRead"),
JSON.stringify(read)
);


updateBadge();

}


function clearRead(){

localStorage.removeItem(
userKey("notificationRead")
);


updateBadge();

}


function unreadCount(){

const read =
readState();


return notifications
.filter(
(_,index) =>
!read[index]
)
.length;

}


/* =========================================
   UI
========================================= */

function createUI(){

if(
document.getElementById(
"sf25Button"
)
){
return;
}


const button =
document.createElement(
"button"
);


button.id =
"sf25Button";


button.type =
"button";


button.innerHTML = `

🔔

<span id="sf25Badge">
0
</span>

`;


const panel =
document.createElement(
"section"
);


panel.id =
"sf25Panel";


panel.innerHTML = `

<div class="sf25-head">

<div>

<strong>
Notifications
</strong>

<small>
Deadlines and academic alerts
</small>

</div>


<div class="sf25-head-actions">

<button
type="button"
id="sf25EnableBrowser"
>
Browser
</button>

<button
type="button"
id="sf25MarkRead"
>
Read all
</button>

</div>

</div>


<div
id="sf25Body"
class="sf25-body"
></div>


<div class="sf25-footer">
StudyFlow checks your current tasks, exams and schedule.
</div>

`;


document.body.appendChild(
button
);


document.body.appendChild(
panel
);


button.onclick =
() => {

panel.classList.toggle(
"open"
);

if(
panel.classList
.contains("open")
){

render();

}

};


document
.getElementById(
"sf25MarkRead"
)
.onclick =
() => {

markAllRead();

render();

};


document
.getElementById(
"sf25EnableBrowser"
)
.onclick =
enableBrowserNotifications;

}


/* =========================================
   RENDER
========================================= */

function render(){

notifications =
buildNotifications();


const container =
document.getElementById(
"sf25Body"
);


if(!container){
return;
}


if(!notifications.length){

container.innerHTML = `

<div class="sf25-empty">

<strong>
You're all caught up.
</strong>

<br><br>

No urgent deadlines or exams right now.

</div>

`;


updateBadge();

return;
}


let section = "";


container.innerHTML =
notifications
.map(
(item,index) => {

let heading = "";


if(
item.section !==
section
){

section =
item.section;


heading = `

<div class="sf25-section">
${item.section.toUpperCase()}
</div>

`;

}


return `

${heading}

<div
class="sf25-item"
data-index="${index}"
>

<div class="sf25-icon">
${item.icon}
</div>

<div class="sf25-content">

<strong>
${item.title}
</strong>

<p>
${item.text}
</p>

<div class="sf25-meta">
${item.meta}
</div>

</div>

</div>

`;

}
)
.join("");


container
.querySelectorAll(
".sf25-item"
)
.forEach(
element => {

element.onclick =
() => {

const index =
Number(
element.dataset.index
);


const item =
notifications[index];


const read =
readState();


read[index] =
true;


localStorage.setItem(
userKey("notificationRead"),
JSON.stringify(read)
);


updateBadge();


openPage(
item.page
);

};

}
);


updateBadge();

}


/* =========================================
   BADGE
========================================= */

function updateBadge(){

notifications =
buildNotifications();


const badge =
document.getElementById(
"sf25Badge"
);


if(!badge){
return;
}


const count =
unreadCount();


badge.textContent =
count > 99
? "99+"
: String(count);


badge.classList.toggle(
"show",
count > 0
);

}


/* =========================================
   BROWSER NOTIFICATIONS
========================================= */

async function enableBrowserNotifications(){

if(
!("Notification" in window)
){

alert(
"Browser notifications are not supported."
);

return;

}


const permission =
await Notification
.requestPermission();


if(
permission !== "granted"
){

alert(
"Notification permission was not granted."
);

return;

}


const urgent =
buildNotifications()
.filter(
item =>
[
"Needs attention",
"Today"
].includes(
item.section
)
);


new Notification(
"StudyFlow notifications enabled",
{
body:
urgent.length
? `${urgent.length} important item${
urgent.length === 1
? ""
: "s"
} need attention.`
: "You're all caught up."
}
);

}


/* =========================================
   STARTUP ALERT
========================================= */

function startupBrowserAlert(){

if(
!("Notification" in window)
||
Notification.permission !==
"granted"
){
return;
}


const today =
new Date()
.toISOString()
.slice(0,10);


const key =
userKey(
`notificationAlert_${today}`
);


if(
localStorage.getItem(key)
){
return;
}


const urgent =
buildNotifications()
.filter(
item =>
[
"Needs attention",
"Today"
].includes(
item.section
)
);


if(!urgent.length){
return;
}


new Notification(
"StudyFlow",
{
body:
`${urgent.length} important academic item${
urgent.length === 1
? ""
: "s"
} need attention today.`
}
);


localStorage.setItem(
key,
"1"
);

}


/* =========================================
   INIT
========================================= */

function initialize(){

if(
initialized ||
!getUser()
){
return;
}


createUI();

notifications =
buildNotifications();


updateBadge();


setTimeout(
startupBrowserAlert,
1000
);


initialized =
true;


console.log(
"✅ StudyFlow Notification Center ready"
);

}


const timer =
setInterval(
() => {

if(getUser()){
initialize();
}


if(initialized){
clearInterval(timer);
}

},
350
);


/* refresh badge periodically */

setInterval(
() => {

if(initialized){
updateBadge();
}

},
60000
);

})();
