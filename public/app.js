const $ = id => document.getElementById(id);

let currentUser = null;

let classes = [];
let tasks = [];
let notes = [];
let grades = [];
let flashcardSets = [];

let currentStudySet = null;
let currentStudyIndex = 0;
let currentStudyFlipped = false;
let currentStudyKnown = 0;
let currentStudyAgain = 0;

let calendarDate = new Date();

let timerMinutes = 25;
let timerSeconds = 1500;
let timerRunning = false;
let timerInterval = null;

let focusSessionsValue = 0;
let focusMinutesValue = 0;

function safe(value=""){
  return String(value)
  .replaceAll("&","&amp;")
  .replaceAll("<","&lt;")
  .replaceAll(">","&gt;")
  .replaceAll('"',"&quot;");
}

function key(name){
  return currentUser
    ? `studyflow_${currentUser.id}_${name}`
    : `studyflow_${name}`;
}

async function api(url,options={}){

  const response=await fetch(url,{
    headers:{
      "Content-Type":"application/json",
      ...(options.headers||{})
    },
    ...options
  });

  const data=await response.json();

  if(!response.ok){
    throw new Error(data.error||"Something went wrong.");
  }

  return data;
}

/* AUTH */

$("loginTab").onclick=()=>{
  $("loginTab").classList.add("active");
  $("registerTab").classList.remove("active");
  $("loginForm").classList.remove("hidden");
  $("registerForm").classList.add("hidden");
};

$("registerTab").onclick=()=>{
  $("registerTab").classList.add("active");
  $("loginTab").classList.remove("active");
  $("registerForm").classList.remove("hidden");
  $("loginForm").classList.add("hidden");
};

async function login(){

  $("loginError").textContent="";

  try{

    const data=await api("/api/login",{
      method:"POST",
      body:JSON.stringify({
        email:$("loginEmail").value,
        password:$("loginPassword").value
      })
    });

    startApp(data.user);

  }catch(error){
    $("loginError").textContent=error.message;
  }
}

async function register(){

  $("registerError").textContent="";

  try{

    const data=await api("/api/register",{
      method:"POST",
      body:JSON.stringify({
        name:$("registerName").value,
        email:$("registerEmail").value,
        password:$("registerPassword").value
      })
    });

    startApp(data.user);

  }catch(error){
    $("registerError").textContent=error.message;
  }
}

async function logout(){

  try{
    await api("/api/logout",{method:"POST"});
  }catch{}

  location.reload();
}

async function checkLogin(){

  try{
    const data=await api("/api/me");
    startApp(data.user);
  }catch{
    $("authScreen").classList.remove("hidden");
  }
}

function startApp(user){

  currentUser=user;

  $("authScreen").classList.add("hidden");
  $("app").classList.remove("hidden");

  classes=JSON.parse(localStorage.getItem(key("classes")))||[];

  tasks=
    JSON.parse(localStorage.getItem(key("tasks")))
    ||
    JSON.parse(localStorage.getItem(key("assignments")))
    ||
    [];

  tasks=tasks.map(task=>({
    id:task.id||Date.now()+Math.random(),
    name:task.name,
    course:task.course||"",
    date:task.date||"",
    priority:task.priority||"Medium",
    status:task.status||"todo"
  }));

  notes=JSON.parse(localStorage.getItem(key("notes")))||[];
  grades=JSON.parse(localStorage.getItem(key("grades")))||[];

  flashcardSets=JSON.parse(localStorage.getItem(key("flashcardSets")))||[];

  focusSessionsValue=
    Number(localStorage.getItem(key("focusSessions")))||0;

  focusMinutesValue=
    Number(localStorage.getItem(key("focusMinutes")))||0;

  $("welcomeTitle").textContent=
    `Hey, ${user.name.split(" ")[0]} 👋`;

  $("avatar").textContent=
    user.name.charAt(0).toUpperCase();

  $("profileName").value=user.name||"";
  $("profileEmail").value=user.email||"";
  $("profileUniversity").value=user.university||"";
  $("profileMajor").value=user.major||"";

  saveEverything();
  renderEverything();

  setTimeout(() => {
    initStudentCore();
    renderAIPowerSelectors();
    checkUpcomingDeadlines();
  }, 50);
}

/* NAV */

document.querySelectorAll(".nav").forEach(button=>{

  button.onclick=()=>{
    showPage(button.dataset.page);
  };

});

function showPage(id){

  document.querySelectorAll(".page")
  .forEach(page=>page.classList.remove("active-page"));

  $(id).classList.add("active-page");

  document.querySelectorAll(".nav")
  .forEach(btn=>{
    btn.classList.toggle(
      "active",
      btn.dataset.page===id
    );
  });

  if(id==="calendar"){
    renderCalendar();
  }
}

/* STORAGE */

function saveEverything(){

  localStorage.setItem(
    key("classes"),
    JSON.stringify(classes)
  );

  localStorage.setItem(
    key("tasks"),
    JSON.stringify(tasks)
  );

  localStorage.setItem(
    key("notes"),
    JSON.stringify(notes)
  );

  localStorage.setItem(
    key("grades"),
    JSON.stringify(grades)
  );

  localStorage.setItem(
    key("flashcardSets"),
    JSON.stringify(flashcardSets)
  );
}

/* CLASSES */

function addClass(){

  const name=$("className").value.trim();

  if(!name)return;

  classes.push({
    id:Date.now(),
    name,
    professor:$("classProfessor").value.trim(),
    room:$("classRoom").value.trim()
  });

  $("className").value="";
  $("classProfessor").value="";
  $("classRoom").value="";

  saveEverything();
  renderEverything();
}

function deleteClass(id){

  classes=classes.filter(item=>item.id!==id);

  saveEverything();
  renderEverything();
}

function renderClasses(){

  $("classesList").innerHTML=
    classes.length
    ?
    classes.map(item=>`

      <div class="course-card">

        <h3>${safe(item.name)}</h3>

        <p>
          👨‍🏫
          ${safe(item.professor||"Professor not added")}
        </p>

        <p>
          📍
          ${safe(item.room||"Room not added")}
        </p>

        <button
          class="delete-btn"
          onclick="deleteClass(${item.id})"
        >
          Delete
        </button>

      </div>

    `).join("")
    :
    `<p class="muted">No classes yet.</p>`;
}

function renderClassSelectors(){

  const options=classes.map(item=>`
    <option value="${safe(item.name)}">
      ${safe(item.name)}
    </option>
  `).join("");

  $("taskClass").innerHTML=
    `<option value="">Select class</option>${options}`;

  $("gradeClass").innerHTML=
    `<option value="">Select class</option>${options}`;

  $("noteClass").innerHTML=
    `<option value="">General</option>${options}`;
}

/* TASKS */

function addTask(){

  const name=$("taskName").value.trim();

  if(!name)return;

  tasks.push({
    id:Date.now(),
    name,
    course:$("taskClass").value,
    date:$("taskDate").value,
    priority:$("taskPriority").value,
    status:"todo"
  });

  $("taskName").value="";
  $("taskDate").value="";

  saveEverything();
  renderEverything();
}

function deleteTask(id){

  tasks=tasks.filter(item=>item.id!==id);

  saveEverything();
  renderEverything();
}

function moveTask(id,status){

  const task=tasks.find(item=>item.id===id);

  if(!task)return;

  task.status=status;

  saveEverything();
  renderEverything();
}

function taskCard(task){

  let buttons="";

  if(task.status==="todo"){

    buttons=`
      <button onclick="moveTask(${task.id},'progress')">
        Start
      </button>
    `;

  }else if(task.status==="progress"){

    buttons=`
      <button onclick="moveTask(${task.id},'done')">
        ✓ Done
      </button>

      <button
        class="secondary"
        onclick="moveTask(${task.id},'todo')"
      >
        Back
      </button>
    `;

  }else{

    buttons=`
      <button
        class="secondary"
        onclick="moveTask(${task.id},'todo')"
      >
        Reopen
      </button>
    `;
  }

  return `
    <div class="task-card">

      <h3>${safe(task.name)}</h3>

      <div class="task-meta">
        ${safe(task.course||"No class")}<br>
        ${
          task.date
          ? "📅 "+safe(task.date)
          : "No deadline"
        }
      </div>

      <span class="priority ${task.priority}">
        ${safe(task.priority)}
      </span>

      <div class="task-actions">

        ${buttons}

        <button
          class="delete-btn"
          onclick="deleteTask(${task.id})"
        >
          ×
        </button>

      </div>

    </div>
  `;
}

function renderTasks(){

  const todo=tasks.filter(t=>t.status==="todo");
  const progress=tasks.filter(t=>t.status==="progress");
  const done=tasks.filter(t=>t.status==="done");

  $("todoTasks").innerHTML=
    todo.map(taskCard).join("");

  $("progressTasks").innerHTML=
    progress.map(taskCard).join("");

  $("doneTasks").innerHTML=
    done.map(taskCard).join("");

  $("todoBadge").textContent=todo.length;
  $("progressBadge").textContent=progress.length;
  $("doneBadge").textContent=done.length;
}

/* CALENDAR */

function changeMonth(amount){

  calendarDate.setMonth(
    calendarDate.getMonth()+amount
  );

  renderCalendar();
}

function goToday(){

  calendarDate=new Date();

  renderCalendar();
}

