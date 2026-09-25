
(function(){

let sf16Initialized = false;
let sf16SelectedId = null;

function user(){
  try {
    return typeof currentUser !== "undefined"
      ? currentUser
      : null;
  } catch {
    return null;
  }
}

function storageKey(name){
  try {
    if (typeof key === "function") {
      return key(name);
    }
  } catch {}

  return `studyflow_${user()?.id || "guest"}_${name}`;
}

function classesList(){
  try {
    return (
      typeof classes !== "undefined" &&
      Array.isArray(classes)
    )
      ? classes
      : [];
  } catch {
    return [];
  }
}

function escapeHTML(value){
  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function metadata(){
  try {
    const data = JSON.parse(
      localStorage.getItem(
        storageKey("knowledgeFiles")
      )
    );

    return Array.isArray(data)
      ? data
      : [];

  } catch {
    return [];
  }
}

function saveMetadata(data){
  localStorage.setItem(
    storageKey("knowledgeFiles"),
    JSON.stringify(data)
  );

  try {
    if (
      typeof markStudyFlowCloudDirty ===
      "function"
    ) {
      markStudyFlowCloudDirty();
    }
  } catch {}
}


/* =========================================================
   INDEXED DB
========================================================= */

function openDB(){
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      "StudyFlowKnowledge",
      1
    );

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore(
          "files",
          {
            keyPath:"id"
          }
        );
      }
    };

    request.onsuccess = () =>
      resolve(request.result);

    request.onerror = () =>
      reject(request.error);
  });
}

async function dbPut(item){
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      "files",
      "readwrite"
    );

    tx.objectStore("files")
      .put(item);

    tx.oncomplete = resolve;
    tx.onerror = () =>
      reject(tx.error);
  });
}

async function dbGet(id){
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      "files",
      "readonly"
    );

    const request =
      tx.objectStore("files")
      .get(id);

    request.onsuccess = () =>
      resolve(request.result);

    request.onerror = () =>
      reject(request.error);
  });
}

async function dbDelete(id){
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      "files",
      "readwrite"
    );

    tx.objectStore("files")
      .delete(id);

    tx.oncomplete = resolve;
    tx.onerror = () =>
      reject(tx.error);
  });
}


/* =========================================================
   PAGE
========================================================= */

function createPage(){
  const main =
    document.querySelector("main");

  if (
    !main ||
    document.getElementById("knowledgeBase")
  ) {
    return;
  }

  const page =
    document.createElement("section");

  page.id = "knowledgeBase";
  page.className =
    "page sf16-page hidden";

  page.innerHTML = `

<div class="sf16-head">

  <div>

    <p class="eyebrow">
      COURSE KNOWLEDGE
    </p>

    <h1>
      Knowledge Base
    </h1>

    <p class="sf16-sub">
      Keep your study materials organized and turn them into useful study tools.
    </p>

  </div>

</div>


<div class="sf16-layout">


  <div>

    <div class="sf16-upload">

      <input
        id="sf16FileInput"
        type="file"
        accept=".pdf,.txt,.md"
        hidden
      >

      <div
        id="sf16Drop"
        class="sf16-drop"
      >

        <div>

          <div class="sf16-drop-icon">
            ↑
          </div>

          <strong>
            Upload study material
          </strong>

          <p>
            PDF, TXT or Markdown · max 12 MB
          </p>

        </div>

      </div>

      <select
        id="sf16Course"
        class="sf16-course-select"
      ></select>

    </div>


    <div class="sf16-sidebar">

      <input
        id="sf16Search"
        class="sf16-search"
        placeholder="Search files..."
      >

      <div
        id="sf16Files"
        class="sf16-file-list"
      ></div>

    </div>

  </div>


  <div
    id="sf16Main"
    class="sf16-main"
  ></div>


</div>

`;

  main.appendChild(page);
}


/* =========================================================
   NAV
========================================================= */

