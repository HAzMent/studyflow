#!/bin/bash

set -e

echo ""
echo "🚀 StudyFlow — PART 5 Launch Version"
echo "===================================="
echo ""

# =========================================================
# BACKUP
# =========================================================

BACKUP="backup-part5-$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP"

cp -R public "$BACKUP/public" 2>/dev/null || true
cp server.js "$BACKUP/server.js" 2>/dev/null || true
cp package.json "$BACKUP/package.json" 2>/dev/null || true
cp .env "$BACKUP/.env" 2>/dev/null || true

echo "✅ Backup created: $BACKUP"


# =========================================================
# LANDING PAGE
# =========================================================

cat > public/landing.html <<'EOF'
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1"
>

<meta
  name="description"
  content="StudyFlow is an AI-powered student workspace for classes, assignments, notes, grades, flashcards, study planning and more."
>

<meta
  name="theme-color"
  content="#635bff"
>

<title>
StudyFlow — Your AI Student Workspace
</title>

<link
  rel="icon"
  href="/studyflow-icon.svg"
>

<link
  rel="stylesheet"
  href="/landing.css"
>

</head>


<body>


<!-- =====================================================
     NAVBAR
===================================================== -->

<nav class="site-nav">

<div class="container nav-inner">


<a
  href="/"
  class="brand"
>

  <div class="brand-logo">
    🎓
  </div>

  <span>
    StudyFlow
  </span>

</a>


<div
  id="navLinks"
  class="nav-links"
>

  <a href="#features">
    Features
  </a>

  <a href="#ai">
    AI Tools
  </a>

  <a href="#how">
    How it works
  </a>

  <a href="#pricing">
    Pricing
  </a>

  <a href="#faq">
    FAQ
  </a>

</div>


<div class="nav-actions">

  <a
    class="nav-login"
    href="/app"
  >
    Log in
  </a>

  <a
    class="button primary small"
    href="/app"
  >
    Get Started
  </a>

  <button
    id="mobileMenu"
    class="mobile-menu"
    aria-label="Open menu"
  >
    ☰
  </button>

</div>

</div>

</nav>



<!-- =====================================================
     HERO
===================================================== -->

<header class="hero">

<div class="hero-glow glow-one"></div>
<div class="hero-glow glow-two"></div>


<div class="container hero-grid">


<div class="hero-copy">


<div class="hero-pill">

  <span>✨</span>

  AI-powered student workspace

</div>


<h1>

  Your whole college life.

  <span>
    One smart workspace.
  </span>

</h1>


<p class="hero-description">

StudyFlow brings your assignments, grades,
notes, study plans, flashcards, AI tools and
degree planning into one place.

</p>


<div class="hero-buttons">

  <a
    href="/app"
    class="button primary hero-button"
  >
    Start Studying Free →
  </a>

  <a
    href="#features"
    class="button secondary hero-button"
  >
    Explore Features
  </a>

</div>


<div class="hero-proof">

  <div>

    <strong>
      20+
    </strong>

    <span>
      Study tools
    </span>

  </div>


  <div>

    <strong>
      AI
    </strong>

    <span>
      Built in
    </span>

  </div>


  <div>

    <strong>
      ☁️
    </strong>

    <span>
      Cloud sync
    </span>

  </div>

</div>

</div>



<!-- APP PREVIEW -->

<div class="app-preview">

<div class="browser-window">


<div class="browser-bar">

  <div class="browser-dots">

    <span></span>
    <span></span>
    <span></span>

  </div>


  <div class="browser-address">

    studyflow.app/app

  </div>

</div>


<div class="preview-app">


<div class="preview-sidebar">

  <div class="preview-logo">
    🎓
  </div>

  <div class="preview-nav active">
    🏠
  </div>

  <div class="preview-nav">
    ✅
  </div>

  <div class="preview-nav">
    📅
  </div>

  <div class="preview-nav">
    🧠
  </div>

  <div class="preview-nav">
    📊
  </div>

  <div class="preview-nav">
    ✨
  </div>

  <div class="preview-nav">
    ☁️
  </div>

</div>


<div class="preview-main">


<div class="preview-header">

  <div>

    <small>
      GOOD AFTERNOON
    </small>

    <h3>
      Ready to study?
    </h3>

  </div>


  <div class="preview-avatar">
    S
  </div>

</div>



<div class="preview-stats">


<div>

  <span>
    📚
  </span>

  <strong>
    5
  </strong>

  <small>
    Classes
  </small>

</div>


<div>

  <span>
    ✅
  </span>

  <strong>
    8
  </strong>

  <small>
    Open tasks
  </small>

</div>


<div>

  <span>
    🔥
  </span>

  <strong>
    7
  </strong>

  <small>
    Day streak
  </small>

</div>

</div>



<div class="preview-columns">


<div class="preview-panel">

<div class="preview-panel-head">

  <strong>
    Upcoming
  </strong>

  <span>
    View all
  </span>

</div>


<div class="preview-task">

  <div class="priority-dot red"></div>

  <div>

    <strong>
      Calculus Homework
    </strong>

    <small>
      Due tomorrow
    </small>

  </div>

</div>


<div class="preview-task">

  <div class="priority-dot orange"></div>

  <div>

    <strong>
      Chemistry Quiz
    </strong>

    <small>
      Friday
    </small>

  </div>

</div>


<div class="preview-task">

  <div class="priority-dot green"></div>

  <div>

    <strong>
      Research Draft
    </strong>

    <small>
      Next week
    </small>

  </div>

</div>

</div>



<div class="preview-ai">

  <div class="ai-icon">
    ✨
  </div>

  <small>
    STUDYFLOW AI
  </small>

  <strong>
    What should I study today?
  </strong>

  <p>
    Focus on Calculus first, then review Chemistry for 45 minutes.
  </p>

  <div class="fake-button">
    Open AI Tutor
  </div>

</div>


</div>

</div>

</div>

</div>

</div>

</div>

</header>



<!-- =====================================================
     LOGOS / STRIP
===================================================== -->

<section class="student-strip">

