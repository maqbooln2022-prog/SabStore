-- 015: Admin audit log
--
-- Every destructive or sensitive admin action (suspend, reinstate,
-- delete shop, update member, transfer ownership) is written here
-- server-side via the service-role key so the record can't be
-- tampered with by the admin UI.
--
-- admin_id has no FK to auth.users — audit rows should survive even
-- if the admin account is later removed.

create table admin_audit_log (
  id          uuid primary key default uuid_generate_v4(),
  admin_id    uuid not null,
  action      text not null,       -- 'suspend_owner' | 'reinstate_owner' | 'delete_shop' | 'update_member' | 'transfer_ownership'
  target_type text not null,       -- 'owner' | 'shop' | 'member'
  target_id   text,                -- uuid of the affected row
  meta        jsonb,               -- extra context: email, shop name, etc.
  created_at  timestamptz not null default now()
);

create index admin_audit_log_created_at_idx on admin_audit_log(created_at desc);
create index admin_audit_log_admin_id_idx   on admin_audit_log(admin_id);

-- RLS: nobody reads this table via the anon/authenticated client —
-- all reads go through app/api/admin/* with the service-role key,
-- same pattern as platform_admins.
alter table admin_audit_log enable row level security;