function addNav(){
  const sidebar =
    document.querySelector("aside");

  if (
    !sidebar ||
    sidebar.querySelector(
      '[data-page="knowledgeBase"]'
    )
  ) {
    return;
  }

  const button =
    document.createElement("button");

  button.className =
    "nav sf16-nav";

  button.dataset.page =
    "knowledgeBase";

  button.innerHTML =
    `🧠 Knowledge Base <span class="sf16-new">NEW</span>`;

  button.onclick = event => {
    event.preventDefault();
    event.stopPropagation();

    go();
  };

  const courseHub =
    sidebar.querySelector(
      '[data-page="courseHub"]'
    );

  if (courseHub) {
    courseHub.insertAdjacentElement(
      "afterend",
      button
    );
  } else {
    sidebar.appendChild(button);
  }
}

function go(){
  document
    .querySelectorAll(".page")
    .forEach(page =>
      page.classList.add("hidden")
    );

  document
    .getElementById("knowledgeBase")
    ?.classList.remove("hidden");

  document
    .querySelectorAll(".nav")
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.page ===
        "knowledgeBase"
      );
    });

  render();
}


/* =========================================================
   COURSES
========================================================= */

function renderCourses(){
  const select =
    document.getElementById(
      "sf16Course"
    );

  const names = classesList()
    .map(item => item.name)
    .filter(Boolean);

  select.innerHTML = `
    <option value="">
      No course
    </option>

    ${names.map(name => `
      <option value="${escapeHTML(name)}">
        ${escapeHTML(name)}
      </option>
    `).join("")}
  `;
}


/* =========================================================
   UPLOAD
========================================================= */

async function uploadFile(file){
  if (!file) return;

  const allowed = [
    "pdf",
    "txt",
    "md"
  ];

  const extension =
    file.name
    .split(".")
    .pop()
    .toLowerCase();

  if (!allowed.includes(extension)) {
    alert(
      "Use PDF, TXT or MD for now."
    );
    return;
  }

  if (file.size > 12 * 1024 * 1024) {
    alert(
      "File must be under 12 MB."
    );
    return;
  }

  const id =
    crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now());

  const course =
    document
    .getElementById("sf16Course")
    .value;

  await dbPut({
    id,
    blob:file,
    name:file.name,
    type:file.type,
    course
  });

  const list = metadata();

  list.unshift({
    id,
    name:file.name,
    type:extension,
    course,
    size:file.size,
    createdAt:
      new Date().toISOString(),
    lastResult:"",
    lastAction:""
  });

  saveMetadata(list);

  sf16SelectedId = id;

  render();

  alert(
    "File added to StudyFlow."
  );
}


/* =========================================================
   FILE LIST
========================================================= */

function renderFiles(){
  const container =
    document.getElementById(
      "sf16Files"
    );

  if (!container) return;

  const search =
    document
    .getElementById("sf16Search")
    ?.value
    .trim()
    .toLowerCase() || "";

  const list = metadata()
    .filter(item => {
      return (
        !search ||
        item.name
          .toLowerCase()
          .includes(search) ||
        String(item.course || "")
          .toLowerCase()
          .includes(search)
      );
    });

  if (!list.length) {
    container.innerHTML = `
      <div class="sf16-empty">
        No files yet.
      </div>
    `;
    return;
  }

  container.innerHTML =
    list.map(item => `
      <div
        class="sf16-file ${
          item.id === sf16SelectedId
          ? "active"
          : ""
        }"
        data-id="${escapeHTML(item.id)}"
      >

        <div class="sf16-file-top">

          <div class="sf16-file-icon">
            ${
              item.type === "pdf"
              ? "📄"
              : "📝"
            }
          </div>

          <div>

            <strong>
              ${escapeHTML(item.name)}
            </strong>

            <small>
              ${
                escapeHTML(
                  item.course ||
                  "No course"
                )
              }
            </small>

          </div>

        </div>

      </div>
    `).join("");

  container
    .querySelectorAll(".sf16-file")
    .forEach(element => {
      element.onclick = () => {
        sf16SelectedId =
          element.dataset.id;

        render();
      };
    });
}


/* =========================================================
   MAIN
========================================================= */

function selectedMetadata(){
  return metadata().find(
    item =>
      item.id === sf16SelectedId
  );
}