<div class="container">

<p>
Built for the way college students actually study
</p>

<div class="strip-items">

  <span>
    📚 Classes
  </span>

  <span>
    ✅ Assignments
  </span>

  <span>
    🧠 AI Study
  </span>

  <span>
    🎓 Degree Planning
  </span>

  <span>
    📊 Grades
  </span>

  <span>
    ☁️ Sync
  </span>

</div>

</div>

</section>



<!-- =====================================================
     FEATURES
===================================================== -->

<section
  id="features"
  class="section"
>

<div class="container">


<div class="section-heading">

  <p class="eyebrow">
    EVERYTHING YOU NEED
  </p>

  <h2>
    One app instead of ten.
  </h2>

  <p>
    Stop jumping between planners, notes,
    calculators, flashcards and AI chats.
  </p>

</div>



<div class="feature-grid">


<div class="feature-card featured">

  <div class="feature-icon">
    ✅
  </div>

  <h3>
    Smart Task Manager
  </h3>

  <p>
    Organize assignments by class, deadline,
    priority and progress.
  </p>

</div>


<div class="feature-card">

  <div class="feature-icon">
    📅
  </div>

  <h3>
    Calendar
  </h3>

  <p>
    See every upcoming deadline in a clean
    monthly and weekly view.
  </p>

</div>


<div class="feature-card">

  <div class="feature-icon">
    🎯
  </div>

  <h3>
    Grade Predictor
  </h3>

  <p>
    Calculate what you need on your next exam
    or final to reach your target grade.
  </p>

</div>


<div class="feature-card">

  <div class="feature-icon">
    🎓
  </div>

  <h3>
    Degree Planner
  </h3>

  <p>
    Track completed credits and plan future
    semesters toward graduation.
  </p>

</div>


<div class="feature-card">

  <div class="feature-icon">
    🙋
  </div>

  <h3>
    Attendance
  </h3>

  <p>
    Track absences and see when you're getting
    close to a course limit.
  </p>

</div>


<div class="feature-card">

  <div class="feature-icon">
    ⏱️
  </div>

  <h3>
    Focus Timer
  </h3>

  <p>
    Study in focused sessions and track your
    learning time.
  </p>

</div>


<div class="feature-card">

  <div class="feature-icon">
    📈
  </div>

  <h3>
    Study Analytics
  </h3>

  <p>
    Understand task completion, course workload,
    focus time and XP.
  </p>

</div>


<div class="feature-card">

  <div class="feature-icon">
    ☁️
  </div>

  <h3>
    Cloud Sync
  </h3>

  <p>
    Keep your StudyFlow workspace synchronized
    across devices.
  </p>

</div>


<div class="feature-card">

  <div class="feature-icon">
    📄
  </div>

  <h3>
    Syllabus Scanner
  </h3>

  <p>
    Upload a syllabus and turn important dates
    into organized tasks.
  </p>

</div>

</div>

</div>

</section>



<!-- =====================================================
     AI
===================================================== -->

<section
  id="ai"
  class="section ai-section"
>

<div class="container ai-layout">


<div class="ai-copy">

<p class="eyebrow">
STUDYFLOW AI
</p>


<h2>
AI that actually helps you study.
</h2>


<p class="ai-description">

StudyFlow combines your study tools with AI
so you can understand material, prepare for tests,
and organize your work faster.

</p>


<div class="ai-feature-list">


<div>

  <span>
    🧪
  </span>

  <div>

    <strong>
      Practice Tests
    </strong>

    <p>
      Generate multiple-choice tests from your notes.
    </p>

  </div>

</div>


<div>

  <span>
    🧠
  </span>

  <div>

    <strong>
      Explain This
    </strong>

    <p>
      Turn difficult concepts into clear explanations.
    </p>

  </div>

</div>


<div>

  <span>
    🗂️
  </span>

  <div>

    <strong>
      AI Flashcards
    </strong>

    <p>
      Convert study material into flashcards instantly.
    </p>

  </div>

</div>


<div>

  <span>
    📚
  </span>

  <div>

    <strong>
      Study Guides
    </strong>

    <p>
      Build organized exam-review material.
    </p>

  </div>

</div>


<div>

  <span>
    📄
  </span>

  <div>

    <strong>
      PDF Summaries
    </strong>

    <p>
      Turn lecture PDFs into useful study notes.
    </p>

  </div>

</div>


<div>

  <span>
    🎓
  </span>

  <div>

    <strong>
      Course Assistant
    </strong>

    <p>
      Ask AI questions using your course context.
    </p>

  </div>

</div>


</div>

</div>



<div class="ai-demo">

<div class="ai-demo-top">

  <span>
    ✨ StudyFlow AI
  </span>

  <span class="online-dot">
    ● Online
  </span>

</div>


<div class="chat-bubble student">

I have a calculus exam Friday.
What should I study first?

</div>


<div class="chat-bubble assistant">

Based on your upcoming tasks, start with:

<br><br>

<strong>
1. Inverse functions
</strong>

<br>

Review domain/range and practice 4 problems.

<br><br>

<strong>
2. Function transformations
</strong>

<br>

Spend about 30 minutes reviewing graph shifts.

<br><br>

<strong>
3. Practice test
</strong>

<br>

Finish with a 10-question practice test.

</div>


<div class="ai-input-demo">

<span>
Ask StudyFlow AI...
</span>

<button>
↑
</button>

</div>

</div>


</div>

</section>



<!-- =====================================================
     HOW IT WORKS
===================================================== -->

<section
  id="how"
  class="section"
>

<div class="container">


<div class="section-heading">

<p class="eyebrow">
GET STARTED
</p>

<h2>
Set up in minutes.
</h2>

</div>


<div class="steps">


<div class="step">

<div class="step-number">
1
</div>

<h3>
Create your account
</h3>

<p>
Set your university, major and semester.
</p>

</div>


<div class="step-line"></div>


<div class="step">

<div class="step-number">
2
</div>

<h3>
Add your classes
</h3>

<p>
Upload a syllabus or enter your classes manually.
</p>

