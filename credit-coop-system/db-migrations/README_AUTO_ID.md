Auto-ID migration scripts
=========================

Inside this folder you'll find SQL scripts for enabling auto-generated IDs for an existing integer primary key column named `application_id` on a table assumed to be `loan_applications`.

Files:
- enable_auto_application_id_postgres.sql - For PostgreSQL databases. This creates a sequence and sets the column default to nextval(sequence), aligns the sequence to the current max id, and sets the column NOT NULL.
- enable_auto_application_id_mysql.sql - For MySQL / MariaDB. This alters the column to AUTO_INCREMENT and sets the next auto-increment value to max(existing ids)+1.

How to use
----------
1. BACKUP your database before running anything.
2. Inspect the scripts and edit table/column names if your table isn't exactly `loan_applications` / `application_id`.
3. Test on a staging copy.

Postgres example (psql):
  psql -h HOST -U USER -d DBNAME -f db-migrations/enable_auto_application_id_postgres.sql

MySQL example (mysql client):
  mysql -h HOST -u USER -p DBNAME < db-migrations/enable_auto_application_id_mysql.sql

Notes and caveats
-----------------
- If your table currently has non-unique or NULL values in `application_id`, you'll need to clean those prior to converting.
- For Postgres, the script creates a sequence and sets ownership; it will set the sequence's current value to the max existing id so future nextval() calls continue from max+1.
- For MySQL, AUTO_INCREMENT requires the column to be indexed; if it's not PRIMARY KEY or indexed, add an index first.
- If you want to auto-generate UUIDs rather than sequential integers, let me know and I can provide a migration script and optional trigger to populate UUIDs on insert.
