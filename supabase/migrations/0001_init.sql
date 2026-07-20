-- Mentor Roadmap Pro — Initial schema
-- Auth is owned by Clerk. Each table keys off clerk_user_id (text) which is
-- injected into the Postgres JWT claim "sub" via a Clerk <-> Supabase JWT template,
-- so RLS can reference auth.jwt() ->> 'sub'.

-- uses gen_random_uuid(), built into Postgres 13+ — no extension required

-- ============ profiles ============
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  email text not null,
  full_name text,
  avatar_url text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_profiles_clerk_user_id on profiles (clerk_user_id);

-- ============ career_goals ============
create table if not exists career_goals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  degree text not null,
  branch text not null,
  graduation_year int not null check (graduation_year between 1990 and 2100),
  current_skills text[] not null default '{}',
  preferred_career text not null,
  weekly_study_hours int not null check (weekly_study_hours > 0 and weekly_study_hours <= 168),
  preferred_learning_style text not null check (preferred_learning_style in ('visual','reading','hands_on','mixed')),
  created_at timestamptz not null default now()
);
create index if not exists idx_career_goals_profile_id on career_goals (profile_id);

-- ============ roadmaps ============
create table if not exists roadmaps (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  career_goal_id uuid not null references career_goals(id) on delete cascade,
  title text not null,
  summary text,
  estimated_weeks int not null,
  readiness_score int not null default 0 check (readiness_score between 0 and 100),
  ai_model text not null default 'gemini-2.0-flash',
  cache_key text not null,
  raw_response jsonb not null,
  status text not null default 'active' check (status in ('active','completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists idx_roadmaps_cache_key on roadmaps (cache_key);
create index if not exists idx_roadmaps_profile_id on roadmaps (profile_id);

-- ============ milestones ============
create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references roadmaps(id) on delete cascade,
  title text not null,
  description text,
  week_number int not null,
  order_index int not null,
  status text not null default 'pending' check (status in ('pending','in_progress','completed')),
  due_date date,
  created_at timestamptz not null default now()
);
create index if not exists idx_milestones_roadmap_id on milestones (roadmap_id, order_index);

-- ============ skills ============
create table if not exists skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  created_at timestamptz not null default now()
);

-- ============ user_skills ============
create table if not exists user_skills (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  proficiency text not null default 'beginner' check (proficiency in ('beginner','intermediate','advanced')),
  is_target boolean not null default false,
  acquired_at timestamptz,
  created_at timestamptz not null default now(),
  unique (profile_id, skill_id)
);
create index if not exists idx_user_skills_profile_id on user_skills (profile_id);

-- ============ learning_resources ============
create table if not exists learning_resources (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid references milestones(id) on delete cascade,
  title text not null,
  url text not null,
  resource_type text not null check (resource_type in ('documentation','youtube','github','course','practice')),
  is_free boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_learning_resources_milestone_id on learning_resources (milestone_id);

-- ============ projects ============
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references roadmaps(id) on delete cascade,
  title text not null,
  description text not null,
  difficulty text not null check (difficulty in ('beginner','intermediate','advanced')),
  tech_stack text[] not null default '{}',
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed')),
  created_at timestamptz not null default now()
);
create index if not exists idx_projects_roadmap_id on projects (roadmap_id);

-- ============ resume_reviews ============
create table if not exists resume_reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  file_path text not null,
  ats_score int not null check (ats_score between 0 and 100),
  suggestions jsonb not null default '[]',
  extracted_text text,
  created_at timestamptz not null default now()
);
create index if not exists idx_resume_reviews_profile_id on resume_reviews (profile_id);

-- ============ mock_interviews ============
create table if not exists mock_interviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  interview_type text not null check (interview_type in ('technical','hr','behavioral')),
  questions jsonb not null,
  answers jsonb,
  feedback jsonb,
  overall_score int check (overall_score between 0 and 100),
  created_at timestamptz not null default now()
);
create index if not exists idx_mock_interviews_profile_id on mock_interviews (profile_id);

-- ============ notifications ============
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('welcome','weekly_progress','milestone_completion','reminder')),
  subject text not null,
  sent_at timestamptz,
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_profile_id on notifications (profile_id);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table profiles enable row level security;
alter table career_goals enable row level security;
alter table roadmaps enable row level security;
alter table milestones enable row level security;
alter table user_skills enable row level security;
alter table learning_resources enable row level security;
alter table projects enable row level security;
alter table resume_reviews enable row level security;
alter table mock_interviews enable row level security;
alter table notifications enable row level security;

-- profiles: a user can only see/edit their own row
create policy "profiles_select_own" on profiles for select
  using (clerk_user_id = auth.jwt() ->> 'sub');
create policy "profiles_insert_own" on profiles for insert
  with check (clerk_user_id = auth.jwt() ->> 'sub');
create policy "profiles_update_own" on profiles for update
  using (clerk_user_id = auth.jwt() ->> 'sub');

-- Helper pattern for all child tables: join back to profiles.clerk_user_id
create policy "career_goals_owner" on career_goals for all
  using (profile_id in (select id from profiles where clerk_user_id = auth.jwt() ->> 'sub'))
  with check (profile_id in (select id from profiles where clerk_user_id = auth.jwt() ->> 'sub'));

create policy "roadmaps_owner" on roadmaps for all
  using (profile_id in (select id from profiles where clerk_user_id = auth.jwt() ->> 'sub'))
  with check (profile_id in (select id from profiles where clerk_user_id = auth.jwt() ->> 'sub'));

create policy "milestones_owner" on milestones for all
  using (roadmap_id in (
    select r.id from roadmaps r join profiles p on p.id = r.profile_id
    where p.clerk_user_id = auth.jwt() ->> 'sub'
  ))
  with check (roadmap_id in (
    select r.id from roadmaps r join profiles p on p.id = r.profile_id
    where p.clerk_user_id = auth.jwt() ->> 'sub'
  ));

create policy "user_skills_owner" on user_skills for all
  using (profile_id in (select id from profiles where clerk_user_id = auth.jwt() ->> 'sub'))
  with check (profile_id in (select id from profiles where clerk_user_id = auth.jwt() ->> 'sub'));

create policy "learning_resources_owner" on learning_resources for all
  using (milestone_id in (
    select m.id from milestones m
    join roadmaps r on r.id = m.roadmap_id
    join profiles p on p.id = r.profile_id
    where p.clerk_user_id = auth.jwt() ->> 'sub'
  ));

create policy "projects_owner" on projects for all
  using (roadmap_id in (
    select r.id from roadmaps r join profiles p on p.id = r.profile_id
    where p.clerk_user_id = auth.jwt() ->> 'sub'
  ));

create policy "resume_reviews_owner" on resume_reviews for all
  using (profile_id in (select id from profiles where clerk_user_id = auth.jwt() ->> 'sub'))
  with check (profile_id in (select id from profiles where clerk_user_id = auth.jwt() ->> 'sub'));

create policy "mock_interviews_owner" on mock_interviews for all
  using (profile_id in (select id from profiles where clerk_user_id = auth.jwt() ->> 'sub'))
  with check (profile_id in (select id from profiles where clerk_user_id = auth.jwt() ->> 'sub'));

create policy "notifications_owner" on notifications for all
  using (profile_id in (select id from profiles where clerk_user_id = auth.jwt() ->> 'sub'));

-- skills is a shared reference table: readable by everyone, writable by nobody via client
alter table skills enable row level security;
create policy "skills_read_all" on skills for select using (true);
