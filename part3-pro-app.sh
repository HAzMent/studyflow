#!/bin/bash

set -e

echo ""
echo "🚀 StudyFlow — PART 3 Pro / App Version"
echo "======================================="
echo ""

# =========================================================
# BACKUP
# =========================================================

BACKUP="backup-part3-$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP"

cp -R public "$BACKUP/public" 2>/dev/null || true
cp server.js "$BACKUP/server.js" 2>/dev/null || true
cp package.json "$BACKUP/package.json" 2>/dev/null || true

echo "✅ Backup created: $BACKUP"


# =========================================================
# PWA ICON
# =========================================================

cat > public/studyflow-icon.svg <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#635bff"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
  </defs>

  <rect width="512" height="512" rx="115" fill="url(#g)"/>

  <path
    d="M75 190 256 105l181 85-181 85L75 190Z"
    fill="#fff"
  />

  <path
    d="M140 235v80c0 45 55 82 116 82s116-37 116-82v-80l-116 54-116-54Z"
    fill="#fff"
    opacity=".92"
  />

  <path
    d="M415 203v116"
    stroke="#fff"
    stroke-width="18"
    stroke-linecap="round"
  />

  <circle cx="415" cy="337" r="14" fill="#fff"/>
</svg>
EOF


# =========================================================
# MANIFEST
# =========================================================

cat > public/manifest.webmanifest <<'EOF'
{
  "name": "StudyFlow",
  "short_name": "StudyFlow",
  "description": "AI-powered student planner and study workspace.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f5f7fb",
  "theme_color": "#635bff",
  "orientation": "any",
  "icons": [
    {
      "src": "/studyflow-icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
EOF


# =========================================================
# OFFLINE PAGE
# =========================================================

cat > public/offline.html <<'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>StudyFlow Offline</title>

<style>
body{
margin:0;
font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
background:#0f1117;
color:white;
min-height:100vh;
display:grid;
place-items:center;
text-align:center;
padding:30px;
}

.box{
max-width:500px;
}

.icon{
font-size:70px;
}

h1{
font-size:38px;
margin:15px 0 8px;
}

p{
color:#a7abb8;
line-height:1.6;
}

button{
margin-top:20px;
border:0;
padding:13px 20px;
border-radius:11px;
background:#635bff;
color:#fff;
font-weight:700;
cursor:pointer;
}
</style>
</head>

<body>

<div class="box">

<div class="icon">🎓</div>

<h1>You're offline</h1>

<p>
StudyFlow can't reach the server right now.
Some previously loaded parts of the app may still work.
</p>

<button onclick="location.reload()">
Try Again
</button>

</div>

</body>
</html>
EOF


# =========================================================
# SERVICE WORKER
# =========================================================

cat > public/sw.js <<'EOF'
const CACHE = "studyflow-v3";

const STATIC_FILES = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/manifest.webmanifest",
  "/studyflow-icon.svg",
  "/offline.html"
];

self.addEventListener("install", event => {

  event.waitUntil(
    caches
      .open(CACHE)
      .then(cache =>
        cache.addAll(STATIC_FILES)
      )
  );

  self.skipWaiting();
});


self.addEventListener("activate", event => {

  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))
        )
      )
  );

  self.clients.claim();
});


self.addEventListener("fetch", event => {

  const request = event.request;

  const url =
    new URL(request.url);


  if(
    request.method !== "GET" ||
    url.pathname.startsWith("/api/")
  ){
    return;
  }


  event.respondWith(

    fetch(request)

      .then(response => {

        const copy =
          response.clone();


        caches
          .open(CACHE)
          .then(cache =>
            cache.put(
              request,
              copy
            )
          );


        return response;

      })

      .catch(async () => {

        const cached =
          await caches.match(request);


        if(cached){
          return cached;
        }


        if(
          request.mode === "navigate"
        ){
          return caches.match(
            "/offline.html"
          );
        }

      })

  );

});
EOF


# =========================================================
# PATCH HTML
# =========================================================

python3 <<'PY'
from pathlib import Path

p = Path("public/index.html")
html = p.read_text()

# ---------- PWA HEAD ----------

if 'manifest.webmanifest' not in html:

    html = html.replace(
        '</head>',
        '''
<link rel="manifest" href="/manifest.webmanifest">

<meta name="theme-color" content="#635bff">

<meta
  name="apple-mobile-web-app-capable"
  content="yes"
>

<meta
  name="apple-mobile-web-app-status-bar-style"
  content="default"
>

<meta
  name="apple-mobile-web-app-title"
  content="StudyFlow"
>

<link
  rel="apple-touch-icon"
  href="/studyflow-icon.svg"
>

</head>
'''
    )


