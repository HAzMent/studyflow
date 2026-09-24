#!/bin/bash

set -e

echo ""
echo "🔧 Repairing StudyFlow PART 7..."
echo ""

python3 <<'PY'
from pathlib import Path

p = Path("server.js")
s = p.read_text()

# ---------------------------------------------------------
# ADD IMPORT
# ---------------------------------------------------------

import_line = 'import supabaseAuthRouter from "./auth-routes.js";'

if import_line not in s:
    lines = s.splitlines()

    last_import = -1

    for i, line in enumerate(lines):
        if line.startswith("import "):
            last_import = i

    if last_import >= 0:
        lines.insert(last_import + 1, import_line)
    else:
        lines.insert(0, import_line)

    s = "\n".join(lines)

# ---------------------------------------------------------
# MOUNT SUPABASE AUTH ROUTER
# ---------------------------------------------------------

mount_line = 'app.use("/api", supabaseAuthRouter);'

if mount_line not in s:

    cloud_marker = 'app.use("/api/cloud", cloudRouter);'

    mount_block = '''
/*
  Supabase-backed StudyFlow accounts
*/
app.use("/api", supabaseAuthRouter);

'''

    if cloud_marker in s:

        s = s.replace(
            cloud_marker,
            mount_block + cloud_marker,
            1
        )

    else:

        possible_markers = [
            'app.post("/api/register"',
            "app.post('/api/register'"
        ]

        inserted = False

        for marker in possible_markers:

            pos = s.find(marker)

            if pos != -1:

                s = (
                    s[:pos]
                    + mount_block
                    + s[pos:]
                )

                inserted = True
                break

        if not inserted:

            raise SystemExit(
                "❌ Could not find where to mount Supabase auth."
            )

p.write_text(s)

print("✅ server.js patched successfully")
PY


echo ""
echo "🧪 Checking files..."
echo ""

node --check auth-routes.js
echo "✅ auth-routes.js OK"

node --check migrate-users-to-supabase.js
echo "✅ migration script OK"

node --check server.js
echo "✅ server.js OK"


if command -v pbcopy >/dev/null 2>&1
then

  pbcopy < supabase-auth-schema.sql

  echo ""
  echo "📋 Supabase SQL copied to clipboard"

fi


echo ""
echo "======================================"
echo "✅ PART 7 REPAIR COMPLETE"
echo "======================================"
echo ""
echo "NEXT:"
echo ""
echo "1. Supabase → SQL Editor"
echo "2. New Query"
echo "3. Command + V"
echo "4. Run"
echo ""
echo "Then come back to Terminal and run:"
echo ""
echo "node migrate-users-to-supabase.js"
echo ""