function dateKey(year,month,day){

  return `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}

function renderCalendar(){

  const year=calendarDate.getFullYear();
  const month=calendarDate.getMonth();

  $("calendarTitle").textContent=
    new Date(year,month,1)
    .toLocaleDateString("en-US",{
      month:"long",
      year:"numeric"
    });

  const firstDay=
    new Date(year,month,1).getDay();

  const daysInMonth=
    new Date(year,month+1,0).getDate();

  const prevDays=
    new Date(year,month,0).getDate();

  const today=new Date();

  let html="";

  for(let cell=0;cell<42;cell++){

    let day;
    let cellMonth=month;
    let cellYear=year;
    let outside=false;

    if(cell<firstDay){

      day=
        prevDays-firstDay+cell+1;

      cellMonth=month-1;
      outside=true;

      if(cellMonth<0){
        cellMonth=11;
        cellYear--;
      }

    }else if(cell>=firstDay+daysInMonth){

      day=
        cell-firstDay-daysInMonth+1;

      cellMonth=month+1;
      outside=true;

      if(cellMonth>11){
        cellMonth=0;
        cellYear++;
      }

    }else{

      day=
        cell-firstDay+1;
    }

    const keyDate=
      dateKey(cellYear,cellMonth,day);

    const dayTasks=
      tasks.filter(task=>task.date===keyDate);

    const isToday=
      day===today.getDate() &&
      cellMonth===today.getMonth() &&
      cellYear===today.getFullYear();

    html+=`

      <div class="
        calendar-day
        ${outside?"outside":""}
        ${isToday?"today":""}
      ">

        <div class="day-number">
          ${day}
        </div>

        ${dayTasks.slice(0,3).map(task=>`
          <div class="calendar-event">
            ${safe(task.name)}
          </div>
        `).join("")}

        ${
          dayTasks.length>3
          ?
          `<div class="calendar-event">
            +${dayTasks.length-3} more
          </div>`
          :
          ""
        }

      </div>
    `;
  }

  $("calendarGrid").innerHTML=html;
}

/* GRADES */

function addGrade(){

  const course=$("gradeClass").value;
  const assignment=$("gradeAssignment").value.trim();

  const earned=
    Number($("gradeEarned").value);

  const possible=
    Number($("gradePossible").value);

  if(
    !course ||
    !assignment ||
    possible<=0 ||
    earned<0
  )return;

  grades.push({
    id:Date.now(),
    course,
    assignment,
    earned,
    possible
  });

  $("gradeAssignment").value="";
  $("gradeEarned").value="";
  $("gradePossible").value="";

  saveEverything();
  renderEverything();
}

function deleteGrade(id){

  grades=grades.filter(item=>item.id!==id);

  saveEverything();
  renderEverything();
}

function letterGrade(percent){

  if(percent>=93)return "A";
  if(percent>=90)return "A-";
  if(percent>=87)return "B+";
  if(percent>=83)return "B";
  if(percent>=80)return "B-";
  if(percent>=77)return "C+";
  if(percent>=73)return "C";
  if(percent>=70)return "C-";
  if(percent>=67)return "D+";
  if(percent>=60)return "D";

  return "F";
}

function renderGrades(){

  $("gradesList").innerHTML=
    grades.length
    ?
    grades.map(item=>{

      const percent=
        (item.earned/item.possible)*100;

      return `

        <div class="grade-row">

          <div class="grade-info">

            <strong>
              ${safe(item.assignment)}
            </strong>

            <p>
              ${safe(item.course)}
              ·
              ${item.earned}/${item.possible}
            </p>

          </div>

          <div class="grade-score">

            <strong>
              ${percent.toFixed(1)}%
            </strong>

            <button
              class="delete-btn"
              onclick="deleteGrade(${item.id})"
            >
              ×
            </button>

          </div>

        </div>

      `;

    }).join("")
    :
    `<p class="muted">No grades added yet.</p>`;

  if(!grades.length){

    $("overallPercent").textContent="—";
    $("overallLetter").textContent="No grades yet";
    $("gradeBarFill").style.width="0%";
    $("classAverages").innerHTML="";
    $("dashboardGrade").textContent="—";

    return;
  }

  const totalEarned=
    grades.reduce(
      (sum,item)=>sum+item.earned,
      0
    );

  const totalPossible=
    grades.reduce(
      (sum,item)=>sum+item.possible,
      0
    );

  const overall=
    totalPossible
    ?
    totalEarned/totalPossible*100
    :
    0;

  $("overallPercent").textContent=
    `${overall.toFixed(1)}%`;

  $("overallLetter").textContent=
    `Letter grade: ${letterGrade(overall)}`;

  $("gradeBarFill").style.width=
    `${Math.min(overall,100)}%`;

  $("dashboardGrade").textContent=
    `${overall.toFixed(0)}%`;

  const grouped={};

  grades.forEach(item=>{

    if(!grouped[item.course]){

      grouped[item.course]={
        earned:0,
        possible:0
      };
    }

    grouped[item.course].earned+=item.earned;
    grouped[item.course].possible+=item.possible;
  });

  $("classAverages").innerHTML=
    Object.entries(grouped)
    .map(([course,data])=>{

      const percent=
        data.earned/data.possible*100;

      return `

        <div class="class-average">

          <span>${safe(course)}</span>

          <strong>
            ${percent.toFixed(1)}%
          </strong>

        </div>

      `;

    }).join("");
}



/* GRADE PREDICTOR */

function gradeLetterFromPercent(percent){

  if(percent >= 93) return "A";
  if(percent >= 90) return "A−";
  if(percent >= 87) return "B+";
  if(percent >= 83) return "B";
  if(percent >= 80) return "B−";
  if(percent >= 77) return "C+";
  if(percent >= 73) return "C";
  if(percent >= 70) return "C−";
  if(percent >= 67) return "D+";
  if(percent >= 60) return "D";

  return "F";
}


function calculateNeededFinal(){

  const current =
    Number($("predictCurrent").value);

  const weight =
    Number($("predictWeight").value);

  const target =
    Number($("predictTarget").value);


  if(
    Number.isNaN(current) ||
    Number.isNaN(weight) ||
    Number.isNaN(target) ||
    weight <= 0 ||
    weight > 100 ||
    current < 0 ||
    current > 100 ||
    target < 0 ||
    target > 100
  ){

    alert("Enter valid percentages.");

    return;
  }


  const finalWeight =
    weight / 100;

  const currentWeight =
    1 - finalWeight;


  const needed =
    (
      target -
      current * currentWeight
    )
    /
    finalWeight;


  $("neededResult")
    .classList.remove("hidden");


  $("neededScore").textContent =
    `${needed.toFixed(1)}%`;


  $("neededBar").style.width =
    `${Math.max(
      0,
      Math.min(needed,100)
    )}%`;


  if(needed > 100){

    $("neededMessage").textContent =
      `You would need more than 100% to finish with ${target}%.`;

  }

  else if(needed <= 0){

    $("neededMessage").textContent =
      `You have already secured at least ${target}% overall.`;

  }

  else{

    $("neededMessage").textContent =
      `Score about ${needed.toFixed(1)}% or higher on the final.`;

  }
}


function calculateFinalGrade(){

  const current =
    Number($("estimateCurrent").value);

  const weight =
    Number($("estimateWeight").value);

  const finalScore =
    Number($("estimateFinal").value);


  if(
    Number.isNaN(current) ||
    Number.isNaN(weight) ||
    Number.isNaN(finalScore) ||
    weight <= 0 ||
    weight > 100 ||
    current < 0 ||
    current > 100 ||
    finalScore < 0 ||
    finalScore > 100
  ){

    alert("Enter valid percentages.");

    return;
  }


  const finalWeight =
    weight / 100;

  const currentWeight =
    1 - finalWeight;


  const result =
    current * currentWeight
    +
    finalScore * finalWeight;


  $("estimateResult")
    .classList.remove("hidden");


  $("estimatedGrade").textContent =
    `${result.toFixed(1)}%`;


  $("estimatedLetter").textContent =
    `Estimated letter grade: ${gradeLetterFromPercent(result)}`;


  $("estimateBar").style.width =
    `${Math.max(
      0,
      Math.min(result,100)
    )}%`;
}


function setTarget(value){

  $("predictTarget").value =
    value;

  $("predictTarget").focus();
}


/* NOTES */

function addNote(){

  const title=$("noteTitle").value.trim();
  const text=$("noteText").value.trim();

  if(!title||!text)return;

  notes.unshift({
    id:Date.now(),
    title,
    course:$("noteClass").value,
    text
  });

  $("noteTitle").value="";
  $("noteText").value="";

  saveEverything();
  renderEverything();
}

function deleteNote(id){

  notes=notes.filter(item=>item.id!==id);

  saveEverything();
  renderEverything();
}

function renderNotes(){

  $("notesList").innerHTML=
    notes.length
    ?
    notes.map(note=>`

      <div class="note-card">

        <h3>${safe(note.title)}</h3>

        <p>
          ${safe(note.course||"General")}
        </p>

        <div class="note-body">
          ${safe(note.text)}
        </div>

        <button
          class="delete-btn"
          onclick="deleteNote(${note.id})"
        >
          Delete
        </button>

      </div>

    `).join("")
    :
    `<p class="muted">No notes yet.</p>`;
}

/* AI */

function promptAI(text){

  $("aiQuestion").value=text;
  $("aiQuestion").focus();
}

async function askAI(){

  const question=
    $("aiQuestion").value.trim();

  if(!question)return;

  const user=document.createElement("div");

  user.className="message user";

  user.innerHTML=`
    <strong>You</strong>
    <p>${safe(question)}</p>
  `;

  $("messages").appendChild(user);

  $("aiQuestion").value="";

  const loading=
    document.createElement("div");

  loading.className="message assistant";

  loading.innerHTML=`
    <strong>StudyFlow AI</strong>
    <p>Thinking...</p>
  `;

  $("messages").appendChild(loading);

  $("messages").scrollTop=
    $("messages").scrollHeight;

  try{

    const data=await api("/api/ai",{
      method:"POST",
      body:JSON.stringify({
        message:question
      })
    });

    loading.innerHTML=`
      <strong>StudyFlow AI</strong>
      <p>${safe(data.answer)}</p>
    `;

  }catch(error){

    loading.innerHTML=`
      <strong>StudyFlow AI</strong>
      <p>${safe(error.message)}</p>
    `;
  }

  $("messages").scrollTop=
    $("messages").scrollHeight;
}

/* TIMER */

function updateTimer(){

  const minutes=
    Math.floor(timerSeconds/60);

  const seconds=
    timerSeconds%60;

  $("timerDisplay").textContent=
    `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
}

function toggleTimer(){

  if(timerRunning){

    clearInterval(timerInterval);

    timerRunning=false;

    $("timerButton").textContent="▶ Resume";

    return;
  }

  timerRunning=true;

  $("timerButton").textContent="⏸ Pause";

  timerInterval=setInterval(()=>{

    timerSeconds--;

    updateTimer();

    if(timerSeconds<=0){

      clearInterval(timerInterval);

      timerRunning=false;

      focusSessionsValue++;
      focusMinutesValue+=timerMinutes;

      localStorage.setItem(
        key("focusSessions"),
        focusSessionsValue
      );

      localStorage.setItem(
        key("focusMinutes"),
        focusMinutesValue
      );

      renderFocusStats();
  renderPlannerStats();

      alert("🎉 Focus session completed!");

      resetTimer();
    }

  },1000);
}

function resetTimer(){

  clearInterval(timerInterval);

  timerRunning=false;

  timerSeconds=timerMinutes*60;

  $("timerButton").textContent="▶ Start";

  updateTimer();
}

function setTimer(minutes){

  timerMinutes=minutes;

  resetTimer();
}

function renderFocusStats(){

  $("focusSessions").textContent=
    focusSessionsValue;

  $("focusMinutes").textContent=
    focusMinutesValue;
}

/* PROFILE */

async function saveProfile(){

  try{

    const data=await api("/api/profile",{
      method:"PUT",
      body:JSON.stringify({
        name:$("profileName").value,
        university:$("profileUniversity").value,
        major:$("profileMajor").value
      })
    });

    currentUser=data.user;

    $("welcomeTitle").textContent=
      `Hey, ${currentUser.name.split(" ")[0]} 👋`;

    $("avatar").textContent=
      currentUser.name.charAt(0).toUpperCase();

    $("profileSaved").textContent=
      "✓ Profile saved";

    setTimeout(()=>{
      $("profileSaved").textContent="";
    },2000);

  }catch(error){

    $("profileSaved").textContent=
      error.message;
  }
}

/* DASHBOARD */

function renderDashboard(){

  const openTasks=
    tasks.filter(t=>t.status!=="done");

  const doneTasks=
    tasks.filter(t=>t.status==="done");

  $("classCount").textContent=
    classes.length;

  $("taskCount").textContent=
    openTasks.length;

  $("doneCount").textContent=
    doneTasks.length;

  const upcoming=[...openTasks]
  .filter(task=>task.date)
  .sort(
    (a,b)=>
    new Date(a.date)-new Date(b.date)
  )
  .slice(0,5);

  $("dashboardTasks").innerHTML=
    upcoming.length
    ?
    upcoming.map(task=>`

      <div class="grade-row">

        <div class="grade-info">

          <strong>
            ${safe(task.name)}
          </strong>

          <p>
            ${safe(task.course||"No class")}
          </p>

        </div>

        <strong>
          ${safe(task.date)}
        </strong>

      </div>

    `).join("")
    :
    `<p class="muted">
      Nothing due yet 🎉
    </p>`;
}

/* RENDER */

function renderEverything(){

  renderClassSelectors();
  renderClasses();
  renderTasks();
  renderGrades();
  renderNotes();
  renderDashboard();
  renderCalendar();
  renderFocusStats();
  renderPlannerStats();

  updateTimer();
}

checkLogin();


/* SMART STUDY PLANNER */

function renderPlannerStats(){

  if(!currentUser){
    return;
  }

  const openTasks =
    tasks.filter(task => task.status !== "done");

  const highPriority =
    openTasks.filter(
      task => task.priority === "High"
    );

  const deadlines =
    openTasks.filter(task => task.date);


  $("plannerOpenTasks").textContent =
    openTasks.length;

  $("plannerHighPriority").textContent =
    highPriority.length;

  $("plannerDeadlines").textContent =
    deadlines.length;


  const savedPlan =
    localStorage.getItem(
      key("studyPlan")
    );


  if(savedPlan){

    $("plannerText").textContent =
      savedPlan;

    $("plannerResult")
      .classList.remove("hidden");

  }
}


async function generateStudyPlan(){

  $("plannerError").textContent = "";


  const openTasks =
    tasks.filter(task => task.status !== "done");


  if(!openTasks.length){

    $("plannerError").textContent =
      "Add at least one open task before generating a study plan.";

    return;
  }


  const hours =
    $("plannerHours").value;

  const session =
    $("plannerSession").value;

  const style =
    $("plannerStyle").value;

  const extra =
    $("plannerNotes").value.trim();


  const taskList =
    openTasks.map((task,index) => {

      return `
${index + 1}. ${task.name}
Class: ${task.course || "No class"}
Deadline: ${task.date || "No deadline"}
Priority: ${task.priority || "Medium"}
Status: ${task.status}
`;

    }).join("\n");


  const prompt = `
You are the StudyFlow study planner.

Create a realistic 7-day study schedule for a college student.

CURRENT OPEN TASKS:
${taskList}

STUDENT SETTINGS:

Available study time:
${hours} hour(s) per day

Preferred session length:
${session} minutes

Study style:
${style}

Additional preferences:
${extra || "None"}

RULES:

- Start with today.
- Create exactly 7 days.
- Prioritize tasks with the closest deadlines.
- High priority tasks should receive more attention.
- Do not schedule work after its deadline.
- Do not exceed approximately ${hours} study hour(s) per day.
- Break large assignments into smaller study sessions.
- Include short breaks between long sessions.
- If there is extra time, include review or preparation.
- Make the schedule realistic for a college student.
- Do not invent new assignments.

FORMAT:

Use this format:

DAY 1 — [Day and date]
• [time/session] — [task]
• [time/session] — [task]

Daily total: X hours

Then DAY 2, DAY 3, etc.

At the very end include:

TOP PRIORITIES
1.
2.
3.

Keep it easy to read.
`;


  $("plannerLoading")
    .classList.remove("hidden");

  $("generatePlanButton").disabled = true;

  $("generatePlanButton").textContent =
    "Creating plan...";


  try{

    const data =
      await api("/api/ai",{

        method:"POST",

        body:JSON.stringify({
          message:prompt
        })

      });


    const plan =
      data.answer || "";


    $("plannerText").textContent =
      plan;


    $("plannerResult")
      .classList.remove("hidden");


    localStorage.setItem(
      key("studyPlan"),
      plan
    );


    $("plannerResult")
      .scrollIntoView({
        behavior:"smooth",
        block:"start"
      });


  }catch(error){

    $("plannerError").textContent =
      error.message;

  }finally{

    $("plannerLoading")
      .classList.add("hidden");

    $("generatePlanButton").disabled = false;

    $("generatePlanButton").textContent =
      "✨ Generate My Study Plan";

  }
}


