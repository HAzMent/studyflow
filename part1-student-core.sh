#!/bin/bash

set -e

echo ""
echo "🎓 StudyFlow — PART 1 Student Core"
echo "=================================="
echo ""

# ---------------------------------------------------------
# BACKUP
# ---------------------------------------------------------

BACKUP="backup-part1-$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP"

cp -R public "$BACKUP/public" 2>/dev/null || true
cp server.js "$BACKUP/server.js" 2>/dev/null || true
cp package.json "$BACKUP/package.json" 2>/dev/null || true

echo "✅ Backup created: $BACKUP"


# ---------------------------------------------------------
# PATCH HTML
# ---------------------------------------------------------

python3 <<'PY'
from pathlib import Path

p = Path("public/index.html")
html = p.read_text()

# =========================================================
# NAVIGATION
# =========================================================

nav_anchor = '<button class="nav" data-page="calendar">📅 Calendar</button>'

nav_new = '''<button class="nav" data-page="calendar">📅 Calendar</button>
      <button class="nav" data-page="degree">🎓 Degree Planner</button>
      <button class="nav" data-page="semester">🗓 Semester Planner</button>
      <button class="nav" data-page="attendance">🙋 Attendance</button>
      <button class="nav" data-page="overview">📆 Weekly Overview</button>
      <button class="nav" data-page="analytics">📈 Analytics</button>'''

if 'data-page="degree"' not in html:
    html = html.replace(nav_anchor, nav_new)


# =========================================================
# STUDENT CORE PAGES
# =========================================================

