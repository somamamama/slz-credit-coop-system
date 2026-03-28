-- enable_auto_application_id_postgres.sql
--
-- Usage: run this on your PostgreSQL database to make `application_id` auto-generated
-- for an existing table `loan_applications` (adjust table/column names as needed).
--
-- This script will:
-- 1. Create a sequence (if not present)
-- 2. Set the application_id default to nextval(sequence)
-- 3. Set the sequence's current value to max(application_id)
-- 4. Ensure the column is NOT NULL
--
-- IMPORTANT: Back up your database before running any migration. Test on a staging DB first.

BEGIN;

-- adjust these names to match your actual schema/table
DO $$
DECLARE
    _table_name text := 'loan_applications';
    _column_name text := 'application_id';
    _seq_name text := _table_name || '_' || _column_name || '_seq';
    _max_id bigint;
BEGIN
    -- create sequence if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'S' AND n.nspname = 'public' AND c.relname = _seq_name) THEN
        EXECUTE format('CREATE SEQUENCE public.%I;', _seq_name);
    END IF;

    -- set default to use the sequence
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I SET DEFAULT nextval(''public.%I'');', _table_name, _column_name, _seq_name);

    -- set sequence ownership to the column
    EXECUTE format('ALTER SEQUENCE public.%I OWNED BY public.%I.%I;', _seq_name, _table_name, _column_name);

    -- set the sequence current value to max(id) so nextval gives max+1
    EXECUTE format('SELECT MAX(%I) FROM public.%I;', _column_name, _table_name) INTO _max_id;
    IF _max_id IS NULL THEN
        _max_id := 0;
    END IF;
    -- set sequence to max_id
    EXECUTE format('SELECT setval(pg_get_serial_sequence(''public.%I'', ''%I''), %s, true);', _table_name, _column_name, _max_id);

    -- make column NOT NULL (if you want)
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I SET NOT NULL;', _table_name, _column_name);
END$$;

COMMIT;

-- After running this script, any new inserts that omit application_id will receive auto-generated values.
-- If you need all inserts to use the sequence (including those that set application_id to NULL), consider adding a trigger.
