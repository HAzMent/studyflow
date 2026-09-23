#!/bin/bash

set -e

echo ""
echo "☁️ StudyFlow — PART 4 Cloud Sync"
echo "================================"
echo ""

# =========================================================
# BACKUP
# =========================================================

BACKUP="backup-part4-$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP"

cp -R public "$BACKUP/public" 2>/dev/null || true
cp server.js "$BACKUP/server.js" 2>/dev/null || true
cp package.json "$BACKUP/package.json" 2>/dev/null || true
cp .env "$BACKUP/.env" 2>/dev/null || true

echo "✅ Backup created: $BACKUP"


# =========================================================
# INSTALL SUPABASE
# =========================================================

echo "📦 Installing Supabase..."

npm install @supabase/supabase-js@latest


# =========================================================
# SUPABASE SQL SCHEMA
# =========================================================

cat > supabase-schema.sql <<'EOF'

-- ========================================================
-- StudyFlow Cloud Database
-- Run this inside Supabase SQL Editor
-- ========================================================

create table if not exists public.studyflow_snapshots (

  user_key text primary key,

  data jsonb not null
    default '{}'::jsonb,

  updated_at timestamptz not null
    default now()

);


-- Turn on RLS.
-- StudyFlow accesses this table ONLY through our backend
-- using the server-side Supabase secret key.

alter table public.studyflow_snapshots
enable row level security;


-- Helpful index

create index if not exists
studyflow_snapshots_updated_at_idx

on public.studyflow_snapshots(updated_at);


EOF


# =========================================================
# CLOUD ROUTER
# =========================================================

cat > cloud-routes.js <<'EOF'

import express from "express";

import {
  createClient
} from "@supabase/supabase-js";


const router =
  express.Router();


function getSupabase(){

  const url =
    process.env.SUPABASE_URL;


  const secret =
    process.env.SUPABASE_SECRET_KEY
    ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;


  if(
    !url ||
    !secret
  ){

    return null;

  }


  return createClient(
    url,
    secret,
    {

      auth:{

        persistSession:false,

        autoRefreshToken:false,

        detectSessionInUrl:false

      }

    }
  );

}


function requireStudyFlowUser(
  req,
  res
){

  if(
    !req.session ||
    !req.session.userId
  ){

    res
    .status(401)
    .json({

      error:
        "Login required."

    });


    return false;

  }


  return true;

}


/* ========================================================
   STATUS
======================================================== */

router.get(
  "/status",

  async (req,res) => {

    if(
      !requireStudyFlowUser(
        req,
        res
      )
    ){

      return;

    }


    const supabase =
      getSupabase();


    if(!supabase){

      return res.json({

        configured:false,

        connected:false,

        message:
          "Supabase is not configured yet."

      });

    }


    try{

      const {
        data,
        error
      } =
        await supabase

        .from(
          "studyflow_snapshots"
        )

        .select(
          "updated_at"
        )

        .eq(
          "user_key",
          String(
            req.session.userId
          )
        )

        .maybeSingle();


      if(error){

        return res.json({

          configured:true,

          connected:false,

          setupRequired:true,

          message:
            error.message

        });

      }


      return res.json({

        configured:true,

        connected:true,

        exists:!!data,

        updatedAt:
          data?.updated_at || null

      });


    }catch(error){

      console.error(
        "Cloud status:",
        error
      );


      return res
      .status(500)
      .json({

        configured:true,

        connected:false,

        error:
          error.message

      });

    }

  }
);


/* ========================================================
   PUSH
======================================================== */

router.post(
  "/push",

  async (req,res) => {

    if(
      !requireStudyFlowUser(
        req,
        res
      )
    ){

      return;

    }


    const supabase =
      getSupabase();


    if(!supabase){

      return res
      .status(503)
      .json({

        error:
          "Cloud Sync is not configured."

      });

    }


    const snapshot =
      req.body?.snapshot;


    if(
      !snapshot ||
      typeof snapshot !== "object"
    ){

      return res
      .status(400)
      .json({

        error:
          "Invalid cloud snapshot."

      });

    }


    try{

      const now =
        new Date()
        .toISOString();


      const {
        data,
        error
      } =
        await supabase

        .from(
          "studyflow_snapshots"
        )

        .upsert(
          {

            user_key:
              String(
                req.session.userId
              ),

            data:
              snapshot,

            updated_at:
              now

          },

          {

            onConflict:
              "user_key"

          }

        )

        .select(
          "updated_at"
        )

        .single();


      if(error){

        throw error;

      }


      res.json({

        success:true,

        updatedAt:
          data.updated_at

      });


    }catch(error){

      console.error(
        "Cloud push:",
        error
      );


      res
      .status(500)
      .json({

        error:
          error.message ||
          "Cloud upload failed."

      });

    }

  }
);


