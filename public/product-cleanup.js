
(function(){

let initialized = false;


/* =========================================================
   USER
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


/* =========================================================
   SIDEBAR LABELS
========================================================= */

const labels = {

homePro:
"⌂ Home",

todayPro:
"☀ Today",

classes:
"▦ Classes",

courseHub:
"◫ Course Hub",

tasksPro:
"✓ Tasks",

calendarPro:
"□ Calendar",

smartSchedule:
"◷ Schedule",

grades:
"% Grades",

notes:
"≡ Notes",

knowledgeBase:
"◉ Knowledge",

examMode:
"◎ Exams",

ai:
"✦ AI Tutor",

focus:
"◷ Focus"

};


/* =========================================================
   CLEAN SIDEBAR
========================================================= */

function cleanSidebar(){

const sidebar =
document.querySelector(
"aside"
);


if(!sidebar){

return;

}


/* Hide legacy duplicates */

[
"dashboard",
"tasks",
"calendar"
]
.forEach(
page => {

const button =
sidebar.querySelector(
`.nav[data-page="${page}"]`
);


if(button){

button.style.display =
"none";

button.setAttribute(
"aria-hidden",
"true"
);

}

}
);


/* Remove temporary NEW badges */

sidebar
.querySelectorAll(
".tf-new-badge,.sf14-new,.sf15-new,.sf16-new,.sf17-new,.sf22-new"
)
.forEach(
badge =>
badge.remove()
);


/* Rename nav only when actually necessary */

Object.entries(
labels
)
.forEach(
([page,label]) => {

const button =
sidebar.querySelector(
`.nav[data-page="${page}"]`
);


if(!button){

return;

}


const current =
button.textContent
.trim()
.replace(
/NEW/g,
""
)
.trim();


if(current !== label){

button.textContent =
label;

}

}
);


/*
IMPORTANT:
Do NOT rewrite Search innerHTML here.

PART 21 already creates Search correctly.
The old PART 23 kept rewriting it inside a
MutationObserver, which caused the infinite loop.
*/

}


/* =========================================================
   PAGE HELPERS
========================================================= */

function authVisible(){

const auth =
document.getElementById(
"authScreen"
);


if(!auth){

return false;

}


return (
!auth.classList.contains(
"hidden"
)
&&
getComputedStyle(
auth
).display !==
"none"
);

}


function visiblePage(){

return [
...document.querySelectorAll(
".page"
)
]
.find(
page => {

if(
page.classList.contains(
"hidden"
)
){

return false;

}


return (
getComputedStyle(
page
).display !==
"none"
);

}
);

}


function openHome(){

const home =
document.getElementById(
"homePro"
);


if(!home){

return;

}


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


home.classList.remove(
"hidden"
);


document
.querySelectorAll(
".nav"
)
.forEach(
button => {

button.classList.toggle(
"active",
button.dataset.page ===
"homePro"
);

}
);

}


/* =========================================================
   HOME AFTER LOGIN
========================================================= */

function ensureHome(){

if(
!getUser()
||
authVisible()
){

return;

}


const current =
visiblePage();


if(
!current
||
current.id ===
"dashboard"
){

openHome();

}

}


/* =========================================================
   HOME CLICK
========================================================= */

function bindHome(){

const button =
document.querySelector(
'.nav[data-page="homePro"]'
);


if(
!button
||
button.dataset.sf23SafeBound ===
"1"
){

return;

}


button.dataset.sf23SafeBound =
"1";


button.addEventListener(
"click",
() => {

setTimeout(
openHome,
0
);

}
);

}


/* =========================================================
   INIT
========================================================= */

function initialize(){

if(
initialized
||
!getUser()
){

return;

}


document.body.classList.add(
"sf23-clean"
);


cleanSidebar();

bindHome();

ensureHome();


/*
Only run a LIMITED startup cleanup.

NO MutationObserver.
NO permanent loop.
*/

let runs = 0;


const startup =
setInterval(
() => {

runs++;


cleanSidebar();

bindHome();


if(runs <= 5){

ensureHome();

}


if(runs >= 12){

clearInterval(
startup
);

}

},
400
);


initialized =
true;


console.log(
"✅ StudyFlow PART 23 safe cleanup ready"
);

}


const loginCheck =
setInterval(
() => {

if(
getUser()
){

initialize();

}


if(initialized){

clearInterval(
loginCheck
);

}

},
300
);

})();


/* ==========================================
   STUDYFLOW PAGE NAVIGATION HOTFIX
========================================== */

(function(){

function sf23ActivatePage(pageId){

  const target =
    document.getElementById(pageId);

  if(!target){
    return;
  }

  document
    .querySelectorAll("main .page")
    .forEach(page => {

      page.classList.remove("active");

      page.classList.add("hidden");

    });


  target.classList.remove("hidden");

  target.classList.add("active");


  document
    .querySelectorAll(
      'aside .nav[data-page]'
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.page === pageId
      );

    });

}


/*
After any sidebar navigation finishes,
enforce the correct page visibility.
*/

document.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        'aside .nav[data-page]'
      );

    if(!button){
      return;
    }

    const pageId =
      button.dataset.page;

    if(!pageId){
      return;
    }

    setTimeout(
      () => sf23ActivatePage(pageId),
      0
    );

  }
);


/*
Recover whichever page is marked active
after StudyFlow finishes loading.
*/

function reconcile(){

  const activeButton =
    document.querySelector(
      'aside .nav.active[data-page]'
    );

  if(
    activeButton &&
    document.getElementById(
      activeButton.dataset.page
    )
  ){

    sf23ActivatePage(
      activeButton.dataset.page
    );

    return;
  }


  /*
  If logged in but no page is active,
  fall back to the new Home.
  */

  let loggedIn = false;

  try{

    loggedIn =
      typeof currentUser !== "undefined"
      &&
      !!currentUser;

  }catch{}


  if(
    loggedIn &&
    document.getElementById("homePro")
  ){

    sf23ActivatePage(
      "homePro"
    );

  }

}


setTimeout(
  reconcile,
  600
);

setTimeout(
  reconcile,
  1400
);

window.sf23ActivatePage =
  sf23ActivatePage;

console.log(
  "✅ StudyFlow page visibility compatibility ready"
);

})();