pages = r'''

<!-- =====================================================
     DEGREE PLANNER
===================================================== -->

<section id="degree" class="page">

<div class="page-head">

  <div>
    <p class="eyebrow">DEGREE PROGRESS</p>
    <h1>Degree Planner 🎓</h1>
    <p class="muted">
      Track credits, requirements and your path to graduation.
    </p>
  </div>

</div>


<div class="degree-stats">

  <div class="stat">
    <span>🎓</span>

    <div>
      <h2 id="degreeCompletedCredits">0</h2>
      <p>Credits completed</p>
    </div>
  </div>


  <div class="stat">
    <span>📘</span>

    <div>
      <h2 id="degreeRemainingCredits">120</h2>
      <p>Credits remaining</p>
    </div>
  </div>


  <div class="stat">
    <span>✅</span>

    <div>
      <h2 id="degreeCompletedCourses">0</h2>
      <p>Courses completed</p>
    </div>
  </div>


  <div class="stat">
    <span>📊</span>

    <div>
      <h2 id="degreePercent">0%</h2>
      <p>Degree progress</p>
    </div>
  </div>

</div>


<div class="degree-layout">

  <div>

    <div class="panel degree-settings">

      <h2>Degree Settings</h2>

      <div class="two-fields">

        <div>
          <label>Degree / Major</label>

          <input
            id="degreeMajor"
            placeholder="Computer Science"
          >
        </div>


        <div>
          <label>Total credits required</label>

          <input
            id="degreeTotalCredits"
            type="number"
            min="1"
            value="120"
          >
        </div>

      </div>

      <button onclick="saveDegreeSettings()">
        Save Degree Settings
      </button>

    </div>


    <div class="panel degree-add">

      <h2>Add Requirement</h2>

      <div class="degree-add-grid">

        <input
          id="degreeCourseCode"
          placeholder="Course code"
        >

        <input
          id="degreeCourseName"
          placeholder="Course name"
        >

        <input
          id="degreeCourseCredits"
          type="number"
          min="1"
          value="4"
          placeholder="Credits"
        >

        <select id="degreeCourseCategory">
          <option value="Major">Major Requirement</option>
          <option value="General Education">General Education</option>
          <option value="Elective">Elective</option>
          <option value="Math/Science">Math / Science</option>
          <option value="Other">Other</option>
        </select>

        <button onclick="addDegreeCourse()">
          + Add
        </button>

      </div>

    </div>


    <div id="degreeCourseList"></div>

  </div>


  <div class="panel degree-side">

    <p class="eyebrow">PROGRESS</p>

    <div class="degree-ring-wrap">

      <div
        id="degreeRing"
        class="degree-ring"
      >

        <div>
          <strong id="degreeRingPercent">
            0%
          </strong>

          <span>
            complete
          </span>
        </div>

      </div>

    </div>


    <div class="degree-progress-bar">
      <div id="degreeProgressFill"></div>
    </div>


    <div class="degree-summary-row">

      <span>Completed</span>

      <strong id="degreeSummaryCompleted">
        0 credits
      </strong>

    </div>


    <div class="degree-summary-row">

      <span>Remaining</span>

      <strong id="degreeSummaryRemaining">
        120 credits
      </strong>

    </div>

  </div>

</div>

</section>


<!-- =====================================================
     SEMESTER PLANNER
===================================================== -->

<section id="semester" class="page">

<div class="page-head">

  <div>
    <p class="eyebrow">COURSE PLANNING</p>
    <h1>Semester Planner 🗓</h1>
    <p class="muted">
      Plan courses across Fall, Winter and Summer.
    </p>
  </div>

</div>


<div class="panel semester-form">

  <input
    id="semesterCourse"
    placeholder="Course name"
  >

  <input
    id="semesterCredits"
    type="number"
    value="4"
    min="1"
    placeholder="Credits"
  >

  <select id="semesterTerm">
    <option value="Fall 2026">Fall 2026</option>
    <option value="Winter 2027">Winter 2027</option>
    <option value="Summer 2027">Summer 2027</option>
    <option value="Fall 2027">Fall 2027</option>
    <option value="Winter 2028">Winter 2028</option>
  </select>

  <select id="semesterDifficulty">
    <option value="Easy">Easy</option>
    <option value="Medium" selected>Medium</option>
    <option value="Hard">Hard</option>
  </select>

  <button onclick="addSemesterCourse()">
    + Add Course
  </button>

</div>


<div
  id="semesterBoards"
  class="semester-board"
></div>

</section>


<!-- =====================================================
     ATTENDANCE
===================================================== -->

<section id="attendance" class="page">

<div class="page-head">

  <div>
    <p class="eyebrow">COURSE TRACKER</p>
    <h1>Attendance 🙋</h1>
    <p class="muted">
      Keep track of absences before they become a problem.
    </p>
  </div>

</div>


<div class="panel attendance-form">

  <select id="attendanceClass">
    <option value="">
      Select class
    </option>
  </select>

  <input
    id="attendanceLimit"
    type="number"
    min="1"
    value="4"
    placeholder="Allowed absences"
  >

  <button onclick="addAttendanceClass()">
    Add Tracker
  </button>

</div>


<div
  id="attendanceList"
  class="attendance-grid"
></div>

</section>


<!-- =====================================================
     WEEKLY OVERVIEW
===================================================== -->

<section id="overview" class="page">

<div class="page-head">

  <div>
    <p class="eyebrow">THIS WEEK</p>
    <h1>Weekly Overview 📆</h1>
    <p class="muted">
      See your workload for the next seven days.
    </p>
  </div>

</div>


<div class="overview-top">

  <div class="stat">

    <span>📌</span>

    <div>
      <h2 id="overviewTasks">0</h2>
      <p>Tasks this week</p>
    </div>

  </div>


  <div class="stat">

    <span>🔥</span>

    <div>
      <h2 id="overviewHigh">0</h2>
      <p>High priority</p>
    </div>

  </div>


  <div class="stat">

    <span>⏱</span>

    <div>
      <h2 id="overviewFocus">0m</h2>
      <p>Focus time</p>
    </div>

  </div>


  <div class="stat">

    <span>⭐</span>

    <div>
      <h2 id="overviewXP">0</h2>
      <p>Study XP</p>
    </div>

  </div>

</div>


<div
  id="weekDays"
  class="week-grid"
></div>

</section>


<!-- =====================================================
     ANALYTICS
===================================================== -->

<section id="analytics" class="page">

<div class="page-head">

  <div>
    <p class="eyebrow">PERFORMANCE</p>
    <h1>Study Analytics 📈</h1>
    <p class="muted">
      Understand your workload and study habits.
    </p>
  </div>

</div>


<div class="analytics-grid">

  <div class="panel">

    <p class="eyebrow">
      PRODUCTIVITY
    </p>

    <div class="analytics-big">
      <strong id="analyticsCompleted">0%</strong>
      <span>task completion</span>
    </div>

    <div class="analytics-track">
      <div id="analyticsTaskBar"></div>
    </div>

  </div>


  <div class="panel">

    <p class="eyebrow">
      FOCUS
    </p>

    <div class="analytics-big">
      <strong id="analyticsMinutes">0</strong>
      <span>minutes studied</span>
    </div>

  </div>


  <div class="panel">

    <p class="eyebrow">
      STREAK
    </p>

    <div class="analytics-big">
      <strong id="analyticsStreak">1</strong>
      <span>day streak</span>
    </div>

  </div>


  <div class="panel">

    <p class="eyebrow">
      LEVEL
    </p>

    <div class="analytics-big">
      <strong id="analyticsLevel">1</strong>
      <span>student level</span>
    </div>

  </div>

</div>


<div class="analytics-bottom">

  <div class="panel">

    <h2>Course workload</h2>

    <div
      id="courseAnalytics"
      class="course-analytics"
    ></div>

  </div>


  <div class="panel">

    <h2>XP Progress</h2>

    <p
      id="xpText"
      class="muted"
    >
      0 / 500 XP
    </p>

    <div class="xp-track">
      <div id="xpFill"></div>
    </div>


    <div class="xp-info">

      <div>
        <strong>+20 XP</strong>
        <span>Complete task</span>
      </div>

      <div>
        <strong>+50 XP</strong>
        <span>Focus session</span>
      </div>

      <div>
        <strong>+10 XP</strong>
        <span>Add study note</span>
      </div>

    </div>

  </div>

</div>

</section>
'''