# ---------- SETTINGS NAV ----------

if 'data-page="settings"' not in html:

    html = html.replace(
        '<button class="nav" data-page="profile">👤 Profile</button>',
        '''<button class="nav" data-page="profile">👤 Profile</button>
      <button class="nav" data-page="settings">⚙️ Settings</button>'''
    )


# =========================================================
# SETTINGS PAGE
# =========================================================

settings_page = r'''

<!-- =====================================================
     SETTINGS
===================================================== -->

<section id="settings" class="page">

<div class="page-head">

  <div>

    <p class="eyebrow">
      STUDYFLOW
    </p>

    <h1>
      Settings ⚙️
    </h1>

    <p class="muted">
      Customize your workspace and manage your data.
    </p>

  </div>

</div>


<div class="settings-layout">


<!-- APPEARANCE -->

<div class="panel settings-card">

  <div class="settings-icon">
    🎨
  </div>

  <h2>
    Appearance
  </h2>

  <p class="muted">
    Make StudyFlow look the way you want.
  </p>


  <label>
    Theme
  </label>

  <select
    id="settingsTheme"
    onchange="updateProSettings()"
  >

    <option value="light">
      Light
    </option>

    <option value="dark">
      Dark
    </option>

    <option value="system">
      System
    </option>

  </select>


  <label>
    Accent color
  </label>

  <div class="accent-picker">

    <button
      class="accent-option purple"
      onclick="setAccent('#635bff')"
      title="Purple"
    ></button>

    <button
      class="accent-option blue"
      onclick="setAccent('#2563eb')"
      title="Blue"
    ></button>

    <button
      class="accent-option green"
      onclick="setAccent('#16a34a')"
      title="Green"
    ></button>

    <button
      class="accent-option orange"
      onclick="setAccent('#ea580c')"
      title="Orange"
    ></button>

    <button
      class="accent-option pink"
      onclick="setAccent('#db2777')"
      title="Pink"
    ></button>

  </div>


  <label>
    Interface size
  </label>

  <select
    id="settingsDensity"
    onchange="updateProSettings()"
  >

    <option value="normal">
      Normal
    </option>

    <option value="compact">
      Compact
    </option>

    <option value="large">
      Large
    </option>

  </select>

</div>


<!-- DASHBOARD -->

<div class="panel settings-card">

  <div class="settings-icon">
    🏠
  </div>

  <h2>
    Dashboard
  </h2>

  <p class="muted">
    Choose what appears on your dashboard.
  </p>


  <label class="toggle-row">

    <span>
      Show statistics
    </span>

    <input
      id="showDashboardStats"
      type="checkbox"
      onchange="updateProSettings()"
    >

  </label>


  <label class="toggle-row">

    <span>
      Show upcoming tasks
    </span>

    <input
      id="showDashboardUpcoming"
      type="checkbox"
      onchange="updateProSettings()"
    >

  </label>


  <label class="toggle-row">

    <span>
      Show AI Assistant card
    </span>

    <input
      id="showDashboardAI"
      type="checkbox"
      onchange="updateProSettings()"
    >

  </label>


  <label class="toggle-row">

    <span>
      Compact sidebar
    </span>

    <input
      id="compactSidebar"
      type="checkbox"
      onchange="updateProSettings()"
    >

  </label>

</div>


<!-- APP -->

<div class="panel settings-card">

  <div class="settings-icon">
    📱
  </div>

  <h2>
    App
  </h2>

  <p class="muted">
    Install StudyFlow like a real application.
  </p>


  <button
    id="settingsInstallButton"
    onclick="installStudyFlowApp()"
  >
    📲 Install StudyFlow
  </button>


  <button
    class="secondary settings-button"
    onclick="requestStudyNotifications()"
  >
    🔔 Enable Notifications
  </button>


  <div class="settings-note">

    <strong>
      Tip for iPhone
    </strong>

    <p>
      Open StudyFlow in Safari → Share →
      Add to Home Screen.
    </p>

  </div>

</div>


<!-- CALENDAR -->

<div class="panel settings-card">

  <div class="settings-icon">
    📅
  </div>

  <h2>
    Calendar
  </h2>

  <p class="muted">
    Move StudyFlow deadlines into another calendar.
  </p>


  <button
    onclick="exportCalendarICS()"
  >
    Download Calendar (.ics)
  </button>


  <button
    class="secondary settings-button"
    onclick="showGoogleCalendarInfo()"
  >
    Google Calendar Sync
  </button>


  <div
    id="googleCalendarInfo"
    class="settings-note hidden"
  >

    <strong>
      Google Calendar
    </strong>

    <p>
      Live two-way sync needs Google OAuth credentials.
      The .ics export above already works without them.
    </p>

  </div>

</div>


<!-- DATA -->

<div class="panel settings-card">

  <div class="settings-icon">
    💾
  </div>

  <h2>
    Your Data
  </h2>

  <p class="muted">
    Backup or transfer your StudyFlow information.
  </p>


  <button onclick="exportStudyFlowData()">
    ⬇ Export Backup
  </button>


  <label class="settings-file-button">

    ⬆ Import Backup

    <input
      id="studyFlowImportFile"
      type="file"
      accept=".json,application/json"
      onchange="importStudyFlowData(this.files[0])"
      hidden
    >

  </label>


  <button
    class="danger-settings-button"
    onclick="resetStudyFlowData()"
  >
    🗑 Reset My Study Data
  </button>

</div>


<!-- CLOUD -->

<div class="panel settings-card">

  <div class="settings-icon">
    ☁️
  </div>

  <h2>
    Cloud Sync
  </h2>

  <p class="muted">
    The current version stores student workspace data
    locally on this device.
  </p>


  <div class="cloud-status">

    <span class="cloud-dot"></span>

    <div>

      <strong>
        Local Mode
      </strong>

      <p>
        Supabase/Postgres can be connected next.
      </p>

    </div>

  </div>


  <button
    class="secondary"
    onclick="showCloudInfo()"
  >
    Cloud Setup Info
  </button>


  <div
    id="cloudInfo"
    class="settings-note hidden"
  >

    <p>
      The app is already structured so localStorage
      data can later be migrated to a cloud database
      without redesigning the interface.
    </p>

  </div>

</div>

</div>

</section>
'''

