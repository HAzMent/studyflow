
(function(){

let initialized = false;
let results = [];
let activeIndex = 0;


/* =========================================================
   SAFE DATA
========================================================= */

function currentUserSafe(){

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


function sfKey(name){

try{

if(typeof key === "function"){

return key(name);

}

}catch{}


return `studyflow_${
currentUserSafe()?.id || "guest"
}_${name}`;

}


function safeArray(variableName){

try{

if(
variableName === "tasks"
&&
typeof tasks !== "undefined"
&&
Array.isArray(tasks)
){

return tasks;

}


if(
variableName === "classes"
&&
typeof classes !== "undefined"
&&
Array.isArray(classes)
){

return classes;

}


if(
variableName === "notes"
&&
typeof notes !== "undefined"
&&
Array.isArray(notes)
){

return notes;

}

}catch{}


return [];

}


function localArray(name){

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


function normalize(value){

return String(value || "")
.trim()
.toLowerCase();

}


function matchText(
query,
...values
){

if(!query){

return true;

}


return values.some(
value =>
normalize(value)
.includes(query)
);

}


/* =========================================================
   PAGES
========================================================= */

const pages = [

{
title:"Today",
subtitle:"Daily priorities and AI planning",
icon:"☀",
page:"todayPro"
},

{
title:"Dashboard",
subtitle:"StudyFlow home",
icon:"⌂",
page:"dashboard"
},

{
title:"Classes",
subtitle:"Your courses",
icon:"▦",
page:"classes"
},

{
title:"Course Hub",
subtitle:"Course workspace",
icon:"◫",
page:"courseHub"
},

{
title:"Tasks Pro",
subtitle:"Kanban task manager",
icon:"✓",
page:"tasksPro"
},

{
title:"Calendar Pro",
subtitle:"Deadlines and calendar",
icon:"□",
page:"calendarPro"
},

{
title:"Smart Schedule",
subtitle:"Weekly schedule and auto planner",
icon:"◷",
page:"smartSchedule"
},

{
title:"Knowledge Base",
subtitle:"Files and AI study tools",
icon:"◉",
page:"knowledgeBase"
},

{
title:"Exam Mode",
subtitle:"Exam preparation center",
icon:"◎",
page:"examMode"
},

{
title:"Grades",
subtitle:"Grade tracking",
icon:"%",
page:"grades"
},

{
title:"Notes",
subtitle:"Study notes",
icon:"≡",
page:"notes"
},

{
title:"AI Tutor",
subtitle:"StudyFlow AI",
icon:"✦",
page:"ai"
}

];


/* =========================================================
   SEARCH INDEX
========================================================= */

function buildResults(queryValue){

const query =
normalize(queryValue);


const output = [];


/* PAGES */

pages.forEach(
page => {

if(
!document.getElementById(
page.page
)
){

return;

}


if(
matchText(
query,
page.title,
page.subtitle
)
){

output.push({

type:"Page",
icon:page.icon,
title:page.title,
subtitle:page.subtitle,

action:
() =>
openPage(
page.page
)

});

}

}
);


/* TASKS */

safeArray("tasks")
.forEach(
task => {

if(
matchText(
query,
task.name,
task.course,
task.details,
task.date
)
){

output.push({

type:"Task",
icon:
task.status === "done"
? "✓"
: "○",

title:
task.name ||
"Untitled task",

subtitle:
[
task.course,
task.date,
task.priority
]
.filter(Boolean)
.join(" · "),

action:
() =>
openPage(
document.getElementById(
"tasksPro"
)
? "tasksPro"
: "tasks"
)

});

}

}
);


/* COURSES */

safeArray("classes")
.forEach(
course => {

if(
matchText(
query,
course.name,
course.professor,
course.room
)
){

output.push({

type:"Course",
icon:"▦",

title:
course.name ||
"Course",

subtitle:
[
course.professor,
course.room
]
.filter(Boolean)
.join(" · ")
||
"Course Hub",

action:
() =>
openCourse(
course.name
)

});

}

}
);


/* NOTES */

safeArray("notes")
.forEach(
note => {

if(
matchText(
query,
note.title,
note.course,
note.text
)
){

output.push({

type:"Note",
icon:"≡",

title:
note.title ||
"Untitled note",

subtitle:
note.course ||
String(
note.text || ""
)
.slice(
0,
70
),

action:
() =>
openPage(
"notes"
)

});

}

}
);


/* EXAMS */

localArray("examMode")
.forEach(
exam => {

if(
matchText(
query,
exam.name,
exam.course,
exam.date
)
){

output.push({

type:"Exam",
icon:"◎",

title:
exam.name ||
"Exam",

subtitle:
[
exam.course,
exam.date
]
.filter(Boolean)
.join(" · "),

action:
() =>
openExam(
exam.id
)

});

}

}
);


/* KNOWLEDGE FILES */

localArray("knowledgeFiles")
.forEach(
file => {

if(
matchText(
query,
file.name,
file.course
)
){

output.push({

type:"File",
icon:
file.type === "pdf"
? "▤"
: "▧",

title:
file.name,

subtitle:
file.course ||
"Knowledge Base",

action:
() =>
openKnowledgeFile(
file.id
)

});

}

}
);


/* LIMIT */

return output.slice(
0,
40
);

}


/* =========================================================
   NAVIGATION
========================================================= */

function openPage(page){

const target =
document.getElementById(
page
);


if(!target){

return;

}


try{

if(
typeof showPage === "function"
){

showPage(page);

}else{

document
.querySelectorAll(
".page"
)
.forEach(
element =>
element.classList.add(
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
element =>
element.classList.add(
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
button.dataset.page === page
);

}
);


close();

}


/* COURSE */

function openCourse(name){

openPage(
"courseHub"
);


setTimeout(
() => {

const wanted =
normalize(name);


const buttons =
[
...document.querySelectorAll(
".sf14-course-item"
)
];


const match =
buttons.find(
button => {

const course =
normalize(
button.dataset.course ||
button.textContent
);


return (
course === wanted
||
course.includes(wanted)
||
wanted.includes(course)
);

}
);


match?.click();

},
120
);

}


/* EXAM */

function openExam(id){

openPage(
"examMode"
);


setTimeout(
() => {

const button =
[
...document.querySelectorAll(
".sf17-exam-item"
)
]
.find(
element =>
String(
element.dataset.id
) ===
String(id)
);


button?.click();

},
120
);

}


/* KNOWLEDGE */

function openKnowledgeFile(id){

openPage(
"knowledgeBase"
);


setTimeout(
() => {

const file =
[
...document.querySelectorAll(
".sf16-file"
)
]
.find(
element =>
String(
element.dataset.id
) ===
String(id)
);


file?.click();

},
120
);

}


/* =========================================================
   UI
========================================================= */

function createUI(){

if(
document.getElementById(
"sf21Backdrop"
)
){

return;

}


const backdrop =
document.createElement(
"div"
);


backdrop.id =
"sf21Backdrop";


backdrop.innerHTML = `

<div
id="sf21Panel"
role="dialog"
aria-modal="true"
>

<div class="sf21-search-wrap">

<span class="sf21-search-icon">
⌕
</span>

<input
id="sf21Search"
placeholder="Search StudyFlow..."
autocomplete="off"
>

<span class="sf21-esc">
ESC
</span>

</div>


<div
id="sf21Body"
class="sf21-body"
></div>


<div class="sf21-footer">

<span>
<span class="sf21-key">↑</span>
<span class="sf21-key">↓</span>
Navigate
</span>

<span>
<span class="sf21-key">↵</span>
Open
</span>

<span>
<span class="sf21-key">ESC</span>
Close
</span>

</div>

</div>

`;


document.body.appendChild(
backdrop
);


const input =
document.getElementById(
"sf21Search"
);


input.addEventListener(
"input",
() => {

activeIndex = 0;

render(
input.value
);

}
);


input.addEventListener(
"keydown",
event => {

if(
event.key === "ArrowDown"
){

event.preventDefault();

activeIndex =
Math.min(
activeIndex + 1,
results.length - 1
);


render(
input.value
);

}


if(
event.key === "ArrowUp"
){

event.preventDefault();

activeIndex =
Math.max(
0,
activeIndex - 1
);


render(
input.value
);

}


if(
event.key === "Enter"
){

event.preventDefault();

results[
activeIndex
]?.action();

}


if(
event.key === "Escape"
){

close();

}

}
);


backdrop.addEventListener(
"mousedown",
event => {

if(
event.target === backdrop
){

close();

}

}
);

}


/* =========================================================
   RENDER
========================================================= */

function render(query){

const body =
document.getElementById(
"sf21Body"
);


results =
buildResults(
query
);


if(
!results.length
){

body.innerHTML = `

<div class="sf21-empty">

No results for
<strong>
"${query}"
</strong>

</div>

`;

return;

}


let currentType = "";


body.innerHTML =
results
.map(
(result,index) => {

let heading = "";


if(
result.type !==
currentType
){

currentType =
result.type;


heading = `

<div class="sf21-section-title">
${result.type.toUpperCase()}
</div>

`;

}


return `

${heading}

<div
class="sf21-result ${
index === activeIndex
? "active"
: ""
}"
data-index="${index}"
>

<div class="sf21-result-icon">
${result.icon}
</div>

<div class="sf21-result-text">

<strong></strong>

<small></small>

</div>

<div class="sf21-result-type">
${result.type}
</div>

</div>

`;

}
)
.join("");


body
.querySelectorAll(
".sf21-result"
)
.forEach(
element => {

const index =
Number(
element.dataset.index
);


const result =
results[index];


element
.querySelector(
"strong"
)
.textContent =
result.title;


element
.querySelector(
"small"
)
.textContent =
result.subtitle || "";


element.addEventListener(
"mouseenter",
() => {

activeIndex =
index;

body
.querySelectorAll(
".sf21-result"
)
.forEach(
item =>
item.classList.remove(
"active"
)
);


element.classList.add(
"active"
);

}
);


element.onclick =
() =>
result.action();

}
);


/* ensure active result visible */

requestAnimationFrame(
() => {

body
.querySelector(
".sf21-result.active"
)
?.scrollIntoView({
block:"nearest"
});

}
);

}


/* =========================================================
   OPEN/CLOSE
========================================================= */

function open(){

const backdrop =
document.getElementById(
"sf21Backdrop"
);


const input =
document.getElementById(
"sf21Search"
);


if(
!backdrop ||
!input
){

return;

}


input.value =
"";


activeIndex = 0;


render("");


backdrop.classList.add(
"open"
);


setTimeout(
() =>
input.focus(),
50
);

}


function close(){

document
.getElementById(
"sf21Backdrop"
)
?.classList
.remove(
"open"
);

}


/* =========================================================
   SIDEBAR BUTTON
========================================================= */

function addSidebarButton(){

const sidebar =
document.querySelector(
"aside"
);


if(
!sidebar ||
sidebar.querySelector(
".sf21-nav"
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
"nav sf21-nav";


button.innerHTML = `

⌕ Search

<span class="sf21-nav-kbd">
⌘K
</span>

`;


button.onclick =
event => {

event.preventDefault();

event.stopPropagation();

open();

};


const firstNav =
sidebar.querySelector(
".nav"
);


if(firstNav){

firstNav.insertAdjacentElement(
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
   KEYBOARD
========================================================= */

function bindKeyboard(){

document.addEventListener(
"keydown",
event => {

if(
(
event.metaKey ||
event.ctrlKey
)
&&
event.key.toLowerCase() ===
"k"
){

event.preventDefault();

open();

return;

}


if(
event.key === "Escape"
&&
document
.getElementById(
"sf21Backdrop"
)
?.classList
.contains(
"open"
)
){

close();

}

}
);

}


/* =========================================================
   INIT
========================================================= */

function initialize(){

if(
initialized ||
!currentUserSafe()
){

return;

}


createUI();

addSidebarButton();

bindKeyboard();


initialized =
true;


console.log(
"✅ StudyFlow Command Center ready"
);

}


const timer =
setInterval(
() => {

if(
currentUserSafe()
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