/* ========================================================
   PULL
======================================================== */

router.get(
  "/pull",

  async (req,res) => {

    if(
      !requireStudyFlowUser(
        req,
        res
      )
    ){

      return;

    }


    const supabase =
      getSupabase();


    if(!supabase){

      return res
      .status(503)
      .json({

        error:
          "Cloud Sync is not configured."

      });

    }


    try{

      const {
        data,
        error
      } =
        await supabase

        .from(
          "studyflow_snapshots"
        )

        .select(
          "data,updated_at"
        )

        .eq(
          "user_key",
          String(
            req.session.userId
          )
        )

        .maybeSingle();


      if(error){

        throw error;

      }


      if(!data){

        return res.json({

          exists:false

        });

      }


      res.json({

        exists:true,

        snapshot:
          data.data,

        updatedAt:
          data.updated_at

      });


    }catch(error){

      console.error(
        "Cloud pull:",
        error
      );


      res
      .status(500)
      .json({

        error:
          error.message ||
          "Cloud download failed."

      });

    }

  }
);


export default router;

EOF


# =========================================================
# PATCH SERVER
# =========================================================

python3 <<'PY'

from pathlib import Path

p = Path("server.js")

s = p.read_text()


# Dynamic deployment PORT

s = s.replace(
    "const PORT = 3000;",
    'const PORT = Number(process.env.PORT) || 3000;'
)


# Cloud router import

if 'from "./cloud-routes.js"' not in s:

    lines = s.splitlines()

    last_import = 0

    for i,line in enumerate(lines):

        if line.startswith("import "):
            last_import = i

    lines.insert(
        last_import + 1,
        'import cloudRouter from "./cloud-routes.js";'
    )

    s = "\n".join(lines)


# Trust reverse proxy in deployed environments

if 'app.set("trust proxy"' not in s:

    s = s.replace(
        "const app = express();",
        '''const app = express();

app.set("trust proxy", 1);'''
    )


# Cloud routes need to be AFTER sessions

if 'app.use("/api/cloud", cloudRouter);' not in s:

    s = s.replace(
        'app.use(express.static("public"));',
        '''app.use("/api/cloud", cloudRouter);

app.get("/api/health", (req, res) => {

  res.json({
    ok: true,
    app: "StudyFlow",
    time: new Date().toISOString()
  });

});

app.use(express.static("public"));'''
    )


p.write_text(s)

print("✅ server.js patched")

PY


# =========================================================
# ENV VARIABLES
# =========================================================

touch .env

if ! grep -q "^SUPABASE_URL=" .env
then

cat >> .env <<'EOF'

# StudyFlow Cloud Sync
SUPABASE_URL=
EOF

fi


if ! grep -q "^SUPABASE_SECRET_KEY=" .env
then

cat >> .env <<'EOF'
SUPABASE_SECRET_KEY=
EOF

fi


# =========================================================
# GITIGNORE
# =========================================================

touch .gitignore

for ENTRY in ".env" "node_modules/" "backup-part*/" ".DS_Store"
do

  grep -qxF "$ENTRY" .gitignore \
  || echo "$ENTRY" >> .gitignore

done


# =========================================================
# DEPLOY SUPPORT
# =========================================================

cat > Procfile <<'EOF'
web: npm start
EOF


cat > CLOUD-SETUP.md <<'EOF'
# StudyFlow Cloud Sync

## 1. Create a Supabase project

Create a new Supabase project.

## 2. Run the SQL

Open the Supabase SQL Editor.

Copy everything from:

supabase-schema.sql

and run it.

## 3. Get credentials

In Supabase Project Settings / API Keys find:

- Project URL
- Secret key (sb_secret_...)

## 4. Add them to .env

SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=sb_secret_YOUR_SECRET

IMPORTANT:
Never put the Supabase secret key in public/app.js.
Never commit .env to GitHub.

## 5. Restart StudyFlow

npm start

Then open:

http://localhost:3000

Go to:

Cloud Sync

and press:

Push to Cloud

EOF