</div>


<div class="step-line"></div>


<div class="step">

<div class="step-number">
3
</div>

<h3>
Let StudyFlow organize it
</h3>

<p>
Track deadlines, grades and study progress in one place.
</p>

</div>


<div class="step-line"></div>


<div class="step">

<div class="step-number">
4
</div>

<h3>
Study smarter
</h3>

<p>
Use AI tools, flashcards and practice tests when you need them.
</p>

</div>


</div>

</div>

</section>



<!-- =====================================================
     PRICING
===================================================== -->

<section
  id="pricing"
  class="section pricing-section"
>

<div class="container">


<div class="section-heading">

<p class="eyebrow">
PRICING
</p>

<h2>
Start free.
</h2>

<p>
StudyFlow is currently being built and tested.
</p>

</div>


<div class="pricing-grid">


<div class="price-card">

<p class="price-name">
FREE
</p>

<h3>
$0
<span>
/ month
</span>
</h3>


<p class="price-description">
Everything you need to organize college.
</p>


<ul>

<li>
✓ Classes & tasks
</li>

<li>
✓ Calendar
</li>

<li>
✓ Notes
</li>

<li>
✓ Grades
</li>

<li>
✓ Focus timer
</li>

<li>
✓ Degree planner
</li>

<li>
✓ Attendance
</li>

</ul>


<a
  href="/app"
  class="button secondary full"
>
Get Started
</a>

</div>



<div class="price-card pro">

<div class="popular-badge">
COMING LATER
</div>

<p class="price-name">
PRO
</p>

<h3>
$—
<span>
/ month
</span>
</h3>


<p class="price-description">
More AI, automation and advanced study tools.
</p>


<ul>

<li>
✓ Everything in Free
</li>

<li>
✓ Advanced AI tools
</li>

<li>
✓ More AI document analysis
</li>

<li>
✓ Advanced analytics
</li>

<li>
✓ Enhanced cloud features
</li>

<li>
✓ Future premium tools
</li>

</ul>


<button
  class="button primary full"
  onclick="showComingSoon()"
>
Coming Soon
</button>

</div>


</div>

</div>

</section>



<!-- =====================================================
     FAQ
===================================================== -->

<section
  id="faq"
  class="section"
>

<div class="container faq-container">


<div class="section-heading">

<p class="eyebrow">
FAQ
</p>

<h2>
Questions?
</h2>

</div>


<div class="faq-list">


<details>

<summary>
What is StudyFlow?
</summary>

<p>
StudyFlow is a student workspace that combines
planning, grades, notes, study tools and AI in one app.
</p>

</details>


<details>

<summary>
Is StudyFlow free?
</summary>

<p>
The current StudyFlow version can be used for free.
Future premium features may be offered separately.
</p>

</details>


<details>

<summary>
Can StudyFlow analyze my syllabus?
</summary>

<p>
StudyFlow includes a syllabus tool designed to identify
important course information and deadlines from uploaded PDFs.
</p>

</details>


<details>

<summary>
Does StudyFlow sync between devices?
</summary>

<p>
StudyFlow includes cloud synchronization when cloud sync
is enabled for the account and server.
</p>

</details>


<details>

<summary>
Can AI do my homework for me?
</summary>

<p>
StudyFlow AI is designed primarily to help students
understand concepts, practice and organize their studying.
</p>

</details>


<details>

<summary>
Can I install StudyFlow like an app?
</summary>

<p>
Supported browsers can install StudyFlow as a Progressive
Web App, and mobile users can add it to their home screen.
</p>

</details>


</div>

</div>

</section>



<!-- =====================================================
     CTA
===================================================== -->

<section class="final-cta">

<div class="final-glow"></div>


<div class="container final-cta-inner">

<p class="eyebrow light">
READY TO STUDY SMARTER?
</p>

<h2>
Put your semester under control.
</h2>

<p>
Your assignments, grades, notes, AI and study plans —
all in StudyFlow.
</p>

<a
  href="/app"
  class="button white hero-button"
>
Open StudyFlow →
</a>

</div>

</section>



<!-- =====================================================
     FOOTER
===================================================== -->

<footer>

<div class="container footer-grid">


<div>

<a
  href="/"
  class="brand footer-brand"
>

<div class="brand-logo">
🎓
</div>

<span>
StudyFlow
</span>

</a>

<p class="footer-description">
Your AI-powered student workspace.
</p>

</div>



<div>

<strong>
Product
</strong>

<a href="#features">
Features
</a>

<a href="#pricing">
Pricing
</a>

<a href="/app">
Open App
</a>

</div>



<div>

<strong>
Resources
</strong>

<a href="#faq">
FAQ
</a>

<a href="/privacy">
Privacy
</a>

<a href="/terms">
Terms
</a>

</div>


</div>


<div class="container footer-bottom">

<span>
© 2026 StudyFlow
</span>

<span>
Built for students 🎓
</span>

</div>

</footer>


<script src="/landing.js"></script>

</body>

</html>
EOF


# =========================================================
# LANDING CSS
# =========================================================

cat > public/landing.css <<'EOF'

*{
box-sizing:border-box;
margin:0;
padding:0;
}

html{
scroll-behavior:smooth;
}

:root{
--primary:#635bff;
--primary-dark:#5048e5;
--purple:#a855f7;
--text:#161821;
--muted:#6f7583;
--border:#e7e8ed;
--background:#ffffff;
--soft:#f7f7fb;
}

body{
font-family:
Inter,
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
sans-serif;
color:var(--text);
background:var(--background);
line-height:1.5;
}

a{
color:inherit;
text-decoration:none;
}

button,
input{
font:inherit;
}

button{
cursor:pointer;
}

.container{
width:min(1160px,calc(100% - 40px));
margin:auto;
}


/* NAV */

.site-nav{
height:76px;
display:flex;
align-items:center;
position:sticky;
top:0;
z-index:100;
background:rgba(255,255,255,.88);
backdrop-filter:blur(18px);
border-bottom:1px solid rgba(230,231,236,.75);
}

