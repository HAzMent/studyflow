const $ = id => document.getElementById(id);

let currentUser = null;
let selectedPDF = null;
let syllabusAnalysis = null;


function safe(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}


function storageKey(name) {
  return `studyflow_${currentUser.id}_${name}`;
}


async function api(url, options = {}) {

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Something went wrong."
    );
  }

  return data;
}


/* LOGIN CHECK */

async function checkUser() {

  try {

    const data = await api("/api/me");

    currentUser = data.user;

    $("syllabusAvatar").textContent =
      currentUser.name.charAt(0).toUpperCase();

  } catch {

    location.href = "/";
  }
}

checkUser();


/* FILE SELECTION */

const fileInput = $("syllabusFile");
const dropZone = $("dropZone");


fileInput.addEventListener("change", () => {

  if (fileInput.files.length) {
    chooseFile(fileInput.files[0]);
  }
});


dropZone.addEventListener("dragover", event => {

  event.preventDefault();

  dropZone.classList.add("dragging");
});


dropZone.addEventListener("dragleave", () => {

  dropZone.classList.remove("dragging");
});


dropZone.addEventListener("drop", event => {

  event.preventDefault();

  dropZone.classList.remove("dragging");

  const file = event.dataTransfer.files[0];

  if (file) {
    chooseFile(file);
  }
});


function chooseFile(file) {

  $("analysisError").textContent = "";

  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {

    $("analysisError").textContent =
      "Please choose a PDF file.";

    return;
  }


  if (file.size > 15 * 1024 * 1024) {

    $("analysisError").textContent =
      "This PDF is too large. Please use a PDF under 15 MB.";

    return;
  }


  selectedPDF = file;

  $("selectedFileName").textContent =
    file.name;

  $("selectedFileSize").textContent =
    formatFileSize(file.size);

  $("selectedFile").classList.remove("hidden");

  $("analyzeButton").disabled = false;

  $("dropTitle").textContent =
    "PDF selected ✓";

  $("dropText").textContent =
    "Click here if you want to choose a different file";
}


function removeSelectedFile() {

  selectedPDF = null;

  fileInput.value = "";

  $("selectedFile").classList.add("hidden");

  $("analyzeButton").disabled = true;

  $("dropTitle").textContent =
    "Drop your syllabus here";

  $("dropText").textContent =
    "or click to choose a PDF";

  $("resultsSection").classList.add("hidden");

  $("analysisError").textContent = "";

  syllabusAnalysis = null;
}


function formatFileSize(bytes) {

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}


/* PDF -> BASE64 */

function fileToBase64(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = () => {

      const result = reader.result;

      const base64 =
        result.substring(
          result.indexOf(",") + 1
        );

      resolve(base64);
    };

    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}


/* ANALYZE */

async function analyzeSyllabus() {

  if (!selectedPDF) {
    return;
  }

  $("analysisError").textContent = "";

  $("analysisStatus").classList.remove("hidden");

  $("resultsSection").classList.add("hidden");

  $("analyzeButton").disabled = true;

  $("analyzeButton").textContent =
    "Analyzing...";


  try {

    $("statusTitle").textContent =
      "Reading your syllabus...";

    $("statusText").textContent =
      "Looking for important coursework and dates.";


    const fileData =
      await fileToBase64(selectedPDF);


    $("statusTitle").textContent =
      "StudyFlow AI is analyzing it...";

    $("statusText").textContent =
      "Finding assignments, exams, projects and deadlines.";


    const data = await api(
      "/api/syllabus-analyze",
      {
        method: "POST",

        body: JSON.stringify({
          filename: selectedPDF.name,
          fileData
        })
      }
    );


    syllabusAnalysis = data;

    renderResults();


  } catch (error) {

    $("analysisError").textContent =
      error.message;

  } finally {

    $("analysisStatus").classList.add("hidden");

    $("analyzeButton").disabled = false;

    $("analyzeButton").textContent =
      "✨ Analyze Again";
  }
}


/* RESULTS */