# =========================================================
# PATCH INDEX.HTML
# =========================================================

python3 <<'PY'

from pathlib import Path

p = Path("public/index.html")

html = p.read_text()


# =========================================================
# NAVIGATION
# =========================================================

if 'data-page="cloudSync"' not in html:

    anchor = (
        '<button class="nav" data-page="settings">'
        '⚙️ Settings</button>'
    )


    replacement = '''<button class="nav" data-page="cloudSync">☁️ Cloud Sync</button>
      <button class="nav" data-page="settings">⚙️ Settings</button>'''


    if anchor in html:

        html = html.replace(
            anchor,
            replacement
        )

    else:

        # Fallback if Settings is not present

        nav_end = "</nav>"

        html = html.replace(
            nav_end,
            '''<button class="nav" data-page="cloudSync">☁️ Cloud Sync</button>
</nav>''',
            1
        )


# =========================================================
# CLOUD PAGE
# =========================================================

cloud_page = r'''

<!-- =====================================================
     CLOUD SYNC
===================================================== -->

<section id="cloudSync" class="page">

<div class="page-head">

  <div>

    <p class="eyebrow">
      STUDYFLOW CLOUD
    </p>

    <h1>
      Cloud Sync ☁️
    </h1>

    <p class="muted">
      Keep your StudyFlow workspace available
      across your devices.
    </p>

  </div>


  <div
    id="cloudHeaderStatus"
    class="cloud-pill cloud-pill-offline"
  >

    Checking...

  </div>

</div>


<div class="cloud-layout">


<!-- MAIN CLOUD CARD -->

<div class="panel cloud-main-card">

  <div class="cloud-hero-icon">
    ☁️
  </div>

  <h2 id="cloudMainTitle">
    Checking Cloud Sync...
  </h2>

  <p
    id="cloudMainDescription"
    class="muted"
  >
    Connecting to StudyFlow Cloud.
  </p>


  <div class="cloud-actions">

    <button
      id="cloudPushButton"
      onclick="pushStudyFlowCloud()"
    >
      ↑ Push to Cloud
    </button>


    <button
      id="cloudPullButton"
      class="secondary"
      onclick="pullStudyFlowCloud()"
    >
      ↓ Pull from Cloud
    </button>


    <button
      class="secondary"
      onclick="refreshCloudStatus()"
    >
      ↻ Refresh
    </button>

  </div>


  <label class="cloud-auto-row">

    <div>

      <strong>
        Auto Sync
      </strong>

      <p>
        Automatically upload changes after you edit StudyFlow.
      </p>

    </div>


    <input
      id="cloudAutoSync"
      type="checkbox"
      onchange="toggleCloudAutoSync()"
    >

  </label>


  <div
    id="cloudMessage"
    class="cloud-message hidden"
  ></div>

</div>


<!-- STATUS -->

<div class="panel cloud-info-card">

  <p class="eyebrow">
    STATUS
  </p>


  <div class="cloud-info-row">

    <span>
      Connection
    </span>

    <strong id="cloudConnectionText">
      Checking...
    </strong>

  </div>


  <div class="cloud-info-row">

    <span>
      Cloud backup
    </span>

    <strong id="cloudBackupText">
      —
    </strong>

  </div>


  <div class="cloud-info-row">

    <span>
      Last cloud update
    </span>

    <strong id="cloudUpdatedText">
      —
    </strong>

  </div>


  <div class="cloud-info-row">

    <span>
      Last device sync
    </span>

    <strong id="cloudLastSyncText">
      Never
    </strong>

  </div>

</div>

</div>


<!-- DEVICE DATA -->

<div class="panel cloud-device-data">

  <div class="panel-head">

    <div>

      <p class="eyebrow">
        THIS DEVICE
      </p>

      <h2>
        Data ready to sync
      </h2>

    </div>

  </div>


  <div class="cloud-data-grid">

    <div>

      <strong id="cloudClassesCount">
        0
      </strong>

      <span>
        Classes
      </span>

    </div>


    <div>

      <strong id="cloudTasksCount">
        0
      </strong>

      <span>
        Tasks
      </span>

    </div>


    <div>

      <strong id="cloudNotesCount">
        0
      </strong>

      <span>
        Notes
      </span>

    </div>


    <div>

      <strong id="cloudGradesCount">
        0
      </strong>

      <span>
        Grades
      </span>

    </div>


    <div>

      <strong id="cloudFlashcardsCount">
        0
      </strong>

      <span>
        Flashcard sets
      </span>

    </div>


    <div>

      <strong id="cloudDegreeCount">
        0
      </strong>

      <span>
        Degree courses
      </span>

    </div>

  </div>

</div>


<!-- SETUP -->

<div
  id="cloudSetupHelp"
  class="panel cloud-setup-help hidden"
>

  <p class="eyebrow">
    CLOUD SETUP REQUIRED
  </p>

  <h2>
    Connect Supabase
  </h2>

  <p class="muted">
    StudyFlow is fully functional locally.
    To enable cross-device sync, configure
    Supabase on the server.
  </p>


  <div class="cloud-code">

    <div>
      SUPABASE_URL=...
    </div>

    <div>
      SUPABASE_SECRET_KEY=sb_secret_...
    </div>

  </div>


  <p class="muted">
    The installer created
    <strong>supabase-schema.sql</strong>
    and
    <strong>CLOUD-SETUP.md</strong>
    in your project folder.
  </p>

</div>

</section>
'''


