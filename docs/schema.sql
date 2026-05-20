create table if not exists users (
  id uuid primary key,
  name text not null,
  email text not null unique,
  role text not null check (role in ('student', 'teacher')),
  created_at timestamptz not null default now()
);

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists class_members (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null check (role in ('student', 'teacher')),
  created_at timestamptz not null default now(),
  unique (class_id, user_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  sender_id uuid not null references users(id) on delete cascade,
  message text not null,
  type text not null check (type in ('text', 'announcement')),
  created_at timestamptz not null default now()
);

create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  title text not null,
  file_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_class_created_at
on messages (class_id, created_at);

create index if not exists idx_materials_class_created_at
on materials (class_id, created_at);

create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  title text not null,
  description text,
  due_date timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_assignments_class_due_date
on assignments (class_id, due_date);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  student_id uuid not null references users(id) on delete cascade,
  file_url text not null,
  marks numeric(5,2),
  feedback text,
  created_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  meeting_url text,
  start_time timestamptz not null,
  end_time timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz,
  left_at timestamptz,
  unique (session_id, user_id)
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  type text not null check (type in ('tab_switch', 'camera_off', 'multiple_face', 'copy_paste', 'presence_ping', 'fullscreen_exit')),
  metadata jsonb not null default '{}'::jsonb,
  timestamp timestamptz not null default now()
);

create index if not exists idx_sessions_class_start_time
on sessions (class_id, start_time);

create index if not exists idx_session_participants_session_joined_at
on session_participants (session_id, joined_at);

create index if not exists idx_events_session_timestamp
on events (session_id, timestamp desc);

create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  engagement_score integer not null default 0,
  integrity_score integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, session_id)
);
