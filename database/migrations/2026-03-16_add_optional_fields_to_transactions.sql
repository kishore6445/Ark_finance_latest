-- Add optional transaction metadata fields used in the Inbox flow.
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS bucket_id UUID,
  ADD COLUMN IF NOT EXISTS vendor_customer_name VARCHAR,
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR,
  ADD COLUMN IF NOT EXISTS bank_account_id UUID,
  ADD COLUMN IF NOT EXISTS accounting_type VARCHAR,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