function clearStudyPlan(){

  localStorage.removeItem(
    key("studyPlan")
  );

  $("plannerText").textContent = "";

  $("plannerResult")
    .classList.add("hidden");
}


/* =========================================================
   AI FLASHCARDS
   ========================================================= */

function renderFlashcards(){

  if(!currentUser){
    return;
  }


  /* NOTES DROPDOWN */

  const noteSelect = $("flashNoteSelect");


  if(noteSelect){

    const oldValue =
      noteSelect.value;


    noteSelect.innerHTML = `
      <option value="">
        — Paste text manually —
      </option>

      ${notes.map(note => `
        <option value="${note.id}">
          ${safe(note.title)}
          ${note.course ? " · " + safe(note.course) : ""}
        </option>
      `).join("")}
    `;


    if(
      [...noteSelect.options]
      .some(option => option.value === oldValue)
    ){
      noteSelect.value = oldValue;
    }


    noteSelect.onchange = () => {

      if(!noteSelect.value){
        return;
      }


      const note =
        notes.find(
          item =>
            String(item.id) ===
            String(noteSelect.value)
        );


      if(note){

        $("flashSource").value =
          `${note.title}

${note.course ? "Class: " + note.course + "\n\n" : ""}${note.text}`;

      }

    };

  }


  /* STATS */

  const totalCards =
    flashcardSets.reduce(
      (sum,set) =>
        sum + (set.cards?.length || 0),
      0
    );


  const studied =
    Number(
      localStorage.getItem(
        key("flashcardsStudied")
      )
    ) || 0;


  if($("flashSetCount")){
    $("flashSetCount").textContent =
      flashcardSets.length;
  }

  if($("flashCardCount")){
    $("flashCardCount").textContent =
      totalCards;
  }

  if($("flashStudiedCount")){
    $("flashStudiedCount").textContent =
      studied;
  }


  /* SET LIST */

  if(!$("flashcardSets")){
    return;
  }


  if(!flashcardSets.length){

    $("flashcardSets").innerHTML = `
      <div class="panel">
        <h3>No flashcards yet</h3>

        <p class="muted" style="margin-top:6px">
          Choose a note above and let StudyFlow
          create your first study set.
        </p>
      </div>
    `;

    return;
  }


  $("flashcardSets").innerHTML =
    flashcardSets
    .slice()
    .reverse()
    .map(set => {

      const firstCard =
        set.cards?.[0];

      return `

        <div class="flash-set">

          <div class="flash-set-icon">
            🧠
          </div>

          <h3>
            ${safe(set.name)}
          </h3>

          <div class="flash-set-meta">
            ${set.cards.length} cards
            ${
              set.course
                ? " · " + safe(set.course)
                : ""
            }
          </div>

          <div class="flash-set-preview">
            ${
              firstCard
                ? safe(firstCard.front)
                : "Empty set"
            }
          </div>

          <div class="flash-set-actions">

            <button
              onclick="startStudySet(${set.id})"
            >
              Study →
            </button>

            <button
              class="flash-delete"
              onclick="deleteFlashcardSet(${set.id})"
            >
              🗑
            </button>

          </div>

        </div>

      `;

    })
    .join("");
}


/* GENERATE */

async function generateFlashcards(){

  $("flashError").textContent = "";


  const source =
    $("flashSource").value.trim();


  if(source.length < 20){

    $("flashError").textContent =
      "Add some study material first.";

    return;
  }


  const count =
    Number($("flashCount").value);


  const difficulty =
    $("flashDifficulty").value;


  const selectedNoteId =
    $("flashNoteSelect").value;


  const selectedNote =
    notes.find(
      item =>
        String(item.id) ===
        String(selectedNoteId)
    );


  const setName =
    selectedNote
      ? selectedNote.title
      : "AI Study Set";


  const course =
    selectedNote?.course || "";


  const prompt = `
You are creating flashcards for a college student.

SOURCE MATERIAL:
${source}

Create exactly ${count} flashcards.

Difficulty:
${difficulty}

RULES:
- Focus on the most important concepts.
- Questions should test understanding, not just copy sentences.
- Answers should be concise but useful.
- Do not invent facts that are not in the source.
- Avoid duplicate questions.
- For math/science, include formulas or definitions when useful.

RETURN ONLY VALID JSON.

Do not use markdown.
Do not use code fences.
Do not add commentary.

Return exactly this format:

[
  {
    "front": "Question or term",
    "back": "Answer or explanation"
  }
]
`;


  $("flashLoading")
    .classList.remove("hidden");


  $("generateFlashButton").disabled =
    true;


  $("generateFlashButton").textContent =
    "Generating...";


  try{

    const data =
      await api("/api/ai",{

        method:"POST",

        body:JSON.stringify({
          message:prompt
        })

      });


    let raw =
      data.answer || "";


    raw =
      raw
      .replace(/```json/gi,"")
      .replace(/```/g,"")
      .trim();


    const firstBracket =
      raw.indexOf("[");


    const lastBracket =
      raw.lastIndexOf("]");


    if(
      firstBracket !== -1 &&
      lastBracket !== -1
    ){

      raw =
        raw.substring(
          firstBracket,
          lastBracket + 1
        );

    }


    const parsed =
      JSON.parse(raw);


    if(
      !Array.isArray(parsed) ||
      !parsed.length
    ){

      throw new Error(
        "AI did not return usable flashcards."
      );

    }


    const cards =
      parsed
      .filter(card =>
        card &&
        card.front &&
        card.back
      )
      .map(card => ({
        front:
          String(card.front),
        back:
          String(card.back)
      }));


    if(!cards.length){

      throw new Error(
        "No valid flashcards were generated."
      );

    }


    flashcardSets.push({

      id:Date.now(),

      name:setName,

      course,

      createdAt:
        new Date().toISOString(),

      cards

    });


    saveEverything();

    renderFlashcards();


    $("flashSource").value = "";

    $("flashNoteSelect").value = "";


    const newSet =
      flashcardSets[
        flashcardSets.length - 1
      ];


    startStudySet(newSet.id);


  }catch(error){

    console.error(error);

    $("flashError").textContent =
      "Could not create flashcards: "
      + error.message;

  }finally{

    $("flashLoading")
      .classList.add("hidden");


    $("generateFlashButton").disabled =
      false;


    $("generateFlashButton").textContent =
      "✨ Generate Flashcards";

  }
}


/* DELETE SET */

function deleteFlashcardSet(id){

  const confirmed =
    confirm(
      "Delete this flashcard set?"
    );


  if(!confirmed){
    return;
  }


  flashcardSets =
    flashcardSets.filter(
      set => set.id !== id
    );


  saveEverything();

  renderFlashcards();
}


/* STUDY */

function startStudySet(id){

  const set =
    flashcardSets.find(
      item => item.id === id
    );


  if(
    !set ||
    !set.cards ||
    !set.cards.length
  ){
    return;
  }


  currentStudySet =
    set;


  currentStudyIndex =
    0;


  currentStudyFlipped =
    false;


  currentStudyKnown =
    0;


  currentStudyAgain =
    0;


  $("studyMode")
    .classList.remove("hidden");


  $("studyComplete")
    .classList.add("hidden");


  renderStudyCard();
}


function renderStudyCard(){

  if(
    !currentStudySet ||
    !currentStudySet.cards.length
  ){
    return;
  }


  const card =
    currentStudySet.cards[
      currentStudyIndex
    ];


  const total =
    currentStudySet.cards.length;


  $("studySetName").textContent =
    currentStudySet.name;


  $("studyProgress").textContent =
    `Card ${currentStudyIndex + 1} of ${total}`;


  $("studyProgressBar").style.width =
    `${((currentStudyIndex + 1) / total) * 100}%`;


  $("studySideLabel").textContent =
    currentStudyFlipped
      ? "ANSWER"
      : "QUESTION";


  $("studyCardText").textContent =
    currentStudyFlipped
      ? card.back
      : card.front;


  $("studyKnown").textContent =
    currentStudyKnown;


  $("studyAgain").textContent =
    currentStudyAgain;
}


function flipStudyCard(){

  currentStudyFlipped =
    !currentStudyFlipped;


  renderStudyCard();
}


function markStudyCard(known){

  if(!currentStudySet){
    return;
  }


  if(known){
    currentStudyKnown++;
  }else{
    currentStudyAgain++;
  }


  let studied =
    Number(
      localStorage.getItem(
        key("flashcardsStudied")
      )
    ) || 0;


  studied++;


  localStorage.setItem(
    key("flashcardsStudied"),
    studied
  );


  if(
    currentStudyIndex <
    currentStudySet.cards.length - 1
  ){

    currentStudyIndex++;

    currentStudyFlipped =
      false;


    renderStudyCard();

    return;
  }


  completeStudySession();
}


function completeStudySession(){

  $("studyMode")
    .classList.add("hidden");


  $("completeKnown").textContent =
    currentStudyKnown;


  $("completeAgain").textContent =
    currentStudyAgain;


  $("studyComplete")
    .classList.remove("hidden");


  renderFlashcards();
}


function restartCurrentSet(){

  if(!currentStudySet){
    return;
  }


  $("studyComplete")
    .classList.add("hidden");


  startStudySet(
    currentStudySet.id
  );
}


function finishStudySession(){

  $("studyComplete")
    .classList.add("hidden");


  currentStudySet =
    null;
}


function closeStudyMode(){

  $("studyMode")
    .classList.add("hidden");
}


/* =========================================================
   PART 1 — STUDENT CORE DATA
========================================================= */

let degreeCourses = [];
let semesterCourses = [];
let attendanceData = [];

let degreeSettings = {
  major:"",
  totalCredits:120
};

let studyXP = 0;
let studyStreak = 1;


/* =========================================================
   STUDENT CORE INIT
========================================================= */

function initStudentCore(){

  if(!currentUser){
    return;
  }

  degreeCourses =
    JSON.parse(
      localStorage.getItem(
        key("degreeCourses")
      )
    ) || [];


  semesterCourses =
    JSON.parse(
      localStorage.getItem(
        key("semesterCourses")
      )
    ) || [];


  attendanceData =
    JSON.parse(
      localStorage.getItem(
        key("attendanceData")
      )
    ) || [];


  degreeSettings =
    JSON.parse(
      localStorage.getItem(
        key("degreeSettings")
      )
    ) || {
      major:"",
      totalCredits:120
    };


  studyXP =
    Number(
      localStorage.getItem(
        key("studyXP")
      )
    ) || 0;


  studyStreak =
    Number(
      localStorage.getItem(
        key("studyStreak")
      )
    ) || 1;


  renderStudentCore();
}


function saveStudentCore(){

  if(!currentUser){
    return;
  }

  localStorage.setItem(
    key("degreeCourses"),
    JSON.stringify(degreeCourses)
  );


  localStorage.setItem(
    key("semesterCourses"),
    JSON.stringify(semesterCourses)
  );


  localStorage.setItem(
    key("attendanceData"),
    JSON.stringify(attendanceData)
  );


  localStorage.setItem(
    key("degreeSettings"),
    JSON.stringify(degreeSettings)
  );


  localStorage.setItem(
    key("studyXP"),
    studyXP
  );


  localStorage.setItem(
    key("studyStreak"),
    studyStreak
  );

}


/* =========================================================
   XP
========================================================= */

function addXP(amount){

  studyXP += amount;

  saveStudentCore();

  renderAnalytics();
}


function getStudentLevel(){

  return Math.floor(
    studyXP / 500
  ) + 1;
}


/* =========================================================
   DEGREE PLANNER
========================================================= */

function saveDegreeSettings(){

  degreeSettings.major =
    $("degreeMajor").value.trim();


  degreeSettings.totalCredits =
    Math.max(
      1,
      Number(
        $("degreeTotalCredits").value
      ) || 120
    );


  saveStudentCore();

  renderDegreePlanner();

  showToast(
    "🎓 Degree settings saved"
  );
}


function addDegreeCourse(){

  const code =
    $("degreeCourseCode").value.trim();

  const name =
    $("degreeCourseName").value.trim();

  const credits =
    Number(
      $("degreeCourseCredits").value
    ) || 0;

  const category =
    $("degreeCourseCategory").value;


  if(!name || credits <= 0){
    return;
  }


  degreeCourses.push({

    id:Date.now(),

    code,

    name,

    credits,

    category,

    completed:false

  });


  $("degreeCourseCode").value="";
  $("degreeCourseName").value="";
  $("degreeCourseCredits").value="4";


  saveStudentCore();

  renderDegreePlanner();
}