.nav-inner{
display:flex;
align-items:center;
justify-content:space-between;
}

.brand{
display:flex;
align-items:center;
gap:9px;
font-size:19px;
font-weight:800;
}

.brand-logo{
width:38px;
height:38px;
display:grid;
place-items:center;
background:linear-gradient(135deg,var(--primary),var(--purple));
border-radius:11px;
font-size:20px;
box-shadow:0 8px 20px rgba(99,91,255,.2);
}

.nav-links{
display:flex;
align-items:center;
gap:28px;
font-size:14px;
font-weight:600;
color:#555b68;
}

.nav-links a:hover{
color:var(--primary);
}

.nav-actions{
display:flex;
align-items:center;
gap:15px;
}

.nav-login{
font-size:14px;
font-weight:700;
}

.button{
border:0;
border-radius:11px;
display:inline-flex;
align-items:center;
justify-content:center;
font-weight:750;
transition:.2s;
}

.button:hover{
transform:translateY(-1px);
}

.button.primary{
background:var(--primary);
color:#fff;
box-shadow:0 9px 25px rgba(99,91,255,.2);
}

.button.primary:hover{
background:var(--primary-dark);
}

.button.secondary{
background:#fff;
border:1px solid var(--border);
color:var(--text);
}

.button.white{
background:#fff;
color:var(--primary);
}

.small{
padding:10px 15px;
font-size:13px;
}

.mobile-menu{
display:none;
border:0;
background:transparent;
font-size:24px;
}


/* HERO */

.hero{
position:relative;
overflow:hidden;
padding:100px 0 105px;
background:
linear-gradient(
180deg,
#fff 0%,
#faf9ff 100%
);
}

.hero-glow{
position:absolute;
border-radius:50%;
filter:blur(15px);
pointer-events:none;
}

.glow-one{
width:480px;
height:480px;
background:#635bff16;
left:-160px;
top:-100px;
}

.glow-two{
width:480px;
height:480px;
background:#a855f715;
right:-180px;
bottom:-180px;
}

.hero-grid{
position:relative;
z-index:2;
display:grid;
grid-template-columns:.92fr 1.08fr;
gap:70px;
align-items:center;
}

.hero-pill{
display:inline-flex;
align-items:center;
gap:7px;
padding:7px 12px;
border:1px solid #dedcff;
background:#f7f5ff;
border-radius:30px;
color:#5149df;
font-size:12px;
font-weight:800;
margin-bottom:20px;
}

.hero h1{
font-size:62px;
letter-spacing:-3.4px;
line-height:1.03;
max-width:610px;
}

.hero h1 span{
display:block;
background:
linear-gradient(
90deg,
#635bff,
#a855f7
);
-webkit-background-clip:text;
color:transparent;
}

.hero-description{
font-size:18px;
color:var(--muted);
line-height:1.65;
max-width:575px;
margin-top:23px;
}

.hero-buttons{
display:flex;
gap:11px;
margin-top:29px;
}

.hero-button{
padding:14px 20px;
}

.hero-proof{
display:flex;
gap:34px;
margin-top:38px;
}

.hero-proof div{
display:flex;
flex-direction:column;
}

.hero-proof strong{
font-size:20px;
}

.hero-proof span{
font-size:11px;
color:var(--muted);
margin-top:2px;
}


/* MOCK APP */

.app-preview{
position:relative;
}

.browser-window{
border-radius:21px;
background:#fff;
border:1px solid #e5e6ec;
box-shadow:
0 35px 90px rgba(37,34,83,.16),
0 5px 20px rgba(0,0,0,.05);
overflow:hidden;
transform:rotate(1deg);
}

.browser-bar{
height:43px;
background:#f4f5f7;
border-bottom:1px solid #e7e8ed;
display:flex;
align-items:center;
padding:0 14px;
position:relative;
}

.browser-dots{
display:flex;
gap:5px;
}

.browser-dots span{
width:8px;
height:8px;
border-radius:50%;
}

.browser-dots span:nth-child(1){
background:#ff6058;
}

.browser-dots span:nth-child(2){
background:#ffbd2e;
}

.browser-dots span:nth-child(3){
background:#28c840;
}

.browser-address{
position:absolute;
left:50%;
transform:translateX(-50%);
font-size:9px;
color:#878c97;
background:#fff;
border:1px solid #e6e7ea;
border-radius:5px;
padding:4px 35px;
}

.preview-app{
height:455px;
display:grid;
grid-template-columns:61px 1fr;
background:#f7f8fb;
}

.preview-sidebar{
background:#fff;
border-right:1px solid #ebecef;
padding:12px 9px;
display:flex;
flex-direction:column;
align-items:center;
gap:10px;
}

.preview-logo{
width:37px;
height:37px;
display:grid;
place-items:center;
border-radius:9px;
background:var(--primary);
margin-bottom:8px;
}

.preview-nav{
width:35px;
height:35px;
display:grid;
place-items:center;
border-radius:8px;
font-size:14px;
}

.preview-nav.active{
background:#eeedff;
}

.preview-main{
padding:23px;
overflow:hidden;
}

.preview-header{
display:flex;
align-items:center;
justify-content:space-between;
}

.preview-header small{
font-size:8px;
font-weight:800;
color:var(--primary);
letter-spacing:1px;
}

.preview-header h3{
font-size:18px;
margin-top:2px;
}

.preview-avatar{
width:33px;
height:33px;
border-radius:50%;
display:grid;
place-items:center;
background:#e6e3ff;
color:#554ce6;
font-size:11px;
font-weight:800;
}

.preview-stats{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:9px;
margin-top:17px;
}

.preview-stats>div{
background:#fff;
border:1px solid #ebecf0;
border-radius:11px;
padding:12px;
display:grid;
grid-template-columns:auto 1fr;
grid-template-rows:auto auto;
column-gap:7px;
}

.preview-stats span{
grid-row:1/3;
align-self:center;
}

.preview-stats strong{
font-size:16px;
}

.preview-stats small{
font-size:8px;
color:#8a8f9b;
}

