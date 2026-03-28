-- enable_auto_application_id_mysql.sql
--
-- Usage: run this on your MySQL / MariaDB database to make `application_id` auto-increment
-- for an existing table `loan_applications` (adjust table/column names as needed).
--
-- NOTE: MySQL requires the AUTO_INCREMENT column to be an indexed integer primary key.
-- If `application_id` is already the PRIMARY KEY, this will ALTER it to AUTO_INCREMENT.
-- If not, you'll need to add the primary key/index.

-- IMPORTANT: Back up your database before running any migration. Test on a staging DB first.

-- Example (adjust schema/table as necessary):

ALTER TABLE loan_applications
  MODIFY COLUMN application_id INT NOT NULL AUTO_INCREMENT;

-- After modifying the column, make sure the AUTO_INCREMENT next value is set to max+1
-- (MySQL will auto-adjust, but you can explicitly set it):

SET @maxid = (SELECT IFNULL(MAX(application_id), 0) FROM loan_applications);
SET @next = @maxid + 1;
SET @@session.sql_mode=REPLACE(@@session.sql_mode,'NO_AUTO_VALUE_ON_ZERO','');
ALTER TABLE loan_applications AUTO_INCREMENT = @next;

-- If the column is not PRIMARY KEY or INDEXED, you must add an index/PK first. For example:
-- ALTER TABLE loan_applications ADD PRIMARY KEY (application_id);

-- If your current values are non-unique or contain 0 or negative values, you'll need to clean them first.
