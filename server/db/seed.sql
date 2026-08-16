-- Seed Data for DevOps Learning Platform

-- 1. Insert Default Categories
INSERT INTO categories (id, name, slug, description, icon) VALUES
(1, 'Git Version Control', 'git', 'Master distributed source control, branching strategies, rebase, and GitHub workflows.', 'GitBranch'),
(2, 'Docker & Containers', 'docker', 'Learn containerization, Dockerfiles, docker-compose, and container networking.', 'Container'),
(3, 'Terraform IaC', 'terraform', 'Infrastructure as Code with HashiCorp Terraform, HCL, states, and modules.', 'Layers'),
(4, 'Kubernetes Orchestration', 'kubernetes', 'Manage containerized applications with K8s pods, deployments, services, and ingress.', 'Server'),
(5, 'YAML Configuration', 'yaml', 'Learn YAML — the simple text format used to write settings for almost every modern tool.', 'FileCode'),
(6, 'Ansible Automation', 'ansible', 'Run one command and change every server. Inventories, playbooks, roles and safe rollouts.', 'Workflow')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon;

-- 2. Insert Default Courses
INSERT INTO courses (id, category_id, title, slug, description, level, is_published) VALUES
(1, 1, 'Git & GitHub Essentials', 'git-essentials', 'Hands-on practical guide to mastering version control.', 'Beginner', true),
(2, 2, 'Docker Fundamentals & Microservices', 'docker-fundamentals', 'Containerize applications and orchestrate with Docker Compose.', 'Intermediate', true),
(3, 3, 'Terraform Infrastructure Automation', 'terraform-automation', 'Automate cloud infrastructure provisioning cleanly.', 'Intermediate', true),
(4, 4, 'Kubernetes Administration & Deployment', 'k8s-administration', 'Deploy resilient clusters and microservices on K8s.', 'Advanced', true),
(5, 5, 'YAML for DevOps Engineers', 'yaml-for-devops', 'Learn to read and write the settings files that every DevOps tool expects. No prior experience needed.', 'Beginner', true),
(6, 6, 'Ansible Quest: Intern to Automation Lead', 'ansible-quest', 'A four-part story. You inherit a rack of undocumented servers as an intern and leave owning the automation platform.', 'Beginner', true)
ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  level = EXCLUDED.level,
  is_published = EXCLUDED.is_published;

-- 3. Insert Default Modules
INSERT INTO modules (id, course_id, title, sequence_order, description) VALUES
(1, 1, 'Git Basics & Repositories', 1, 'Understanding working tree, staging, and commits.'),
(2, 2, 'Docker Basics & Images', 1, 'Building efficient Docker containers.'),
(3, 3, 'Terraform HCL Basics', 1, 'Writing declarative HCL configurations.'),
(4, 4, 'Kubernetes Core Concepts', 1, 'Pods, ReplicaSets, and Deployments.'),
(5, 5, 'YAML Syntax Fundamentals', 1, 'Names and values, lists, text over several lines, and reusing settings.'),
(6, 6, 'The Ansible Quest', 1, 'Four chapters: take the keys, make it safe to run twice, survive the rollout, own the platform.')
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  sequence_order = EXCLUDED.sequence_order,
  description = EXCLUDED.description;