function toggleDegreeCourse(id){

  const course =
    degreeCourses.find(
      item => item.id === id
    );


  if(!course){
    return;
  }


  const wasCompleted =
    course.completed;


  course.completed =
    !course.completed;


  if(
    course.completed &&
    !wasCompleted
  ){
    addXP(25);
  }


  saveStudentCore();

  renderDegreePlanner();
}


function deleteDegreeCourse(id){

  degreeCourses =
    degreeCourses.filter(
      item => item.id !== id
    );


  saveStudentCore();

  renderDegreePlanner();
}


function renderDegreePlanner(){

  if(!$("degreeCourseList")){
    return;
  }


  $("degreeMajor").value =
    degreeSettings.major || "";


  $("degreeTotalCredits").value =
    degreeSettings.totalCredits || 120;


  const completed =
    degreeCourses.filter(
      course => course.completed
    );


  const completedCredits =
    completed.reduce(
      (sum,course) =>
        sum + Number(course.credits),
      0
    );


  const totalCredits =
    Number(
      degreeSettings.totalCredits
    ) || 120;


  const remaining =
    Math.max(
      totalCredits -
      completedCredits,
      0
    );


  const percent =
    Math.min(
      100,
      totalCredits
        ? completedCredits /
          totalCredits * 100
        : 0
    );


  $("degreeCompletedCredits")
    .textContent =
    completedCredits;


  $("degreeRemainingCredits")
    .textContent =
    remaining;


  $("degreeCompletedCourses")
    .textContent =
    completed.length;


  $("degreePercent")
    .textContent =
    `${percent.toFixed(0)}%`;


  $("degreeRingPercent")
    .textContent =
    `${percent.toFixed(0)}%`;


  $("degreeSummaryCompleted")
    .textContent =
    `${completedCredits} credits`;


  $("degreeSummaryRemaining")
    .textContent =
    `${remaining} credits`;


  $("degreeProgressFill")
    .style.width =
    `${percent}%`;


  $("degreeRing")
    .style.background =
    `conic-gradient(
      var(--primary) ${percent}%,
      #eceef3 ${percent}%
    )`;


  $("degreeCourseList").innerHTML =
    degreeCourses.length
    ?
    degreeCourses.map(course => `

      <div class="degree-requirement">

        <input
          class="degree-check"
          type="checkbox"
          ${course.completed ? "checked" : ""}
          onchange="toggleDegreeCourse(${course.id})"
        >

        <div>

          <strong>
            ${
              safe(
                course.code
                  ? course.code + " — " + course.name
                  : course.name
              )
            }
          </strong>

          <p>
            ${course.credits} credits
            ·
            ${safe(course.category)}
          </p>

        </div>


        <div class="degree-actions">

          <span class="degree-tag">
            ${course.completed ? "Completed" : "Required"}
          </span>

          <button
            class="delete-btn"
            onclick="deleteDegreeCourse(${course.id})"
          >
            ×
          </button>

        </div>

      </div>

    `).join("")
    :
    `
      <div class="panel">
        <p class="muted">
          Add your degree requirements to start tracking progress.
        </p>
      </div>
    `;
}


/* =========================================================
   SEMESTER PLANNER
========================================================= */

function addSemesterCourse(){

  const name =
    $("semesterCourse").value.trim();

  const credits =
    Number(
      $("semesterCredits").value
    ) || 0;

  const term =
    $("semesterTerm").value;

  const difficulty =
    $("semesterDifficulty").value;


  if(!name || credits <= 0){
    return;
  }


  semesterCourses.push({

    id:Date.now(),

    name,

    credits,

    term,

    difficulty

  });


  $("semesterCourse").value="";
  $("semesterCredits").value="4";


  saveStudentCore();

  renderSemesterPlanner();
}


function deleteSemesterCourse(id){

  semesterCourses =
    semesterCourses.filter(
      item => item.id !== id
    );


  saveStudentCore();

  renderSemesterPlanner();
}


function renderSemesterPlanner(){

  if(!$("semesterBoards")){
    return;
  }


  const defaultTerms = [
    "Fall 2026",
    "Winter 2027",
    "Summer 2027"
  ];


  const customTerms =
    semesterCourses.map(
      item => item.term
    );


  const terms =
    [...new Set([
      ...defaultTerms,
      ...customTerms
    ])];


  $("semesterBoards").innerHTML =
    terms.map(term => {

      const courses =
        semesterCourses.filter(
          item => item.term === term
        );


      const credits =
        courses.reduce(
          (sum,item) =>
            sum + Number(item.credits),
          0
        );


      return `

        <div class="semester-column">

          <div class="semester-column-head">

            <div>
              <strong>
                ${safe(term)}
              </strong>

              <p>
                ${credits} credits
              </p>
            </div>

          </div>


          ${
            courses.length
            ?
            courses.map(course => `

              <div class="semester-course-card">

                <h3>
                  ${safe(course.name)}
                </h3>

                <div class="semester-course-meta">
                  ${course.credits} credits
                </div>

                <span
                  class="difficulty-pill ${safe(course.difficulty)}"
                >
                  ${safe(course.difficulty)}
                </span>

                <button
                  class="delete-btn"
                  style="margin-left:6px"
                  onclick="deleteSemesterCourse(${course.id})"
                >
                  ×
                </button>

              </div>

            `).join("")
            :
            `
              <p class="muted">
                No courses planned.
              </p>
            `
          }

        </div>

      `;

    }).join("");
}


/* =========================================================
   ATTENDANCE
========================================================= */

function renderAttendanceSelector(){

  if(!$("attendanceClass")){
    return;
  }


  const current =
    $("attendanceClass").value;


  $("attendanceClass").innerHTML =
    `
      <option value="">
        Select class
      </option>

      ${classes.map(course => `
        <option value="${safe(course.name)}">
          ${safe(course.name)}
        </option>
      `).join("")}
    `;


  if(
    [...$("attendanceClass").options]
    .some(option =>
      option.value === current
    )
  ){
    $("attendanceClass").value =
      current;
  }

}


function addAttendanceClass(){

  const course =
    $("attendanceClass").value;

  const limit =
    Number(
      $("attendanceLimit").value
    ) || 0;


  if(!course || limit <= 0){
    return;
  }


  const exists =
    attendanceData.some(
      item =>
        item.course === course
    );


  if(exists){

    showToast(
      "Attendance tracker already exists for this class."
    );

    return;
  }


  attendanceData.push({

    id:Date.now(),

    course,

    absences:0,

    limit

  });


  saveStudentCore();

  renderAttendance();
}


function changeAbsence(id,amount){

  const item =
    attendanceData.find(
      tracker =>
        tracker.id === id
    );


  if(!item){
    return;
  }


  item.absences =
    Math.max(
      0,
      item.absences + amount
    );


  saveStudentCore();

  renderAttendance();
}


function deleteAttendance(id){

  attendanceData =
    attendanceData.filter(
      item =>
        item.id !== id
    );


  saveStudentCore();

  renderAttendance();
}


function renderAttendance(){

  if(!$("attendanceList")){
    return;
  }


  renderAttendanceSelector();


  $("attendanceList").innerHTML =
    attendanceData.length
    ?
    attendanceData.map(item => {

      const remaining =
        Math.max(
          item.limit - item.absences,
          0
        );


      const danger =
        remaining <= 1;


      return `

        <div class="attendance-card">

          <h3>
            ${safe(item.course)}
          </h3>


          <div class="attendance-numbers">

            <div>
              <strong>
                ${item.absences}
              </strong>

              <span>
                Absences
              </span>
            </div>


            <div>
              <strong>
                ${item.limit}
              </strong>

              <span>
                Allowed
              </span>
            </div>


            <div>
              <strong>
                ${remaining}
              </strong>

              <span>
                Remaining
              </span>
            </div>

          </div>


          <div class="attendance-actions">

            <button
              onclick="changeAbsence(${item.id},1)"
            >
              + Absence
            </button>

            <button
              class="secondary"
              onclick="changeAbsence(${item.id},-1)"
            >
              Undo
            </button>

          </div>


          <div
            class="${
              danger
                ? "attendance-warning"
                : "attendance-ok"
            }"
          >

            ${
              danger
                ? "⚠ You are close to your absence limit."
                : "✓ Attendance is currently okay."
            }

          </div>


          <button
            class="delete-btn"
            onclick="deleteAttendance(${item.id})"
          >
            Delete tracker
          </button>

        </div>

      `;

    }).join("")
    :
    `
      <div class="panel">
        <p class="muted">
          Add one of your classes above to start tracking attendance.
        </p>
      </div>
    `;
}


/* =========================================================
   WEEKLY OVERVIEW
========================================================= */

function localDateKey(date){

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth()+1
    ).padStart(2,"0");

  const day =
    String(
      date.getDate()
    ).padStart(2,"0");


  return `${year}-${month}-${day}`;
}


function renderWeeklyOverview(){

  if(!$("weekDays")){
    return;
  }


  const today =
    new Date();


  const week = [];


  for(let i=0;i<7;i++){

    const date =
      new Date(today);

    date.setDate(
      today.getDate()+i
    );

    week.push(date);
  }


  const weekKeys =
    week.map(localDateKey);


  const weekTasks =
    tasks.filter(
      task =>
        task.date &&
        weekKeys.includes(task.date)
    );


  $("overviewTasks").textContent =
    weekTasks.length;


  $("overviewHigh").textContent =
    weekTasks.filter(
      task =>
        task.priority === "High"
    ).length;


  const focus =
    Number(
      localStorage.getItem(
        key("focusMinutes")
      )
    ) || 0;


  $("overviewFocus").textContent =
    `${focus}m`;


  $("overviewXP").textContent =
    studyXP;


  $("weekDays").innerHTML =
    week.map((date,index) => {

      const dateString =
        localDateKey(date);


      const dayTasks =
        tasks.filter(
          task =>
            task.date === dateString &&
            task.status !== "done"
        );


      return `

        <div class="
          week-day
          ${index === 0 ? "today" : ""}
        ">

          <div class="week-day-name">

            ${
              date
              .toLocaleDateString(
                "en-US",
                {weekday:"short"}
              )
              .toUpperCase()
            }

          </div>


          <div class="week-day-date">
            ${date.getDate()}
          </div>


          ${
            dayTasks.length
            ?
            dayTasks.map(task => `

              <div class="week-task">
                ${safe(task.name)}
              </div>

            `).join("")
            :
            `
              <p
                class="muted"
                style="font-size:11px"
              >
                Nothing due
              </p>
            `
          }

        </div>

      `;

    }).join("");
}


/* =========================================================
   ANALYTICS
========================================================= */

function renderAnalytics(){

  if(!$("analyticsCompleted")){
    return;
  }


  const total =
    tasks.length;


  const complete =
    tasks.filter(
      task =>
        task.status === "done"
    ).length;


  const percent =
    total
      ? complete / total * 100
      : 0;


  $("analyticsCompleted")
    .textContent =
    `${percent.toFixed(0)}%`;


  $("analyticsTaskBar")
    .style.width =
    `${percent}%`;


  const minutes =
    Number(
      localStorage.getItem(
        key("focusMinutes")
      )
    ) || 0;


  $("analyticsMinutes")
    .textContent =
    minutes;


  $("analyticsStreak")
    .textContent =
    studyStreak;


  const level =
    getStudentLevel();


  $("analyticsLevel")
    .textContent =
    level;


  const currentLevelXP =
    studyXP % 500;


  $("xpText").textContent =
    `${currentLevelXP} / 500 XP`;


  $("xpFill").style.width =
    `${currentLevelXP / 500 * 100}%`;


  const workload = {};


  tasks.forEach(task => {

    const course =
      task.course || "Other";


    if(!workload[course]){
      workload[course]=0;
    }


    if(task.status !== "done"){
      workload[course]++;
    }

  });


  const max =
    Math.max(
      1,
      ...Object.values(workload)
    );


  $("courseAnalytics").innerHTML =
    Object.keys(workload).length
    ?
    Object.entries(workload)
    .sort((a,b)=>b[1]-a[1])
    .map(([course,count]) => `

      <div class="course-analytics-row">

        <div class="course-analytics-label">

          <span>
            ${safe(course)}
          </span>

          <strong>
            ${count} open
          </strong>

        </div>


        <div class="course-load-bar">

          <div
            style="width:${
              count / max * 100
            }%"
          ></div>

        </div>

      </div>

    `).join("")
    :
    `
      <p class="muted">
        Add tasks to see workload analytics.
      </p>
    `;
}


/* =========================================================
   TASK PROGRESS
========================================================= */

function setTaskProgress(id){

  const task =
    tasks.find(
      item =>
        item.id === id
    );


  if(!task){
    return;
  }


  let value =
    prompt(
      "Task progress from 0 to 100:",
      task.progress || 0
    );


  if(value === null){
    return;
  }


  value =
    Math.max(
      0,
      Math.min(
        100,
        Number(value) || 0
      )
    );


  task.progress =
    value;


  if(value >= 100){
    task.status =
      "done";
  }


  saveEverything();

  renderEverything();

  renderStudentCore();
}


