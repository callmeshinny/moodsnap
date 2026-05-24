# MoodSnap SQL Schema

Use `schema.sql` when you want one pasteable, all-in-one schema file.

Use `schema_parts/` when you want to read or review the schema by domain:

1. `01_identity.sql` - extensions, users, signup OTP, password reset OTP.
2. `02_social.sql` - friendships, blocks, reports.
3. `03_content.sql` - snaps and app ratings.
4. `04_notifications.sql` - push tokens, preferences, reminder state.
5. `90_indexes.sql` - indexes and legacy index cleanup.

`backend/supabase/schema.sql` is kept in sync with `backend/sql/schema.sql`.
