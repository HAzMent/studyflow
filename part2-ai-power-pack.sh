#!/bin/bash

set -e

echo ""
echo "🤖 StudyFlow — PART 2 AI Power Pack"
echo "==================================="
echo ""

BACKUP="backup-part2-$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP"

cp -R public "$BACKUP/public" 2>/dev/null || true
cp server.js "$BACKUP/server.js" 2>/dev/null || true

echo "✅ Backup: $BACKUP"


# =========================================================
# SERVER — GENERIC PDF AI ROUTE
# =========================================================

python3 <<'PY'
from pathlib import Path

p = Path("server.js")
s = p.read_text()

# Increase JSON body limit if needed
s = s.replace(
    'app.use(express.json());',
    'app.use(express.json({ limit: "25mb" }));'
)

route = r'''
app.post("/api/document-ai", async (req, res) => {

  if (!req.session.userId) {
    return res.status(401).json({
      error: "Login required."
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: "OPENAI_API_KEY is not connected."
    });
  }

  const {
    filename,
    fileData,
    instruction
  } = req.body;

  if (!filename || !fileData) {
    return res.status(400).json({
      error: "PDF is required."
    });
  }

  try {

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await client.responses.create({

      model:
        process.env.OPENAI_MODEL ||
        "gpt-5-mini",

      store: false,

      input: [
        {
          role: "user",

          content: [

            {
              type: "input_text",

              text:
                instruction ||
                "Summarize this document for a college student."
            },

            {
              type: "input_file",
              filename,
              file_data: fileData
            }

          ]
        }
      ]

    });

    res.json({
      answer: response.output_text
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error:
        error?.message ||
        "Document analysis failed."
    });
  }

});
'''

if '/api/document-ai' not in s:
    s = s.replace(
        'app.listen(PORT, () => {',
        route + '\n\napp.listen(PORT, () => {'
    )

p.write_text(s)

print("✅ Server patched")
PY


# =========================================================
# HTML
# =========================================================

python3 <<'PY'
from pathlib import Path

p = Path("public/index.html")
html = p.read_text()

# Add AI Power nav
if 'data-page="aiPower"' not in html:

    html = html.replace(
        '<button class="nav" data-page="ai">✨ AI Tutor</button>',
        '''<button class="nav" data-page="ai">✨ AI Tutor</button>
      <button class="nav" data-page="aiPower">⚡ AI Power Lab</button>'''
    )


