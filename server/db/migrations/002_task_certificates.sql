-- Additive migration. Safe to run repeatedly on an existing database:
-- it never drops or rewrites anything, unlike db/schema.sql.

-- 1. A task can award a certificate when it is completed. Off by default, so
--    adding a lab never silently starts issuing certificates for it.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS awards_certificate BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Certificates were originally per-course only. Allow per-task certificates
--    alongside them: course_id becomes optional, task_id is the new target.
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS task_id INT REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE certificates ALTER COLUMN course_id DROP NOT NULL;

-- 3. The title and the recipient's name are snapshotted at issue time. A
--    certificate is a record of what was achieved on that date — renaming the
--    lab, or the student changing their display name later, must not rewrite
--    a certificate that has already been issued and shared.
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS title VARCHAR(200);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(150);

-- 4. One certificate per student per task. A partial index rather than a table
--    constraint, so the older per-course rows (task_id IS NULL) are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS certificates_user_task_uniq
    ON certificates (user_id, task_id)
    WHERE task_id IS NOT NULL;

-- 5. Git Task 1 is the first lab to award one.
UPDATE tasks SET awards_certificate = TRUE WHERE id = 1;
