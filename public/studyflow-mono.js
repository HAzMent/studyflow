
(function(){

const STORAGE_KEY =
"studyflow_theme_v18";


const media =
window.matchMedia(
"(prefers-color-scheme: dark)"
);


function savedTheme(){

return (
localStorage.getItem(
STORAGE_KEY
)
||
"system"
);

}


function actualTheme(
theme
){

if(theme === "system"){

return media.matches
? "dark"
: "light";

}


return theme;

}


function applyTheme(
theme
){

document
.documentElement
.setAttribute(
"data-sf-theme",
actualTheme(theme)
);


document
.documentElement
.setAttribute(
"data-sf-theme-setting",
theme
);


updateButtons();

}


function updateButtons(){

const selected =
savedTheme();


document
.querySelectorAll(
".sf18-theme-button"
)
.forEach(
button => {

button.classList.toggle(
"active",
button.dataset.theme ===
selected
);

}
);

}


function setTheme(
theme
){

localStorage.setItem(
STORAGE_KEY,
theme
);


applyTheme(
theme
);

}


/* apply immediately */

applyTheme(
savedTheme()
);


/* system changes */

media.addEventListener?.(
"change",
() => {

if(
savedTheme() ===
"system"
){

applyTheme(
"system"
);

}

}
);


/* =========================================================
   SIDEBAR SWITCHER
========================================================= */

function createSwitcher(){

const sidebar =
document.querySelector(
"aside"
);


if(
!sidebar ||
document.getElementById(
"sf18ThemeSwitcher"
)
){

return;

}


const switcher =
document.createElement(
"div"
);


switcher.id =
"sf18ThemeSwitcher";


switcher.innerHTML = `

<div class="sf18-theme-label">
Appearance
</div>

<div class="sf18-theme-buttons">

<button
type="button"
class="sf18-theme-button"
data-theme="light"
>
Light
</button>

<button
type="button"
class="sf18-theme-button"
data-theme="dark"
>
Dark
</button>

<button
type="button"
class="sf18-theme-button"
data-theme="system"
>
Auto
</button>

</div>

`;


switcher
.querySelectorAll(
".sf18-theme-button"
)
.forEach(
button => {

button.addEventListener(
"click",
event => {

event.preventDefault();

event.stopPropagation();


setTheme(
button.dataset.theme
);

}
);

}
);


sidebar.appendChild(
switcher
);


updateButtons();

}


/* wait for app sidebar */

const timer =
setInterval(
() => {

createSwitcher();

},
600
);


setTimeout(
() => {

clearInterval(
timer
);

},
30000
);


console.log(
"✅ StudyFlow monochrome theme ready"
);

})();
