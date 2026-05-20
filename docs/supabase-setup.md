# Supabase Setup Notes

## Environment

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Schema

`SUPABASE_SERVICE_ROLE_KEY` is server-only. It lets ClassyGenz backfill a missing `public.users` profile row when a student exists in Supabase Auth but has not signed in yet. Never expose it in browser code.


Run the SQL in `docs/schema.sql` inside the Supabase SQL editor.

## Storage

Create public buckets named:

- `materials`
- `submissions`
- `snapshots`

Suggested starter storage policy:

```sql
create policy "authenticated users can upload materials"
on storage.objects for insert
to authenticated
with check (bucket_id = 'materials');

create policy "authenticated users can view materials"
on storage.objects for select
to authenticated
using (bucket_id = 'materials');

create policy "authenticated users can upload submissions"
on storage.objects for insert
to authenticated
with check (bucket_id = 'submissions');

create policy "authenticated users can view submissions"
on storage.objects for select
to authenticated
using (bucket_id = 'submissions');

create policy "authenticated users can upload snapshots"
on storage.objects for insert
to authenticated
with check (bucket_id = 'snapshots');

create policy "authenticated users can view snapshots"
on storage.objects for select
to authenticated
using (bucket_id = 'snapshots');
```

## Realtime

Enable realtime for:

- `messages`
- `materials`

## Session Monitoring Tables

When you update an existing Supabase project, also run the new additions in `docs/schema.sql` for:

- `session_participants`
- `fullscreen_exit` in the `events.type` check
- session and event indexes

## Auth Behavior

- Authentication uses Supabase Auth email/password accounts
- App profile data lives in the `users` table
- During sign-up, the app inserts the auth user into `users`

## Recommended RLS Starter Policies

These policies are a sensible MVP baseline and should be adjusted as the product grows:

