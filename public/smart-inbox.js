
(function(){

let initialized = false;

let inputMode =
"text";

let selectedFile =
null;

let analysis =
null;


/* =========================================================
   SAFE DATA
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


function getTasks(){

try{

return (
typeof tasks !==
"undefined"
&&
Array.isArray(tasks)
)
? tasks
: null;

}catch{

return null;

}

}


function getNotes(){

try{

return (
typeof notes !==
"undefined"
&&
Array.isArray(notes)
)
? notes
: null;

}catch{

return null;

}

}


function getClasses(){

try{

return (
typeof classes !==
"undefined"
&&
Array.isArray(classes)
)
? classes
: [];

}catch{

return [];

}

}


function userKey(name){

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


function makeId(){

if(
window.crypto &&
typeof window.crypto.randomUUID ===
"function"
){

return crypto.randomUUID();

}


return `${Date.now()}-${Math.random()}`;

}


function escapeHTML(value){

return String(value ?? "")
.replaceAll("&","&amp;")
.replaceAll("<","&lt;")
.replaceAll(">","&gt;")
.replaceAll('"',"&quot;")
.replaceAll("'","&#039;");

}


function getJSON(name){

try{

const parsed =
JSON.parse(
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


function setJSON(
name,
value
){

localStorage.setItem(
userKey(name),
JSON.stringify(value)
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


/* =========================================================
   SAVE CORE DATA
========================================================= */

function saveCore(){

try{

if(
typeof saveEverything ===
"function"
){

saveEverything();

return;

}

}catch{}


const taskList =
getTasks();


if(taskList){

localStorage.setItem(
userKey(
"tasks"
),
JSON.stringify(
taskList
)
);

}


const noteList =
getNotes();


if(noteList){

localStorage.setItem(
userKey(
"notes"
),
JSON.stringify(
noteList
)
);

}


try{

if(
typeof markStudyFlowCloudDirty ===
"function"
){

markStudyFlowCloudDirty();

}

}catch{}

}


/* =========================================================
   PAGE
========================================================= */

function createPage(){

if(
document.getElementById(
"smartInbox"
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
"smartInbox";


page.className =
"page sf24-page hidden";


page.innerHTML = `

<div class="sf24-head">

<div>

<p class="eyebrow">
SMART CAPTURE
</p>

<h1>
Inbox
</h1>

<p class="sf24-sub">
Drop in a screenshot, PDF, syllabus, professor announcement or assignment text. StudyFlow will organize it for you.
</p>

</div>

</div>


<div class="sf24-grid">


<div>


<div class="sf24-card">

<div class="sf24-card-head">

<h3>
Add something
</h3>

<span>
AI extraction
</span>

</div>


<div class="sf24-tabs">

<button
type="button"
class="sf24-tab active"
data-mode="text"
>
Paste text
</button>

<button
type="button"
class="sf24-tab"
data-mode="file"
>
Upload file
</button>

</div>


<div id="sf24TextMode">

<textarea
id="sf24Text"
placeholder="Paste an assignment, professor announcement, syllabus section, Moodle message, email, or anything else..."
></textarea>

</div>


<div
id="sf24FileMode"
class="hidden"
>

<input
id="sf24FileInput"
type="file"
accept=".pdf,.png,.jpg,.jpeg,.webp"
hidden
>

<div
id="sf24Drop"
class="sf24-drop"
>

<div>

<div class="sf24-drop-icon">
↑
</div>

<strong>
Drop a PDF or screenshot
</strong>

<p>
PDF, PNG, JPG or WEBP<br>
Maximum about 12 MB
</p>

</div>

</div>


<div
id="sf24SelectedFile"
class="sf24-file-selected hidden"
></div>

</div>


<div class="sf24-field">

<label>
COURSE HINT — OPTIONAL
</label>

<select id="sf24CourseHint">
</select>

</div>


<button
type="button"
id="sf24Analyze"
class="sf24-analyze"
>
✦ Analyze with StudyFlow
</button>

</div>


<div
class="sf24-card"
style="margin-top:14px"
>

<div class="sf24-card-head">

<h3>
Recent imports
</h3>

<span>
Local history
</span>

</div>

<div
id="sf24History"
class="sf24-history"
></div>

</div>


</div>


<div class="sf24-card">

<div class="sf24-card-head">

<h3>
Detected items
</h3>

<span id="sf24ResultCount">
Waiting for input
</span>

</div>


<div id="sf24Results">

<div class="sf24-empty">

<div>

<strong>
Your Inbox is empty
</strong>

<br><br>

Paste text or upload a document on the left.

<br>

StudyFlow will detect tasks, exams, deadlines and notes before anything is imported.

</div>

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
'[data-page="smartInbox"]'
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
"nav sf24-nav";


button.dataset.page =
"smartInbox";


button.innerHTML = `

📥 Inbox

<span
class="sf24-nav-count"
id="sf24NavCount"
>
0
</span>

`;


button.onclick =
event => {

event.preventDefault();

event.stopPropagation();


openPage();

};


/*
Place Inbox close to Home / Search.
*/

const home =
sidebar.querySelector(
'[data-page="homePro"]'
);


if(home){

home.insertAdjacentElement(
"afterend",
button
);

}else{

const search =
sidebar.querySelector(
".sf21-nav"
);


if(search){

search.insertAdjacentElement(
"afterend",
button
);

}else{

sidebar.prepend(
button
);

}

}

}


/* =========================================================
   NAVIGATION
========================================================= */

function openPage(){

const page =
document.getElementById(
"smartInbox"
);


if(!page){

return;

}


document
.querySelectorAll(
"main .page"
)
.forEach(
item => {

item.classList.remove(
"active"
);

item.classList.add(
"hidden"
);

}
);


page.classList.remove(
"hidden"
);

page.classList.add(
"active"
);


document
.querySelectorAll(
"aside .nav[data-page]"
)
.forEach(
button => {

button.classList.toggle(
"active",
button.dataset.page ===
"smartInbox"
);

}
);


renderHistory();

}


/* =========================================================
   COURSE OPTIONS
========================================================= */

function renderCourses(){

const select =
document.getElementById(
"sf24CourseHint"
);


if(!select){

return;

}


const names =
[
...new Set(
getClasses()
.map(
course =>
course.name
)
.filter(Boolean)
)
];


select.innerHTML = `

<option value="">
Auto detect course
</option>

${names.map(
name => `

<option value="${escapeHTML(name)}">
${escapeHTML(name)}
</option>

`
).join("")}

`;

}


/* =========================================================
   INPUT MODE
========================================================= */

function setMode(mode){

inputMode =
mode;


document
.querySelectorAll(
".sf24-tab"
)
.forEach(
button => {

button.classList.toggle(
"active",
button.dataset.mode ===
mode
);

}
);


document
.getElementById(
"sf24TextMode"
)
.classList.toggle(
"hidden",
mode !== "text"
);


document
.getElementById(
"sf24FileMode"
)
.classList.toggle(
"hidden",
mode !== "file"
);

}


/* =========================================================
   FILE
========================================================= */

function humanSize(bytes){

if(
bytes < 1024
){

return `${bytes} B`;

}


if(
bytes <
1024 * 1024
){

return `${Math.round(
bytes / 1024
)} KB`;

}


return `${(
bytes /
1024 /
1024
).toFixed(1)} MB`;

}


function selectFile(file){

if(!file){

return;

}


const name =
file.name.toLowerCase();


const valid =
name.endsWith(".pdf")
||
name.endsWith(".png")
||
name.endsWith(".jpg")
||
name.endsWith(".jpeg")
||
name.endsWith(".webp");


if(!valid){

alert(
"Use PDF, PNG, JPG, JPEG or WEBP."
);

return;

}


if(
file.size >
12 * 1024 * 1024
){

alert(
"File must be under about 12 MB."
);

return;

}


selectedFile =
file;


const box =
document.getElementById(
"sf24SelectedFile"
);


box.classList.remove(
"hidden"
);


box.textContent =
`${file.name} · ${humanSize(file.size)}`;

}


function fileToDataURL(file){

return new Promise(
(resolve,reject) => {

const reader =
new FileReader();


reader.onload =
() =>
resolve(
reader.result
);


reader.onerror =
() =>
reject(
reader.error
);


reader.readAsDataURL(
file
);

}
);

}


/* =========================================================
   ANALYZE
========================================================= */

async function analyze(){

const button =
document.getElementById(
"sf24Analyze"
);


const resultBox =
document.getElementById(
"sf24Results"
);


const courseHint =
document
.getElementById(
"sf24CourseHint"
)
.value;


let payload = {

today:
new Date()
.toLocaleDateString(
"en-CA"
),

timezone:
Intl.DateTimeFormat()
.resolvedOptions()
.timeZone,

knownCourses:
getClasses()
.map(
course =>
course.name
)
.filter(Boolean),

courseHint

};


if(
inputMode === "text"
){

const text =
document
.getElementById(
"sf24Text"
)
.value
.trim();


if(!text){

document
.getElementById(
"sf24Text"
)
.focus();

return;

}


payload.mode =
"text";

payload.text =
text;

payload.filename =
"Pasted text";

}


if(
inputMode === "file"
){

if(!selectedFile){

alert(
"Choose a PDF or screenshot first."
);

return;

}


const data =
await fileToDataURL(
selectedFile
);


const lower =
selectedFile.name
.toLowerCase();


if(
lower.endsWith(
".pdf"
)
){

payload.mode =
"pdf";

}else{

payload.mode =
"image";

}


payload.fileData =
data;

payload.filename =
selectedFile.name;

payload.mimeType =
selectedFile.type;

}


button.disabled =
true;


button.textContent =
"✦ Analyzing…";


resultBox.innerHTML = `

<div class="sf24-loading">
StudyFlow is reading your material…
</div>

`;


try{

const response =
await fetch(
"/api/inbox-analyze",
{
method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:
JSON.stringify(
payload
)
}
);


const data =
await response.json();


if(!response.ok){

throw new Error(
data.error ||
"Analysis failed."
);

}


analysis =
data;


renderAnalysis();


}catch(error){

analysis =
null;


resultBox.innerHTML = `

<div class="sf24-empty">

<div>

<strong>
Could not analyze this material
</strong>

<br><br>

${escapeHTML(
error.message
)}

</div>

</div>

`;

}


button.disabled =
false;


button.textContent =
"✦ Analyze with StudyFlow";

}


/* =========================================================
   RESULTS
========================================================= */

function courseOptions(
selected
){

const names =
[
...new Set(
getClasses()
.map(
course =>
course.name
)
.filter(Boolean)
)
];


if(
selected &&
!names.includes(
selected
)
){

names.push(
selected
);

}


return `

<option value="">
No course
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


function kindOptions(
selected
){

const kinds = [

["task","Task"],
["exam","Exam"],
["note","Note"],
["announcement","Announcement"]

];


return kinds
.map(
([value,label]) => `

<option
value="${value}"
${value === selected ? "selected" : ""}
>
${label}
</option>

`
)
.join("");

}


function priorityOptions(
selected
){

return [
"Low",
"Medium",
"High"
]
.map(
value => `

<option
value="${value}"
${value === selected ? "selected" : ""}
>
${value}
</option>

`
)
.join("");

}


function renderAnalysis(){

const container =
document.getElementById(
"sf24Results"
);


const counter =
document.getElementById(
"sf24ResultCount"
);


if(
!analysis
){

return;

}


counter.textContent =
`${analysis.items?.length || 0} detected`;


const items =
Array.isArray(
analysis.items
)
? analysis.items
: [];


container.innerHTML = `

<div class="sf24-summary">

<div class="sf24-summary-label">
STUDYFLOW ANALYSIS
</div>

<strong>
${escapeHTML(
analysis.sourceType ||
"Material"
)}
${analysis.courseGuess
? ` · ${escapeHTML(
analysis.courseGuess
)}`
: ""}
</strong>

<p>
${escapeHTML(
analysis.summary ||
"No summary available."
)}
</p>

</div>


<div
class="sf24-results"
id="sf24Items"
>

${items.map(
(item,index) => `

<div
class="sf24-item"
data-index="${index}"
>

<div class="sf24-item-top">

<div class="sf24-check-wrap">

<input
class="sf24-check"
type="checkbox"
checked
>

<span class="sf24-kind">
${escapeHTML(item.kind)}
</span>

</div>

<span class="sf24-confidence">
${Math.round(
item.confidence || 0
)}% confidence
</span>

</div>


<div class="sf24-item-grid">


<div class="full">

<label class="sf24-mini-label">
TITLE
</label>

<input
class="sf24-title"
value="${escapeHTML(
item.title
)}"
>

</div>


<div>

<label class="sf24-mini-label">
TYPE
</label>

<select class="sf24-kind-select">
${kindOptions(
item.kind
)}
</select>

</div>


<div>

<label class="sf24-mini-label">
COURSE
</label>

<select class="sf24-course">
${courseOptions(
item.course ||
analysis.courseGuess ||
""
)}
</select>

</div>


<div>

<label class="sf24-mini-label">
DATE
</label>

<input
type="date"
class="sf24-date"
value="${escapeHTML(
item.date || ""
)}"
>

</div>


<div>

<label class="sf24-mini-label">
PRIORITY
</label>

<select class="sf24-priority">
${priorityOptions(
item.priority ||
"Medium"
)}
</select>

</div>


<div class="full">

<label class="sf24-mini-label">
DETAILS
</label>

<textarea class="sf24-details">${escapeHTML(
item.details ||
""
)}</textarea>

</div>


</div>

</div>

`
).join("")}

</div>


${items.length
? `

<div class="sf24-import-bar">

<span id="sf24SelectedCount">
${items.length} selected
</span>

<div class="sf24-import-actions">

<button
type="button"
class="secondary"
id="sf24SelectAll"
>
Select all
</button>

<button
type="button"
id="sf24Import"
>
Import selected
</button>

</div>

</div>

`
: `

<div class="sf24-empty">
No actionable academic items were detected.
</div>

`}

`;


if(!items.length){

return;

}


document
.querySelectorAll(
".sf24-check"
)
.forEach(
checkbox => {

checkbox.addEventListener(
"change",
updateSelectedCount
);

}
);


document
.getElementById(
"sf24SelectAll"
)
.onclick =
toggleAll;


document
.getElementById(
"sf24Import"
)
.onclick =
importSelected;


updateSelectedCount();

}


/* =========================================================
   SELECTION
========================================================= */

function selectedRows(){

return [
...document
.querySelectorAll(
".sf24-item"
)
]
.filter(
row =>
row.querySelector(
".sf24-check"
)?.checked
);

}


function updateSelectedCount(){

const count =
selectedRows()
.length;


const element =
document.getElementById(
"sf24SelectedCount"
);


if(element){

element.textContent =
`${count} selected`;

}


const navCount =
document.getElementById(
"sf24NavCount"
);


if(navCount){

navCount.textContent =
count;


navCount.classList.toggle(
"show",
count > 0
);

}

}


function toggleAll(){

const checks =
[
...document
.querySelectorAll(
".sf24-check"
)
];


const shouldSelect =
checks.some(
checkbox =>
!checkbox.checked
);


checks.forEach(
checkbox => {

checkbox.checked =
shouldSelect;

}
);


updateSelectedCount();

}


/* =========================================================
   READ EDITED ROW
========================================================= */

function readRow(row){

const original =
analysis.items[
Number(
row.dataset.index
)
] || {};


return {

kind:
row.querySelector(
".sf24-kind-select"
).value,

title:
row.querySelector(
".sf24-title"
).value.trim(),

course:
row.querySelector(
".sf24-course"
).value,

date:
row.querySelector(
".sf24-date"
).value,

priority:
row.querySelector(
".sf24-priority"
).value,

details:
row.querySelector(
".sf24-details"
).value.trim(),

topics:
original.topics || []

};

}


/* =========================================================
   IMPORT TASK
========================================================= */

function importTask(item){

const list =
getTasks();


if(!list){

throw new Error(
"Tasks are unavailable."
);

}


list.push({

id:
makeId(),

name:
item.title,

course:
item.course || "",

date:
item.date || "",

priority:
item.priority || "Medium",

status:
"todo",

details:
item.details ||
"Imported from StudyFlow Inbox"

});

}


/* =========================================================
   IMPORT EXAM
========================================================= */

function importExam(item){

const list =
getJSON(
"examMode"
);


const topics =
Array.isArray(
item.topics
)
? item.topics
: [];


list.push({

id:
makeId(),

course:
item.course || "",

name:
item.title ||
"Exam",

date:
item.date || "",

target:
90,

topics:
topics.map(
topic => ({

id:
makeId(),

name:
topic,

mastery:1

})
),

practiceScores:[],

aiOutput:"",

plan:[],

createdAt:
new Date()
.toISOString()

});


setJSON(
"examMode",
list
);

}


/* =========================================================
   IMPORT NOTE / ANNOUNCEMENT
========================================================= */

function importNote(item){

const list =
getNotes();


if(!list){

throw new Error(
"Notes are unavailable."
);

}


list.unshift({

id:
makeId(),

title:
item.title,

course:
item.course || "",

text:
item.details ||
(
item.kind ===
"announcement"
? "Professor announcement"
: "Imported note"
)

});

}


/* =========================================================
   IMPORT SELECTED
========================================================= */

function importSelected(){

const rows =
selectedRows();


if(!rows.length){

alert(
"Select at least one item."
);

return;

}


const items =
rows.map(
readRow
);


if(
items.some(
item =>
!item.title
)
){

alert(
"Every selected item needs a title."
);

return;

}


let taskCount = 0;
let examCount = 0;
let noteCount = 0;


try{

items.forEach(
item => {

if(
item.kind === "task"
){

importTask(
item
);

taskCount++;

return;

}


if(
item.kind === "exam"
){

importExam(
item
);

examCount++;

return;

}


/*
Announcements become Notes,
so important information isn't lost.
*/

importNote(
item
);

noteCount++;

}
);


saveCore();


const history =
getJSON(
"inboxHistory"
);


history.unshift({

id:
makeId(),

createdAt:
new Date()
.toISOString(),

source:
selectedFile?.name ||
"Pasted text",

summary:
analysis?.summary || "",

taskCount,

examCount,

noteCount,

total:
items.length

});


setJSON(
"inboxHistory",
history.slice(0,25)
);


analysis =
null;


selectedFile =
null;


document
.getElementById(
"sf24Text"
).value =
"";


document
.getElementById(
"sf24SelectedFile"
)
.classList.add(
"hidden"
);


document
.getElementById(
"sf24Results"
).innerHTML = `

<div class="sf24-empty">

<div>

<strong>
Import complete ✓
</strong>

<br><br>

${taskCount} task${
taskCount === 1
? ""
: "s"
},
${examCount} exam${
examCount === 1
? ""
: "s"
},
${noteCount} note${
noteCount === 1
? ""
: "s"
}

<br><br>

Everything was added to StudyFlow.

</div>

</div>

`;


document
.getElementById(
"sf24ResultCount"
).textContent =
"Imported";


const nav =
document.getElementById(
"sf24NavCount"
);


if(nav){

nav.classList.remove(
"show"
);

}


renderHistory();


alert(
`Imported ${items.length} item${
items.length === 1
? ""
: "s"
} into StudyFlow.`
);


}catch(error){

alert(
error.message
);

}

}


/* =========================================================
   HISTORY
========================================================= */

function renderHistory(){

const container =
document.getElementById(
"sf24History"
);


if(!container){

return;

}


const history =
getJSON(
"inboxHistory"
);


if(!history.length){

container.innerHTML = `

<div class="sf24-empty"
style="min-height:120px"
>
Nothing imported yet.
</div>

`;

return;

}


container.innerHTML =
history
.slice(0,8)
.map(
entry => `

<div class="sf24-history-item">

<strong>
${escapeHTML(
entry.source ||
"Inbox import"
)}
</strong>

<small>

${new Date(
entry.createdAt
).toLocaleDateString()}

 ·

${entry.taskCount || 0} tasks

 ·

${entry.examCount || 0} exams

 ·

${entry.noteCount || 0} notes

</small>

</div>

`
)
.join("");

}


/* =========================================================
   EVENTS
========================================================= */

function bind(){

document
.querySelectorAll(
".sf24-tab"
)
.forEach(
button => {

button.onclick =
() =>
setMode(
button.dataset.mode
);

}
);


const fileInput =
document.getElementById(
"sf24FileInput"
);


const drop =
document.getElementById(
"sf24Drop"
);


drop.onclick =
() =>
fileInput.click();


fileInput.onchange =
() => {

const file =
fileInput.files?.[0];


if(file){

selectFile(
file
);

}


fileInput.value =
"";

};


drop.addEventListener(
"dragover",
event => {

event.preventDefault();

}
);


drop.addEventListener(
"drop",
event => {

event.preventDefault();


const file =
event.dataTransfer
?.files?.[0];


if(file){

selectFile(
file
);

}

}
);


document
.getElementById(
"sf24Analyze"
)
.onclick =
analyze;

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

renderCourses();

renderHistory();

bind();


initialized =
true;


console.log(
"✅ StudyFlow Smart Inbox ready"
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
350
);

})();
