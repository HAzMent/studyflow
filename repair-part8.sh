#!/bin/bash

set -e

echo ""
echo "🔧 Repairing StudyFlow PART 8..."
echo ""

# ---------------------------------------------------------
# MAKE SURE PART 8 FILES EXIST
# ---------------------------------------------------------

for FILE in \
  session-config.js \
  auth-extra-routes.js \
  supabase-production-auth.sql \
  public/forgot-password.html \
  public/reset-password.html \
  public/password-pages.css
do

  if [ ! -f "$FILE" ]; then
    echo "❌ Missing file: $FILE"
    echo "PART 8 stopped before creating all files."
    exit 1
  fi

done

echo "✅ PART 8 files found"


# ---------------------------------------------------------
# PATCH SERVER.JS
# ---------------------------------------------------------

python3 <<'PY'
from pathlib import Path

p = Path("server.js")
s = p.read_text()

session_import = 'import { createSessionMiddleware } from "./session-config.js";'
extra_import = 'import authExtraRouter from "./auth-extra-routes.js";'


def add_import(source, import_line):
    if import_line in source:
        return source

    lines = source.splitlines()
    import_indexes = [
        i for i, line in enumerate(lines)
        if line.startswith("import ")
    ]

    if import_indexes:
        lines.insert(import_indexes[-1] + 1, import_line)
    else:
        lines.insert(0, import_line)

    return "\n".join(lines)


s = add_import(s, session_import)
s = add_import(s, extra_import)


# ---------------------------------------------------------
# REPLACE OLD express-session MIDDLEWARE
# ---------------------------------------------------------

if "app.use(createSessionMiddleware());" not in s:
    marker = "app.use(session("

    start = s.find(marker)

    if start != -1:
        i = start
        depth = 0
        in_single = False
        in_double = False
        in_template = False
        escaped = False
        found_open = False
        end = None

        while i < len(s):
            ch = s[i]

            if escaped:
                escaped = False
                i += 1
                continue

            if ch == "\\":
                escaped = True
                i += 1
                continue

            if not in_double and not in_template and ch == "'":
                in_single = not in_single
                i += 1
                continue

            if not in_single and not in_template and ch == '"':
                in_double = not in_double
                i += 1
                continue

            if not in_single and not in_double and ch == "`":
                in_template = not in_template
                i += 1
                continue

            if in_single or in_double or in_template:
                i += 1
                continue

            if ch == "(":
                depth += 1
                found_open = True

            elif ch == ")":
                depth -= 1

                if found_open and depth == 0:
                    end = i + 1

                    while end < len(s) and s[end] in " \t\r\n;":
                        end += 1

                    break

            i += 1

        if end is None:
            raise SystemExit(
                "❌ Found old session middleware but could not safely replace it."
            )

        s = (
            s[:start]
            + "app.use(createSessionMiddleware());\n\n"
            + s[end:]
        )

    else:
        # Fallback: insert after express.json()
        json_pos = s.find("app.use(express.json")

        if json_pos == -1:
            raise SystemExit(
                "❌ Could not find express.json or old session middleware."
            )

        line_end = s.find("\n", json_pos)

        s = (
            s[:line_end + 1]
            + "\napp.use(createSessionMiddleware());\n"
            + s[line_end + 1:]
        )


# ---------------------------------------------------------
# ADD EXTRA AUTH ROUTES
# ---------------------------------------------------------

mount = 'app.use("/api", authExtraRouter);'

if mount not in s:
    auth_marker = 'app.use("/api", supabaseAuthRouter);'
    cloud_marker = 'app.use("/api/cloud", cloudRouter);'

    if auth_marker in s:
        s = s.replace(
            auth_marker,
            auth_marker + "\n" + mount,
            1
        )

    elif cloud_marker in s:
        s = s.replace(
            cloud_marker,
            mount + "\n\n" + cloud_marker,
            1
        )

    else:
        raise SystemExit(
            "❌ Could not find Supabase auth/cloud router mount."
        )