if 'id="settings"' not in html:

    html = html.replace(
        '</main>',
        settings_page + '\n</main>'
    )


# =========================================================
# ONBOARDING
# =========================================================

onboarding = r'''

<!-- =====================================================
     ONBOARDING
===================================================== -->

<div
  id="studyFlowOnboarding"
  class="onboarding-overlay hidden"
>

  <div class="onboarding-card">

    <div class="onboarding-logo">
      🎓
    </div>

    <p class="eyebrow">
      WELCOME TO STUDYFLOW
    </p>

    <h1>
      Let's set up your workspace
    </h1>

    <p class="muted onboarding-intro">
      A few quick details and StudyFlow will personalize
      your student dashboard.
    </p>


    <div class="onboarding-grid">

      <div>

        <label>
          University
        </label>

        <input
          id="onboardingUniversity"
          placeholder="Oakland University"
        >

      </div>


      <div>

        <label>
          Major
        </label>

        <input
          id="onboardingMajor"
          placeholder="Computer Science"
        >

      </div>


      <div>

        <label>
          Current semester
        </label>

        <select id="onboardingSemester">

          <option value="Fall 2026">
            Fall 2026
          </option>

          <option value="Winter 2027">
            Winter 2027
          </option>

          <option value="Summer 2027">
            Summer 2027
          </option>

        </select>

      </div>


      <div>

        <label>
          Degree credits required
        </label>

        <input
          id="onboardingCredits"
          type="number"
          min="1"
          value="120"
        >

      </div>

    </div>


    <div class="onboarding-theme">

      <span>
        Choose your style
      </span>

      <div>

        <button
          class="onboarding-theme-button"
          onclick="chooseOnboardingTheme('light')"
        >
          ☀️ Light
        </button>

        <button
          class="onboarding-theme-button"
          onclick="chooseOnboardingTheme('dark')"
        >
          🌙 Dark
        </button>

      </div>

    </div>


    <button
      class="onboarding-start"
      onclick="completeStudyFlowOnboarding()"
    >
      Start using StudyFlow →
    </button>

  </div>

</div>


<!-- INSTALL BANNER -->

<div
  id="installBanner"
  class="install-banner hidden"
>

  <div>

    <strong>
      📱 Install StudyFlow
    </strong>

    <p>
      Use it like a real app from your desktop or phone.
    </p>

  </div>


  <div>

    <button
      onclick="installStudyFlowApp()"
    >
      Install
    </button>

    <button
      class="install-close"
      onclick="dismissInstallBanner()"
    >
      ×
    </button>

  </div>

</div>
'''

if 'id="studyFlowOnboarding"' not in html:

    html = html.replace(
        '<script src="app.js"></script>',
        onboarding +
        '\n<script src="app.js"></script>'
    )


p.write_text(html)

print("✅ HTML patched")
PY


# =========================================================
# CSS
# =========================================================

cat >> public/style.css <<'EOF'


