import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { taskService } from '../services/taskService';
import TaskCard from '../components/tasks/TaskCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Search, Filter, Code2, Terminal } from 'lucide-react';

const TasksListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'all';

  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [difficulty, setDifficulty] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catRes, taskRes] = await Promise.all([
          taskService.getCategories(),
          taskService.getTasks({
            category: activeCategory !== 'all' ? activeCategory : null,
            difficulty: difficulty !== 'all' ? difficulty : null,
            search,
          }),
        ]);
        setCategories(catRes.data);
        setTasks(taskRes.data);
      } catch (err) {
        console.error('Failed to load lab catalog:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeCategory, difficulty, search]);

  const handleCategorySelect = (catSlug) => {
    if (catSlug === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', catSlug);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-sky-400 font-semibold text-sm mb-1">
            <Code2 className="w-4 h-4" />
            <span>Interactive Catalog</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">DevOps Hands-On Labs</h1>
          <p className="text-slate-400 text-sm mt-1">Select a topic to launch an interactive HTML exercise in your browser.</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-4">
        {/* Category Tabs — every module stays on screen, so these wrap onto as
            many rows as they need rather than scrolling sideways. */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleCategorySelect('all')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
              activeCategory === 'all'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Topics
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.slug)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                activeCategory === cat.slug
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat.name} ({cat.total_tasks})
            </button>
          ))}
        </div>

        {/* Search & Difficulty Select */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-slate-800/70">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search labs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Task Grid */}
      {loading ? (
        <LoadingSpinner label="Loading DevOps lab catalog..." />
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-3xl border border-slate-800 space-y-4">
          <Terminal className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Labs Found</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            No DevOps lab exercises match your selected search or category filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TasksListPage;
