
(function(){

let initialized = false;
let history = [];
let busy = false;


/* =========================================================
   HELPERS
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


function keyName(name){

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


function firstName(){

const user =
getUser();


return (
user?.name
||
user?.email
||
"Student"
)
.split(/[ @]/)[0];

}


function escapeHTML(value){

return String(value ?? "")
.replaceAll("&","&amp;")
.replaceAll("<","&lt;")
.replaceAll(">","&gt;")
.replaceAll('"',"&quot;")
.replaceAll("'","&#039;");

}


function loadJSON(name){

try{

return JSON.parse(
localStorage.getItem(
keyName(name)
)
) || [];

}catch{

return [];

}

}


function currentPage(){

const visible =
[
...document
.querySelectorAll(
".page"
)
]
.find(
page =>
!page.classList
.contains(
"hidden"
)
);


return visible?.id || "unknown";

}


/* =========================================================
   CONTEXT
========================================================= */

function buildContext(){

const openTasks =
getTasks()
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
15
);


const exams =
loadJSON(
"examMode"
)
.slice(
0,
8
);


const schedule =
loadJSON(
"scheduleBlocks"
)
.slice(
0,
30
);


const knowledge =
loadJSON(
"knowledgeFiles"
)
.filter(
item =>
item.lastResult
)
.slice(
0,
5
)
.map(
item => ({
file:
item.name,

course:
item.course,

result:
String(
item.lastResult
)
.slice(
0,
900
)
})
);


const recentNotes =
getNotes()
.slice(
0,
8
)
.map(
note => ({
title:
note.title,

course:
note.course,

text:
String(
note.text || ""
)
.slice(
0,
700
)
})
);


return {

today:
new Date()
.toLocaleDateString(),

page:
currentPage(),

classes:
getClasses()
.slice(
0,
15
),

openTasks,

exams,

schedule,

recentNotes,

knowledge

};

}


/* =========================================================
   API
========================================================= */

async function askAPI(
question
){

const context =
buildContext();


const recentHistory =
history
.slice(
-8
)
.map(
item =>
`${item.role.toUpperCase()}: ${item.text}`
)
.join("\n\n");


const prompt = `
You are StudyFlow Copilot, a personal AI assistant inside a college student productivity app.

TODAY:
${context.today}

CURRENT STUDYFLOW PAGE:
${context.page}

STUDENT DATA:
${JSON.stringify(
context,
null,
2
)}

RECENT COPILOT CONVERSATION:
${recentHistory || "None"}

USER:
${question}

Instructions:
- Be concise and practical.
- Use the student's StudyFlow data when relevant.
- Prioritize deadlines and high-priority tasks.
- If information is missing, say so.
- Never pretend a task is completed or modified unless the user actually changes it in StudyFlow.
- When making a study plan, give concrete steps and realistic time blocks.
- Use clean formatting.
`;


try{

if(
typeof api === "function"
){

return await api(
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
message:
prompt
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
   UI
========================================================= */

function createUI(){

if(
document.getElementById(
"sf19Button"
)
){

return;

}


const button =
document.createElement(
"button"
);


button.id =
"sf19Button";

button.type =
"button";

button.title =
"StudyFlow Copilot";

button.textContent =
"◉";


const panel =
document.createElement(
"section"
);


panel.id =
"sf19Panel";


panel.innerHTML = `

<div class="sf19-head">

<div class="sf19-head-left">

<div class="sf19-icon">
◉
</div>

<div>

<strong>
StudyFlow Copilot
</strong>

<small>
Your study assistant
</small>

</div>

</div>


<button
type="button"
id="sf19Close"
class="sf19-close"
>
×
</button>

</div>


<div class="sf19-quick">

<button
type="button"
class="sf19-chip"
data-prompt="What should I focus on today?"
>
Today
</button>

<button
type="button"
class="sf19-chip"
data-prompt="Plan my study week based on my current deadlines and exams."
>
Plan week
</button>

<button
type="button"
class="sf19-chip"
data-prompt="Which of my current tasks are most urgent and why?"
>
Priorities
</button>

<button
type="button"
class="sf19-chip"
data-prompt="Review my upcoming exams and tell me what I should study first."
>
Exams
</button>

<button
type="button"
class="sf19-chip"
data-prompt="Look at my current workload and tell me if I am falling behind anywhere."
>
Check progress
</button>

</div>


<div
id="sf19Messages"
class="sf19-messages"
>

<div class="sf19-welcome">

<strong>
Hi, ${escapeHTML(firstName())}.
</strong>

<p>
Ask me about your tasks, courses, schedule, notes or exams.
</p>

</div>

</div>


<div class="sf19-input-wrap">

<div class="sf19-input-box">

<textarea
id="sf19Input"
rows="1"
placeholder="Ask StudyFlow..."
></textarea>

<button
type="button"
id="sf19Send"
>
↑
</button>

</div>

<div class="sf19-hint">
Enter to send · Shift + Enter for a new line
</div>

</div>

`;


document.body
.appendChild(
button
);


document.body
.appendChild(
panel
);


button.onclick =
toggle;


document
.getElementById(
"sf19Close"
)
.onclick =
close;


document
.getElementById(
"sf19Send"
)
.onclick =
send;


document
.getElementById(
"sf19Input"
)
.addEventListener(
"keydown",
event => {

if(
event.key === "Enter"
&&
!event.shiftKey
){

event.preventDefault();

send();

}

}
);


document
.querySelectorAll(
".sf19-chip"
)
.forEach(
chip => {

chip.onclick =
() => {

open();

const input =
document.getElementById(
"sf19Input"
);


input.value =
chip.dataset.prompt;


send();

};

}
);


/* shortcut */

document
.addEventListener(
"keydown",
event => {

if(
(
event.metaKey ||
event.ctrlKey
)
&&
event.key.toLowerCase() ===
"j"
){

event.preventDefault();

toggle();

}

}
);

}


/* =========================================================
   OPEN / CLOSE
========================================================= */

function open(){

document
.getElementById(
"sf19Panel"
)
?.classList
.add(
"open"
);


setTimeout(
() => {

document
.getElementById(
"sf19Input"
)
?.focus();

},
80
);

}


function close(){

document
.getElementById(
"sf19Panel"
)
?.classList
.remove(
"open"
);

}


function toggle(){

const panel =
document.getElementById(
"sf19Panel"
);


if(!panel){

return;

}


if(
panel.classList
.contains(
"open"
)
){

close();

}else{

open();

}

}


/* =========================================================
   CHAT
========================================================= */

function addMessage(
role,
text,
thinking = false
){

const container =
document.getElementById(
"sf19Messages"
);


const element =
document.createElement(
"div"
);


element.className =
`sf19-message ${role}${
thinking
? " sf19-thinking"
: ""
}`;


element.textContent =
text;


container.appendChild(
element
);


container.scrollTop =
container.scrollHeight;


return element;

}


async function send(){

if(busy){

return;

}


const input =
document.getElementById(
"sf19Input"
);


const question =
input.value.trim();


if(!question){

input.focus();

return;

}


input.value =
"";


history.push({

role:"user",
text:question

});


addMessage(
"user",
question
);


const thinking =
addMessage(
"ai",
"Thinking…",
true
);


busy =
true;


document
.getElementById(
"sf19Send"
).disabled =
true;


try{

const result =
await askAPI(
question
);


const answer =
result.answer ||
"No answer returned.";


thinking.remove();


addMessage(
"ai",
answer
);


history.push({

role:"assistant",
text:answer

});


}catch(error){

thinking.textContent =
`Copilot error: ${error.message}`;


thinking.classList
.remove(
"sf19-thinking"
);

}


busy =
false;


document
.getElementById(
"sf19Send"
).disabled =
false;


input.focus();

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


createUI();


initialized =
true;


console.log(
"✅ StudyFlow Copilot ready"
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
