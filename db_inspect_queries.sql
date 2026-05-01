-- DB inspection queries for Team Task Manager (Postgres)

-- 1. List all tables in public schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Describe columns for a table (replace 'tasks')
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;

-- 3. Quick row counts for main tables
SELECT 'users' AS table_name, COUNT(*) FROM users
UNION ALL
SELECT 'workspaces', COUNT(*) FROM workspaces
UNION ALL
SELECT 'workspace_members', COUNT(*) FROM workspace_members
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'task_assignees', COUNT(*) FROM task_assignees;

-- 4. Show latest tasks (most recent 50)
SELECT * FROM tasks ORDER BY created_at DESC LIMIT 50;

-- 5. Overdue tasks (not done)
SELECT * FROM tasks
WHERE due_date IS NOT NULL
  AND due_date < now()
  AND status <> 'done'
ORDER BY due_date ASC;

-- 6. Tasks assigned to a given user (multi-assignee + legacy assigned_to fallback)
-- Replace :user_id with actual numeric id
WITH multi AS (
  SELECT t.*
  FROM tasks t
  JOIN task_assignees ta ON ta.task_id = t.id
  WHERE ta.user_id = :user_id
), legacy AS (
  SELECT * FROM tasks WHERE assigned_to = :user_id
)
SELECT * FROM multi
UNION
SELECT * FROM legacy
ORDER BY due_date NULLS LAST;

-- 7. List assignees for a task
-- Replace :task_id
SELECT ta.user_id, u.email, ta.assigned_at
FROM task_assignees ta
JOIN users u ON u.id = ta.user_id
WHERE ta.task_id = :task_id;

-- 8. Workspace members
-- Replace :workspace_id
SELECT wm.user_id, u.email, wm.role, wm.joined_at
FROM workspace_members wm
LEFT JOIN users u ON u.id = wm.user_id
WHERE wm.workspace_id = :workspace_id
ORDER BY wm.role DESC, u.email;

-- 9. Member progress for a workspace (completed/total & percentage)
-- Replace :workspace_id
SELECT
  wm.user_id,
  u.email,
  SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS completed_tasks,
  COUNT(t.id) AS total_tasks,
  CASE WHEN COUNT(t.id) = 0 THEN 0
       ELSE ROUND(100.0 * SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) / COUNT(t.id), 2)
  END AS completion_percentage
FROM workspace_members wm
LEFT JOIN users u ON u.id = wm.user_id
LEFT JOIN tasks t ON t.workspace_id = wm.workspace_id
  AND (
    t.id IN (SELECT task_id FROM task_assignees WHERE user_id = wm.user_id)
    OR t.assigned_to = wm.user_id
  )
WHERE wm.workspace_id = :workspace_id
GROUP BY wm.user_id, u.email
ORDER BY completion_percentage DESC;

-- 10. Dashboard stats (per workspace): total tasks, overdue, completed
SELECT
  w.id AS workspace_id,
  w.name,
  COUNT(t.id) AS total_tasks,
  SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS completed_tasks,
  SUM(CASE WHEN t.due_date IS NOT NULL AND t.due_date < now() AND t.status <> 'done' THEN 1 ELSE 0 END) AS overdue_tasks
FROM workspaces w
LEFT JOIN tasks t ON t.workspace_id = w.id
GROUP BY w.id, w.name
ORDER BY w.name;

-- 11. Find dangling/legacy assigned_to values (tasks with assigned_to but no entry in task_assignees)
SELECT t.id, t.title, t.assigned_to
FROM tasks t
LEFT JOIN task_assignees ta ON ta.task_id = t.id AND ta.user_id = t.assigned_to
WHERE t.assigned_to IS NOT NULL
  AND ta.id IS NULL;

-- 12. Check foreign key integrity (quick checks)
-- tasks.workspace_id references workspaces
SELECT t.id FROM tasks t LEFT JOIN workspaces w ON t.workspace_id = w.id WHERE w.id IS NULL LIMIT 10;
-- workspace_members.user_id references users
SELECT wm.id FROM workspace_members wm LEFT JOIN users u ON wm.user_id = u.id WHERE u.id IS NULL LIMIT 10;