section = r'''
<!-- =====================================================
     AI POWER LAB
===================================================== -->

<section id="aiPower" class="page">

<div class="page-head">

  <div>

    <p class="eyebrow">
      AI POWER PACK
    </p>

    <h1>
      AI Power Lab ⚡
    </h1>

    <p class="muted">
      Practice tests, study guides, explanations, PDF summaries,
      formulas, citations and research planning.
    </p>

  </div>

</div>


<div class="ai-tools-grid">

  <button
    class="ai-tool-card"
    onclick="openAITool('practice')"
  >

    <span>🧪</span>

    <strong>
      Practice Test
    </strong>

    <small>
      Generate A/B/C/D tests
    </small>

  </button>


  <button
    class="ai-tool-card"
    onclick="openAITool('quiz')"
  >

    <span>❓</span>

    <strong>
      Quiz Me
    </strong>

    <small>
      Interactive questions
    </small>

  </button>


  <button
    class="ai-tool-card"
    onclick="openAITool('guide')"
  >

    <span>📚</span>

    <strong>
      Study Guide
    </strong>

    <small>
      Build exam review notes
    </small>

  </button>


  <button
    class="ai-tool-card"
    onclick="openAITool('explain')"
  >

    <span>🧠</span>

    <strong>
      Explain This
    </strong>

    <small>
      Make hard topics simple
    </small>

  </button>


  <button
    class="ai-tool-card"
    onclick="openAITool('pdf')"
  >

    <span>📄</span>

    <strong>
      PDF Summary
    </strong>

    <small>
      Summarize lectures & PDFs
    </small>

  </button>


  <button
    class="ai-tool-card"
    onclick="openAITool('formula')"
  >

    <span>🧮</span>

    <strong>
      Formula Sheet
    </strong>

    <small>
      Extract key formulas
    </small>

  </button>


  <button
    class="ai-tool-card"
    onclick="openAITool('citation')"
  >

    <span>🔗</span>

    <strong>
      Citation Generator
    </strong>

    <small>
      MLA / APA / Chicago
    </small>

  </button>


  <button
    class="ai-tool-card"
    onclick="openAITool('research')"
  >

    <span>✍️</span>

    <strong>
      Essay Planner
    </strong>

    <small>
      Thesis + outline + questions
    </small>

  </button>


  <button
    class="ai-tool-card"
    onclick="openAITool('courseAI')"
  >

    <span>🎓</span>

    <strong>
      Course Assistant
    </strong>

    <small>
      AI context for one class
    </small>

  </button>

</div>


<div class="panel ai-workspace">

  <!-- PRACTICE TEST -->

  <div
    id="tool-practice"
    class="ai-tool-panel"
  >

    <h2>
      🧪 AI Practice Test
    </h2>

    <p class="muted">
      Paste notes or choose one of your saved notes.
    </p>


    <select
      id="practiceNoteSelect"
      onchange="loadNoteIntoTool(
        this.value,
        'practiceSource'
      )"
    >

      <option value="">
        Choose saved note
      </option>

    </select>


    <textarea
      id="practiceSource"
      placeholder="Paste study material..."
    ></textarea>


    <div class="ai-inline-fields">

      <select id="practiceCount">
        <option value="5">
          5 questions
        </option>

        <option value="10" selected>
          10 questions
        </option>

        <option value="15">
          15 questions
        </option>
      </select>


      <select id="practiceDifficulty">

        <option value="easy">
          Easy
        </option>

        <option value="medium" selected>
          Medium
        </option>

        <option value="hard">
          Hard
        </option>

      </select>

    </div>


    <button
      id="generatePracticeButton"
      onclick="generatePracticeTest()"
    >
      ✨ Generate Test
    </button>


    <p
      id="practiceError"
      class="ai-tool-error"
    ></p>


    <div
      id="practiceTestArea"
      class="practice-test-area"
    ></div>

  </div>


  <!-- QUIZ ME -->

  <div
    id="tool-quiz"
    class="ai-tool-panel hidden"
  >

    <h2>
      ❓ Quiz Me
    </h2>

    <p class="muted">
      AI asks one question at a time.
    </p>


    <textarea
      id="quizTopic"
      placeholder="Example: inverse functions, chapter 4 chemistry, WWI..."
    ></textarea>


    <button onclick="startAIQuiz()">
      Start Quiz
    </button>


    <div
      id="quizConversation"
      class="quiz-conversation"
    ></div>

  </div>


  <!-- STUDY GUIDE -->

  <div
    id="tool-guide"
    class="ai-tool-panel hidden"
  >

    <h2>
      📚 Study Guide Generator
    </h2>

    <select
      id="guideNoteSelect"
      onchange="loadNoteIntoTool(
        this.value,
        'guideSource'
      )"
    >
      <option value="">
        Choose saved note
      </option>
    </select>


    <textarea
      id="guideSource"
      placeholder="Paste notes or exam material..."
    ></textarea>


    <button
      onclick="generateStudyGuide()"
    >
      ✨ Create Study Guide
    </button>


    <div
      id="guideResult"
      class="ai-output"
    ></div>

  </div>


  <!-- EXPLAIN -->

  <div
    id="tool-explain"
    class="ai-tool-panel hidden"
  >

    <h2>
      🧠 Explain This
    </h2>

    <textarea
      id="explainSource"
      placeholder="Paste a problem, paragraph, concept or question..."
    ></textarea>


    <select id="explainLevel">

      <option value="very simple">
        Very simple
      </option>

      <option value="college beginner" selected>
        College beginner
      </option>

      <option value="detailed">
        Detailed
      </option>

    </select>


    <button onclick="explainThis()">
      Explain
    </button>


    <div
      id="explainResult"
      class="ai-output"
    ></div>

  </div>


  <!-- PDF -->

  <div
    id="tool-pdf"
    class="ai-tool-panel hidden"
  >

    <h2>
      📄 PDF / Lecture Summarizer
    </h2>

    <div class="ai-pdf-drop">

      <input
        id="aiPdfFile"
        type="file"
        accept=".pdf,application/pdf"
      >

    </div>


    <select id="pdfSummaryType">

      <option value="summary">
        Short summary
      </option>

      <option value="study">
        Study notes
      </option>

      <option value="exam">
        Exam review
      </option>

      <option value="concepts">
        Key concepts
      </option>

    </select>


    <button onclick="summarizePDF()">
      ✨ Analyze PDF
    </button>


    <div
      id="pdfResult"
      class="ai-output"
    ></div>

  </div>


  <!-- FORMULA -->

  <div
    id="tool-formula"
    class="ai-tool-panel hidden"
  >

    <h2>
      🧮 Formula Sheet
    </h2>

    <textarea
      id="formulaSource"
      placeholder="Paste math, physics, engineering or chemistry notes..."
    ></textarea>


    <button onclick="generateFormulaSheet()">
      Generate Formula Sheet
    </button>


    <div
      id="formulaResult"
      class="ai-output"
    ></div>

  </div>


  <!-- CITATION -->

  <div
    id="tool-citation"
    class="ai-tool-panel hidden"
  >

    <h2>
      🔗 Citation Generator
    </h2>

    <select id="citationStyle">

      <option value="MLA 9">
        MLA 9
      </option>

      <option value="APA 7">
        APA 7
      </option>

      <option value="Chicago">
        Chicago
      </option>

    </select>


    <textarea
      id="citationSource"
      placeholder="Paste URL, book information, article title/author/date, DOI, etc..."
    ></textarea>


    <button onclick="generateCitation()">
      Generate Citation
    </button>


    <div
      id="citationResult"
      class="ai-output"
    ></div>

  </div>


  <!-- RESEARCH -->

  <div
    id="tool-research"
    class="ai-tool-panel hidden"
  >

    <h2>
      ✍️ Essay & Research Planner
    </h2>

    <textarea
      id="researchTopic"
      placeholder="Example: How does AI affect college students' learning?"
    ></textarea>


    <select id="researchType">

      <option value="research paper">
        Research Paper
      </option>

      <option value="argumentative essay">
        Argumentative Essay
      </option>

      <option value="analysis essay">
        Analysis Essay
      </option>

      <option value="presentation">
        Presentation
      </option>

    </select>


    <button onclick="generateResearchPlan()">
      ✨ Build Plan
    </button>


    <div
      id="researchResult"
      class="ai-output"
    ></div>

  </div>


  <!-- COURSE AI -->

  <div
    id="tool-courseAI"
    class="ai-tool-panel hidden"
  >

    <h2>
      🎓 Course Assistant
    </h2>

    <p class="muted">
      StudyFlow will include your notes and tasks
      from the selected class as context.
    </p>


    <select id="courseAIClass">

      <option value="">
        Select class
      </option>

    </select>


    <textarea
      id="courseAIQuestion"
      placeholder="Ask something about this class..."
    ></textarea>


    <button onclick="askCourseAI()">
      Ask Course Assistant
    </button>


    <div
      id="courseAIResult"
      class="ai-output"
    ></div>

  </div>

</div>

</section>
'''

