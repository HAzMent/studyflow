
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


