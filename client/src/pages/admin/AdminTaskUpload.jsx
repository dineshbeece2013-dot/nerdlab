import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { taskService } from '../../services/taskService';
import AlertBanner from '../../components/common/AlertBanner';
import {
  Upload,
  ArrowLeft,
  Code2,
  FileCode2,
  Tag,
  Star,
  Clock,
  CheckCircle2,
  Terminal,
  FolderPlus,
  X,
} from 'lucide-react';

// NOTE: `value` must match the DB CHECK constraint on tasks.difficulty ('Easy' | 'Medium' | 'Hard')
const DIFFICULTIES = [
  { value: 'Easy', label: 'Beginner' },
  { value: 'Medium', label: 'Intermediate' },
  { value: 'Hard', label: 'Advanced' },
];

const TASK_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Lab Task</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem; line-height: 1.6; }
    h1 { color: #38bdf8; margin-top: 0; }
    h2 { color: #cbd5e1; font-size: 1rem; text-transform: uppercase; letter-spacing: .05em; }
    pre { background: #1e293b; padding: 1rem; border-radius: 8px; overflow-x: auto; }
    input[type=text] { background: #0b1220; border: 1px solid #334155; color: #e2e8f0; border-radius: 8px; padding: .6rem .8rem; width: 100%; max-width: 420px; font-family: monospace; }
    .step { background: #111c31; border: 1px solid #1e293b; border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1rem; }
    .step.done { border-color: #10b981; background: #0d2020; }
    .step h3 { margin: 0 0 .5rem; font-size: .95rem; color: #e2e8f0; }
    .step .status { float: right; font-size: .8rem; font-weight: bold; color: #64748b; }
    .step.done .status { color: #10b981; }
    .check { background: #0ea5e9; color: white; border: none; padding: .5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: bold; margin-top: .5rem; }
    .check:hover { background: #38bdf8; }
    .step.done .check { background: #10b981; cursor: default; }
    #progress { position: sticky; top: 0; background: #0f172a; padding: .75rem 0; margin-bottom: 1rem; font-weight: bold; }
    #bar { height: 8px; background: #1e293b; border-radius: 999px; overflow: hidden; margin-top: .5rem; }
    #fill { height: 100%; width: 0%; background: linear-gradient(90deg,#0ea5e9,#10b981); transition: width .3s; }
    #done-banner { display: none; background: #052e22; border: 1px solid #10b981; color: #6ee7b7; padding: 1rem 1.25rem; border-radius: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Task Title</h1>
  <p>Describe the objective of this lab exercise here.</p>

  <div id="progress">
    <span id="progress-text">0 of 3 steps complete</span>
    <div id="bar"><div id="fill"></div></div>
  </div>

  <!-- STEP 1 -->
  <div class="step" data-step="1">
    <span class="status">Pending</span>
    <h3>Step 1 — Initialise the repository</h3>
    <p>Type the command that creates a new Git repository:</p>
    <input type="text" placeholder="type the command here" />
    <br /><button class="check" onclick="checkStep(1, this)">Check step</button>
  </div>

  <!-- STEP 2 -->
  <div class="step" data-step="2">
    <span class="status">Pending</span>
    <h3>Step 2 — Stage your changes</h3>
    <p>Type the command that stages every file:</p>
    <input type="text" placeholder="type the command here" />
    <br /><button class="check" onclick="checkStep(2, this)">Check step</button>
  </div>

  <!-- STEP 3 -->
  <div class="step" data-step="3">
    <span class="status">Pending</span>
    <h3>Step 3 — Commit</h3>
    <p>Type the command that commits with a message:</p>
    <input type="text" placeholder="type the command here" />
    <br /><button class="check" onclick="checkStep(3, this)">Check step</button>
  </div>

  <div id="done-banner">All steps complete — your points have been awarded.</div>

  <script>
    // Define the correct answer for each step. Add or remove entries here and the
    // matching .step blocks above; the totals update automatically.
    var ANSWERS = {
      1: /^git\\s+init$/i,
      2: /^git\\s+add\\s+(\\.|-A|--all)$/i,
      3: /^git\\s+commit\\s+-m\\s+.+$/i
    };

    var completed = {};
    var TOTAL = document.querySelectorAll('.step').length;

    function render() {
      var count = Object.keys(completed).length;
      document.getElementById('progress-text').textContent = count + ' of ' + TOTAL + ' steps complete';
      document.getElementById('fill').style.width = (count / TOTAL * 100) + '%';

      if (count === TOTAL) {
        document.getElementById('done-banner').style.display = 'block';
        // Only now does the platform award points for this lab.
        window.parent.postMessage({ type: 'TASK_COMPLETED' }, '*');
      }
    }

    function checkStep(stepNumber, button) {
      var stepEl = document.querySelector('.step[data-step="' + stepNumber + '"]');
      if (completed[stepNumber]) return;

      var value = stepEl.querySelector('input').value.trim();
      if (!ANSWERS[stepNumber].test(value)) {
        stepEl.querySelector('.status').textContent = 'Incorrect — try again';
        return;
      }

      completed[stepNumber] = true;
      stepEl.classList.add('done');
      stepEl.querySelector('.status').textContent = 'Complete';
      button.textContent = 'Passed';
      render();
    }

    render();
  </script>
</body>
</html>`;

const AdminTaskUpload = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    categorySlug: '',
    description: '',
    difficulty: 'Easy',
    points: '100',
    estimatedMinutes: '30',
    htmlContent: TASK_HTML_TEMPLATE,
    fileName: '',
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [success, setSuccess] = useState(false);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await taskService.getCategories();
        const list = res.data || [];
        setCategories(list);
        setForm((prev) => ({ ...prev, categorySlug: prev.categorySlug || (list[0]?.slug ?? '') }));
      } catch (err) {
        setAlert({ type: 'error', message: err.message || 'Failed to load categories.' });
      } finally {
        setCategoriesLoading(false);
      }
    };
    loadCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    setAlert(null);

    try {
      const res = await adminService.createCategory({ name: newCategoryName });
      const created = res.data;
      setCategories((prev) => [...prev, created]);
      setForm((prev) => ({ ...prev, categorySlug: created.slug }));
      setNewCategoryName('');
      setShowNewCategory(false);
      setAlert({ type: 'success', message: `Category "${created.name}" created and selected.` });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to create category.' });
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!form.title.trim()) return setAlert({ type: 'error', message: 'Task title is required.' });
    if (!form.categorySlug) return setAlert({ type: 'error', message: 'Please pick or create a category.' });
    if (!form.htmlContent.trim()) return setAlert({ type: 'error', message: 'HTML content cannot be empty.' });
    if (parseInt(form.points, 10) < 1) return setAlert({ type: 'error', message: 'Points must be at least 1.' });

    setLoading(true);
    try {
      await adminService.uploadTask({
        ...form,
        points: parseInt(form.points, 10),
        estimatedMinutes: parseInt(form.estimatedMinutes, 10),
      });
      setSuccess(true);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to upload task.' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">Task Uploaded!</h1>
        <p className="text-slate-400">
          <span className="text-white font-semibold">"{form.title}"</span> has been saved and registered in the database.
        </p>
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => { setSuccess(false); setForm((prev) => ({ title: '', categorySlug: prev.categorySlug, description: '', difficulty: 'Easy', points: '100', estimatedMinutes: '30', htmlContent: TASK_HTML_TEMPLATE, fileName: '' })); }}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all"
          >
            Upload Another
          </button>
          <button
            onClick={() => navigate('/admin')}
            className="px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/admin"
          className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </Link>
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Upload className="w-3.5 h-3.5" />
            <span>Admin · Task Upload</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Upload New Lab Task</h1>
        </div>
      </div>

      {alert && <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column — metadata */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <Tag className="w-4 h-4 text-sky-400" />
              <span>Task Metadata</span>
            </h2>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Task Title *</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Git Branching Basics"
                required
                className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Category *</label>
                <button
                  type="button"
                  onClick={() => setShowNewCategory((v) => !v)}
                  className="flex items-center space-x-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {showNewCategory ? <X className="w-3.5 h-3.5" /> : <FolderPlus className="w-3.5 h-3.5" />}
                  <span>{showNewCategory ? 'Cancel' : 'New category'}</span>
                </button>
              </div>

              {showNewCategory ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory(); } }}
                    placeholder="e.g. Ansible"
                    autoFocus
                    className="flex-1 bg-slate-900 border border-emerald-500/40 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={creatingCategory || !newCategoryName.trim()}
                    className="px-4 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 font-bold rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {creatingCategory ? 'Adding...' : 'Create'}
                  </button>
                </div>
              ) : (
                <select
                  name="categorySlug"
                  value={form.categorySlug}
                  onChange={handleChange}
                  disabled={categoriesLoading}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all disabled:opacity-50"
                >
                  {categoriesLoading && <option>Loading categories...</option>}
                  {!categoriesLoading && categories.length === 0 && <option value="">No categories — create one</option>}
                  {categories.map((c) => (
                    <option key={c.id ?? c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Brief summary of what the student will learn..."
                className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all resize-none"
              />
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span>Difficulty</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, difficulty: d.value }))}
                    className={`py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                      form.difficulty === d.value
                        ? d.value === 'Easy' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          : d.value === 'Medium' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                          : 'bg-red-500/20 border-red-500/50 text-red-400'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Points & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Points</label>
                <input
                  type="number"
                  name="points"
                  value={form.points}
                  onChange={handleChange}
                  min="1"
                  max="1000"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Est. Minutes</span>
                </label>
                <input
                  type="number"
                  name="estimatedMinutes"
                  value={form.estimatedMinutes}
                  onChange={handleChange}
                  min="5"
                  max="240"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                />
              </div>
            </div>

            {/* File name (optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                File Name <span className="normal-case text-slate-500">(optional — auto-generated from title)</span>
              </label>
              <input
                type="text"
                name="fileName"
                value={form.fileName}
                onChange={handleChange}
                placeholder="e.g. git-branching-basics.html"
                className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all font-mono"
              />
            </div>
          </div>
        </div>

        {/* Right column — HTML editor */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-4 h-full flex flex-col">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <FileCode2 className="w-4 h-4 text-purple-400" />
              <span>HTML Task Content *</span>
            </h2>

            <div className="flex items-start space-x-2 text-xs text-slate-500 bg-slate-900/60 rounded-lg px-3 py-2 border border-slate-800">
              <Terminal className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                There is no manual "mark complete" button any more. Your HTML must verify every step itself and post{' '}
                <code className="text-emerald-400 font-mono">window.parent.postMessage({'{ type: "TASK_COMPLETED" }'}, '*')</code>{' '}
                <strong className="text-slate-400">only once all steps have passed</strong> — that is the single trigger
                that awards points. The starter template below implements this pattern.
              </span>
            </div>

            <textarea
              name="htmlContent"
              value={form.htmlContent}
              onChange={handleChange}
              required
              spellCheck={false}
              rows={22}
              className="flex-1 w-full bg-slate-950 border border-slate-700 text-emerald-300 placeholder-slate-600 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Submit row — spans full width */}
        <div className="lg:col-span-2 flex items-center justify-between pt-2">
          <Link
            to="/admin"
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold rounded-xl transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 transition-all"
          >
            {loading ? (
              <>
                <Code2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload Task</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminTaskUpload;
