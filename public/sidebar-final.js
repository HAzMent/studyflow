
(function(){

"use strict";

const ORDER = [
  "homePro",
  "todayPro",
  "smartInbox",
  "smartSchedule",

  "classes",
  "courseHub",
  "knowledgeBase",
  "examMode",

  "tasksPro",
  "calendarPro",

  "degree",
  "semester",
  "attendance",
  "analytics",
  "grades",
  "predictor",

  "notes",
  "flashcards",
  "ai",
  "aiPower",
  "timer",

  "__syllabus__",

  "cloudSync",
  "profile",
  "settings"
];


function findSyllabus(aside){

  return [...aside.querySelectorAll(
    "button,a"
  )].find(el => {

    const text =
      (el.textContent || "")
        .replace(/\s+/g," ")
        .trim()
        .toLowerCase();

    return text.includes("syllabus ai");

  }) || null;

}


function applySidebarOrder(){

  const aside =
    document.querySelector("aside");

  if(!aside){
    return false;
  }


  const nav =
    aside.querySelector("nav");

  if(!nav){
    return false;
  }


  const home =
    aside.querySelector(
      '[data-page="homePro"]'
    );

  const inbox =
    aside.querySelector(
      '[data-page="smartInbox"]'
    );


  /*
    Move the already-existing elements.
    appendChild does NOT clone them,
    so their event listeners remain attached.
  */

  if(
    home &&
    home.parentElement !== nav
  ){
    nav.appendChild(home);
  }


  if(
    inbox &&
    inbox.parentElement !== nav
  ){
    nav.appendChild(inbox);
  }


  const syllabus =
    findSyllabus(aside);


  const nodes =
    ORDER.map(key => {

      if(key === "__syllabus__"){
        return syllabus;
      }

      return aside.querySelector(
        `[data-page="${key}"]`
      );

    });


  /*
    If the important navigation modules have not
    initialized yet, retry later.
  */

  const required = [
    "homePro",
    "todayPro",
    "smartInbox",
    "smartSchedule",
    "classes",
    "tasksPro",
    "calendarPro",
    "settings"
  ];


  const ready =
    required.every(page =>
      aside.querySelector(
        `[data-page="${page}"]`
      )
    );


  if(!ready){
    return false;
  }


  nodes
    .filter(Boolean)
    .forEach(node => {

      nav.appendChild(node);

    });


  /*
    Keep legacy buttons hidden.

    These pages stay in the DOM as fallback data,
    but they must not appear in the final product nav.
  */

  [
    "dashboard",
    "tasks",
    "planner",
    "calendar",
    "overview"
  ]
  .forEach(page => {

    const legacy =
      nav.querySelector(
        `[data-page="${page}"]`
      );

    if(legacy){

      legacy.style.setProperty(
        "display",
        "none",
        "important"
      );

    }

  });


  document.body.classList.add(
    "sf-final-sidebar"
  );


  return true;

}


function start(){

  if(applySidebarOrder()){

    console.log(
      "✅ StudyFlow final sidebar ready"
    );

    return;

  }


  /*
    Finite startup retries only.
    No permanent polling.
  */

  const delays = [
    250,
    600,
    1200,
    2200,
    4000
  ];


  delays.forEach((delay,index) => {

    setTimeout(() => {

      if(
        document.body.classList
          .contains("sf-final-sidebar")
      ){
        return;
      }


      if(applySidebarOrder()){

        console.log(
          "✅ StudyFlow final sidebar ready"
        );

      }else if(
        index === delays.length - 1
      ){

        console.warn(
          "StudyFlow sidebar initialized partially."
        );

      }

    },delay);

  });

}


if(
  document.readyState === "loading"
){

  document.addEventListener(
    "DOMContentLoaded",
    start,
    { once:true }
  );

}else{

  start();

}

})();
