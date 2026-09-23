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