/* =========================================================
   QUICK ADD
========================================================= */

function toggleQuickAdd(){

  $("quickAddMenu")
    .classList.toggle("hidden");
}


function quickAddTask(){

  $("quickAddMenu")
    .classList.add("hidden");

  showPage("tasks");

  setTimeout(()=>{
    $("taskName")?.focus();
  },100);
}


function quickAddNote(){

  $("quickAddMenu")
    .classList.add("hidden");

  showPage("notes");

  setTimeout(()=>{
    $("noteTitle")?.focus();
  },100);
}


function quickAddClass(){

  $("quickAddMenu")
    .classList.add("hidden");

  showPage("classes");

  setTimeout(()=>{
    $("className")?.focus();
  },100);
}


/* =========================================================
   COMMAND PALETTE
========================================================= */

const commandPages = [

  ["dashboard","🏠 Dashboard"],
  ["classes","📚 Classes"],
  ["tasks","✅ Tasks"],
  ["planner","🧠 Study Planner"],
  ["calendar","📅 Calendar"],
  ["degree","🎓 Degree Planner"],
  ["semester","🗓 Semester Planner"],
  ["attendance","🙋 Attendance"],
  ["overview","📆 Weekly Overview"],
  ["analytics","📈 Analytics"],
  ["grades","📊 Grades"],
  ["predictor","🎯 Grade Predictor"],
  ["notes","📝 Notes"],
  ["flashcards","🧠 Flashcards"],
  ["ai","✨ AI Tutor"],
  ["timer","⏱ Focus"],
  ["profile","👤 Profile"]

];


function openCommandPalette(){

  $("commandPalette")
    .classList.remove("hidden");

  $("commandInput").value="";

  renderCommandResults("");

  setTimeout(()=>{
    $("commandInput").focus();
  },30);
}


function closeCommandPalette(){

  $("commandPalette")
    .classList.add("hidden");
}


function renderCommandResults(query){

  const q =
    query
    .trim()
    .toLowerCase();


  const pages =
    commandPages.filter(
      ([id,label]) =>
        document.getElementById(id) &&
        label.toLowerCase().includes(q)
    );


  const matchingTasks =
    tasks.filter(
      task =>
        task.name
        .toLowerCase()
        .includes(q)
    )
    .slice(0,5);


  const matchingNotes =
    notes.filter(
      note =>
        note.title
        .toLowerCase()
        .includes(q)
    )
    .slice(0,5);


  let html = "";


  pages.forEach(([id,label]) => {

    html += `

      <div
        class="command-result"
        onclick="
          showPage('${id}');
          closeCommandPalette();
        "
      >

        <strong>
          ${label}
        </strong>

        <span>
          Open page
        </span>

      </div>

    `;

  });


  matchingTasks.forEach(task => {

    html += `

      <div
        class="command-result"
        onclick="
          showPage('tasks');
          closeCommandPalette();
        "
      >

        <strong>
          ✅ ${safe(task.name)}
        </strong>

        <span>
          Task
        </span>

      </div>

    `;

  });


  matchingNotes.forEach(note => {

    html += `

      <div
        class="command-result"
        onclick="
          showPage('notes');
          closeCommandPalette();
        "
      >

        <strong>
          📝 ${safe(note.title)}
        </strong>

        <span>
          Note
        </span>

      </div>

    `;

  });


  $("commandResults").innerHTML =
    html ||
    `
      <div
        style="
          padding:20px;
          color:var(--muted);
        "
      >
        No results
      </div>
    `;
}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function showToast(message){

  const toast =
    $("studyToast");


  if(!toast){
    return;
  }


  toast.textContent =
    message;


  toast.classList
    .remove("hidden");


  clearTimeout(
    window.studyToastTimer
  );


  window.studyToastTimer =
    setTimeout(()=>{

      toast.classList
        .add("hidden");

    },3500);
}


function checkUpcomingDeadlines(){

  if(!currentUser){
    return;
  }


  const now =
    new Date();


  const tomorrow =
    new Date(now);

  tomorrow.setDate(
    now.getDate()+1
  );


  const tomorrowKey =
    localDateKey(tomorrow);


  const dueTomorrow =
    tasks.filter(
      task =>
        task.status !== "done" &&
        task.date === tomorrowKey
    );


  if(dueTomorrow.length){

    showToast(
      `⏰ ${dueTomorrow.length} task${
        dueTomorrow.length === 1
          ? ""
          : "s"
      } due tomorrow`
    );

  }
}


/* =========================================================
   CORE RENDER
========================================================= */

function renderStudentCore(){

  if(!currentUser){
    return;
  }

  renderDegreePlanner();

  renderSemesterPlanner();

  renderAttendance();

  renderWeeklyOverview();

  renderAnalytics();

}


/* =========================================================
   HOTKEYS
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if(
      (event.metaKey || event.ctrlKey) &&
      event.key.toLowerCase() === "k"
    ){

      event.preventDefault();

      openCommandPalette();

    }


    if(
      event.key === "Escape" &&
      $("commandPalette") &&
      !$("commandPalette")
        .classList.contains("hidden")
    ){

      closeCommandPalette();

    }

  }
);


document.addEventListener(
  "input",
  event => {

    if(
      event.target.id === "commandInput"
    ){

      renderCommandResults(
        event.target.value
      );

    }

  }
);


/* =========================================================
   PATCH EXISTING TASK CARDS
========================================================= */

const oldTaskCardFunction =
  typeof taskCard === "function"
    ? taskCard
    : null;


if(oldTaskCardFunction){

  const originalTaskCard =
    oldTaskCardFunction;


  taskCard = function(task){

    let html =
      originalTaskCard(task);


    const progress =
      Number(task.progress || 0);


    const extra = `

      <div class="task-progress-wrap">

        <div class="task-progress-label">

          <span>
            Progress
          </span>

          <span>
            ${progress}%
          </span>

        </div>

        <div class="task-progress-track">

          <div
            style="width:${progress}%"
          ></div>

        </div>

        <button
          class="secondary"
          style="
            margin-top:8px;
            font-size:11px;
            padding:6px 8px;
          "
          onclick="setTaskProgress(${task.id})"
        >
          Update progress
        </button>

      </div>

    `;


    return html.replace(
      '</div>',
      extra + '</div>'
    );

  };

}


/* =========================================================
   PATCH EXISTING FUNCTIONS FOR XP
========================================================= */

if(typeof moveTask === "function"){

  const originalMoveTask =
    moveTask;


  moveTask = function(id,status){

    const before =
      tasks.find(
        item =>
          item.id === id
      );


    const alreadyDone =
      before?.status === "done";


    originalMoveTask(id,status);


    if(
      status === "done" &&
      !alreadyDone
    ){

      addXP(20);

      renderStudentCore();

    }

  };

}


/* =========================================================
   PERIODIC CORE REFRESH
========================================================= */

setInterval(()=>{

  if(currentUser){
    renderWeeklyOverview();
  }

},60000);



/* =========================================================
   PART 2 — AI POWER PACK
========================================================= */

let currentPracticeTest = [];

let quizTopicMemory = "";
let quizQuestionCount = 0;


/* ---------------------------------------------------------
   TOOL NAVIGATION
--------------------------------------------------------- */

function openAITool(name){

  document
  .querySelectorAll(
    ".ai-tool-panel"
  )
  .forEach(panel => {

    panel.classList
      .add("hidden");

  });


  const tool =
    $("tool-" + name);


  if(tool){

    tool.classList
      .remove("hidden");

  }

}


/* ---------------------------------------------------------
   NOTES + CLASS SELECTS
--------------------------------------------------------- */

function renderAIPowerSelectors(){

  if(!currentUser){
    return;
  }


  const noteOptions =
    notes.map(note => `

      <option value="${note.id}">
        ${safe(note.title)}
      </option>

    `).join("");


  [
    "practiceNoteSelect",
    "guideNoteSelect"

  ].forEach(id => {

    const select =
      $(id);


    if(!select){
      return;
    }


    const current =
      select.value;


    select.innerHTML =
      `
        <option value="">
          Choose saved note
        </option>

        ${noteOptions}
      `;


    if(
      [...select.options]
      .some(
        option =>
          option.value === current
      )
    ){
      select.value =
        current;
    }

  });


  if($("courseAIClass")){

    const current =
      $("courseAIClass").value;


    $("courseAIClass").innerHTML =
      `
        <option value="">
          Select class
        </option>

        ${classes.map(course => `

          <option value="${safe(course.name)}">
            ${safe(course.name)}
          </option>

        `).join("")}
      `;


    if(
      [...$("courseAIClass").options]
      .some(
        option =>
          option.value === current
      )
    ){

      $("courseAIClass").value =
        current;

    }

  }

}


function loadNoteIntoTool(
  noteId,
  targetId
){

  if(!noteId){
    return;
  }


  const note =
    notes.find(
      item =>
        String(item.id) ===
        String(noteId)
    );


  if(!note){
    return;
  }


  $(targetId).value =
    `${note.title}

${note.course ? "Class: " + note.course + "\n\n" : ""}${note.text}`;

}


/* ---------------------------------------------------------
   GENERIC AI
--------------------------------------------------------- */

async function callStudyAI(
  prompt,
  outputElement
){

  const element =
    typeof outputElement === "string"
      ? $(outputElement)
      : outputElement;


  if(element){

    element.innerHTML = `

      <div class="ai-thinking">

        <div class="ai-thinking-dot"></div>

        <span>
          StudyFlow AI is thinking...
        </span>

      </div>

    `;

  }


  try{

    const data =
      await api(
        "/api/ai",
        {
          method:"POST",

          body:JSON.stringify({
            message:prompt
          })
        }
      );


    if(element){

      element.textContent =
        data.answer || "";

    }


    return data.answer || "";


  }catch(error){

    if(element){

      element.textContent =
        "Error: " + error.message;

    }


    throw error;

  }

}


/* ---------------------------------------------------------
   PRACTICE TEST
--------------------------------------------------------- */

async function generatePracticeTest(){

  const source =
    $("practiceSource").value.trim();


  $("practiceError").textContent =
    "";


  if(source.length < 20){

    $("practiceError").textContent =
      "Add some study material first.";

    return;
  }


  const count =
    Number(
      $("practiceCount").value
    );


  const difficulty =
    $("practiceDifficulty").value;


  $("practiceTestArea").innerHTML =
    `
      <div class="ai-thinking">

        <div class="ai-thinking-dot"></div>

        Generating practice test...

      </div>
    `;


  const prompt = `
Create a college practice test.

SOURCE:
${source}

Number of questions:
${count}

Difficulty:
${difficulty}

Create multiple-choice questions.

Each question must have exactly 4 options.

Return ONLY valid JSON.

Format:

[
  {
    "question":"...",
    "options":[
      "A answer",
      "B answer",
      "C answer",
      "D answer"
    ],
    "correct":0,
    "explanation":"..."
  }
]

"correct" must be the numeric array index:
0, 1, 2, or 3.

Do not use markdown.
Do not use code fences.
Do not invent facts outside the source.
`;


  try{

    const raw =
      await callStudyAI(
        prompt,
        null
      );


    let clean =
      raw
      .replace(/```json/gi,"")
      .replace(/```/g,"")
      .trim();


    const start =
      clean.indexOf("[");


    const end =
      clean.lastIndexOf("]");


    if(
      start !== -1 &&
      end !== -1
    ){

      clean =
        clean.substring(
          start,
          end + 1
        );

    }


    const parsed =
      JSON.parse(clean);


    if(!Array.isArray(parsed)){

      throw new Error(
        "Invalid test format."
      );

    }


    currentPracticeTest =
      parsed;


    renderPracticeTest();


  }catch(error){

    $("practiceTestArea")
      .innerHTML = "";


    $("practiceError")
      .textContent =
      error.message;

  }

}


function renderPracticeTest(){

  $("practiceTestArea").innerHTML =
    currentPracticeTest
    .map(
      (question,index) => `

      <div
        class="practice-question"
        id="practice-q-${index}"
      >

        <h3>
          ${index + 1}.
          ${safe(question.question)}
        </h3>


        ${
          question.options
          .map(
            (option,optionIndex) => `

            <label class="practice-option">

              <input
                type="radio"
                name="practice-${index}"
                value="${optionIndex}"
              >

              ${safe(option)}

            </label>

          `).join("")
        }


        <div
          id="practice-explanation-${index}"
          class="muted"
          style="
            display:none;
            margin-top:10px;
          "
        ></div>

      </div>

    `).join("")
    +
    `

      <button onclick="gradePracticeTest()">
        Submit Test
      </button>

      <div
        id="practiceScore"
      ></div>

    `;

}