.preview-columns{
display:grid;
grid-template-columns:1.25fr .75fr;
gap:11px;
margin-top:12px;
}

.preview-panel,
.preview-ai{
background:#fff;
border:1px solid #ebecef;
border-radius:12px;
padding:14px;
height:220px;
}

.preview-panel-head{
display:flex;
justify-content:space-between;
align-items:center;
font-size:10px;
margin-bottom:10px;
}

.preview-panel-head span{
font-size:8px;
color:var(--primary);
}

.preview-task{
display:flex;
align-items:center;
gap:8px;
padding:10px 0;
border-bottom:1px solid #f0f1f4;
}

.priority-dot{
width:6px;
height:6px;
border-radius:50%;
}

.priority-dot.red{
background:#ef4444;
}

.priority-dot.orange{
background:#f59e0b;
}

.priority-dot.green{
background:#22c55e;
}

.preview-task>div:last-child{
display:flex;
flex-direction:column;
}

.preview-task strong{
font-size:9px;
}

.preview-task small{
font-size:7px;
color:#8b909c;
margin-top:2px;
}

.preview-ai{
background:
linear-gradient(
145deg,
#635bff,
#895cf7
);
color:#fff;
}

.ai-icon{
font-size:20px;
margin-bottom:8px;
}

.preview-ai>small{
display:block;
font-size:7px;
font-weight:800;
letter-spacing:1px;
opacity:.7;
}

.preview-ai>strong{
display:block;
font-size:12px;
line-height:1.35;
margin-top:5px;
}

.preview-ai p{
font-size:8px;
line-height:1.5;
opacity:.8;
margin-top:9px;
}

.fake-button{
display:inline-block;
font-size:7px;
background:#fff;
color:#635bff;
padding:6px 8px;
border-radius:6px;
font-weight:800;
margin-top:11px;
}


/* STRIP */

.student-strip{
border-top:1px solid var(--border);
border-bottom:1px solid var(--border);
padding:27px 0;
background:#fff;
text-align:center;
}

.student-strip p{
font-size:11px;
font-weight:800;
color:#9a9eaa;
letter-spacing:1.1px;
text-transform:uppercase;
margin-bottom:18px;
}

.strip-items{
display:flex;
justify-content:center;
gap:35px;
flex-wrap:wrap;
font-size:13px;
font-weight:700;
color:#555b67;
}


/* SECTIONS */

.section{
padding:105px 0;
}

.section-heading{
text-align:center;
max-width:680px;
margin:0 auto 52px;
}

.eyebrow{
font-size:11px;
font-weight:900;
color:var(--primary);
letter-spacing:1.4px;
margin-bottom:8px;
}

.eyebrow.light{
color:#d8d5ff;
}

.section-heading h2,
.ai-copy h2,
.final-cta h2{
font-size:44px;
letter-spacing:-2px;
line-height:1.1;
}

.section-heading>p:last-child{
color:var(--muted);
font-size:16px;
margin-top:13px;
line-height:1.6;
}

.feature-grid{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:16px;
}

.feature-card{
border:1px solid var(--border);
border-radius:18px;
padding:24px;
background:#fff;
transition:.2s;
}

.feature-card:hover{
transform:translateY(-4px);
box-shadow:0 20px 50px rgba(30,27,70,.07);
border-color:#cbc8ff;
}

.feature-card.featured{
background:
linear-gradient(
145deg,
#faf9ff,
#fff
);
border-color:#d8d5ff;
}

.feature-icon{
width:45px;
height:45px;
display:grid;
place-items:center;
border-radius:12px;
background:#f0efff;
font-size:22px;
margin-bottom:17px;
}

.feature-card h3{
font-size:17px;
margin-bottom:8px;
}

.feature-card p{
font-size:13px;
line-height:1.6;
color:var(--muted);
}


/* AI SECTION */

.ai-section{
background:#11131a;
color:#fff;
}

.ai-layout{
display:grid;
grid-template-columns:1fr 1fr;
gap:80px;
align-items:center;
}

.ai-copy h2{
max-width:500px;
}

.ai-description{
color:#aeb2bd;
font-size:16px;
line-height:1.65;
margin-top:17px;
max-width:520px;
}

.ai-feature-list{
display:grid;
grid-template-columns:1fr 1fr;
gap:13px;
margin-top:30px;
}

.ai-feature-list>div{
display:flex;
gap:11px;
padding:12px;
border-radius:12px;
background:#181b24;
border:1px solid #262a35;
}

.ai-feature-list>div>span{
font-size:21px;
}

.ai-feature-list strong{
font-size:13px;
}

.ai-feature-list p{
font-size:10px;
color:#959aa6;
margin-top:3px;
line-height:1.4;
}

.ai-demo{
background:#191c25;
border:1px solid #2a2f3a;
border-radius:20px;
padding:20px;
box-shadow:0 30px 70px rgba(0,0,0,.3);
}

.ai-demo-top{
display:flex;
justify-content:space-between;
font-size:11px;
font-weight:800;
padding-bottom:15px;
border-bottom:1px solid #2b2f39;
}

.online-dot{
color:#4ade80;
font-size:9px;
}

.chat-bubble{
padding:13px;
border-radius:12px;
font-size:12px;
line-height:1.55;
margin-top:15px;
max-width:85%;
}

.chat-bubble.student{
background:#635bff;
margin-left:auto;
}

.chat-bubble.assistant{
background:#242833;
color:#d7d9df;
}

.ai-input-demo{
margin-top:18px;
display:flex;
justify-content:space-between;
align-items:center;
background:#11141a;
border:1px solid #303541;
border-radius:11px;
padding:10px 11px;
font-size:10px;
color:#767c88;
}

.ai-input-demo button{
width:29px;
height:29px;
border-radius:8px;
border:0;
background:#635bff;
color:#fff;
}


/* STEPS */

.steps{
display:grid;
grid-template-columns:1fr auto 1fr auto 1fr auto 1fr;
align-items:center;
}

.step{
text-align:center;
}

