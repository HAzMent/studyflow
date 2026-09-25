
(function(){

let runs = 0;


/* =========================================================
   REMOVE LEGACY SIDEBAR DUPLICATES
========================================================= */

function cleanSidebar(){

  const sidebar =
    document.querySelector("aside");

  if(!sidebar){
    return;
  }


  /*
    Study Planner is superseded by Smart Schedule.
    Weekly Overview is superseded by Home + Today.
  */

  const hideExact = new Set([
    "study planner",
    "weekly overview"
  ]);


  sidebar
    .querySelectorAll("button,a,.nav")
    .forEach(element => {

      const text =
        String(element.textContent || "")
        .replace(/\s+/g," ")
        .trim()
        .toLowerCase();


      if(hideExact.has(text)){
        element.style.display = "none";
        element.setAttribute(
          "aria-hidden",
          "true"
        );
      }

    });


  /* old Dashboard / Tasks / Calendar duplicates */

  [
    "dashboard",
    "tasks",
    "calendar"
  ]
  .forEach(page => {

    const old =
      sidebar.querySelector(
        `.nav[data-page="${page}"]`
      );

    if(old){
      old.style.display = "none";
    }

  });

}


/* =========================================================
   REMOVE OLD FLOATING BUTTONS
========================================================= */

function cleanFloating(){

  [
    "#quickAddButton",
    "#premiumQuickAdd",
    ".sf-quick-add",
    ".quick-add-button",
    ".premium-quick-add"
  ]
  .forEach(selector => {

    document
      .querySelectorAll(selector)
      .forEach(element => {

        element.style.display =
          "none";

      });

  });

}


/* =========================================================
   REMOVE OLD NEW/BETA BADGES
========================================================= */

function cleanBadges(){

  document
    .querySelectorAll(
      ".tf-new-badge,.sf14-new,.sf15-new,.sf16-new,.sf17-new,.sf22-new,.premium-badge,.beta-badge"
    )
    .forEach(element => {
      element.remove();
    });

}


/* =========================================================
   RUN A FEW TIMES ONLY
   NO MUTATION OBSERVER
========================================================= */

function cleanup(){

  cleanSidebar();

  cleanFloating();

  cleanBadges();

}


cleanup();


const timer =
  setInterval(() => {

    runs++;

    cleanup();

    if(runs >= 15){
      clearInterval(timer);
    }

  },400);


console.log(
  "✅ StudyFlow final monochrome cleanup ready"
);

})();

/* Hide superseded legacy navigation */

(function(){

  function hideLegacy(){

    document
      .querySelectorAll('aside button, aside a, aside .nav')
      .forEach(el => {

        const text = (el.textContent || "")
          .replace(/\s+/g," ")
          .trim()
          .toLowerCase();

        if(
          text.includes("study planner") ||
          text.includes("weekly overview")
        ){
          el.style.setProperty(
            "display",
            "none",
            "important"
          );
        }

      });

  }

  hideLegacy();

  let n = 0;

  const t = setInterval(() => {

    hideLegacy();

    n++;

    if(n >= 10){
      clearInterval(t);
    }

  },400);

})();
