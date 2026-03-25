ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS "dueDate" date;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'invoices'
      AND column_name = 'due_date'
  ) THEN
    UPDATE public.invoices
    SET "dueDate" = COALESCE("dueDate", due_date)
    WHERE "dueDate" IS NULL;
  END IF;
END $$;