function gradePracticeTest(){

  let correct =
    0;


  currentPracticeTest
  .forEach(
    (question,index) => {

      const selected =
        document.querySelector(
          `input[name="practice-${index}"]:checked`
        );


      const questionBox =
        $(`practice-q-${index}`);


      const explanation =
        $(
          `practice-explanation-${index}`
        );


      if(!selected){

        questionBox.classList
          .add("answer-wrong");


        explanation.style.display =
          "block";


        explanation.textContent =
          `Correct answer: ${
            question.options[
              question.correct
            ]
          }. ${question.explanation || ""}`;


        return;
      }


      const answer =
        Number(
          selected.value
        );


      if(
        answer ===
        Number(question.correct)
      ){

        correct++;

        questionBox.classList
          .add("answer-correct");

      }else{

        questionBox.classList
          .add("answer-wrong");

      }


      explanation.style.display =
        "block";


      explanation.textContent =
        `Correct answer: ${
          question.options[
            question.correct
          ]
        }. ${question.explanation || ""}`;

    }
  );


  const percent =
    currentPracticeTest.length
      ? correct /
        currentPracticeTest.length *
        100
      : 0;


  $("practiceScore").innerHTML =
    `

      <div class="practice-score">

        <strong>
          ${percent.toFixed(0)}%
        </strong>

        <p>
          ${correct} / ${currentPracticeTest.length}
          correct
        </p>

      </div>

    `;


  if(
    typeof addXP === "function"
  ){

    addXP(
      Math.round(
        correct * 5
      )
    );

  }

}


/* ---------------------------------------------------------
   QUIZ ME
--------------------------------------------------------- */

async function startAIQuiz(){

  quizTopicMemory =
    $("quizTopic").value.trim();


  if(!quizTopicMemory){
    return;
  }


  quizQuestionCount =
    1;


  $("quizConversation")
    .innerHTML = "";


  await askNextQuizQuestion();

}


async function askNextQuizQuestion(
  previousAnswer = "",
  previousQuestion = ""
){

  const prompt = `
You are quizzing a college student.

TOPIC:
${quizTopicMemory}

This is question number:
${quizQuestionCount}

${previousQuestion
  ? `
Previous question:
${previousQuestion}

Student answer:
${previousAnswer}

Briefly tell the student whether the previous answer was correct.
Then ask ONE new question.
`
  : `
Ask ONE question.
`}

Do not give the answer to the new question.

Keep it concise.
`;


  const aiBubble =
    document.createElement("div");


  aiBubble.className =
    "quiz-bubble quiz-ai";


  aiBubble.textContent =
    "Thinking...";


  $("quizConversation")
    .appendChild(aiBubble);


  const answer =
    await callStudyAI(
      prompt,
      null
    );


  aiBubble.textContent =
    answer;


  aiBubble.dataset.question =
    answer;


  const inputArea =
    document.createElement("div");


  inputArea.className =
    "quiz-answer-box";


  inputArea.innerHTML = `

    <input
      placeholder="Type your answer..."
    >

    <button>
      Answer
    </button>

  `;


  const input =
    inputArea.querySelector(
      "input"
    );


  inputArea
  .querySelector("button")
  .onclick = async () => {

    const response =
      input.value.trim();


    if(!response){
      return;
    }


    const userBubble =
      document.createElement("div");


    userBubble.className =
      "quiz-bubble quiz-user";


    userBubble.textContent =
      response;


    $("quizConversation")
      .appendChild(userBubble);


    inputArea.remove();


    quizQuestionCount++;


    await askNextQuizQuestion(
      response,
      answer
    );

  };


  $("quizConversation")
    .appendChild(inputArea);

}


/* ---------------------------------------------------------
   STUDY GUIDE
--------------------------------------------------------- */

function generateStudyGuide(){

  const source =
    $("guideSource").value.trim();


  if(!source){
    return;
  }


  callStudyAI(
    `
Create a high-quality college study guide from this material:

${source}

Include:

1. Key concepts
2. Important definitions
3. Important facts
4. Things likely to appear on an exam
5. Common mistakes
6. Quick review section
7. Five self-test questions

Use clear headings and concise explanations.
`,
    "guideResult"
  );

}


/* ---------------------------------------------------------
   EXPLAIN THIS
--------------------------------------------------------- */

function explainThis(){

  const source =
    $("explainSource").value.trim();


  if(!source){
    return;
  }


  const level =
    $("explainLevel").value;


  callStudyAI(
    `
Explain the following material at a ${level} level:

${source}

Use:
- simple language
- step-by-step reasoning
- an example when useful
- a short summary at the end
`,
    "explainResult"
  );

}


/* ---------------------------------------------------------
   PDF
--------------------------------------------------------- */

function fileToBase64Power(file){

  return new Promise(
    (resolve,reject) => {

      const reader =
        new FileReader();


      reader.onload =
        () => {

          const result =
            reader.result;


          resolve(
            result.substring(
              result.indexOf(",") + 1
            )
          );

        };


      reader.onerror =
        reject;


      reader.readAsDataURL(
        file
      );

    }
  );

}


async function summarizePDF(){

  const file =
    $("aiPdfFile").files[0];


  if(!file){

    alert(
      "Choose a PDF first."
    );

    return;
  }


  const type =
    $("pdfSummaryType").value;


  $("pdfResult").innerHTML =
    `
      <div class="ai-thinking">
        <div class="ai-thinking-dot"></div>
        Reading PDF...
      </div>
    `;


  try{

    const fileData =
      await fileToBase64Power(
        file
      );


    let instruction =
      "";


    if(type === "summary"){

      instruction =
        `
Summarize this PDF for a college student.

Include:
- short overview
- key ideas
- important details
- concise final summary
`;

    }


    if(type === "study"){

      instruction =
        `
Turn this PDF into organized college study notes.

Include headings, key concepts, definitions,
examples and important information.
`;

    }


    if(type === "exam"){

      instruction =
        `
Create an exam review from this PDF.

Identify:
- most testable concepts
- definitions
- formulas
- key facts
- possible exam questions
- common mistakes
`;

    }


    if(type === "concepts"){

      instruction =
        `
Extract the key concepts from this PDF.

Explain each concept clearly and concisely.
`;

    }


    const data =
      await api(
        "/api/document-ai",
        {
          method:"POST",

          body:JSON.stringify({
            filename:file.name,
            fileData,
            instruction
          })
        }
      );


    $("pdfResult").textContent =
      data.answer || "";


  }catch(error){

    $("pdfResult").textContent =
      "Error: " + error.message;

  }

}


/* ---------------------------------------------------------
   FORMULA SHEET
--------------------------------------------------------- */

function generateFormulaSheet(){

  const source =
    $("formulaSource").value.trim();


  if(!source){
    return;
  }


  callStudyAI(
    `
Create a compact formula sheet from this material:

${source}

For each formula include:

- formula name
- formula
- meaning of each variable
- when to use it
- one short example if useful

Do not invent formulas unrelated to the material.
`,
    "formulaResult"
  );

}


/* ---------------------------------------------------------
   CITATION
--------------------------------------------------------- */

function generateCitation(){

  const source =
    $("citationSource").value.trim();


  const style =
    $("citationStyle").value;


  if(!source){
    return;
  }


  callStudyAI(
    `
Create a ${style} citation using only the information below:

${source}

If information needed for the citation is missing,
clearly say which information is missing.

Return:
1. Full citation
2. In-text citation if that citation style uses one
`,
    "citationResult"
  );

}


/* ---------------------------------------------------------
   ESSAY / RESEARCH PLANNER
--------------------------------------------------------- */

function generateResearchPlan(){

  const topic =
    $("researchTopic").value.trim();


  const type =
    $("researchType").value;


  if(!topic){
    return;
  }


  callStudyAI(
    `
Help a college student plan a ${type}.

TOPIC:
${topic}

Create:

1. Refined research question
2. Possible thesis
3. Main arguments / sections
4. Detailed outline
5. Evidence needed for each section
6. Search keywords
7. Possible primary research idea if appropriate
8. Questions the student should investigate
9. Suggested conclusion direction

Do not fabricate sources.
`,
    "researchResult"
  );

}


/* ---------------------------------------------------------
   COURSE ASSISTANT
--------------------------------------------------------- */

function askCourseAI(){

  const course =
    $("courseAIClass").value;


  const question =
    $("courseAIQuestion").value.trim();


  if(
    !course ||
    !question
  ){
    return;
  }


  const courseNotes =
    notes
    .filter(
      note =>
        (
          note.course ||
          note.subject ||
          ""
        ).toLowerCase()
        ===
        course.toLowerCase()
    )
    .map(
      note =>
        `${note.title}\n${note.text}`
    )
    .join("\n\n");


  const courseTasks =
    tasks
    .filter(
      task =>
        (
          task.course ||
          ""
        ).toLowerCase()
        ===
        course.toLowerCase()
    )
    .map(
      task =>
        `${task.name} — deadline: ${task.date || "none"}`
    )
    .join("\n");


  callStudyAI(
    `
You are the student's AI assistant for this course:

COURSE:
${course}

STUDENT NOTES:
${courseNotes || "No saved notes yet."}

COURSE TASKS:
${courseTasks || "No saved tasks yet."}

QUESTION:
${question}

Answer using the student's course context when relevant.

If the provided notes do not contain enough information,
say so instead of pretending they do.
`,
    "courseAIResult"
  );

}


/* ---------------------------------------------------------
   AUTO REFRESH SELECTORS
--------------------------------------------------------- */

setInterval(
  () => {

    if(currentUser){

      renderAIPowerSelectors();

    }

  },
  3000
);



/* =========================================================
   PART 3 — PRO / APP VERSION
========================================================= */

let proSettings = {

  theme:"light",

  accent:"#635bff",

  density:"normal",

  showStats:true,

  showUpcoming:true,

  showAI:true,

  compactSidebar:false

};


let deferredInstallPrompt =
  null;


let onboardingThemeChoice =
  "light";


let proInitialized =
  false;


/* =========================================================
   INITIALIZE PRO VERSION
========================================================= */

function initProVersion(){

  if(
    !currentUser ||
    proInitialized
  ){
    return;
  }


  proInitialized =
    true;


  const saved =
    localStorage.getItem(
      key("proSettings")
    );


  if(saved){

    try{

      proSettings = {
        ...proSettings,
        ...JSON.parse(saved)
      };

    }catch{}

  }


  applyProSettings();

  renderProSettings();

  checkStudyFlowOnboarding();

  checkProDeadlineNotifications();


  setTimeout(()=>{

    if(
      deferredInstallPrompt &&
      !localStorage.getItem(
        key("installDismissed")
      )
    ){

      $("installBanner")
        ?.classList
        .remove("hidden");

    }

  },2500);

}


/* =========================================================
   SETTINGS
========================================================= */

function saveProSettings(){

  if(!currentUser){
    return;
  }


  localStorage.setItem(
    key("proSettings"),
    JSON.stringify(proSettings)
  );

}


function updateProSettings(){

  if(!$("settingsTheme")){
    return;
  }


  proSettings.theme =
    $("settingsTheme").value;


  proSettings.density =
    $("settingsDensity").value;


  proSettings.showStats =
    $("showDashboardStats").checked;


  proSettings.showUpcoming =
    $("showDashboardUpcoming").checked;


  proSettings.showAI =
    $("showDashboardAI").checked;


  proSettings.compactSidebar =
    $("compactSidebar").checked;


  saveProSettings();

  applyProSettings();

}


function setAccent(color){

  proSettings.accent =
    color;


  saveProSettings();

  applyProSettings();


  if(
    typeof showToast === "function"
  ){

    showToast(
      "🎨 Accent color changed"
    );

  }

}


function renderProSettings(){

  if(!$("settingsTheme")){
    return;
  }


  $("settingsTheme").value =
    proSettings.theme;


  $("settingsDensity").value =
    proSettings.density;


  $("showDashboardStats").checked =
    proSettings.showStats;


  $("showDashboardUpcoming").checked =
    proSettings.showUpcoming;


  $("showDashboardAI").checked =
    proSettings.showAI;


  $("compactSidebar").checked =
    proSettings.compactSidebar;

}


function applyProSettings(){

  const body =
    document.body;


  let dark =
    proSettings.theme === "dark";


  if(
    proSettings.theme === "system"
  ){

    dark =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

  }


  body.classList.toggle(
    "theme-dark",
    dark
  );


  body.classList.toggle(
    "interface-compact",
    proSettings.density === "compact"
  );


  body.classList.toggle(
    "interface-large",
    proSettings.density === "large"
  );


  body.classList.toggle(
    "hide-dashboard-stats",
    !proSettings.showStats
  );


  body.classList.toggle(
    "hide-dashboard-upcoming",
    !proSettings.showUpcoming
  );


  body.classList.toggle(
    "hide-dashboard-ai",
    !proSettings.showAI
  );


  body.classList.toggle(
    "compact-sidebar",
    !!proSettings.compactSidebar
  );


  document.documentElement
    .style
    .setProperty(
      "--primary",
      proSettings.accent
    );


  document
    .querySelector(
      'meta[name="theme-color"]'
    )
    ?.setAttribute(
      "content",
      proSettings.accent
    );

}