if 'id="degree"' not in html:
    html = html.replace(
        '<!-- CALENDAR -->',
        pages + '\n\n<!-- CALENDAR -->'
    )


# =========================================================
# FLOATING ADD BUTTON + COMMAND PALETTE
# =========================================================

extra_ui = r'''

<!-- QUICK ADD -->

<button
  id="quickAddButton"
  class="quick-add-button"
  onclick="toggleQuickAdd()"
>
  +
</button>


<div
  id="quickAddMenu"
  class="quick-add-menu hidden"
>

  <button onclick="quickAddTask()">
    ✅ New Task
  </button>

  <button onclick="quickAddNote()">
    📝 New Note
  </button>

  <button onclick="quickAddClass()">
    📚 New Class
  </button>

</div>


<!-- COMMAND PALETTE -->

<div
  id="commandPalette"
  class="command-overlay hidden"
>

  <div class="command-box">

    <div class="command-input-wrap">

      <span>⌘</span>

      <input
        id="commandInput"
        placeholder="Search StudyFlow..."
        autocomplete="off"
      >

      <kbd>ESC</kbd>

    </div>


    <div id="commandResults"></div>

  </div>

</div>


<!-- NOTIFICATION TOAST -->

<div
  id="studyToast"
  class="study-toast hidden"
></div>

'''

if 'id="commandPalette"' not in html:
    html = html.replace(
        '<script src="app.js"></script>',
        extra_ui + '\n<script src="app.js"></script>'
    )

p.write_text(html)

print("✅ HTML patched")
PY


# ---------------------------------------------------------
# PATCH CSS
# ---------------------------------------------------------

cat >> public/style.css <<'EOF'


