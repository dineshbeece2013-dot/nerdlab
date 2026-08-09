import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { taskService } from '../../services/taskService';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertBanner from '../../components/common/AlertBanner';
import {
  ArrowLeft,
  Trash2,
  Search,
  Upload,
  Database,
  AlertTriangle,
  X,
  FolderPlus,
  Layers,
  FileCode2,
  Clock,
  Award,
  Pencil,
  Save,
} from 'lucide-react';

const DIFFICULTY_STYLES = {
  Easy: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  Medium: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  Hard: 'bg-red-500/10 border-red-500/30 text-red-400',
};

const AdminManageTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  const [confirmTask, setConfirmTask] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Edit task dialog
  const [editTask, setEditTask] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  // New category form
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);

  const loadData = async () => {
    try {
      const [taskRes, catRes] = await Promise.all([
        taskService.getTasks(),
        taskService.getCategories(),
      ]);
      setTasks(taskRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to load tasks.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTasks = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (categoryFilter !== 'all' && t.category_slug !== categoryFilter) return false;
      if (difficultyFilter !== 'all' && t.difficulty !== difficultyFilter) return false;
      if (term && !(`${t.title} ${t.description || ''}`.toLowerCase().includes(term))) return false;
      return true;
    });
  }, [tasks, search, categoryFilter, difficultyFilter]);

  const handleDelete = async () => {
    if (!confirmTask) return;
    setDeletingId(confirmTask.id);
    setAlert(null);

    try {
      await adminService.deleteTask(confirmTask.id);
      setTasks((prev) => prev.filter((t) => t.id !== confirmTask.id));
      setAlert({ type: 'success', message: `Task "${confirmTask.title}" and its HTML file were deleted.` });
      setConfirmTask(null);
      // Refresh category counts
      const catRes = await taskService.getCategories();
      setCategories(catRes.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to delete task.' });
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (task) => {
    setEditTask(task);
    setEditError(null);
    setEditForm({
      title: task.title || '',
      description: task.description || '',
      difficulty: task.difficulty || 'Easy',
      points: String(task.points ?? 100),
      estimatedMinutes: String(task.estimated_minutes ?? 30),
      categorySlug: task.category_slug || '',
      isComingSoon: !!task.is_coming_soon,
    });
  };

  const closeEdit = () => {
    setEditTask(null);
    setEditForm(null);
    setEditError(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTask || !editForm) return;

    if (!editForm.title.trim()) {
      setEditError('Title cannot be empty.');
      return;
    }

    setSavingEdit(true);
    setEditError(null);
    try {
      const res = await adminService.updateTask(editTask.id, {
        title: editForm.title,
        description: editForm.description,
        difficulty: editForm.difficulty,
        points: editForm.points,
        estimatedMinutes: editForm.estimatedMinutes,
        categorySlug: editForm.categorySlug,
        isComingSoon: editForm.isComingSoon,
      });
      const updated = res.data;
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
      setAlert({ type: 'success', message: `Task "${updated.title}" updated.` });
      closeEdit();
      // Category counts change when a task is reassigned
      const catRes = await taskService.getCategories();
      setCategories(catRes.data || []);
    } catch (err) {
      setEditError(err.message || 'Failed to update task.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setCreatingCategory(true);
    setAlert(null);
    try {
      const res = await adminService.createCategory({
        name: newCategoryName,
        description: newCategoryDesc,
      });
      setCategories((prev) => [...prev, { ...res.data, total_tasks: 0 }]);
      setNewCategoryName('');
      setNewCategoryDesc('');
      setAlert({ type: 'success', message: `Category "${res.data.name}" created.` });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to create category.' });
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    setDeletingCategoryId(category.id);
    setAlert(null);
    try {
      await adminService.deleteCategory(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      setAlert({ type: 'success', message: `Category "${category.name}" deleted.` });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to delete category.' });
    } finally {
      setDeletingCategoryId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage label="Loading task catalog..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link
            to="/admin"
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </Link>
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Database className="w-3.5 h-3.5" />
              <span>Admin · Manage Tasks</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Task &amp; Category Management</h1>
          </div>
        </div>

        <Link
          to="/admin/tasks/upload"
          className="px-5 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 flex items-center space-x-2 transition-all"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Task</span>
        </Link>
      </div>

      {alert && <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Category management */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-5">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Categories</span>
        </h2>

        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="group flex items-center space-x-2 pl-3 pr-2 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-sm"
            >
              <span className="text-white font-semibold">{c.name}</span>
              <span className="text-xs text-slate-500 font-mono">/{c.slug}</span>
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400">{c.total_tasks ?? 0}</span>
              <button
                onClick={() => handleDeleteCategory(c)}
                disabled={deletingCategoryId === c.id || (c.total_tasks ?? 0) > 0}
                title={(c.total_tasks ?? 0) > 0 ? 'Delete its tasks first' : 'Delete category'}
                className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-slate-500">No categories yet — create one below.</p>
          )}
        </div>

        <form onSubmit={handleCreateCategory} className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-800">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category name (e.g. Ansible)"
            className="flex-1 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
          />
          <input
            type="text"
            value={newCategoryDesc}
            onChange={(e) => setNewCategoryDesc(e.target.value)}
            placeholder="Short description (optional)"
            className="flex-1 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
          />
          <button
            type="submit"
            disabled={creatingCategory || !newCategoryName.trim()}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 font-bold rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <FolderPlus className="w-4 h-4" />
            <span>{creatingCategory ? 'Adding...' : 'Add Category'}</span>
          </button>
        </form>
      </div>

      {/* Filters */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-4 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by title or description..."
            className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
        >
          <option value="all">All difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      {/* Task list */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
            <FileCode2 className="w-4 h-4 text-sky-400" />
            <span>Tasks</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {filteredTasks.length} of {tasks.length}
          </span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="px-6 py-16 text-center space-y-2">
            <FileCode2 className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400">No tasks match the current filters.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {filteredTasks.map((task) => (
              <li key={task.id} className="px-6 py-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-900/40 transition-colors">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-xs font-mono text-slate-600">#{task.id}</span>
                    <h3 className="text-sm font-bold text-white truncate">{task.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${DIFFICULTY_STYLES[task.difficulty] || DIFFICULTY_STYLES.Easy}`}>
                      {task.difficulty}
                    </span>
                    {task.is_coming_soon && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold bg-amber-500/10 border-amber-500/30 text-amber-400">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{task.description || 'No description.'}</p>
                  <p className="text-[11px] text-slate-600 font-mono truncate">{task.file_path}</p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-sky-400 font-semibold">
                    {task.category_name || 'Uncategorized'}
                  </span>
                  <span className="hidden sm:flex items-center space-x-1 text-xs text-amber-400 font-semibold">
                    <Award className="w-3.5 h-3.5" />
                    <span>{task.points}</span>
                  </span>
                  <span className="hidden sm:flex items-center space-x-1 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{task.estimated_minutes}m</span>
                  </span>
                  <button
                    onClick={() => openEdit(task)}
                    className="p-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 transition-all"
                    title="Edit task details"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmTask(task)}
                    disabled={deletingId === task.id}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 disabled:opacity-40 transition-all"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Edit task dialog */}
      {editTask && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4 py-8 overflow-y-auto">
          <form
            onSubmit={handleSaveEdit}
            className="glass-panel rounded-2xl border border-sky-500/30 bg-slate-900 p-6 max-w-2xl w-full space-y-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center flex-shrink-0">
                  <Pencil className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Edit task details</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    #{editTask.id} · {editTask.slug}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {editError}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="edit-title" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Title
              </label>
              <input
                id="edit-title"
                type="text"
                value={editForm.title}
                maxLength={150}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-desc" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Description
              </label>
              <textarea
                id="edit-desc"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="edit-category" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Category
                </label>
                <select
                  id="edit-category"
                  value={editForm.categorySlug}
                  onChange={(e) => setEditForm({ ...editForm, categorySlug: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="edit-difficulty" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Difficulty
                </label>
                <select
                  id="edit-difficulty"
                  value={editForm.difficulty}
                  onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="edit-points" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Points
                </label>
                <input
                  id="edit-points"
                  type="number"
                  min="0"
                  max="10000"
                  value={editForm.points}
                  onChange={(e) => setEditForm({ ...editForm, points: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="edit-minutes" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Estimated minutes
                </label>
                <input
                  id="edit-minutes"
                  type="number"
                  min="1"
                  max="1440"
                  value={editForm.estimatedMinutes}
                  onChange={(e) => setEditForm({ ...editForm, estimatedMinutes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                />
              </div>
            </div>

            <label className="flex items-start space-x-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.isComingSoon}
                onChange={(e) => setEditForm({ ...editForm, isComingSoon: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-amber-500/50"
              />
              <span className="text-sm">
                <span className="font-semibold text-white">Mark as “Coming Soon”</span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  Students still see it in the catalogue, but it cannot be opened and awards no points.
                </span>
              </span>
            </label>

            <p className="text-xs text-slate-500 border-t border-slate-800 pt-4">
              The URL slug and the lab file
              {' '}<code className="text-slate-400 font-mono">{editTask.file_path}</code>{' '}
              are not editable here — learners bookmark the slug, and the file is the lab itself.
              Re-upload the task to replace its content.
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={closeEdit}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="flex items-center space-x-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {confirmTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
          <div className="glass-panel rounded-2xl border border-red-500/30 bg-slate-900 p-6 max-w-md w-full space-y-5">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Delete this task?</h3>
                <p className="text-sm text-slate-400">
                  <span className="text-white font-semibold">"{confirmTask.title}"</span> will be removed from the
                  database along with its HTML file at{' '}
                  <code className="text-red-400 font-mono text-xs">{confirmTask.file_path}</code>.
                  All student progress for this task will also be deleted. This cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setConfirmTask(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deletingId === confirmTask.id}
                className="flex items-center space-x-2 px-5 py-2.5 bg-red-500 hover:bg-red-400 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deletingId === confirmTask.id ? 'Deleting...' : 'Delete Task'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManageTasks;