if 'id="aiPower"' not in html:

    html = html.replace(
        '<!-- TIMER -->',
        section + '\n\n<!-- TIMER -->'
    )

p.write_text(html)

print("✅ HTML patched")
PY


# =========================================================
# CSS
# =========================================================

cat >> public/style.css <<'EOF'


/* =========================================================
   PART 2 — AI POWER PACK
========================================================= */

.ai-tools-grid{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:14px;
margin-bottom:22px;
}

.ai-tool-card{
background:#fff;
border:1px solid var(--border);
color:var(--text);
padding:20px;
border-radius:17px;
text-align:left;
display:flex;
flex-direction:column;
align-items:flex-start;
gap:7px;
box-shadow:0 7px 25px rgba(20,20,40,.025);
}

.ai-tool-card:hover{
background:#f7f6ff;
border-color:#c9c5ff;
}

.ai-tool-card>span{
font-size:29px;
}

.ai-tool-card strong{
font-size:16px;
}

.ai-tool-card small{
color:var(--muted);
}

.ai-workspace{
min-height:500px;
}

.ai-tool-panel{
display:grid;
gap:13px;
}

.ai-tool-panel>textarea{
min-height:180px;
resize:vertical;
}

.ai-tool-panel>select{
max-width:350px;
}

.ai-inline-fields{
display:grid;
grid-template-columns:1fr 1fr;
gap:10px;
max-width:600px;
}

