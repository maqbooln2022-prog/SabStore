-- 009: Fixed monthly costs
--
-- Different concept from `expenses` (a log of variable, one-off costs
-- that already happened on a specific date). This is a set of *standing*
-- recurring cost definitions — rent, salaries, subscriptions — each with
-- a monthly amount and a due day, not tied to any single payment event.
--
-- Run this in the Supabase SQL editor after 001-008.

create table fixed_expenses (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references shops(id) on delete cascade,
  name text not null,
  category text not null,
  amount numeric(12,2) not null,
  due_day int not null check (due_day between 1 and 28),
  created_at timestamptz not null default now()
);
create index fixed_expenses_shop_id_idx on fixed_expenses(shop_id);
alter table fixed_expenses enable row level security;

create policy "Members can view fixed_expenses" on fixed_expenses for select
  using (is_shop_member(shop_id));
create policy "Members with expenses permission can insert fixed_expenses" on fixed_expenses for insert
  with check (has_shop_permission(shop_id, 'expenses'));
create policy "Members with expenses permission can update fixed_expenses" on fixed_expenses for update
  using (has_shop_permission(shop_id, 'expenses')) with check (has_shop_permission(shop_id, 'expenses'));
create policy "Members with expenses permission can delete fixed_expenses" on fixed_expenses for delete
  using (has_shop_permission(shop_id, 'expenses'));