-- 4. Insert Default Tasks
-- Every category has a real lab. is_coming_soon stays in the schema so a new
-- category can be announced before its lab is written.
INSERT INTO tasks (id, module_id, category_id, title, slug, description, difficulty, points, estimated_minutes, file_path, is_coming_soon) VALUES
(1, 1, 1, 'Git Task 1: Git, Finally Explained', 'git-task-1', 'The end of Report_Final_v2_REALLY_FINAL.docx. Eleven hands-on exercises built around a group report you have basically already lived through: init, add, commit, status, log, branches, a merge conflict you fix by hand, and rebase. Awards a certificate.', 'Easy', 100, 35, 'tasks/git/task1.html', FALSE),
(12, 1, 1, 'Git Task 2: Undoing Things Safely', 'git-task-2', 'Three different undos and how to pick one. Throw away an unsaved edit, take back a commit that is still yours, and correct a commit the whole team already has — without rewriting history everyone shares.', 'Medium', 150, 25, 'tasks/git/task2.html', FALSE),
(13, 1, 1, 'Git Task 3: When Two People Edit One File', 'git-task-3', 'Cause a merge conflict on purpose, read what Git actually wrote into the file, and finish the merge. Conflicts stop being frightening once you have made one deliberately.', 'Medium', 150, 25, 'tasks/git/task3.html', FALSE),
(2, 2, 2, 'Docker Task 1: The Same App Everywhere', 'docker-task-1', 'Why an app that runs on one laptop fails on another, and how a Dockerfile fixes it. Write one, then make the rebuild fast, the image small, and the container stop running as administrator.', 'Easy', 150, 30, 'tasks/docker/task1.html', FALSE),
(3, 3, 3, 'Terraform Task 1: Infrastructure You Can Rebuild', 'terraform-task-1', 'Servers made by clicking cannot be rebuilt. Describe them in a file instead: one server, then two, then variables and count — and prove that running it twice changes nothing.', 'Medium', 150, 35, 'tasks/terraform/task1.html', FALSE),
(14, 3, 3, 'Terraform Task 2: Changing What Already Exists', 'terraform-task-2', 'Creating from nothing is the easy half. Read a plan before you apply it: which changes happen in place, which quietly destroy and rebuild the machine, and why deleting a block is how you delete a server.', 'Medium', 200, 30, 'tasks/terraform/task2.html', FALSE),
(15, 3, 3, 'Terraform Task 3: One Block, Many Servers', 'terraform-task-3', 'Build a fleet from one block. count for interchangeable copies, for_each when each machine has an identity — then remove one from the middle and see why the choice mattered.', 'Medium', 200, 30, 'tasks/terraform/task3.html', FALSE),
(4, 4, 4, 'Kubernetes Task 1: Many Copies, Kept Alive', 'kubernetes-task-1', 'Ask for three copies of an app and keep them alive. Covers the label mismatch that breaks silently, putting one stable address in front of copies that come and go, and why running is not the same as ready.', 'Medium', 200, 40, 'tasks/kubernetes/task1.html', FALSE),
(16, 4, 4, 'Kubernetes Task 2: Why Won’t It Start?', 'kubernetes-task-2', 'Three broken deployments and the statuses that name their own cause: an image that cannot be pulled, a memory limit that kills the app on startup, and the quiet one — Running, no errors, and never Ready.', 'Medium', 200, 30, 'tasks/kubernetes/task2.html', FALSE),
(17, 4, 4, 'Kubernetes Task 3: Changing Version Without Going Down', 'kubernetes-task-3', 'Upgrade an app while people are using it. Watch capacity hit zero with Recreate, hold at two of three with a rolling update, then add the readiness probe that makes a bad version stall instead of taking the service down.', 'Medium', 200, 30, 'tasks/kubernetes/task3.html', FALSE),
-- A bundle lab (ADR-010): a directory of index.html plus its own assets.
(11, 2, 2, 'Docker Task 2: Compose Quest', 'docker-task-2', 'A five-chapter build-it game. Assemble a real two-container shop: add the pieces, connect them by name, keep the data when a container is replaced, and open exactly one door to the outside world.', 'Medium', 200, 30, 'tasks/docker/compose-quest', FALSE),
(18, 2, 2, 'Docker Task 3: Running It, and Reaching It', 'docker-task-3', 'A container is running and nobody can reach it. Publish a port, discover why the two numbers are not interchangeable, and use ps -a and logs to find out why a container will not stay up.', 'Medium', 200, 30, 'tasks/docker/task3.html', FALSE),
(5, 5, 5, 'YAML Task 1: The Basics', 'yaml-task-1', 'Start from zero. What YAML actually is, the difference between text, whole numbers, decimals and true/false, and how to write a settings file line by line from an empty box. No prior experience needed.', 'Easy', 100, 25, 'tasks/yaml/task1.html', FALSE),
(6, 5, 5, 'YAML Part 2 - 3:14 AM The Callout', 'yaml-task-2', 'A payment service goes down in the night and the settings file is broken in six places. Fix each fault for real — tabs, values that changed type, misaligned lists, block text, reused settings, and splitting one file into two.', 'Medium', 150, 30, 'tasks/yaml/task2.html', FALSE),
(19, 5, 5, 'YAML Task 3: YAML in the Wild', 'yaml-task-3', 'Build a real CI workflow file: a list whose items are themselves sets of settings, the key that turns into true when you leave it unquoted, and making one job wait for another.', 'Medium', 150, 30, 'tasks/yaml/task3.html', FALSE),
(7, 6, 6, 'Ansible Quest 1: Take the Keys', 'ansible-task-1', 'You inherit a rack of servers nobody documented. Write the inventory, reach the machines with ad-hoc commands, and hand-write your first playbook. Intern to Junior SRE.', 'Easy', 150, 45, 'tasks/ansible/task1.html', FALSE),
(8, 6, 6, 'Ansible Quest 2: Safe to Run Twice', 'ansible-task-2', 'web02 is throwing 502s. Fix it with modules that describe a result, then make the fix idempotent — it has to run twice and change nothing the second time. Junior SRE to SRE.', 'Medium', 200, 50, 'tasks/ansible/task2.html', FALSE),
(9, 6, 6, 'Ansible Quest 3: Blast Radius', 'ansible-task-3', 'Split the monolith into roles, then roll a change out in batches that stop themselves when they go wrong. Ends with a real rolling upgrade: drain, deploy, health check, back into the load balancer. SRE to Senior SRE.', 'Hard', 250, 55, 'tasks/ansible/task3.html', FALSE),
(10, 6, 6, 'Ansible Quest 4: The Handover', 'ansible-task-4', 'Stop running the playbooks and start owning the platform. Get secrets out of the repository, pin your collections, and gate every change on lint, converge and an idempotence check. Senior SRE to Automation Lead.', 'Hard', 250, 60, 'tasks/ansible/task4.html', FALSE)
-- Re-seeding refreshes the catalogue copy. Student progress lives in
-- student_progress and is keyed by task id, so it survives these updates.
ON CONFLICT (id) DO UPDATE SET
  module_id = EXCLUDED.module_id,
  category_id = EXCLUDED.category_id,
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  difficulty = EXCLUDED.difficulty,
  points = EXCLUDED.points,
  estimated_minutes = EXCLUDED.estimated_minutes,
  file_path = EXCLUDED.file_path,
  is_coming_soon = EXCLUDED.is_coming_soon;

-- Which labs award a certificate on completion. Authoritative: this is the
-- single place the list lives, so re-seeding always reconciles it.
UPDATE tasks SET awards_certificate = (id IN (1));

-- Reset Sequences to avoid ID collisions
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('courses_id_seq', (SELECT MAX(id) FROM courses));
SELECT setval('modules_id_seq', (SELECT MAX(id) FROM modules));
SELECT setval('tasks_id_seq', (SELECT MAX(id) FROM tasks));