function renderResults() {

  if (!syllabusAnalysis) {
    return;
  }

  const events =
    syllabusAnalysis.events || [];


  $("detectedCourse").textContent =
    syllabusAnalysis.courseName ||
    "Detected Course";


  $("detectedInstructor").textContent =
    syllabusAnalysis.instructor
      ? `Instructor: ${syllabusAnalysis.instructor}`
      : "Instructor not detected";


  $("eventCount").textContent =
    events.length;


  $("datedCount").textContent =
    events.filter(event => event.date).length;


  $("highCount").textContent =
    events.filter(
      event => event.priority === "High"
    ).length;


  if (!events.length) {

    $("syllabusEvents").innerHTML = `
      <div style="padding:30px;text-align:center">
        <h3>No deadlines found</h3>
        <p class="muted" style="margin-top:6px">
          StudyFlow could not find clear assignments or exam dates
          in this PDF.
        </p>
      </div>
    `;

  } else {

    $("syllabusEvents").innerHTML =
      events.map((event, index) => `

        <div class="syllabus-event">

          <input
            class="event-checkbox"
            type="checkbox"
            data-index="${index}"
            checked
          >

          <div class="event-main">

            <h3>
              ${safe(event.title)}
            </h3>

            <div class="event-info">

              <span class="event-type">
                ${safe(event.type)}
              </span>

              <span
                class="event-priority ${safe(event.priority)}"
              >
                ${safe(event.priority)}
              </span>

            </div>

            ${
              event.details
                ? `
                <div class="event-details">
                  ${safe(event.details)}
                </div>
                `
                : ""
            }

          </div>

          <div class="
            event-date
            ${event.date ? "" : "no-date"}
          ">

            ${
              event.date
                ? `📅 ${safe(event.date)}`
                : "No clear date"
            }

          </div>

        </div>

      `).join("");
  }


  $("resultsSection").classList.remove("hidden");

  $("importSuccess").classList.add("hidden");

  $("resultsSection").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


/* SELECT ALL */

function selectAllEvents() {

  const boxes =
    document.querySelectorAll(
      ".event-checkbox"
    );

  const allSelected =
    [...boxes].every(box => box.checked);

  boxes.forEach(box => {
    box.checked = !allSelected;
  });
}


/* IMPORT */

function addSelectedToStudyFlow() {

  if (!currentUser || !syllabusAnalysis) {
    return;
  }


  const selectedIndexes =
    [...document.querySelectorAll(
      ".event-checkbox:checked"
    )]
    .map(box => Number(box.dataset.index));


  if (!selectedIndexes.length) {

    alert(
      "Choose at least one assignment or exam."
    );

    return;
  }


  let tasks =
    JSON.parse(
      localStorage.getItem(
        storageKey("tasks")
      )
    ) || [];


  let classes =
    JSON.parse(
      localStorage.getItem(
        storageKey("classes")
      )
    ) || [];


  const course =
    syllabusAnalysis.courseName ||
    "Imported Course";


  const courseExists =
    classes.some(
      item =>
        item.name
          .trim()
          .toLowerCase()
        ===
        course
          .trim()
          .toLowerCase()
    );


  if (!courseExists) {

    classes.push({
      id: Date.now(),
      name: course,
      professor:
        syllabusAnalysis.instructor || "",
      room: ""
    });
  }


  let imported = 0;


  selectedIndexes.forEach((index, offset) => {

    const event =
      syllabusAnalysis.events[index];

    if (!event) {
      return;
    }


    const duplicate =
      tasks.some(task =>
        task.name
          .trim()
          .toLowerCase()
        ===
        event.title
          .trim()
          .toLowerCase()

        &&

        (task.date || "")
        ===
        (event.date || "")

        &&

        (task.course || "")
          .trim()
          .toLowerCase()
        ===
        course
          .trim()
          .toLowerCase()
      );


    if (duplicate) {
      return;
    }


    tasks.push({
      id:
        Date.now()
        + offset
        + Math.floor(Math.random() * 1000),

      name:
        event.title,

      course,

      date:
        event.date || "",

      priority:
        event.priority || "Medium",

      status:
        "todo",

      type:
        event.type || "Assignment",

      details:
        event.details || ""
    });


    imported++;
  });


  localStorage.setItem(
    storageKey("tasks"),
    JSON.stringify(tasks)
  );


  localStorage.setItem(
    storageKey("classes"),
    JSON.stringify(classes)
  );


  $("importSuccessTitle").textContent =
    imported === 1
      ? "1 item added to StudyFlow"
      : `${imported} items added to StudyFlow`;


  $("importSuccess")
    .classList.remove("hidden");


  $("importSuccess")
    .scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
}