/* =========================================================
   PART 1 — STUDENT CORE
========================================================= */

.degree-stats,
.overview-top{
display:grid;
grid-template-columns:repeat(4,1fr);
gap:18px;
margin-bottom:20px;
}

.degree-layout{
display:grid;
grid-template-columns:1.5fr .65fr;
gap:20px;
}

.degree-settings,
.degree-add{
margin-bottom:18px;
}

.degree-settings label{
display:block;
font-size:13px;
font-weight:750;
margin-bottom:7px;
}

.two-fields{
display:grid;
grid-template-columns:1fr 1fr;
gap:12px;
margin:18px 0;
}

.degree-add-grid{
display:grid;
grid-template-columns:.7fr 1.4fr .6fr 1fr auto;
gap:10px;
margin-top:15px;
}

.degree-requirement{
background:#fff;
border:1px solid var(--border);
border-radius:15px;
padding:17px;
margin-bottom:10px;
display:grid;
grid-template-columns:auto 1fr auto;
gap:14px;
align-items:center;
}

.degree-check{
width:22px;
height:22px;
accent-color:var(--primary);
}

.degree-requirement p{
font-size:13px;
color:var(--muted);
margin-top:4px;
}

.degree-tag{
font-size:11px;
background:#f2f3f7;
padding:5px 8px;
border-radius:7px;
font-weight:750;
}

.degree-actions{
display:flex;
align-items:center;
gap:9px;
}

.degree-side{
height:max-content;
}

.degree-ring-wrap{
display:flex;
justify-content:center;
padding:20px 0 25px;
}

.degree-ring{
width:180px;
height:180px;
border-radius:50%;
background:conic-gradient(
var(--primary) 0%,
#eceef3 0%
);
display:grid;
place-items:center;
}

.degree-ring>div{
width:138px;
height:138px;
border-radius:50%;
background:#fff;
display:flex;
flex-direction:column;
align-items:center;
justify-content:center;
}

.degree-ring strong{
font-size:36px;
}

.degree-ring span{
font-size:12px;
color:var(--muted);
}

.degree-progress-bar,
.analytics-track,
.xp-track{
height:10px;
background:#eceef3;
border-radius:30px;
overflow:hidden;
}