if 'id="cloudSync"' not in html:

    html = html.replace(
        '</main>',
        cloud_page +
        '\n</main>'
    )


p.write_text(html)

print("✅ Cloud Sync page added")

PY


# =========================================================
# CLOUD CSS
# =========================================================

cat >> public/style.css <<'EOF'


/* =========================================================
   PART 4 — CLOUD SYNC
========================================================= */

.cloud-layout{
display:grid;
grid-template-columns:1.4fr .65fr;
gap:20px;
margin-bottom:20px;
}

.cloud-main-card{
min-height:340px;
display:flex;
flex-direction:column;
align-items:flex-start;
}

.cloud-hero-icon{
font-size:55px;
margin-bottom:14px;
}

.cloud-main-card h2{
font-size:25px;
margin-bottom:6px;
}

.cloud-main-card>.muted{
line-height:1.55;
max-width:650px;
}

.cloud-actions{
display:flex;
gap:9px;
flex-wrap:wrap;
margin:25px 0;
}

.cloud-auto-row{
width:100%;
display:flex;
justify-content:space-between;
align-items:center;
gap:20px;
border-top:1px solid var(--border);
padding-top:20px;
}

.cloud-auto-row p{
font-size:12px;
color:var(--muted);
margin-top:3px;
}

.cloud-auto-row input{
width:22px;
height:22px;
accent-color:var(--primary);
}

.cloud-pill{
padding:7px 11px;
font-size:12px;
font-weight:800;
border-radius:30px;
}

.cloud-pill-online{
background:#dcfce7;
color:#15803d;
}

.cloud-pill-offline{
background:#f3f4f6;
color:#6b7280;
}

.cloud-pill-error{
background:#fee2e2;
color:#dc2626;
}

.cloud-info-card{
height:max-content;
}

.cloud-info-row{
display:flex;
justify-content:space-between;
gap:15px;
padding:15px 0;
border-bottom:1px solid var(--border);
font-size:13px;
}

.cloud-info-row:last-child{
border-bottom:0;
}

.cloud-info-row span{
color:var(--muted);
}

.cloud-message{
margin-top:auto;
width:100%;
padding:13px;
border-radius:11px;
background:#f5f3ff;
border:1px solid #ddd9ff;
font-size:13px;
}

.cloud-message.cloud-success{
background:#ecfdf5;
border-color:#bbf7d0;
color:#15803d;
}

.cloud-message.cloud-error{
background:#fff1f2;
border-color:#fecdd3;
color:#be123c;
}

.cloud-device-data{
margin-bottom:20px;
}

.cloud-data-grid{
display:grid;
grid-template-columns:repeat(6,1fr);
gap:12px;
}

.cloud-data-grid>div{
background:var(--bg);
border:1px solid var(--border);
border-radius:13px;
padding:16px;
}

.cloud-data-grid strong{
font-size:28px;
display:block;
}

.cloud-data-grid span{
font-size:12px;
color:var(--muted);
}

.cloud-setup-help{
margin-top:20px;
}

.cloud-setup-help>p{
margin-top:8px;
line-height:1.6;
}

.cloud-code{
background:#101218;
color:#e8e9ed;
font-family:monospace;
padding:17px;
border-radius:12px;
margin:17px 0;
line-height:1.8;
overflow-x:auto;
}


/* DARK */

body.theme-dark .cloud-data-grid>div,
body.theme-dark .cloud-message{
background:#12151c;
}