/* =========================================================
   ONBOARDING
========================================================= */

function checkStudyFlowOnboarding(){

  if(!currentUser){
    return;
  }


  const complete =
    localStorage.getItem(
      key("onboardingComplete")
    );


  if(complete){
    return;
  }


  $("onboardingUniversity").value =
    currentUser.university || "";


  $("onboardingMajor").value =
    currentUser.major || "";


  if(
    typeof degreeSettings !== "undefined"
  ){

    $("onboardingCredits").value =
      degreeSettings.totalCredits || 120;

  }


  $("studyFlowOnboarding")
    .classList
    .remove("hidden");

}


function chooseOnboardingTheme(theme){

  onboardingThemeChoice =
    theme;


  document
    .querySelectorAll(
      ".onboarding-theme-button"
    )
    .forEach(button =>
      button.classList
      .remove("active")
    );


  const buttons =
    document.querySelectorAll(
      ".onboarding-theme-button"
    );


  if(theme === "light"){

    buttons[0]
      ?.classList
      .add("active");

  }else{

    buttons[1]
      ?.classList
      .add("active");

  }

}


async function completeStudyFlowOnboarding(){

  const university =
    $("onboardingUniversity")
    .value
    .trim();


  const major =
    $("onboardingMajor")
    .value
    .trim();


  const credits =
    Number(
      $("onboardingCredits").value
    ) || 120;


  const semester =
    $("onboardingSemester").value;


  try{

    const data =
      await api(
        "/api/profile",
        {
          method:"PUT",

          body:JSON.stringify({

            name:
              currentUser.name,

            university,

            major

          })
        }
      );


    currentUser =
      data.user;

  }catch(error){

    console.warn(
      "Profile update:",
      error
    );

  }


  if(
    typeof degreeSettings !== "undefined"
  ){

    degreeSettings.major =
      major;


    degreeSettings.totalCredits =
      credits;


    if(
      typeof saveStudentCore === "function"
    ){

      saveStudentCore();

    }

  }


  localStorage.setItem(
    key("currentSemester"),
    semester
  );


  proSettings.theme =
    onboardingThemeChoice;


  saveProSettings();

  applyProSettings();


  localStorage.setItem(
    key("onboardingComplete"),
    "true"
  );


  $("studyFlowOnboarding")
    .classList
    .add("hidden");


  if(
    typeof renderStudentCore === "function"
  ){

    renderStudentCore();

  }


  if(
    typeof showToast === "function"
  ){

    showToast(
      "🎓 Welcome to StudyFlow!"
    );

  }

}


/* =========================================================
   PWA INSTALL
========================================================= */

window.addEventListener(
  "beforeinstallprompt",
  event => {

    event.preventDefault();

    deferredInstallPrompt =
      event;


    if(
      currentUser &&
      !localStorage.getItem(
        key("installDismissed")
      )
    ){

      $("installBanner")
        ?.classList
        .remove("hidden");

    }

  }
);


async function installStudyFlowApp(){

  if(!deferredInstallPrompt){

    alert(
      "If the install button is not available, use your browser menu and choose Install App or Add to Home Screen."
    );

    return;
  }


  deferredInstallPrompt.prompt();


  await deferredInstallPrompt
    .userChoice;


  deferredInstallPrompt =
    null;


  $("installBanner")
    ?.classList
    .add("hidden");

}


function dismissInstallBanner(){

  $("installBanner")
    ?.classList
    .add("hidden");


  if(currentUser){

    localStorage.setItem(
      key("installDismissed"),
      "true"
    );

  }

}


/* =========================================================
   SERVICE WORKER
========================================================= */

if(
  "serviceWorker" in navigator
){

  window.addEventListener(
    "load",
    () => {

      navigator
        .serviceWorker
        .register("/sw.js")
        .catch(error =>
          console.warn(
            "Service worker:",
            error
          )
        );

    }
  );

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

async function requestStudyNotifications(){

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
    permission === "granted"
  ){

    new Notification(
      "StudyFlow 🎓",
      {
        body:
          "Notifications are enabled."
      }
    );

  }

}