.degree-progress-bar div,
.analytics-track div,
.xp-track div{
height:100%;
width:0;
background:linear-gradient(90deg,#635bff,#8b5cf6);
border-radius:30px;
transition:.35s;
}

.degree-summary-row{
display:flex;
justify-content:space-between;
padding:15px 0;
border-bottom:1px solid var(--border);
font-size:14px;
}


/* SEMESTER */

.semester-form{
display:grid;
grid-template-columns:1.5fr .6fr 1fr 1fr auto;
gap:10px;
margin-bottom:20px;
}

.semester-board{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:18px;
align-items:start;
}

.semester-column{
background:#eef0f5;
border-radius:18px;
padding:14px;
min-height:370px;
}

.semester-column-head{
display:flex;
justify-content:space-between;
align-items:center;
padding:7px 5px 14px;
}

.semester-column-head p{
font-size:12px;
color:var(--muted);
}

.semester-course-card{
background:#fff;
border:1px solid var(--border);
border-radius:13px;
padding:14px;
margin-bottom:9px;
}

.semester-course-card h3{
font-size:15px;
}

.semester-course-meta{
font-size:12px;
color:var(--muted);
margin-top:5px;
}

.difficulty-pill{
display:inline-block;
margin-top:9px;
font-size:11px;
font-weight:800;
padding:5px 7px;
border-radius:7px;
}

.difficulty-pill.Easy{
background:#dcfce7;
color:#15803d;
}

.difficulty-pill.Medium{
background:#fef3c7;
color:#b45309;
}

.difficulty-pill.Hard{
background:#fee2e2;
color:#dc2626;
}


/* ATTENDANCE */

.attendance-form{
display:grid;
grid-template-columns:1fr .8fr auto;
gap:10px;
margin-bottom:20px;
}

.attendance-grid{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:18px;
}

.attendance-card{
background:#fff;
border:1px solid var(--border);
border-radius:18px;
padding:20px;
}

.attendance-numbers{
display:flex;
justify-content:space-between;
margin:18px 0;
}

.attendance-numbers strong{
font-size:32px;
display:block;
}

.attendance-numbers span{
font-size:12px;
color:var(--muted);
}

.attendance-actions{
display:grid;
grid-template-columns:1fr 1fr;
gap:8px;
}

.attendance-warning{
margin-top:13px;
font-size:12px;
font-weight:750;
color:#dc2626;
}

.attendance-ok{
margin-top:13px;
font-size:12px;
font-weight:750;
color:#15803d;
}


/* WEEK */

.week-grid{
display:grid;
grid-template-columns:repeat(7,1fr);
gap:10px;
}

.week-day{
background:#fff;
border:1px solid var(--border);
border-radius:15px;
padding:14px;
min-height:260px;
}

.week-day.today{
border:2px solid #8b85ff;
background:#faf9ff;
}

.week-day-name{
font-size:11px;
font-weight:850;
color:var(--primary);
letter-spacing:1px;
}

.week-day-date{
font-size:25px;
font-weight:850;
margin:3px 0 13px;
}

.week-task{
background:#f5f3ff;
border-radius:8px;
padding:8px;
font-size:11px;
font-weight:700;
margin-bottom:6px;
}


/* ANALYTICS */

.analytics-grid{
display:grid;
grid-template-columns:repeat(4,1fr);
gap:18px;
margin-bottom:20px;
}

.analytics-big{
display:flex;
flex-direction:column;
margin:12px 0 18px;
}

.analytics-big strong{
font-size:44px;
letter-spacing:-2px;
}

.analytics-big span{
font-size:13px;
color:var(--muted);
}

.analytics-bottom{
display:grid;
grid-template-columns:1.3fr .7fr;
gap:20px;
}

.course-analytics{
margin-top:17px;
}

.course-analytics-row{
margin-bottom:17px;
}

.course-analytics-label{
display:flex;
justify-content:space-between;
font-size:13px;
margin-bottom:7px;
}

.course-load-bar{
height:8px;
background:#eef0f4;
border-radius:20px;
overflow:hidden;
}

.course-load-bar div{
height:100%;
background:linear-gradient(90deg,#635bff,#8b5cf6);
border-radius:20px;
}

.xp-info{
margin-top:20px;
display:grid;
gap:12px;
}

.xp-info div{
display:flex;
justify-content:space-between;
border-bottom:1px solid var(--border);
padding-bottom:10px;
}

.xp-info span{
font-size:12px;
color:var(--muted);
}


/* QUICK ADD */

.quick-add-button{
position:fixed;
right:30px;
bottom:30px;
z-index:300;
width:58px;
height:58px;
border-radius:50%;
font-size:31px;
line-height:1;
box-shadow:0 15px 35px rgba(80,70,200,.35);
}

.quick-add-menu{
position:fixed;
right:30px;
bottom:98px;
z-index:299;
background:#fff;
border:1px solid var(--border);
box-shadow:0 20px 60px rgba(0,0,0,.14);
padding:8px;
border-radius:15px;
width:180px;
}

.quick-add-menu button{
display:block;
width:100%;
background:transparent;
color:var(--text);
text-align:left;
margin:2px 0;
}

.quick-add-menu button:hover{
background:#f3f4f8;
}


/* COMMAND PALETTE */

.command-overlay{
position:fixed;
inset:0;
background:rgba(15,17,24,.48);
backdrop-filter:blur(6px);
z-index:1000;
display:flex;
justify-content:center;
align-items:flex-start;
padding-top:12vh;
}

.command-box{
width:min(650px,90vw);
background:#fff;
border-radius:18px;
box-shadow:0 35px 100px rgba(0,0,0,.25);
overflow:hidden;
}

.command-input-wrap{
display:grid;
grid-template-columns:auto 1fr auto;
align-items:center;
gap:10px;
padding:13px;
border-bottom:1px solid var(--border);
}

.command-input-wrap input{
border:0;
background:transparent;
box-shadow:none;
font-size:17px;
}

.command-input-wrap kbd{
font-size:10px;
background:#eef0f5;
padding:5px 7px;
border-radius:6px;
}

.command-result{
display:flex;
justify-content:space-between;
align-items:center;
padding:13px 16px;
cursor:pointer;
border-bottom:1px solid #f1f2f5;
}

.command-result:hover{
background:#f6f7fb;
}

.command-result span{
font-size:12px;
color:var(--muted);
}


/* TOAST */

.study-toast{
position:fixed;
top:25px;
right:25px;
z-index:1200;
background:#181b24;
color:#fff;
padding:14px 18px;
border-radius:12px;
box-shadow:0 18px 50px rgba(0,0,0,.25);
max-width:330px;
font-size:14px;
}


/* TASK PROGRESS */

.task-progress-wrap{
margin-top:11px;
}

.task-progress-label{
display:flex;
justify-content:space-between;
font-size:11px;
color:var(--muted);
margin-bottom:5px;
}

.task-progress-track{
height:6px;
background:#eceef3;
border-radius:20px;
overflow:hidden;
}

.task-progress-track div{
height:100%;
background:var(--primary);
}


/* RESPONSIVE */

@media(max-width:1150px){

.degree-layout,
.analytics-bottom{
grid-template-columns:1fr;
}

.degree-add-grid,
.semester-form{
grid-template-columns:1fr 1fr;
}

.semester-board{
grid-template-columns:1fr;
}

.attendance-grid{
grid-template-columns:1fr 1fr;
}

.analytics-grid{
grid-template-columns:1fr 1fr;
}

.week-grid{
grid-template-columns:repeat(2,1fr);
}

}

@media(max-width:700px){

.degree-stats,
.overview-top,
.analytics-grid{
grid-template-columns:1fr;
}

.two-fields,
.degree-add-grid,
.semester-form,
.attendance-form,
.attendance-grid{
grid-template-columns:1fr;
}

.week-grid{
grid-template-columns:1fr;
}

}
EOF


# ---------------------------------------------------------
# PATCH JAVASCRIPT
# ---------------------------------------------------------

cat >> public/app.js <<'EOF'


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

EOF


# ---------------------------------------------------------
# PATCH STARTAPP / RENDER
# ---------------------------------------------------------

python3 <<'PY'
from pathlib import Path

p = Path("public/app.js")
js = p.read_text()

# Add init to startApp safely
needle = "renderEverything();\n}"

replacement = """renderEverything();

  setTimeout(() => {
    initStudentCore();
    checkUpcomingDeadlines();
  }, 50);
}"""

# Only replace the first suitable end of startApp if core init not present
if "initStudentCore();" not in js[:js.find("/* NAV */") if "/* NAV */" in js else len(js)]:
    pos = js.find(needle)

    if pos != -1:
        js = js[:pos] + replacement + js[pos+len(needle):]

p.write_text(js)

print("✅ JavaScript patched")
PY


# ---------------------------------------------------------
# DONE
# ---------------------------------------------------------

echo ""
echo "=================================="
echo "✅ PART 1 installed successfully"
echo "=================================="
echo ""
echo "Added:"
echo "• Degree Planner"
echo "• Semester Planner"
echo "• Attendance Tracker"
echo "• Weekly Overview"
echo "• Analytics"
echo "• XP + Levels"
echo "• Task Progress"
echo "• Deadline notifications"
echo "• Universal + button"
echo "• Command search ⌘K / Ctrl+K"
echo ""
echo "🚀 Starting StudyFlow..."
echo ""

npm start