# ---------------------------------------------------------
# ADD PASSWORD PAGE ROUTES
# ---------------------------------------------------------

if 'app.get("/forgot-password"' not in s:
    page_routes = '''
app.get("/forgot-password", (req, res) => {
  res.sendFile("forgot-password.html", {
    root: "public"
  });
});

app.get("/reset-password", (req, res) => {
  res.sendFile("reset-password.html", {
    root: "public"
  });
});

'''

    static_marker = 'app.use(express.static("public"));'

    if static_marker in s:
        s = s.replace(
            static_marker,
            page_routes + static_marker,
            1
        )
    else:
        raise SystemExit(
            "❌ Could not find express.static in server.js."
        )


p.write_text(s)

print("✅ server.js patched successfully")
PY


# ---------------------------------------------------------
# ADD FORGOT PASSWORD LINK IF NOT ALREADY PRESENT
# ---------------------------------------------------------

python3 <<'PY'
from pathlib import Path

p = Path("public/index.html")
html = p.read_text()

if "studyflow-forgot-password-link" not in html:
    block = '''
<div class="studyflow-forgot-password-link">
  <a href="/forgot-password">Forgot password?</a>
</div>
'''

    candidates = [
        "Create account",
        "Create Account",
        "Register"
    ]

    inserted = False

    for candidate in candidates:
        pos = html.find(candidate)

        if pos == -1:
            continue

        end = html.find("</button>", pos)

        if end != -1:
            end += len("</button>")
            html = html[:end] + block + html[end:]
            inserted = True
            break

    if not inserted:
        html = html.replace(
            "</body>",
            block + "\n</body>",
            1
        )

    p.write_text(html)

print("✅ Forgot password link checked")
PY


# ---------------------------------------------------------
# CSS
# ---------------------------------------------------------

if ! grep -q "studyflow-forgot-password-link" public/style.css
then

cat >> public/style.css <<'EOF'

/* PART 8 AUTH */

.studyflow-forgot-password-link{
text-align:center;
margin-top:11px;
}

.studyflow-forgot-password-link a{
font-size:12px;
font-weight:700;
color:var(--primary);
text-decoration:none;
}

.studyflow-forgot-password-link a:hover{
text-decoration:underline;
}

EOF

fi


# ---------------------------------------------------------
# ENV PLACEHOLDERS
# ---------------------------------------------------------

touch .env

grep -q "^DATABASE_URL=" .env \
|| echo "DATABASE_URL=" >> .env

grep -q "^APP_URL=" .env \
|| echo "APP_URL=http://localhost:3000" >> .env

grep -q "^RESEND_API_KEY=" .env \
|| echo "RESEND_API_KEY=" >> .env

grep -q "^RESEND_FROM_EMAIL=" .env \
|| echo "RESEND_FROM_EMAIL=" >> .env


# ---------------------------------------------------------
# CHECK EVERYTHING
# ---------------------------------------------------------

echo ""
echo "🧪 Checking JavaScript..."
echo ""

node --check session-config.js
echo "✅ session-config.js OK"

node --check auth-extra-routes.js
echo "✅ auth-extra-routes.js OK"

node --check server.js
echo "✅ server.js OK"

node --check public/app.js
echo "✅ public/app.js OK"


# ---------------------------------------------------------
# COPY SQL
# ---------------------------------------------------------

if command -v pbcopy >/dev/null 2>&1
then

  pbcopy < supabase-production-auth.sql

  echo ""
  echo "📋 PART 8 SQL copied to clipboard"

fi


echo ""
echo "======================================"
echo "✅ PART 8 REPAIR COMPLETE"
echo "======================================"
echo ""
echo "NEXT:"
echo ""
echo "1. Supabase → SQL Editor → New Query"
echo "2. Command + V"
echo "3. Run"
echo ""
echo "Then we add DATABASE_URL."
echo ""