.step-number{
width:42px;
height:42px;
display:grid;
place-items:center;
border-radius:50%;
background:#eeedff;
color:#635bff;
font-weight:900;
margin:0 auto 14px;
}

.step h3{
font-size:15px;
}

.step p{
font-size:12px;
color:var(--muted);
line-height:1.5;
margin-top:6px;
}

.step-line{
width:55px;
height:1px;
background:#dddfe5;
}


/* PRICING */

.pricing-section{
background:#fafafd;
}

.pricing-grid{
max-width:780px;
margin:auto;
display:grid;
grid-template-columns:1fr 1fr;
gap:18px;
}

.price-card{
position:relative;
padding:32px;
border-radius:20px;
background:#fff;
border:1px solid var(--border);
}

.price-card.pro{
border:2px solid var(--primary);
box-shadow:0 25px 60px rgba(99,91,255,.12);
}

.popular-badge{
position:absolute;
right:20px;
top:20px;
font-size:8px;
font-weight:900;
letter-spacing:1px;
color:#635bff;
background:#eeedff;
border-radius:20px;
padding:5px 8px;
}

.price-name{
font-size:11px;
font-weight:900;
color:#737986;
letter-spacing:1px;
}

.price-card h3{
font-size:42px;
margin-top:8px;
}

.price-card h3 span{
font-size:12px;
font-weight:600;
color:var(--muted);
}

.price-description{
font-size:13px;
color:var(--muted);
margin:10px 0 22px;
}

.price-card ul{
list-style:none;
display:grid;
gap:11px;
margin-bottom:28px;
font-size:13px;
}

.full{
width:100%;
padding:12px;
}


/* FAQ */

.faq-container{
max-width:780px;
}

.faq-list{
display:grid;
gap:9px;
}

details{
border:1px solid var(--border);
border-radius:13px;
padding:17px 19px;
background:#fff;
}

summary{
font-weight:750;
font-size:14px;
cursor:pointer;
}

details p{
font-size:13px;
color:var(--muted);
line-height:1.6;
margin-top:12px;
}


/* CTA */

.final-cta{
position:relative;
overflow:hidden;
background:#635bff;
color:#fff;
padding:90px 0;
text-align:center;
}

.final-glow{
position:absolute;
width:600px;
height:600px;
border-radius:50%;
background:#a855f74a;
top:-330px;
left:50%;
transform:translateX(-50%);
filter:blur(25px);
}

.final-cta-inner{
position:relative;
z-index:2;
}

.final-cta h2{
margin-top:5px;
}

.final-cta p:not(.eyebrow){
color:#e0deff;
max-width:550px;
margin:15px auto 25px;
line-height:1.6;
}


/* FOOTER */

footer{
background:#0e1016;
color:#fff;
padding:60px 0 25px;
}

.footer-grid{
display:grid;
grid-template-columns:2fr 1fr 1fr;
gap:50px;
}

.footer-brand{
margin-bottom:13px;
}

.footer-description{
font-size:12px;
color:#858b97;
}

.footer-grid>div:not(:first-child){
display:flex;
flex-direction:column;
align-items:flex-start;
gap:10px;
}

.footer-grid strong{
font-size:12px;
margin-bottom:4px;
}

.footer-grid a:not(.brand){
font-size:12px;
color:#8d929e;
}

.footer-grid a:not(.brand):hover{
color:#fff;
}

.footer-bottom{
display:flex;
justify-content:space-between;
border-top:1px solid #22252d;
margin-top:45px;
padding-top:20px;
font-size:10px;
color:#6d727e;
}


/* RESPONSIVE */

@media(max-width:1000px){

.hero-grid{
grid-template-columns:1fr;
}

.hero-copy{
text-align:center;
}

.hero h1{
margin:auto;
}

.hero-description{
margin-left:auto;
margin-right:auto;
}

.hero-buttons,
.hero-proof{
justify-content:center;
}

.app-preview{
max-width:700px;
margin:auto;
}

.feature-grid{
grid-template-columns:1fr 1fr;
}

.ai-layout{
grid-template-columns:1fr;
}

.steps{
grid-template-columns:1fr 1fr;
gap:30px;
}

.step-line{
display:none;
}

}


@media(max-width:760px){

.container{
width:min(100% - 28px,1160px);
}

.site-nav{
height:68px;
}

.nav-links{
display:none;
position:absolute;
top:68px;
left:14px;
right:14px;
background:#fff;
padding:18px;
border-radius:14px;
box-shadow:0 20px 55px rgba(0,0,0,.15);
flex-direction:column;
align-items:flex-start;
gap:16px;
}

.nav-links.open{
display:flex;
}

.nav-login{
display:none;
}

.mobile-menu{
display:block;
}

.hero{
padding:70px 0;
}

.hero h1{
font-size:44px;
letter-spacing:-2.2px;
}

.hero-description{
font-size:15px;
}

.hero-buttons{
flex-direction:column;
}

.hero-proof{
gap:20px;
}

.browser-window{
transform:none;
}

.preview-app{
height:390px;
}

.preview-main{
padding:15px;
}

.preview-columns{
grid-template-columns:1fr;
}

.preview-ai{
display:none;
}

.feature-grid,
.pricing-grid,
.ai-feature-list{
grid-template-columns:1fr;
}

.section{
padding:75px 0;
}

.section-heading h2,
.ai-copy h2,
.final-cta h2{
font-size:34px;
}

.steps{
grid-template-columns:1fr;
}

.footer-grid{
grid-template-columns:1fr 1fr;
}

.footer-grid>div:first-child{
grid-column:1 / -1;
}

}


@media(max-width:480px){

.hero h1{
font-size:38px;
}

.hero-proof{
font-size:11px;
}

.preview-stats{
grid-template-columns:1fr 1fr 1fr;
}

.preview-stats>div{
display:flex;
flex-direction:column;
align-items:flex-start;
}

.preview-stats span{
margin-bottom:3px;
}

.strip-items{
gap:18px;
}

.footer-grid{
grid-template-columns:1fr;
}

.footer-grid>div:first-child{
grid-column:auto;
}

.footer-bottom{
flex-direction:column;
gap:7px;
}

}
EOF