/* RESPONSIVE */

@media(max-width:1050px){

.cloud-layout{
grid-template-columns:1fr;
}

.cloud-data-grid{
grid-template-columns:repeat(3,1fr);
}

}


@media(max-width:650px){

.cloud-data-grid{
grid-template-columns:1fr 1fr;
}

.cloud-actions{
display:grid;
grid-template-columns:1fr;
width:100%;
}

.cloud-actions button{
width:100%;
}

.cloud-auto-row{
align-items:flex-start;
}

}
EOF


# =========================================================
# CLOUD JAVASCRIPT
# =========================================================

cat >> public/app.js <<'EOF'


/* =========================================================
   PART 4 — CLOUD SYNC
========================================================= */

let cloudConfigured =
  false;

let cloudConnected =
  false;

let cloudPushTimer =
  null;

let cloudSyncInitialized =
  false;

let applyingCloudSnapshot =
  false;


/* =========================================================
   SNAPSHOT
========================================================= */

function createStudyFlowCloudSnapshot(){

  if(!currentUser){

    return null;

  }


  const prefix =
    `studyflow_${currentUser.id}_`;


  const store = {};


  for(
    let index = 0;
    index < localStorage.length;
    index++
  ){

    const storageKey =
      localStorage.key(index);


    if(
      !storageKey ||
      !storageKey.startsWith(prefix)
    ){

      continue;

    }


    const shortKey =
      storageKey.substring(
        prefix.length
      );


    if(
      [
        "cloudLastSyncAt",
        "cloudLocalDirty"
      ]
      .includes(shortKey)
    ){

      continue;

    }


    store[shortKey] =
      localStorage.getItem(
        storageKey
      );

  }


  return {

    app:
      "StudyFlow",

    version:
      4,

    user:{
      id:
        currentUser.id,

      name:
        currentUser.name,

      email:
        currentUser.email
    },

    savedAt:
      new Date()
      .toISOString(),

    store

  };

}


/* =========================================================
   APPLY SNAPSHOT
========================================================= */

function applyStudyFlowCloudSnapshot(
  snapshot
){

  if(
    !snapshot ||
    !snapshot.store ||
    !currentUser
  ){

    throw new Error(
      "Invalid StudyFlow cloud backup."
    );

  }


  applyingCloudSnapshot =
    true;


  const prefix =
    `studyflow_${currentUser.id}_`;


  const protectedKeys =
    new Set([

      prefix +
      "cloudAutoSync",

      prefix +
      "cloudLastSyncAt",

      prefix +
      "cloudLocalDirty"

    ]);


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
      storageKey.startsWith(prefix) &&
      !protectedKeys.has(storageKey)
    ){

      remove.push(
        storageKey
      );

    }

  }


  remove.forEach(
    storageKey => {

      localStorage.removeItem(
        storageKey
      );

    }
  );


  Object.entries(
    snapshot.store
  )
  .forEach(
    ([name,value]) => {

      localStorage.setItem(
        prefix + name,
        value
      );

    }
  );


  applyingCloudSnapshot =
    false;

}


/* =========================================================
   STATUS
========================================================= */