function renderMain(){
  const container =
    document.getElementById(
      "sf16Main"
    );

  if (!container) return;

  const item =
    selectedMetadata();

  if (!item) {
    container.innerHTML = `
      <div class="sf16-empty">

        <div>

          <div class="sf16-empty-icon">
            🧠
          </div>

          <strong>
            Build your course knowledge base
          </strong>

          <p>
            Upload a PDF or text file to start.
          </p>

        </div>

      </div>
    `;
    return;
  }

  container.innerHTML = `

<div class="sf16-doc-head">

  <div>

    <p class="eyebrow">
      ${escapeHTML(
        item.course ||
        "STUDY MATERIAL"
      )}
    </p>

    <h2>
      ${escapeHTML(item.name)}
    </h2>

    <p>
      Uploaded ${
        new Date(
          item.createdAt
        ).toLocaleDateString()
      }
    </p>

  </div>

  <button
    id="sf16Delete"
    class="sf16-delete"
    type="button"
  >
    Delete
  </button>

</div>


<div class="sf16-tools">

  <button
    class="sf16-tool"
    data-action="summary"
    type="button"
  >
    <span>⚡</span>
    <strong>Summary</strong>
    <small>Understand it fast</small>
  </button>

  <button
    class="sf16-tool"
    data-action="guide"
    type="button"
  >
    <span>📚</span>
    <strong>Study Guide</strong>
    <small>Prepare for exams</small>
  </button>

  <button
    class="sf16-tool"
    data-action="concepts"
    type="button"
  >
    <span>🧠</span>
    <strong>Key Concepts</strong>
    <small>What actually matters</small>
  </button>

  <button
    class="sf16-tool"
    data-action="flashcards"
    type="button"
  >
    <span>🗂</span>
    <strong>Flashcards</strong>
    <small>Generate Q&A cards</small>
  </button>

  <button
    class="sf16-tool"
    data-action="quiz"
    type="button"
  >
    <span>🧪</span>
    <strong>Practice Quiz</strong>
    <small>Test yourself</small>
  </button>

  <button
    class="sf16-tool"
    data-action="summary"
    type="button"
  >
    <span>✨</span>
    <strong>Explain Simply</strong>
    <small>Make it easier</small>
  </button>

</div>


<div class="sf16-ask">

  <input
    id="sf16Question"
    placeholder="Ask a question about this file..."
  >

  <button
    id="sf16Ask"
    type="button"
  >
    Ask AI
  </button>

</div>


<div
  id="sf16Result"
  class="sf16-result"
>

  ${
    item.lastResult
    ? escapeHTML(item.lastResult)
    : `
      <span class="sf16-result-placeholder">
        Select an AI tool above or ask a question about this file.
      </span>
    `
  }

</div>


<div class="sf16-save-row">

  <button
    id="sf16SaveNote"
    class="secondary"
    type="button"
  >
    Save Result as Note
  </button>

</div>

`;

  document
    .querySelectorAll(
      ".sf16-tool"
    )
    .forEach(button => {
      button.onclick = () =>
        analyze(
          button.dataset.action
        );
    });

  document
    .getElementById("sf16Ask")
    .onclick = () =>
      analyze("ask");

  document
    .getElementById("sf16Delete")
    .onclick =
      deleteSelected;

  document
    .getElementById("sf16SaveNote")
    .onclick =
      saveResultAsNote;
}


/* =========================================================
   FILE TO DATA URL
========================================================= */

function blobToDataURL(blob){
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload = () =>
        resolve(reader.result);

      reader.onerror = () =>
        reject(reader.error);

      reader.readAsDataURL(blob);
    }
  );
}


/* =========================================================
   AI
========================================================= */