# =========================================================
# LANDING JS
# =========================================================

cat > public/landing.js <<'EOF'

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

EOF


# =========================================================
# PRIVACY
# =========================================================

cat > public/privacy.html <<'EOF'
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
>

<title>
Privacy Policy — StudyFlow
</title>

<link
  rel="stylesheet"
  href="/legal.css"
>

</head>


<body>

<header class="legal-nav">

<a href="/">
🎓 StudyFlow
</a>

<a href="/app">
Open App
</a>

</header>


<main>

<p class="eyebrow">
LEGAL
</p>

<h1>
Privacy Policy
</h1>

<p class="updated">
Last updated: September 23, 2026
</p>


<section>

<h2>
1. Overview
</h2>

<p>
StudyFlow is a student productivity application
designed to help users organize classes, assignments,
notes, grades and study activities.
</p>

</section>


<section>

<h2>
2. Information you provide
</h2>

<p>
Depending on the features you use, StudyFlow may
process information such as your account information,
classes, assignments, notes, grades, uploaded documents
and study preferences.
</p>

</section>


<section>

<h2>
3. Local and cloud storage
</h2>

<p>
Some StudyFlow information may be stored locally
in your browser. If cloud synchronization is enabled,
supported StudyFlow data may also be stored in the
configured cloud database.
</p>

</section>


<section>

<h2>
4. AI features
</h2>

<p>
When you use AI-powered features, the content you submit
to those features may be sent to the configured AI service
for processing in order to generate a response.
</p>

</section>


<section>

<h2>
5. Uploaded documents
</h2>

<p>
Documents uploaded for AI analysis may be processed
by the configured AI service to provide requested
summaries, study material or other educational output.
</p>

</section>


<section>

<h2>
6. Security
</h2>

<p>
StudyFlow uses reasonable technical measures to protect
application data. No online system can guarantee absolute
security.
</p>

</section>


<section>

<h2>
7. Changes
</h2>

<p>
This policy may be updated as StudyFlow develops and new
features or services are introduced.
</p>

</section>


<p class="notice">

This page is an initial product policy draft and should
be reviewed before commercial public launch.

</p>

</main>

</body>

</html>
EOF


# =========================================================
# TERMS
# =========================================================

cat > public/terms.html <<'EOF'
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
>

<title>
Terms of Use — StudyFlow
</title>

<link
  rel="stylesheet"
  href="/legal.css"
>

</head>


<body>

<header class="legal-nav">

<a href="/">
🎓 StudyFlow
</a>

<a href="/app">
Open App
</a>

</header>


<main>

<p class="eyebrow">
LEGAL
</p>

<h1>
Terms of Use
</h1>

<p class="updated">
Last updated: September 23, 2026
</p>


<section>

<h2>
1. StudyFlow
</h2>

<p>
StudyFlow provides educational productivity tools
including planning, note-taking, grade tracking and
AI-assisted study functionality.
</p>

</section>


<section>

<h2>
2. Educational use
</h2>

<p>
StudyFlow is intended to support learning and organization.
Users remain responsible for following the academic
integrity rules of their school, instructor and course.
</p>

</section>


<section>

<h2>
3. AI output
</h2>

<p>
AI-generated information may contain mistakes.
Users should verify important information, calculations,
citations and academic content before relying on it.
</p>

</section>


<section>

<h2>
4. User content
</h2>

<p>
Users are responsible for the content they upload or enter
into StudyFlow and for ensuring they have permission to use it.
</p>

</section>


<section>

<h2>
5. Availability
</h2>

<p>
StudyFlow features may change, be improved or temporarily
become unavailable as the application develops.
</p>

</section>


<section>

<h2>
6. Account security
</h2>

<p>
Users are responsible for protecting their login information
and maintaining appropriate security for their account.
</p>

</section>


<section>

<h2>
7. Changes to these terms
</h2>

<p>
These terms may be updated as StudyFlow evolves.
</p>

</section>


<p class="notice">

This page is an initial product terms draft and should
be reviewed before commercial public launch.

</p>

</main>

</body>

</html>
EOF


# =========================================================
# LEGAL CSS
# =========================================================

cat > public/legal.css <<'EOF'

*{
box-sizing:border-box;
}

body{
margin:0;
font-family:
Inter,
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
sans-serif;
background:#f8f9fb;
color:#181a22;
}

.legal-nav{
height:70px;
background:#fff;
border-bottom:1px solid #e8e9ed;
display:flex;
align-items:center;
justify-content:space-between;
padding:0 max(25px,calc((100% - 850px)/2));
}

.legal-nav a{
text-decoration:none;
color:#181a22;
font-weight:800;
}

.legal-nav a:last-child{
font-size:13px;
color:#635bff;
}

main{
max-width:850px;
margin:65px auto;
padding:0 25px;
}

.eyebrow{
font-size:11px;
font-weight:900;
color:#635bff;
letter-spacing:1.5px;
}

h1{
font-size:44px;
letter-spacing:-2px;
margin:7px 0;
}

.updated{
font-size:12px;
color:#878c98;
margin-bottom:45px;
}

section{
background:#fff;
border:1px solid #e7e8ed;
border-radius:14px;
padding:22px;
margin-bottom:12px;
}

h2{
font-size:17px;
margin-top:0;
}

section p{
font-size:14px;
line-height:1.7;
color:#626874;
margin-bottom:0;
}

.notice{
margin-top:30px;
padding:15px;
border-radius:10px;
background:#fff8dd;
color:#776100;
font-size:12px;
line-height:1.5;
}

EOF


# =========================================================
# 404
# =========================================================

cat > public/404.html <<'EOF'
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
>

<title>
Page Not Found — StudyFlow
</title>

<style>

body{
margin:0;
min-height:100vh;
display:grid;
place-items:center;
background:#f7f7fb;
font-family:
Inter,
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
sans-serif;
text-align:center;
color:#181a22;
}