/* =========================================================
   PART 3 — PRO / APP VERSION
========================================================= */


/* DARK THEME */

body.theme-dark{
--bg:#0f1117;
--card:#181b23;
--text:#f4f5f7;
--muted:#989eaa;
--border:#2b2f38;
--primarySoft:#292748;
background:var(--bg);
color:var(--text);
}

body.theme-dark aside,
body.theme-dark .panel,
body.theme-dark .stat,
body.theme-dark .course-card,
body.theme-dark .note-card,
body.theme-dark .flash-set,
body.theme-dark .task-card,
body.theme-dark .calendar-shell,
body.theme-dark .attendance-card,
body.theme-dark .week-day,
body.theme-dark .grade-row,
body.theme-dark .semester-course-card,
body.theme-dark .command-box{
background:var(--card);
color:var(--text);
}

body.theme-dark input,
body.theme-dark textarea,
body.theme-dark select{
background:#11141a;
color:#f5f5f7;
border-color:var(--border);
}

body.theme-dark .task-column,
body.theme-dark .semester-column{
background:#13161d;
}

body.theme-dark .secondary,
body.theme-dark .prompts button,
body.theme-dark .target-buttons button,
body.theme-dark .presets button{
background:#242832;
color:#f4f5f7;
border-color:#343945;
}

body.theme-dark .message.assistant,
body.theme-dark .quiz-ai,
body.theme-dark .ai-output,
body.theme-dark .predictor-result,
body.theme-dark .gpa-result{
background:#12151c;
}

body.theme-dark .calendar-day.outside{
background:#14171d;
}

body.theme-dark .weekdays{
background:#14171d;
}

body.theme-dark .ai-preview{
background:
linear-gradient(
135deg,
#635bff18,
#a855f714
),
var(--card);
}


/* SETTINGS */

.settings-layout{
display:grid;
grid-template-columns:repeat(2,1fr);
gap:18px;
}

.settings-card{
display:flex;
flex-direction:column;
align-items:flex-start;
gap:10px;
}

.settings-card>h2{
margin-bottom:0;
}

.settings-card>.muted{
margin-bottom:9px;
line-height:1.5;
}

.settings-card label:not(.toggle-row){
font-size:13px;
font-weight:750;
margin-top:8px;
}

.settings-icon{
font-size:31px;
}

.settings-button{
margin-top:3px;
}

.toggle-row{
width:100%;
display:flex;
justify-content:space-between;
align-items:center;
padding:12px 0;
border-bottom:1px solid var(--border);
cursor:pointer;
}

.toggle-row input{
width:20px;
height:20px;
accent-color:var(--primary);
}

.accent-picker{
display:flex;
gap:10px;
margin:3px 0 5px;
}

.accent-option{
width:34px;
height:34px;
border-radius:50%;
padding:0;
border:3px solid transparent;
}

.accent-option:hover{
transform:scale(1.1);
}

.accent-option.purple{
background:#635bff;
}

.accent-option.blue{
background:#2563eb;
}

.accent-option.green{
background:#16a34a;
}

.accent-option.orange{
background:#ea580c;
}

.accent-option.pink{
background:#db2777;
}

.settings-note{
width:100%;
margin-top:10px;
padding:13px;
border:1px solid var(--border);
background:var(--bg);
border-radius:12px;
}

.settings-note p{
font-size:13px;
color:var(--muted);
margin-top:4px;
line-height:1.5;
}

.settings-file-button{
display:inline-block;
background:var(--primary);
color:#fff;
padding:11px 15px;
border-radius:10px;
font-weight:650;
cursor:pointer;
}

.danger-settings-button{
background:#fff1f2;
color:#e11d48;
}

.cloud-status{
width:100%;
display:flex;
align-items:center;
gap:11px;
padding:14px;
background:var(--bg);
border-radius:12px;
}

.cloud-status p{
font-size:12px;
color:var(--muted);
margin-top:3px;
}

.cloud-dot{
width:11px;
height:11px;
border-radius:50%;
background:#f59e0b;
}


/* CUSTOM DASHBOARD */

body.hide-dashboard-stats #dashboard .stats{
display:none;
}

body.hide-dashboard-upcoming #dashboard .dashboard-grid>div:first-child{
display:none;
}

body.hide-dashboard-ai #dashboard .ai-preview{
display:none;
}

body.hide-dashboard-upcoming #dashboard .dashboard-grid,
body.hide-dashboard-ai #dashboard .dashboard-grid{
grid-template-columns:1fr;
}


/* COMPACT */

body.interface-compact main{
padding:26px;
}

body.interface-compact .panel,
body.interface-compact .stat{
padding:17px;
}