async function analyze(action){
  const item =
    selectedMetadata();

  if (!item) return;

  const resultBox =
    document.getElementById(
      "sf16Result"
    );

  const question =
    document
    .getElementById("sf16Question")
    ?.value
    .trim() || "";

  if (
    action === "ask" &&
    !question
  ) {
    document
      .getElementById("sf16Question")
      .focus();

    return;
  }

  resultBox.textContent =
    "StudyFlow AI is reading your material...";

  try {
    const stored =
      await dbGet(item.id);

    if (!stored?.blob) {
      throw new Error(
        "The original file is no longer available on this device."
      );
    }

    let answer = "";

    if (
      item.type === "txt" ||
      item.type === "md"
    ) {
      const text =
        await stored.blob.text();

      const instruction = {
        summary:
          "Summarize this study material clearly.",
        guide:
          "Create a detailed but concise exam study guide from this material.",
        concepts:
          "Extract and explain the most important concepts from this material.",
        flashcards:
          "Create 15 high-quality flashcards in Q: / A: format from this material.",
        quiz:
          "Create a 10-question multiple-choice practice quiz with answer key and short explanations.",
        ask:
          `Answer this question using the study material: ${question}`
      }[action];

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
`${instruction}

Course: ${item.course || "Unknown"}

Study material:

${text.slice(0,120000)}`
              })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "AI request failed."
        );
      }

      answer =
        data.answer || "";

    } else {
      const fileData =
        await blobToDataURL(
          stored.blob
        );

      const response =
        await fetch(
          "/api/material-analyze",
          {
            method:"POST",
            headers:{
              "Content-Type":
                "application/json"
            },
            body:
              JSON.stringify({
                filename:item.name,
                fileData,
                course:item.course,
                action,
                question
              })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "File analysis failed."
        );
      }

      answer =
        data.answer || "";
    }

    resultBox.textContent =
      answer;

    const list = metadata();

    const target =
      list.find(
        entry =>
          entry.id === item.id
      );

    if (target) {
      target.lastResult =
        answer;

      target.lastAction =
        action;

      saveMetadata(list);
    }

  } catch (error) {
    resultBox.textContent =
      `Error: ${error.message}`;
  }
}


/* =========================================================
   DELETE
========================================================= */

async function deleteSelected(){
  const item =
    selectedMetadata();

  if (!item) return;

  if (
    !confirm(
      `Delete "${item.name}"?`
    )
  ) {
    return;
  }

  await dbDelete(item.id);

  const list =
    metadata().filter(
      entry =>
        entry.id !== item.id
    );

  saveMetadata(list);

  sf16SelectedId =
    list[0]?.id || null;

  render();
}


/* =========================================================
   SAVE AS NOTE
========================================================= */

function saveResultAsNote(){
  const item =
    selectedMetadata();

  if (
    !item ||
    !item.lastResult
  ) {
    alert(
      "Generate an AI result first."
    );
    return;
  }

  try {
    if (
      typeof notes === "undefined" ||
      !Array.isArray(notes)
    ) {
      throw new Error(
        "Notes are unavailable."
      );
    }

    notes.unshift({
      id:
        crypto.randomUUID
          ? crypto.randomUUID()
          : Date.now(),

      title:
        `${item.name} — AI Notes`,

      course:
        item.course || "",

      text:
        item.lastResult
    });

    if (
      typeof saveEverything ===
      "function"
    ) {
      saveEverything();
    } else {
      localStorage.setItem(
        storageKey("notes"),
        JSON.stringify(notes)
      );
    }

    alert(
      "Saved to Notes."
    );

  } catch (error) {
    alert(error.message);
  }
}


/* =========================================================
   RENDER
========================================================= */

function render(){
  renderCourses();
  renderFiles();
  renderMain();
}


/* =========================================================
   EVENTS
========================================================= */

function bind(){
  const input =
    document.getElementById(
      "sf16FileInput"
    );

  const drop =
    document.getElementById(
      "sf16Drop"
    );

  drop.onclick = () =>
    input.click();

  input.onchange = async () => {
    const file =
      input.files?.[0];

    if (file) {
      await uploadFile(file);
    }

    input.value = "";
  };

  drop.addEventListener(
    "dragover",
    event => {
      event.preventDefault();
    }
  );

  drop.addEventListener(
    "drop",
    async event => {
      event.preventDefault();

      const file =
        event.dataTransfer
        ?.files?.[0];

      if (file) {
        await uploadFile(file);
      }
    }
  );

  document
    .getElementById("sf16Search")
    .addEventListener(
      "input",
      renderFiles
    );
}


/* =========================================================
   INIT
========================================================= */

function initialize(){
  if (
    sf16Initialized ||
    !user()
  ) {
    return;
  }

  createPage();
  addNav();
  bind();

  const list = metadata();

  sf16SelectedId =
    list[0]?.id || null;

  render();

  sf16Initialized = true;

  console.log(
    "✅ StudyFlow Knowledge Base ready"
  );
}

const timer =
  setInterval(() => {
    if (user()) {
      initialize();
    }

    if (sf16Initialized) {
      clearInterval(timer);
    }
  },400);

})();