async function refreshCloudStatus(){

  if(
    !currentUser
  ){

    return;

  }


  setCloudMessage(
    "Checking cloud connection...",
    ""
  );


  try{

    const data =
      await api(
        "/api/cloud/status"
      );


    cloudConfigured =
      !!data.configured;


    cloudConnected =
      !!data.connected;


    if(!cloudConfigured){

      setCloudStatusUI(
        "Not configured",
        "offline"
      );


      $("cloudConnectionText")
        .textContent =
        "Not configured";


      $("cloudBackupText")
        .textContent =
        "Local only";


      $("cloudUpdatedText")
        .textContent =
        "—";


      $("cloudSetupHelp")
        ?.classList
        .remove("hidden");


      $("cloudMainTitle")
        .textContent =
        "StudyFlow is running locally";


      $("cloudMainDescription")
        .textContent =
        "Add your Supabase credentials to enable cross-device synchronization.";


      setCloudMessage(
        "",
        ""
      );


      return;

    }


    if(!cloudConnected){

      setCloudStatusUI(
        "Setup needed",
        "error"
      );


      $("cloudConnectionText")
        .textContent =
        "Database setup needed";


      $("cloudSetupHelp")
        ?.classList
        .remove("hidden");


      $("cloudMainTitle")
        .textContent =
        "Cloud database needs setup";


      $("cloudMainDescription")
        .textContent =
        data.message ||
        "Run supabase-schema.sql in Supabase.";


      setCloudMessage(
        data.message ||
        "Run the Supabase SQL schema.",
        "error"
      );


      return;

    }


    $("cloudSetupHelp")
      ?.classList
      .add("hidden");


    setCloudStatusUI(
      "Connected",
      "online"
    );


    $("cloudConnectionText")
      .textContent =
      "Connected";


    $("cloudBackupText")
      .textContent =
      data.exists
        ? "Available"
        : "Not created yet";


    $("cloudUpdatedText")
      .textContent =
      formatCloudDate(
        data.updatedAt
      );


    $("cloudMainTitle")
      .textContent =
      "StudyFlow Cloud is connected";


    $("cloudMainDescription")
      .textContent =
      data.exists
        ? "Your StudyFlow workspace has a cloud backup."
        : "Push this device to create your first cloud backup.";


    setCloudMessage(
      "",
      ""
    );


  }catch(error){

    cloudConnected =
      false;


    setCloudStatusUI(
      "Connection error",
      "error"
    );


    $("cloudConnectionText")
      .textContent =
      "Error";


    setCloudMessage(
      error.message,
      "error"
    );

  }


  renderCloudDeviceSummary();

}


/* =========================================================
   PUSH
========================================================= */

async function pushStudyFlowCloud(
  silent = false
){

  if(
    !currentUser ||
    applyingCloudSnapshot
  ){

    return;

  }


  if(!silent){

    setCloudMessage(
      "Uploading StudyFlow data...",
      ""
    );

  }


  try{

    const snapshot =
      createStudyFlowCloudSnapshot();


    const data =
      await api(
        "/api/cloud/push",
        {

          method:
            "POST",

          body:
            JSON.stringify({
              snapshot
            })

        }
      );


    localStorage.setItem(
      key("cloudLastSyncAt"),
      data.updatedAt ||
      new Date().toISOString()
    );


    localStorage.setItem(
      key("cloudLocalDirty"),
      "0"
    );


    cloudConfigured =
      true;


    cloudConnected =
      true;


    if(!silent){

      setCloudMessage(
        "✅ StudyFlow uploaded to the cloud.",
        "success"
      );

    }


    renderCloudLastSync();


    await refreshCloudStatus();


    return true;


  }catch(error){

    if(!silent){

      setCloudMessage(
        error.message,
        "error"
      );

    }


    return false;

  }

}


/* =========================================================
   PULL
========================================================= */

async function pullStudyFlowCloud(
  skipConfirm = false
){

  if(!currentUser){

    return;

  }


  setCloudMessage(
    "Downloading StudyFlow cloud data...",
    ""
  );


  try{

    const data =
      await api(
        "/api/cloud/pull"
      );


    if(!data.exists){

      setCloudMessage(
        "There is no cloud backup yet. Push this device first.",
        "error"
      );


      return false;

    }


    if(!skipConfirm){

      const approved =
        confirm(
          "Pull cloud data to this device? Your current local StudyFlow workspace will be replaced by the cloud version."
        );


      if(!approved){

        setCloudMessage(
          "",
          ""
        );


        return false;

      }

    }


    applyStudyFlowCloudSnapshot(
      data.snapshot
    );


    localStorage.setItem(
      key("cloudLastSyncAt"),
      data.updatedAt ||
      new Date().toISOString()
    );


    localStorage.setItem(
      key("cloudLocalDirty"),
      "0"
    );


    setCloudMessage(
      "✅ Cloud data downloaded. Reloading StudyFlow...",
      "success"
    );


    setTimeout(
      () => {

        location.reload();

      },
      700
    );


    return true;


  }catch(error){

    setCloudMessage(
      error.message,
      "error"
    );


    return false;

  }

}


/* =========================================================
   AUTO SYNC
========================================================= */

function isCloudAutoSyncEnabled(){

  if(!currentUser){

    return false;

  }


  return (
    localStorage.getItem(
      key("cloudAutoSync")
    )
    === "true"
  );

}


function toggleCloudAutoSync(){

  if(!currentUser){

    return;

  }


  const enabled =
    !!$("cloudAutoSync")
      ?.checked;


  localStorage.setItem(
    key("cloudAutoSync"),
    String(enabled)
  );


  if(enabled){

    setCloudMessage(
      "✅ Auto Sync enabled.",
      "success"
    );


    scheduleStudyFlowCloudPush(
      500
    );

  }else{

    setCloudMessage(
      "Auto Sync disabled.",
      ""
    );

  }

}