body.interface-large{
font-size:17px;
}

body.interface-large h1{
font-size:39px;
}

body.compact-sidebar aside{
width:205px;
}

body.compact-sidebar main{
margin-left:205px;
}

body.compact-sidebar .logout{
width:169px;
}


/* ONBOARDING */

.onboarding-overlay{
position:fixed;
inset:0;
z-index:5000;
background:
radial-gradient(
circle at 15% 20%,
#635bff45,
transparent 30%
),
radial-gradient(
circle at 85% 80%,
#a855f745,
transparent 30%
),
rgba(10,12,18,.94);
display:flex;
align-items:center;
justify-content:center;
padding:25px;
backdrop-filter:blur(12px);
}

.onboarding-card{
width:min(720px,100%);
background:#fff;
color:#16181e;
border-radius:27px;
padding:40px;
box-shadow:0 40px 120px rgba(0,0,0,.45);
}

.onboarding-logo{
font-size:53px;
margin-bottom:8px;
}

.onboarding-card h1{
font-size:37px;
margin-bottom:8px;
}

.onboarding-intro{
margin-bottom:28px;
}

.onboarding-grid{
display:grid;
grid-template-columns:1fr 1fr;
gap:15px;
}

.onboarding-grid label{
display:block;
font-size:12px;
font-weight:800;
margin-bottom:7px;
}

.onboarding-theme{
display:flex;
justify-content:space-between;
align-items:center;
margin:25px 0;
padding:15px;
background:#f6f7fa;
border-radius:13px;
}

.onboarding-theme>span{
font-weight:750;
}

.onboarding-theme-button{
background:#fff;
color:#25272e;
border:1px solid #dedfe5;
}

.onboarding-theme-button.active{
background:#635bff;
color:#fff;
border-color:#635bff;
}

.onboarding-start{
width:100%;
padding:14px;
font-size:15px;
}


/* INSTALL BANNER */

.install-banner{
position:fixed;
left:50%;
bottom:22px;
transform:translateX(-50%);
z-index:3000;
width:min(650px,calc(100vw - 30px));
background:#181b24;
color:#fff;
border-radius:16px;
padding:14px 16px;
display:flex;
align-items:center;
justify-content:space-between;
gap:15px;
box-shadow:0 25px 70px rgba(0,0,0,.3);
}

.install-banner p{
font-size:12px;
color:#b6bac5;
margin-top:3px;
}

.install-banner>div:last-child{
display:flex;
gap:7px;
}

.install-close{
background:#2a2e38;
}


/* MOBILE PRO */

@media(max-width:900px){

.settings-layout{
grid-template-columns:1fr;
}

body.compact-sidebar aside{
width:82px;
}

body.compact-sidebar main{
margin-left:82px;
}

.onboarding-grid{
grid-template-columns:1fr;
}

}


@media(max-width:650px){

body,
body.interface-large{
font-size:15px;
}

main{
padding:17px;
}

header,
.page-head,
.calendar-header{
align-items:flex-start;
gap:15px;
}

.settings-layout{
gap:12px;
}

.onboarding-card{
padding:25px 20px;
border-radius:20px;
}

.onboarding-card h1{
font-size:29px;
}

.onboarding-theme{
align-items:flex-start;
flex-direction:column;
gap:12px;
}

.install-banner{
align-items:flex-start;
flex-direction:column;
}

.quick-add-button{
right:18px;
bottom:18px;
}

}
EOF


# =========================================================
# JAVASCRIPT
# =========================================================

cat >> public/app.js <<'EOF'


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

EOF


# =========================================================
# FINAL CHECK
# =========================================================

echo ""
echo "✅ PART 3 files created"
echo ""
echo "Checking JavaScript syntax..."

node --check public/app.js

echo "✅ app.js syntax OK"

node --check server.js

echo "✅ server.js syntax OK"

echo ""
echo "======================================="
echo "🎉 PART 3 PRO VERSION INSTALLED"
echo "======================================="
echo ""
echo "Added:"
echo "• PWA / Installable StudyFlow app"
echo "• Offline support"
echo "• First-time onboarding"
echo "• Dark / Light / System themes"
echo "• 5 accent colors"
echo "• Interface sizing"
echo "• Customizable dashboard"
echo "• Compact sidebar"
echo "• Settings page"
echo "• Browser deadline notifications"
echo "• Full StudyFlow backup export"
echo "• Backup import"
echo "• Data reset"
echo "• Calendar .ics export"
echo "• Google Calendar integration point"
echo "• Cloud database integration point"
echo "• Mobile UI improvements"
echo ""
echo "🚀 Starting StudyFlow..."
echo ""

npm start

