# ClassyGenz Development Architecture

Tagline: Smart Classrooms for the Next Generation

## Product Layers

### 1. Experience Layer
- `app/` routes for dashboard, classes, sessions, proctoring, and analytics
- Reusable UI in `components/`
- Tailwind-based design system for rapid MVP iteration

### 2. Platform Layer
- `lib/supabase/` for browser and server Supabase clients
- Supabase Auth for login, session management, and role-aware access
- Supabase Realtime for chat, announcements, and live dashboard updates

### 3. Classroom Domain Layer
- Classes, members, materials, assignments, submissions, and live sessions
- Each domain entity is modeled in Postgres and surfaced through typed queries

### 4. Monitoring Layer
- Browser detectors log classroom behavior events
- Events are written to the `events` table with `user_id`, `session_id`, and `type`
- Optional evidence uploads map back to event records or sessions

### 5. Intelligence Layer
- Supabase Edge Functions compute engagement and integrity scores
- Teacher dashboard reads from `scores` and `events`
- Later AI features can extend this layer without rebuilding the classroom flows

## Recommended Build Sequence

1. Auth and role-aware access
2. Class creation, membership, and announcements
3. Materials, assignments, and submissions
4. Session creation and attendance
5. Proctoring event ingestion
6. Score calculation and dashboard reporting

## Folder Intent

- `app/`: route-level pages and server components
- `components/`: shared visual building blocks
- `lib/`: config, utility helpers, Supabase adapters, and future domain services
- `docs/`: architecture notes, schema, and implementation decisions