function markStudyFlowCloudDirty(){

  if(
    !currentUser ||
    applyingCloudSnapshot
  ){

    return;

  }


  localStorage.setItem(
    key("cloudLocalDirty"),
    "1"
  );


  if(
    isCloudAutoSyncEnabled()
  ){

    scheduleStudyFlowCloudPush();

  }

}


function scheduleStudyFlowCloudPush(
  delay = 1400
){

  clearTimeout(
    cloudPushTimer
  );


  cloudPushTimer =
    setTimeout(
      async () => {

        await pushStudyFlowCloud(
          true
        );

      },
      delay
    );

}


/* =========================================================
   CLOUD POLLING
========================================================= */

async function checkForNewCloudVersion(){

  if(
    !currentUser ||
    !isCloudAutoSyncEnabled() ||
    !cloudConnected
  ){

    return;

  }


  const localDirty =
    localStorage.getItem(
      key("cloudLocalDirty")
    )
    === "1";


  if(localDirty){

    return;

  }


  const lastSync =
    localStorage.getItem(
      key("cloudLastSyncAt")
    );


  if(!lastSync){

    return;

  }


  try{

    const data =
      await api(
        "/api/cloud/pull"
      );


    if(
      !data.exists ||
      !data.updatedAt
    ){

      return;

    }


    const cloudTime =
      new Date(
        data.updatedAt
      ).getTime();


    const localTime =
      new Date(
        lastSync
      ).getTime();


    if(
      cloudTime >
      localTime + 1000
    ){

      applyStudyFlowCloudSnapshot(
        data.snapshot
      );


      localStorage.setItem(
        key("cloudLastSyncAt"),
        data.updatedAt
      );


      if(
        typeof showToast ===
        "function"
      ){

        showToast(
          "☁️ New StudyFlow data synced from another device"
        );

      }


      setTimeout(
        () => {

          location.reload();

        },
        800
      );

    }


  }catch{}

}


/* =========================================================
   CLOUD UI
========================================================= */

function setCloudStatusUI(
  text,
  state
){

  const element =
    $("cloudHeaderStatus");


  if(!element){

    return;

  }


  element.textContent =
    text;


  element.classList.remove(
    "cloud-pill-online",
    "cloud-pill-offline",
    "cloud-pill-error"
  );


  if(state === "online"){

    element.classList.add(
      "cloud-pill-online"
    );

  }

  else if(state === "error"){

    element.classList.add(
      "cloud-pill-error"
    );

  }

  else{

    element.classList.add(
      "cloud-pill-offline"
    );

  }

}


function setCloudMessage(
  message,
  type
){

  const element =
    $("cloudMessage");


  if(!element){

    return;

  }


  if(!message){

    element.classList
      .add("hidden");


    element.textContent =
      "";


    return;

  }


  element.textContent =
    message;


  element.classList
    .remove(
      "hidden",
      "cloud-success",
      "cloud-error"
    );


  if(type === "success"){

    element.classList
      .add("cloud-success");

  }


  if(type === "error"){

    element.classList
      .add("cloud-error");

  }

}


function formatCloudDate(
  value
){

  if(!value){

    return "—";

  }


  const date =
    new Date(value);


  if(
    Number.isNaN(
      date.getTime()
    )
  ){

    return "—";

  }


  return date
    .toLocaleString();

}


function renderCloudLastSync(){

  if(
    !$("cloudLastSyncText") ||
    !currentUser
  ){

    return;

  }


  const value =
    localStorage.getItem(
      key("cloudLastSyncAt")
    );


  $("cloudLastSyncText")
    .textContent =
    formatCloudDate(
      value
    );

}


function renderCloudDeviceSummary(){

  if(
    !$("cloudClassesCount")
  ){

    return;

  }


  $("cloudClassesCount")
    .textContent =
    Array.isArray(classes)
      ? classes.length
      : 0;


  $("cloudTasksCount")
    .textContent =
    Array.isArray(tasks)
      ? tasks.length
      : 0;


  $("cloudNotesCount")
    .textContent =
    Array.isArray(notes)
      ? notes.length
      : 0;


  $("cloudGradesCount")
    .textContent =
    typeof grades !== "undefined" &&
    Array.isArray(grades)
      ? grades.length
      : 0;


  $("cloudFlashcardsCount")
    .textContent =
    typeof flashcardSets !== "undefined" &&
    Array.isArray(flashcardSets)
      ? flashcardSets.length
      : 0;


  $("cloudDegreeCount")
    .textContent =
    typeof degreeCourses !== "undefined" &&
    Array.isArray(degreeCourses)
      ? degreeCourses.length
      : 0;

}