```sql
alter table public.users enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;

drop policy if exists "users can read own profile" on public.users;
create policy "users can read own profile"
on public.users for select
to authenticated
using (auth.uid() = id);

drop policy if exists "users can insert own profile" on public.users;
create policy "users can insert own profile"
on public.users for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "users can update own profile" on public.users;
create policy "users can update own profile"
on public.users for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "teachers can create classes" on public.classes;
create policy "teachers can create classes"
on public.classes for insert
to authenticated
with check (
  teacher_id = auth.uid()
  and exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.role = 'teacher'
  )
);

drop policy if exists "teachers can view owned classes" on public.classes;
create policy "teachers can view owned classes"
on public.classes for select
to authenticated
using (teacher_id = auth.uid());

drop policy if exists "members can view joined classes" on public.classes;
create policy "members can view joined classes"
on public.classes for select
to authenticated
using (
  exists (
    select 1
    from public.class_members
    where class_members.class_id = classes.id
      and class_members.user_id = auth.uid()
  )
);

drop policy if exists "users can view own memberships" on public.class_members;
create policy "users can view own memberships"
on public.class_members for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "teachers can add own membership row" on public.class_members;
create policy "teachers can add own membership row"
on public.class_members for insert
to authenticated
with check (
  user_id = auth.uid()
  and role = 'teacher'
  and exists (
    select 1
    from public.classes
    where classes.id = class_members.class_id
      and classes.teacher_id = auth.uid()
  )
);

drop policy if exists "teachers can add students to owned classes" on public.class_members;
create policy "teachers can add students to owned classes"
on public.class_members for insert
to authenticated
with check (
  role = 'student'
  and exists (
    select 1
    from public.classes
    where classes.id = class_members.class_id
      and classes.teacher_id = auth.uid()
  )
  and exists (
    select 1
    from public.users
    where users.id = class_members.user_id
      and users.role = 'student'
  )
);

drop policy if exists "teachers can update student memberships in owned classes" on public.class_members;
create policy "teachers can update student memberships in owned classes"
on public.class_members for update
to authenticated
using (
  exists (
    select 1
    from public.classes
    where classes.id = class_members.class_id
      and classes.teacher_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.classes
    where classes.id = class_members.class_id
      and classes.teacher_id = auth.uid()
  )
);

alter table public.sessions enable row level security;
alter table public.session_participants enable row level security;
alter table public.events enable row level security;
alter table public.scores enable row level security;

drop policy if exists "teachers can create sessions for owned classes" on public.sessions;
create policy "teachers can create sessions for owned classes"
on public.sessions for insert
to authenticated
with check (
  exists (
    select 1
    from public.classes
    where classes.id = sessions.class_id
      and classes.teacher_id = auth.uid()
  )
);

drop policy if exists "class members can view sessions" on public.sessions;
create policy "class members can view sessions"
on public.sessions for select
to authenticated
using (
  exists (
    select 1
    from public.classes
    where classes.id = sessions.class_id
      and classes.teacher_id = auth.uid()
  )
  or exists (
    select 1
    from public.class_members
    where class_members.class_id = sessions.class_id
      and class_members.user_id = auth.uid()
  )
);

drop policy if exists "users can track own session attendance" on public.session_participants;
create policy "users can track own session attendance"
on public.session_participants for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.sessions
    left join public.classes on classes.id = sessions.class_id
    left join public.class_members on class_members.class_id = sessions.class_id
    where sessions.id = session_participants.session_id
      and (
        classes.teacher_id = auth.uid()
        or class_members.user_id = auth.uid()
      )
  )
);

drop policy if exists "users can update own session attendance" on public.session_participants;
create policy "users can update own session attendance"
on public.session_participants for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "class teachers and own user can view attendance" on public.session_participants;
create policy "class teachers and own user can view attendance"
on public.session_participants for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.sessions
    join public.classes on classes.id = sessions.class_id
    where sessions.id = session_participants.session_id
      and classes.teacher_id = auth.uid()
  )
);

drop policy if exists "users can insert own session events" on public.events;
create policy "users can insert own session events"
on public.events for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.sessions
    left join public.classes on classes.id = sessions.class_id
    left join public.class_members on class_members.class_id = sessions.class_id
    where sessions.id = events.session_id
      and (
        classes.teacher_id = auth.uid()
        or class_members.user_id = auth.uid()
      )
  )
);

drop policy if exists "class teachers and own user can view events" on public.events;
create policy "class teachers and own user can view events"
on public.events for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.sessions
    join public.classes on classes.id = sessions.class_id
    where sessions.id = events.session_id
      and classes.teacher_id = auth.uid()
  )
);

drop policy if exists "users can upsert own scores" on public.scores;
create policy "users can upsert own scores"
on public.scores for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "users can update own scores" on public.scores;
create policy "users can update own scores"
on public.scores for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "class teachers and own user can view scores" on public.scores;
create policy "class teachers and own user can view scores"
on public.scores for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.sessions
    join public.classes on classes.id = sessions.class_id
    where sessions.id = scores.session_id
      and classes.teacher_id = auth.uid()
  )
);
```



## Fix Class Policy Recursion

If Supabase reports `infinite recursion detected in policy for relation "classes"`, replace the class and class member policies with this non-recursive version:

```sql
create or replace function public.is_class_teacher(target_class_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.classes
    where classes.id = target_class_id
      and classes.teacher_id = auth.uid()
  );
$$;

create or replace function public.is_class_member(target_class_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.class_members
    where class_members.class_id = target_class_id
      and class_members.user_id = auth.uid()
  );
$$;

grant execute on function public.is_class_teacher(uuid) to authenticated;
grant execute on function public.is_class_member(uuid) to authenticated;

alter table public.classes enable row level security;
alter table public.class_members enable row level security;

drop policy if exists "teachers can view owned classes" on public.classes;
drop policy if exists "members can view joined classes" on public.classes;
drop policy if exists "class access can view classes" on public.classes;
create policy "class access can view classes"
on public.classes for select
to authenticated
using (
  teacher_id = auth.uid()
  or public.is_class_member(id)
);

drop policy if exists "teachers can create classes" on public.classes;
create policy "teachers can create classes"
on public.classes for insert
to authenticated
with check (
  teacher_id = auth.uid()
  and exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.role = 'teacher'
  )
);

drop policy if exists "users can view own memberships" on public.class_members;
drop policy if exists "class access can view memberships" on public.class_members;
create policy "class access can view memberships"
on public.class_members for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_class_teacher(class_id)
);

drop policy if exists "teachers can add own membership row" on public.class_members;
create policy "teachers can add own membership row"
on public.class_members for insert
to authenticated
with check (
  user_id = auth.uid()
  and role = 'teacher'
  and public.is_class_teacher(class_id)
);

drop policy if exists "teachers can add students to owned classes" on public.class_members;
create policy "teachers can add students to owned classes"
on public.class_members for insert
to authenticated
with check (
  role = 'student'
  and public.is_class_teacher(class_id)
  and exists (
    select 1
    from public.users
    where users.id = class_members.user_id
      and users.role = 'student'
  )
);

drop policy if exists "teachers can update student memberships in owned classes" on public.class_members;
create policy "teachers can update student memberships in owned classes"
on public.class_members for update
to authenticated
using (public.is_class_teacher(class_id))
with check (public.is_class_teacher(class_id));
```

## Assignment RLS Policies

Run this when enabling assignments and submissions:

```sql
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;

drop policy if exists "teachers can create assignments for owned classes" on public.assignments;
create policy "teachers can create assignments for owned classes"
on public.assignments for insert
to authenticated
with check (
  exists (
    select 1
    from public.classes
    where classes.id = assignments.class_id
      and classes.teacher_id = auth.uid()
  )
);

drop policy if exists "class members can view assignments" on public.assignments;
create policy "class members can view assignments"
on public.assignments for select
to authenticated
using (
  exists (
    select 1
    from public.classes
    where classes.id = assignments.class_id
      and classes.teacher_id = auth.uid()
  )
  or exists (
    select 1
    from public.class_members
    where class_members.class_id = assignments.class_id
      and class_members.user_id = auth.uid()
  )
);

drop policy if exists "students can submit own assignments" on public.submissions;
create policy "students can submit own assignments"
on public.submissions for insert
to authenticated
with check (
  student_id = auth.uid()
  and exists (
    select 1
    from public.assignments
    join public.class_members on class_members.class_id = assignments.class_id
    where assignments.id = submissions.assignment_id
      and class_members.user_id = auth.uid()
      and class_members.role = 'student'
  )
);

drop policy if exists "students can update own submissions" on public.submissions;
create policy "students can update own submissions"
on public.submissions for update
to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

drop policy if exists "teachers and owners can view submissions" on public.submissions;
create policy "teachers and owners can view submissions"
on public.submissions for select
to authenticated
using (
  student_id = auth.uid()
  or exists (
    select 1
    from public.assignments
    join public.classes on classes.id = assignments.class_id
    where assignments.id = submissions.assignment_id
      and classes.teacher_id = auth.uid()
  )
);

drop policy if exists "teachers can evaluate submissions" on public.submissions;
create policy "teachers can evaluate submissions"
on public.submissions for update
to authenticated
using (
  exists (
    select 1
    from public.assignments
    join public.classes on classes.id = assignments.class_id
    where assignments.id = submissions.assignment_id
      and classes.teacher_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.assignments
    join public.classes on classes.id = assignments.class_id
    where assignments.id = submissions.assignment_id
      and classes.teacher_id = auth.uid()
  )
);
```

## Current Phase 1 Flow

1. User signs up with name, email, password, and role
2. Supabase Auth creates the identity
3. If Supabase returns a session immediately, the app inserts a matching row in `users`
4. If email confirmation is enabled, the profile row is created on the first successful sign-in
5. Teacher can create a class from `/classes`
6. Teacher-owned and student-joined classes load from the database
7. Classroom detail pages show announcements, chat, and materials
8. Session rooms log attendance and browser proctoring events
9. Analytics pages compute and persist transparent engagement and integrity scores
