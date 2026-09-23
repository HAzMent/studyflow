
const mobileMenu =
  document.getElementById(
    "mobileMenu"
  );

const navLinks =
  document.getElementById(
    "navLinks"
  );


if(
  mobileMenu &&
  navLinks
){

  mobileMenu.addEventListener(
    "click",
    () => {

      navLinks.classList
        .toggle("open");

    }
  );


  navLinks
  .querySelectorAll("a")
  .forEach(link => {

    link.addEventListener(
      "click",
      () => {

        navLinks.classList
          .remove("open");

      }
    );

  });

}


function showComingSoon(){

  alert(
    "StudyFlow Pro is coming later. The current version is available to use now."
  );

}