.ai-output{
white-space:pre-wrap;
line-height:1.75;
margin-top:10px;
padding:20px;
border-radius:14px;
background:#f7f8fb;
border:1px solid var(--border);
min-height:60px;
}

.ai-output:empty{
display:none;
}

.ai-tool-error{
color:#dc2626;
font-size:13px;
}


/* PRACTICE TEST */

.practice-test-area{
margin-top:15px;
}

.practice-question{
background:#f8f9fc;
border:1px solid var(--border);
border-radius:15px;
padding:18px;
margin-bottom:13px;
}

.practice-question h3{
font-size:16px;
line-height:1.45;
margin-bottom:13px;
}

.practice-option{
display:block;
margin:7px 0;
padding:10px;
border-radius:9px;
background:#fff;
border:1px solid var(--border);
cursor:pointer;
}

.practice-option:hover{
border-color:#a9a4ff;
}

.practice-option input{
width:auto;
margin-right:7px;
}

.practice-score{
padding:25px;
background:#f5f3ff;
border-radius:15px;
margin-top:16px;
text-align:center;
}

.practice-score strong{
display:block;
font-size:48px;
color:var(--primary);
}

.answer-correct{
border-color:#86efac!important;
background:#f0fdf4!important;
}

.answer-wrong{
border-color:#fda4af!important;
background:#fff1f2!important;
}


/* QUIZ */

.quiz-conversation{
margin-top:10px;
}

.quiz-bubble{
padding:14px 16px;
border-radius:14px;
margin-bottom:10px;
max-width:80%;
line-height:1.5;
}

.quiz-ai{
background:#f1f2f6;
}

.quiz-user{
margin-left:auto;
background:var(--primary);
color:#fff;
}

.quiz-answer-box{
display:grid;
grid-template-columns:1fr auto;
gap:8px;
margin-top:10px;
}


/* PDF */

.ai-pdf-drop{
padding:20px;
background:#f7f8fb;
border:2px dashed var(--border);
border-radius:14px;
}


/* LOADING */

.ai-thinking{
display:flex;
gap:10px;
align-items:center;
color:var(--muted);
padding:15px;
}

.ai-thinking-dot{
width:9px;
height:9px;
background:var(--primary);
border-radius:50%;
animation:aiPulse .8s infinite alternate;
}

@keyframes aiPulse{
from{
opacity:.25;
transform:scale(.8);
}
to{
opacity:1;
transform:scale(1.2);
}
}


@media(max-width:950px){

.ai-tools-grid{
grid-template-columns:1fr 1fr;
}

}

@media(max-width:600px){

.ai-tools-grid,
.ai-inline-fields{
grid-template-columns:1fr;
}

}
EOF


# =========================================================
# JAVASCRIPT
# =========================================================

cat >> public/app.js <<'EOF'


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

EOF


# =========================================================
# PATCH startApp
# =========================================================

python3 <<'PY'
from pathlib import Path

p = Path("public/app.js")
js = p.read_text()

marker = "initStudentCore();"

if marker in js and "renderAIPowerSelectors();" not in js[js.find(marker):js.find(marker)+300]:

    js = js.replace(
        marker,
        marker + "\n    renderAIPowerSelectors();",
        1
    )

p.write_text(js)

print("✅ JavaScript patched")
PY


echo ""
echo "==================================="
echo "✅ PART 2 AI POWER PACK INSTALLED"
echo "==================================="
echo ""
echo "Added:"
echo "• AI Practice Tests"
echo "• Interactive Quiz Me"
echo "• AI Study Guides"
echo "• Explain This"
echo "• PDF / Lecture Summarizer"
echo "• Formula Sheet Generator"
echo "• MLA / APA / Chicago Citations"
echo "• Essay & Research Planner"
echo "• Course-specific AI Assistant"
echo ""
echo "🚀 Starting StudyFlow..."
echo ""

npm start