/* =========================================================
   INIT CLOUD
========================================================= */

async function initStudyFlowCloud(){

  if(
    !currentUser ||
    cloudSyncInitialized
  ){

    return;

  }


  cloudSyncInitialized =
    true;


  if(
    $("cloudAutoSync")
  ){

    $("cloudAutoSync")
      .checked =
      isCloudAutoSyncEnabled();

  }


  renderCloudDeviceSummary();

  renderCloudLastSync();


  await refreshCloudStatus();

}


/* =========================================================
   PATCH SAVE FUNCTIONS
========================================================= */

if(
  typeof saveEverything ===
  "function"
){

  const saveEverythingBeforeCloud =
    saveEverything;


  saveEverything =
    function(...args){

      const result =
        saveEverythingBeforeCloud(
          ...args
        );


      markStudyFlowCloudDirty();

      renderCloudDeviceSummary();


      return result;

    };

}


if(
  typeof saveStudentCore ===
  "function"
){

  const saveStudentCoreBeforeCloud =
    saveStudentCore;


  saveStudentCore =
    function(...args){

      const result =
        saveStudentCoreBeforeCloud(
          ...args
        );


      markStudyFlowCloudDirty();

      renderCloudDeviceSummary();


      return result;

    };

}


if(
  typeof saveProSettings ===
  "function"
){

  const saveProSettingsBeforeCloud =
    saveProSettings;


  saveProSettings =
    function(...args){

      const result =
        saveProSettingsBeforeCloud(
          ...args
        );


      markStudyFlowCloudDirty();


      return result;

    };

}


/* =========================================================
   PATCH STARTAPP
========================================================= */

if(
  typeof startApp ===
  "function"
){

  const startAppBeforeCloud =
    startApp;


  startApp =
    function(user){

      cloudSyncInitialized =
        false;


      startAppBeforeCloud(
        user
      );


      setTimeout(
        () => {

          initStudyFlowCloud();

        },
        500
      );

    };

}


/* =========================================================
   COMMAND PALETTE
========================================================= */

if(
  typeof commandPages !==
  "undefined" &&
  Array.isArray(commandPages)
){

  if(
    !commandPages.some(
      item =>
        item[0] ===
        "cloudSync"
    )
  ){

    commandPages.push(
      [
        "cloudSync",
        "☁️ Cloud Sync"
      ]
    );

  }

}


/* =========================================================
   AUTO CLOUD CHECK
========================================================= */

setInterval(
  () => {

    checkForNewCloudVersion();

  },
  30000
);

EOF


# =========================================================
# SYNTAX CHECKS
# =========================================================

echo ""
echo "🧪 Checking syntax..."

node --check server.js
node --check cloud-routes.js
node --check public/app.js

echo ""
echo "✅ JavaScript syntax OK"


# =========================================================
# FINISH
# =========================================================

echo ""
echo "================================"
echo "🎉 PART 4 INSTALLED"
echo "================================"
echo ""
echo "Added:"
echo "• Supabase Cloud Sync"
echo "• Push to Cloud"
echo "• Pull from Cloud"
echo "• Auto Sync"
echo "• Cross-device cloud polling"
echo "• Cloud status page"
echo "• Cloud database SQL schema"
echo "• Dynamic deployment PORT"
echo "• /api/health endpoint"
echo "• .gitignore protection"
echo "• Deploy Procfile"
echo ""
echo "StudyFlow still works WITHOUT Supabase."
echo ""
echo "To enable Cloud Sync:"
echo ""
echo "1. Create a Supabase project"
echo "2. Run supabase-schema.sql in SQL Editor"
echo "3. Add these values to .env:"
echo ""
echo "SUPABASE_URL=https://YOUR_PROJECT.supabase.co"
echo "SUPABASE_SECRET_KEY=sb_secret_..."
echo ""
echo "4. Restart with npm start"
echo ""
echo "🚀 Starting StudyFlow..."
echo ""

npm start

