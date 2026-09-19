-- How a non-credit bill was actually collected. Separate from
-- payment_type (cash/credit), which governs udhaar — this tracks cash vs
-- digital so Day Close can tell physical cash-in-drawer apart from UPI/
-- card/bank collections instead of assuming every non-credit bill was cash.
-- Defaulting existing rows to 'cash' is correct: they predate this column,
-- when the only way to get paid outside udhaar was physical cash.
alter table bills add column if not exists payment_method text not null default 'cash'
  check (payment_method in ('cash', 'upi', 'card', 'bank'));