main{
padding:25px;
}

.icon{
font-size:70px;
}

h1{
font-size:80px;
margin:0;
letter-spacing:-5px;
color:#635bff;
}

h2{
font-size:25px;
margin:0 0 8px;
}

p{
color:#727784;
}

a{
display:inline-block;
margin-top:17px;
padding:12px 17px;
background:#635bff;
color:#fff;
border-radius:10px;
text-decoration:none;
font-weight:700;
}

</style>

</head>


<body>

<main>

<div class="icon">
🎓
</div>

<h1>
404
</h1>

<h2>
That page isn't here.
</h2>

<p>
Let's get you back to StudyFlow.
</p>

<a href="/">
Back Home
</a>

</main>

</body>

</html>
EOF


# =========================================================
# PATCH MANIFEST
# =========================================================

python3 <<'PY'

import json

from pathlib import Path


p = Path(
    "public/manifest.webmanifest"
)


if p.exists():

    try:

        data = json.loads(
            p.read_text()
        )

        data["start_url"] = "/app"

        data["scope"] = "/"

        data["name"] = "StudyFlow"

        data["short_name"] = "StudyFlow"

        p.write_text(
            json.dumps(
                data,
                indent=2
            )
        )

        print(
            "✅ PWA manifest updated"
        )

    except Exception as error:

        print(
            "⚠ Could not patch manifest:",
            error
        )

PY


# =========================================================
# PATCH SERVER ROUTES
# =========================================================

python3 <<'PY'

from pathlib import Path


p = Path("server.js")

s = p.read_text()


routes = r'''

/* ========================================================
   STUDYFLOW PUBLIC ROUTES
======================================================== */

app.get("/", (req, res) => {

  res.sendFile(
    "landing.html",
    {
      root: "public"
    }
  );

});


app.get("/app", (req, res) => {

  res.sendFile(
    "index.html",
    {
      root: "public"
    }
  );

});


app.get("/privacy", (req, res) => {

  res.sendFile(
    "privacy.html",
    {
      root: "public"
    }
  );

});


app.get("/terms", (req, res) => {

  res.sendFile(
    "terms.html",
    {
      root: "public"
    }
  );

});

'''


marker = (
    'app.use(express.static("public"));'
)


if "STUDYFLOW PUBLIC ROUTES" not in s:

    if marker in s:

        s = s.replace(
            marker,
            routes +
            "\n" +
            marker
        )

    else:

        print(
            "⚠ express.static marker not found"
        )


# 404 AFTER static, BEFORE listen

not_found = r'''

/* ========================================================
   404
======================================================== */

app.use((req, res, next) => {

  if(
    req.path.startsWith("/api/")
  ){

    return next();

  }


  res
  .status(404)
  .sendFile(
    "404.html",
    {
      root: "public"
    }
  );

});

'''


listen_marker = (
    "app.listen(PORT"
)


if (
    "res\n  .status(404)" not in s
    and listen_marker in s
):

    pos = s.find(
        listen_marker
    )

    s = (
        s[:pos]
        +
        not_found
        +
        s[pos:]
    )


p.write_text(s)

print(
    "✅ Server launch routes installed"
)

PY


# =========================================================
# PATCH PWA LINK INSIDE APP
# =========================================================

python3 <<'PY'

from pathlib import Path


p = Path(
    "public/index.html"
)


html = p.read_text()


if '<base href="/">' not in html:

    if "<head>" in html:

        html = html.replace(
            "<head>",
            '''<head>
<base href="/">''',
            1
        )


p.write_text(html)

print(
    "✅ StudyFlow app prepared for /app route"
)

PY


# =========================================================
# DOCKERFILE
# =========================================================

cat > Dockerfile <<'EOF'

FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm","start"]

EOF


# =========================================================
# DOCKERIGNORE
# =========================================================

cat > .dockerignore <<'EOF'

node_modules
npm-debug.log
.env
backup-part*
.git
.DS_Store

EOF


# =========================================================
# DEPLOY README
# =========================================================

cat > DEPLOY.md <<'EOF'

# StudyFlow Deployment

StudyFlow now has:

- `/` public landing page
- `/app` StudyFlow application
- `/privacy`
- `/terms`
- `/api/health`
- Supabase Cloud Sync
- PWA support
- Docker support

## Required production environment variables

SESSION_SECRET=
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_SECRET_KEY=

Never commit `.env`.

## Before public launch

1. Rotate any API keys that were ever exposed.
2. Use a long random production SESSION_SECRET.
3. Configure HTTPS.
4. Use a persistent production session store.
5. Add rate limiting.
6. Review Privacy Policy and Terms.
7. Configure a real domain.
8. Test account creation, AI, cloud sync and password handling.

EOF


# =========================================================
# PACKAGE / APP CHECKS
# =========================================================

echo ""
echo "🧪 Running checks..."
echo ""


node --check server.js

echo "✅ server.js syntax OK"


node --check public/app.js

echo "✅ app.js syntax OK"


node --check public/landing.js

echo "✅ landing.js syntax OK"


echo ""
echo "========================================"
echo "🎉 PART 5 LAUNCH VERSION INSTALLED"
echo "========================================"
echo ""

echo "Routes:"
echo ""
echo "🏠 Landing:"
echo "   http://localhost:3000/"
echo ""
echo "🎓 StudyFlow App:"
echo "   http://localhost:3000/app"
echo ""
echo "🔐 Privacy:"
echo "   http://localhost:3000/privacy"
echo ""
echo "📄 Terms:"
echo "   http://localhost:3000/terms"
echo ""
echo "Added:"
echo "• Professional landing page"
echo "• Features section"
echo "• AI product section"
echo "• Pricing section"
echo "• FAQ"
echo "• Privacy Policy"
echo "• Terms"
echo "• Custom 404 page"
echo "• Mobile landing page"
echo "• /app route"
echo "• PWA start route updated"
echo "• Dockerfile"
echo "• Deploy guide"
echo ""
echo "🚀 Starting StudyFlow..."
echo ""

npm start

