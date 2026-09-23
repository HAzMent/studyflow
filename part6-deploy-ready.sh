#!/bin/bash

set -e

echo ""
echo "🌍 StudyFlow — PART 6 Deploy Ready"
echo "================================="
echo ""

# ---------------------------------------------------------
# BACKUP
# ---------------------------------------------------------

BACKUP="backup-part6-$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP"

cp server.js "$BACKUP/server.js" 2>/dev/null || true
cp package.json "$BACKUP/package.json" 2>/dev/null || true
cp .gitignore "$BACKUP/.gitignore" 2>/dev/null || true

echo "✅ Backup created"


# ---------------------------------------------------------
# MAKE SURE SECRETS NEVER GO TO GITHUB
# ---------------------------------------------------------

touch .gitignore

for ITEM in \
".env" \
"node_modules/" \
".DS_Store" \
"backup-part*/" \
"data/users.json" \
"npm-debug.log"
do

  grep -qxF "$ITEM" .gitignore || echo "$ITEM" >> .gitignore

done


# ---------------------------------------------------------
# MAKE DATA DIRECTORY EXIST ON DEPLOY
# ---------------------------------------------------------

mkdir -p data

touch data/.gitkeep


# ---------------------------------------------------------
# PATCH SERVER FOR HOSTING
# ---------------------------------------------------------

python3 <<'PY'

from pathlib import Path
import re

p = Path("server.js")

s = p.read_text()

# Use host platform PORT
s = re.sub(
    r'const\s+PORT\s*=\s*[^;]+;',
    'const PORT = Number(process.env.PORT) || 3000;',
    s,
    count=1
)

# Ensure Render can reach Express externally
if "0.0.0.0" not in s:

    patterns = [
        r'app\.listen\(\s*PORT\s*,\s*\(\)\s*=>\s*\{',
        r'app\.listen\(\s*PORT\s*,'
    ]

    changed = False

    match = re.search(patterns[0], s)

    if match:

        s = s[:match.start()] + \
            'app.listen(PORT, "0.0.0.0", () => {' + \
            s[match.end():]

        changed = True

    if not changed:

        match = re.search(patterns[1], s)

        if match:

            s = s[:match.start()] + \
                'app.listen(PORT, "0.0.0.0",' + \
                s[match.end():]

# Add production security flag for cookies if current code
# already creates the session configuration.
# We do not force secure cookies locally.

p.write_text(s)

print("✅ server.js hosting configuration checked")

PY


# ---------------------------------------------------------
# PACKAGE NODE VERSION
# ---------------------------------------------------------

python3 <<'PY'

import json
from pathlib import Path

p = Path("package.json")

data = json.loads(p.read_text())

data["engines"] = {
    "node": ">=20"
}

if "scripts" not in data:
    data["scripts"] = {}

if "start" not in data["scripts"]:
    data["scripts"]["start"] = "node server.js"

p.write_text(
    json.dumps(
        data,
        indent=2
    ) + "\n"
)

print("✅ package.json ready")

PY


# ---------------------------------------------------------
# RENDER CONFIG
# ---------------------------------------------------------

cat > render.yaml <<'EOF'
services:

  - type: web
    name: studyflow
    runtime: node

    buildCommand: npm ci

    startCommand: npm start

    healthCheckPath: /api/health

    autoDeploy: true

    envVars:

      - key: NODE_ENV
        value: production

      - key: SESSION_SECRET
        sync: false

      - key: OPENAI_API_KEY
        sync: false

      - key: SUPABASE_URL
        sync: false

      - key: SUPABASE_SECRET_KEY
        sync: false
EOF


# ---------------------------------------------------------
# HEALTH CHECK FALLBACK
# ---------------------------------------------------------

python3 <<'PY'

from pathlib import Path

p = Path("server.js")

s = p.read_text()

if '/api/health' not in s:

    route = '''

app.get("/api/health", (req, res) => {

  res.json({
    ok: true,
    app: "StudyFlow",
    time: new Date().toISOString()
  });

});

'''

    static_marker = 'app.use(express.static("public"));'

    if static_marker in s:

        s = s.replace(
            static_marker,
            route + "\n" + static_marker,
            1
        )

    else:

        listen = s.find("app.listen(")

        if listen != -1:

            s = (
                s[:listen]
                +
                route
                +
                "\n"
                +
                s[listen:]
            )

p.write_text(s)

PY


# ---------------------------------------------------------
# CHECK EVERYTHING
# ---------------------------------------------------------

echo ""
echo "🧪 Checking StudyFlow..."

node --check server.js

node --check public/app.js

if [ -f public/landing.js ]; then
  node --check public/landing.js
fi

echo ""
echo "✅ Syntax checks passed"


# ---------------------------------------------------------
# GIT
# ---------------------------------------------------------

if [ ! -d .git ]; then

  git init

  git branch -M main

fi

git add .

git status

echo ""
echo "================================="
echo "✅ STUDYFLOW IS DEPLOY-READY"
echo "================================="
echo ""
echo "IMPORTANT:"
echo ".env is NOT included in Git."
echo "Your API secrets stay local."
echo ""
echo "Next step: commit and push to GitHub."
echo ""

