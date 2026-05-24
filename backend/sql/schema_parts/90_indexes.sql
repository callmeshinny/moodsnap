create unique index if not exists users_username_normalized_unique_idx
  on public.users (username_normalized);

drop index if exists public.users_username_lower_unique_idx;
drop index if exists public.users_email_idx;

create index if not exists pending_registrations_username_idx on public.pending_registrations (username_normalized);
drop index if exists public.pending_registrations_email_idx;

create index if not exists password_reset_otps_email_used_created_at_idx
  on public.password_reset_otps (email, is_used, created_at desc);
drop index if exists public.password_reset_otps_email_used_idx;

create index if not exists friendships_user_one_status_created_idx
  on public.friendships (user_one_id, status, created_at desc);
create index if not exists friendships_user_two_status_created_idx
  on public.friendships (user_two_id, status, created_at desc);
drop index if exists public.friendships_status_idx;
drop index if exists public.friendships_user_one_idx;
drop index if exists public.friendships_user_two_idx;

drop index if exists public.blocked_users_blocker_idx;
create index if not exists blocked_users_blocked_idx on public.blocked_users (blocked_user_id);
create index if not exists user_reports_reported_idx on public.user_reports (reported_user_id);

create index if not exists moodsnap_user_created_at_idx
  on public.moodsnap (user_id, created_at desc);
drop index if exists public.moodsnap_user_id_idx;
drop index if exists public.moodsnap_created_at_idx;

drop index if exists public.app_ratings_user_id_idx;
drop index if exists public.app_ratings_rating_idx;

create index if not exists notification_tokens_active_user_token_idx
  on public.notification_tokens (user_id, expo_push_token)
  where is_active = true;
drop index if exists public.notification_tokens_user_id_idx;
drop index if exists public.notification_tokens_active_idx;

drop index if exists public.notification_preferences_user_id_idx;
drop index if exists public.notification_reminder_state_user_id_idx;
drop index if exists public.notification_reminder_state_last_snap_at_idx;