function checkProDeadlineNotifications(){

  if(
    !currentUser ||
    !Array.isArray(tasks)
  ){
    return;
  }


  const today =
    new Date();


  const tomorrow =
    new Date(today);


  tomorrow.setDate(
    today.getDate()+1
  );


  const tomorrowKey =
    typeof localDateKey === "function"
      ? localDateKey(tomorrow)
      : tomorrow
        .toISOString()
        .slice(0,10);


  const due =
    tasks.filter(
      task =>
        task.status !== "done" &&
        task.date === tomorrowKey
    );


  if(
    due.length &&
    "Notification" in window &&
    Notification.permission === "granted"
  ){

    new Notification(
      "StudyFlow Deadline Reminder",
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
   EXPORT DATA
========================================================= */

function exportStudyFlowData(){

  if(!currentUser){
    return;
  }


  const prefix =
    `studyflow_${currentUser.id}_`;


  const store = {};


  for(
    let index=0;
    index<localStorage.length;
    index++
  ){

    const storageKey =
      localStorage.key(index);


    if(
      storageKey &&
      storageKey.startsWith(prefix)
    ){

      const shortKey =
        storageKey.substring(
          prefix.length
        );


      store[shortKey] =
        localStorage.getItem(
          storageKey
        );

    }

  }


  const backup = {

    app:"StudyFlow",

    version:3,

    exportedAt:
      new Date().toISOString(),

    user:{
      name:currentUser.name,
      email:currentUser.email
    },

    store

  };


  const blob =
    new Blob(
      [
        JSON.stringify(
          backup,
          null,
          2
        )
      ],
      {
        type:"application/json"
      }
    );


  const url =
    URL.createObjectURL(blob);


  const link =
    document.createElement("a");


  link.href =
    url;


  link.download =
    `studyflow-backup-${new Date()
      .toISOString()
      .slice(0,10)}.json`;


  link.click();


  URL.revokeObjectURL(
    url
  );


  if(
    typeof showToast === "function"
  ){

    showToast(
      "💾 StudyFlow backup downloaded"
    );

  }

}


/* =========================================================
   IMPORT DATA
========================================================= */

async function importStudyFlowData(file){

  if(
    !file ||
    !currentUser
  ){
    return;
  }


  try{

    const text =
      await file.text();


    const backup =
      JSON.parse(text);


    if(
      backup.app !== "StudyFlow" ||
      !backup.store
    ){

      throw new Error(
        "This is not a valid StudyFlow backup."
      );

    }


    const approved =
      confirm(
        "Import this backup? Current StudyFlow data for this account may be replaced."
      );


    if(!approved){
      return;
    }


    const prefix =
      `studyflow_${currentUser.id}_`;


    Object.entries(
      backup.store
    )
    .forEach(
      ([name,value]) => {

        localStorage.setItem(
          prefix + name,
          value
        );

      }
    );


    alert(
      "✅ Backup imported. StudyFlow will reload."
    );


    location.reload();


  }catch(error){

    alert(
      "Import failed: " +
      error.message
    );

  }

}


/* =========================================================
   RESET STUDY DATA
========================================================= */

function resetStudyFlowData(){

  if(!currentUser){
    return;
  }


  const first =
    confirm(
      "Reset all StudyFlow study data for this account?"
    );


  if(!first){
    return;
  }


  const second =
    confirm(
      "This will remove your tasks, notes, grades, degree plan, flashcards and other local study data. Continue?"
    );


  if(!second){
    return;
  }


  const prefix =
    `studyflow_${currentUser.id}_`;


  const remove = [];


  for(
    let index=0;
    index<localStorage.length;
    index++
  ){

    const storageKey =
      localStorage.key(index);


    if(
      storageKey &&
      storageKey.startsWith(prefix)
    ){

      remove.push(
        storageKey
      );

    }

  }


  remove.forEach(
    storageKey =>
      localStorage.removeItem(
        storageKey
      )
  );


  alert(
    "Study data reset."
  );


  location.reload();

}


/* =========================================================
   CALENDAR .ICS EXPORT
========================================================= */

function escapeICS(value=""){

  return String(value)
    .replaceAll("\\","\\\\")
    .replaceAll(",","\\,")
    .replaceAll(";","\\;")
    .replaceAll("\n","\\n");

}


function exportCalendarICS(){

  if(
    !Array.isArray(tasks)
  ){
    return;
  }


  const datedTasks =
    tasks.filter(
      task =>
        task.date &&
        task.status !== "done"
    );


  if(!datedTasks.length){

    alert(
      "You don't have any dated open tasks to export."
    );

    return;
  }


  let calendar =
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//StudyFlow//Student Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;


  datedTasks.forEach(
    task => {

      const date =
        task.date
        .replaceAll("-","");


      const uid =
        `${task.id}@studyflow.local`;


      calendar +=
`BEGIN:VEVENT
UID:${uid}
DTSTART;VALUE=DATE:${date}
SUMMARY:${escapeICS(task.name)}
DESCRIPTION:${escapeICS(
  task.course
    ? "Course: " + task.course
    : "StudyFlow task"
)}
END:VEVENT
`;

    }
  );


  calendar +=
`END:VCALENDAR`;


  const blob =
    new Blob(
      [calendar],
      {
        type:"text/calendar"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement("a");


  link.href =
    url;


  link.download =
    "studyflow-calendar.ics";


  link.click();


  URL.revokeObjectURL(
    url
  );

}


/* =========================================================
   GOOGLE / CLOUD INFO
========================================================= */

function showGoogleCalendarInfo(){

  $("googleCalendarInfo")
    ?.classList
    .toggle("hidden");

}


function showCloudInfo(){

  $("cloudInfo")
    ?.classList
    .toggle("hidden");

}


/* =========================================================
   SYSTEM THEME
========================================================= */

window.matchMedia(
  "(prefers-color-scheme: dark)"
)
.addEventListener(
  "change",
  () => {

    if(
      proSettings.theme === "system"
    ){

      applyProSettings();

    }

  }
);


/* =========================================================
   PATCH START APP
========================================================= */

if(
  typeof startApp === "function"
){

  const startAppBeforePro =
    startApp;


  startApp = function(user){

    proInitialized =
      false;


    startAppBeforePro(user);


    setTimeout(
      () => {

        initProVersion();

      },
      120
    );

  };

}


/* =========================================================
   SETTINGS IN COMMAND PALETTE
========================================================= */

if(
  typeof commandPages !== "undefined" &&
  Array.isArray(commandPages)
){

  if(
    !commandPages.some(
      item =>
        item[0] === "settings"
    )
  ){

    commandPages.push(
      [
        "settings",
        "⚙️ Settings"
      ]
    );

  }

}



/* =========================================================
   PART 4 — CLOUD SYNC
========================================================= */

let cloudConfigured =
  false;

let cloudConnected =
  false;

let cloudPushTimer =
  null;

let cloudSyncInitialized =
  false;

let applyingCloudSnapshot =
  false;


/* =========================================================
   SNAPSHOT
========================================================= */

function createStudyFlowCloudSnapshot(){

  if(!currentUser){

    return null;

  }


  const prefix =
    `studyflow_${currentUser.id}_`;


  const store = {};


  for(
    let index = 0;
    index < localStorage.length;
    index++
  ){

    const storageKey =
      localStorage.key(index);


    if(
      !storageKey ||
      !storageKey.startsWith(prefix)
    ){

      continue;

    }


    const shortKey =
      storageKey.substring(
        prefix.length
      );


    if(
      [
        "cloudLastSyncAt",
        "cloudLocalDirty"
      ]
      .includes(shortKey)
    ){

      continue;

    }


    store[shortKey] =
      localStorage.getItem(
        storageKey
      );

  }


  return {

    app:
      "StudyFlow",

    version:
      4,

    user:{
      id:
        currentUser.id,

      name:
        currentUser.name,

      email:
        currentUser.email
    },

    savedAt:
      new Date()
      .toISOString(),

    store

  };

}


/* =========================================================
   APPLY SNAPSHOT
========================================================= */

function applyStudyFlowCloudSnapshot(
  snapshot
){

  if(
    !snapshot ||
    !snapshot.store ||
    !currentUser
  ){

    throw new Error(
      "Invalid StudyFlow cloud backup."
    );

  }


  applyingCloudSnapshot =
    true;


  const prefix =
    `studyflow_${currentUser.id}_`;


  const protectedKeys =
    new Set([

      prefix +
      "cloudAutoSync",

      prefix +
      "cloudLastSyncAt",

      prefix +
      "cloudLocalDirty"

    ]);


  const remove = [];


  for(
    let index=0;
    index<localStorage.length;
    index++
  ){

    const storageKey =
      localStorage.key(index);


    if(
      storageKey &&
      storageKey.startsWith(prefix) &&
      !protectedKeys.has(storageKey)
    ){

      remove.push(
        storageKey
      );

    }

  }


  remove.forEach(
    storageKey => {

      localStorage.removeItem(
        storageKey
      );

    }
  );


  Object.entries(
    snapshot.store
  )
  .forEach(
    ([name,value]) => {

      localStorage.setItem(
        prefix + name,
        value
      );

    }
  );


  applyingCloudSnapshot =
    false;

}


/* =========================================================
   STATUS
========================================================= */

async function refreshCloudStatus(){

  if(
    !currentUser
  ){

    return;

  }


  setCloudMessage(
    "Checking cloud connection...",
    ""
  );


  try{

    const data =
      await api(
        "/api/cloud/status"
      );


    cloudConfigured =
      !!data.configured;


    cloudConnected =
      !!data.connected;


    if(!cloudConfigured){

      setCloudStatusUI(
        "Not configured",
        "offline"
      );


      $("cloudConnectionText")
        .textContent =
        "Not configured";


      $("cloudBackupText")
        .textContent =
        "Local only";


      $("cloudUpdatedText")
        .textContent =
        "—";


      $("cloudSetupHelp")
        ?.classList
        .remove("hidden");


      $("cloudMainTitle")
        .textContent =
        "StudyFlow is running locally";


      $("cloudMainDescription")
        .textContent =
        "Add your Supabase credentials to enable cross-device synchronization.";


      setCloudMessage(
        "",
        ""
      );


      return;

    }


    if(!cloudConnected){

      setCloudStatusUI(
        "Setup needed",
        "error"
      );


      $("cloudConnectionText")
        .textContent =
        "Database setup needed";


      $("cloudSetupHelp")
        ?.classList
        .remove("hidden");


      $("cloudMainTitle")
        .textContent =
        "Cloud database needs setup";


      $("cloudMainDescription")
        .textContent =
        data.message ||
        "Run supabase-schema.sql in Supabase.";


      setCloudMessage(
        data.message ||
        "Run the Supabase SQL schema.",
        "error"
      );


      return;

    }


    $("cloudSetupHelp")
      ?.classList
      .add("hidden");


    setCloudStatusUI(
      "Connected",
      "online"
    );


    $("cloudConnectionText")
      .textContent =
      "Connected";


    $("cloudBackupText")
      .textContent =
      data.exists
        ? "Available"
        : "Not created yet";


    $("cloudUpdatedText")
      .textContent =
      formatCloudDate(
        data.updatedAt
      );


    $("cloudMainTitle")
      .textContent =
      "StudyFlow Cloud is connected";


    $("cloudMainDescription")
      .textContent =
      data.exists
        ? "Your StudyFlow workspace has a cloud backup."
        : "Push this device to create your first cloud backup.";


    setCloudMessage(
      "",
      ""
    );


  }catch(error){

    cloudConnected =
      false;


    setCloudStatusUI(
      "Connection error",
      "error"
    );


    $("cloudConnectionText")
      .textContent =
      "Error";


    setCloudMessage(
      error.message,
      "error"
    );

  }


  renderCloudDeviceSummary();

}


/* =========================================================
   PUSH
========================================================= */

async function pushStudyFlowCloud(
  silent = false
){

  if(
    !currentUser ||
    applyingCloudSnapshot
  ){

    return;

  }


  if(!silent){

    setCloudMessage(
      "Uploading StudyFlow data...",
      ""
    );

  }


  try{

    const snapshot =
      createStudyFlowCloudSnapshot();


    const data =
      await api(
        "/api/cloud/push",
        {

          method:
            "POST",

          body:
            JSON.stringify({
              snapshot
            })

        }
      );


    localStorage.setItem(
      key("cloudLastSyncAt"),
      data.updatedAt ||
      new Date().toISOString()
    );


    localStorage.setItem(
      key("cloudLocalDirty"),
      "0"
    );


    cloudConfigured =
      true;


    cloudConnected =
      true;


    if(!silent){

      setCloudMessage(
        "✅ StudyFlow uploaded to the cloud.",
        "success"
      );

    }


    renderCloudLastSync();


    await refreshCloudStatus();


    return true;


  }catch(error){

    if(!silent){

      setCloudMessage(
        error.message,
        "error"
      );

    }


    return false;

  }

}


/* =========================================================
   PULL
========================================================= */

async function pullStudyFlowCloud(
  skipConfirm = false
){

  if(!currentUser){

    return;

  }


  setCloudMessage(
    "Downloading StudyFlow cloud data...",
    ""
  );


  try{

    const data =
      await api(
        "/api/cloud/pull"
      );


    if(!data.exists){

      setCloudMessage(
        "There is no cloud backup yet. Push this device first.",
        "error"
      );


      return false;

    }


    if(!skipConfirm){

      const approved =
        confirm(
          "Pull cloud data to this device? Your current local StudyFlow workspace will be replaced by the cloud version."
        );


      if(!approved){

        setCloudMessage(
          "",
          ""
        );


        return false;

      }

    }


    applyStudyFlowCloudSnapshot(
      data.snapshot
    );


    localStorage.setItem(
      key("cloudLastSyncAt"),
      data.updatedAt ||
      new Date().toISOString()
    );


    localStorage.setItem(
      key("cloudLocalDirty"),
      "0"
    );


    setCloudMessage(
      "✅ Cloud data downloaded. Reloading StudyFlow...",
      "success"
    );


    setTimeout(
      () => {

        location.reload();

      },
      700
    );


    return true;


  }catch(error){

    setCloudMessage(
      error.message,
      "error"
    );


    return false;

  }

}


/* =========================================================
   AUTO SYNC
========================================================= */

function isCloudAutoSyncEnabled(){

  if(!currentUser){

    return false;

  }


  return (
    localStorage.getItem(
      key("cloudAutoSync")
    )
    === "true"
  );

}


function toggleCloudAutoSync(){

  if(!currentUser){

    return;

  }


  const enabled =
    !!$("cloudAutoSync")
      ?.checked;


  localStorage.setItem(
    key("cloudAutoSync"),
    String(enabled)
  );


  if(enabled){

    setCloudMessage(
      "✅ Auto Sync enabled.",
      "success"
    );


    scheduleStudyFlowCloudPush(
      500
    );

  }else{

    setCloudMessage(
      "Auto Sync disabled.",
      ""
    );

  }

}


function markStudyFlowCloudDirty(){

  if(
    !currentUser ||
    applyingCloudSnapshot
  ){

    return;

  }


  localStorage.setItem(
    key("cloudLocalDirty"),
    "1"
  );


  if(
    isCloudAutoSyncEnabled()
  ){

    scheduleStudyFlowCloudPush();

  }

}


function scheduleStudyFlowCloudPush(
  delay = 1400
){

  clearTimeout(
    cloudPushTimer
  );


  cloudPushTimer =
    setTimeout(
      async () => {

        await pushStudyFlowCloud(
          true
        );

      },
      delay
    );

}


/* =========================================================
   CLOUD POLLING
========================================================= */

async function checkForNewCloudVersion(){

  if(
    !currentUser ||
    !isCloudAutoSyncEnabled() ||
    !cloudConnected
  ){

    return;

  }


  const localDirty =
    localStorage.getItem(
      key("cloudLocalDirty")
    )
    === "1";


  if(localDirty){

    return;

  }


  const lastSync =
    localStorage.getItem(
      key("cloudLastSyncAt")
    );


  if(!lastSync){

    return;

  }


  try{

    const data =
      await api(
        "/api/cloud/pull"
      );


    if(
      !data.exists ||
      !data.updatedAt
    ){

      return;

    }


    const cloudTime =
      new Date(
        data.updatedAt
      ).getTime();


    const localTime =
      new Date(
        lastSync
      ).getTime();


    if(
      cloudTime >
      localTime + 1000
    ){

      applyStudyFlowCloudSnapshot(
        data.snapshot
      );


      localStorage.setItem(
        key("cloudLastSyncAt"),
        data.updatedAt
      );


      if(
        typeof showToast ===
        "function"
      ){

        showToast(
          "☁️ New StudyFlow data synced from another device"
        );

      }


      setTimeout(
        () => {

          location.reload();

        },
        800
      );

    }


  }catch{}

}


/* =========================================================
   CLOUD UI
========================================================= */

function setCloudStatusUI(
  text,
  state
){

  const element =
    $("cloudHeaderStatus");


  if(!element){

    return;

  }


  element.textContent =
    text;


  element.classList.remove(
    "cloud-pill-online",
    "cloud-pill-offline",
    "cloud-pill-error"
  );


  if(state === "online"){

    element.classList.add(
      "cloud-pill-online"
    );

  }

  else if(state === "error"){

    element.classList.add(
      "cloud-pill-error"
    );

  }

  else{

    element.classList.add(
      "cloud-pill-offline"
    );

  }

}


function setCloudMessage(
  message,
  type
){

  const element =
    $("cloudMessage");


  if(!element){

    return;

  }


  if(!message){

    element.classList
      .add("hidden");


    element.textContent =
      "";


    return;

  }


  element.textContent =
    message;


  element.classList
    .remove(
      "hidden",
      "cloud-success",
      "cloud-error"
    );


  if(type === "success"){

    element.classList
      .add("cloud-success");

  }


  if(type === "error"){

    element.classList
      .add("cloud-error");

  }

}


function formatCloudDate(
  value
){

  if(!value){

    return "—";

  }


  const date =
    new Date(value);


  if(
    Number.isNaN(
      date.getTime()
    )
  ){

    return "—";

  }


  return date
    .toLocaleString();

}


function renderCloudLastSync(){

  if(
    !$("cloudLastSyncText") ||
    !currentUser
  ){

    return;

  }


  const value =
    localStorage.getItem(
      key("cloudLastSyncAt")
    );


  $("cloudLastSyncText")
    .textContent =
    formatCloudDate(
      value
    );

}


function renderCloudDeviceSummary(){

  if(
    !$("cloudClassesCount")
  ){

    return;

  }


  $("cloudClassesCount")
    .textContent =
    Array.isArray(classes)
      ? classes.length
      : 0;


  $("cloudTasksCount")
    .textContent =
    Array.isArray(tasks)
      ? tasks.length
      : 0;


  $("cloudNotesCount")
    .textContent =
    Array.isArray(notes)
      ? notes.length
      : 0;


  $("cloudGradesCount")
    .textContent =
    typeof grades !== "undefined" &&
    Array.isArray(grades)
      ? grades.length
      : 0;


  $("cloudFlashcardsCount")
    .textContent =
    typeof flashcardSets !== "undefined" &&
    Array.isArray(flashcardSets)
      ? flashcardSets.length
      : 0;


  $("cloudDegreeCount")
    .textContent =
    typeof degreeCourses !== "undefined" &&
    Array.isArray(degreeCourses)
      ? degreeCourses.length
      : 0;

}


/* =========================================================
   INIT CLOUD
========================================================= */

async function initStudyFlowCloud(){

  if(
    !currentUser ||
    cloudSyncInitialized
  ){

    return;

  }


  cloudSyncInitialized =
    true;


  if(
    $("cloudAutoSync")
  ){

    $("cloudAutoSync")
      .checked =
      isCloudAutoSyncEnabled();

  }


  renderCloudDeviceSummary();

  renderCloudLastSync();


  await refreshCloudStatus();

}


/* =========================================================
   PATCH SAVE FUNCTIONS
========================================================= */

if(
  typeof saveEverything ===
  "function"
){

  const saveEverythingBeforeCloud =
    saveEverything;


  saveEverything =
    function(...args){

      const result =
        saveEverythingBeforeCloud(
          ...args
        );


      markStudyFlowCloudDirty();

      renderCloudDeviceSummary();


      return result;

    };

}


if(
  typeof saveStudentCore ===
  "function"
){

  const saveStudentCoreBeforeCloud =
    saveStudentCore;


  saveStudentCore =
    function(...args){

      const result =
        saveStudentCoreBeforeCloud(
          ...args
        );


      markStudyFlowCloudDirty();

      renderCloudDeviceSummary();


      return result;

    };

}


if(
  typeof saveProSettings ===
  "function"
){

  const saveProSettingsBeforeCloud =
    saveProSettings;


  saveProSettings =
    function(...args){

      const result =
        saveProSettingsBeforeCloud(
          ...args
        );


      markStudyFlowCloudDirty();


      return result;

    };

}


/* =========================================================
   PATCH STARTAPP
========================================================= */

if(
  typeof startApp ===
  "function"
){

  const startAppBeforeCloud =
    startApp;


  startApp =
    function(user){

      cloudSyncInitialized =
        false;


      startAppBeforeCloud(
        user
      );


      setTimeout(
        () => {

          initStudyFlowCloud();

        },
        500
      );

    };

}


/* =========================================================
   COMMAND PALETTE
========================================================= */

if(
  typeof commandPages !==
  "undefined" &&
  Array.isArray(commandPages)
){

  if(
    !commandPages.some(
      item =>
        item[0] ===
        "cloudSync"
    )
  ){

    commandPages.push(
      [
        "cloudSync",
        "☁️ Cloud Sync"
      ]
    );

  }

}


/* =========================================================
   AUTO CLOUD CHECK
========================================================= */

setInterval(
  () => {

    checkForNewCloudVersion();

  },
  30000
);

