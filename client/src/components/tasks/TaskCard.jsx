import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Award, CheckCircle, ArrowRight, GitBranch, Container, Layers, Server, FileCode, Hourglass, Workflow } from 'lucide-react';

const TaskCard = ({ task }) => {
  const isComingSoon = !!task.is_coming_soon;
  const isCompleted = !isComingSoon && task.userProgress && task.userProgress.status === 'completed';

  const categoryIcons = {
    git: GitBranch,
    docker: Container,
    terraform: Layers,
    kubernetes: Server,
    yaml: FileCode,
    ansible: Workflow,
  };

  const Icon = categoryIcons[task.category_slug] || GitBranch;

  const difficultyColors = {
    Easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    Hard: 'bg-red-500/10 text-red-400 border-red-500/30',
  };

  return (
    <div className={`group rounded-2xl glass-panel p-6 border transition-all duration-300 flex flex-col justify-between ${
      isComingSoon
        ? 'border-slate-800 bg-slate-900/40'
        : isCompleted
          ? 'border-emerald-500/40 bg-emerald-950/10 hover:-translate-y-1'
          : 'border-slate-800 hover:border-sky-500/50 hover:-translate-y-1'
    }`}>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center">
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {task.category_name || task.category_slug}
            </span>
          </div>
          {isComingSoon ? (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
              <Hourglass className="w-3.5 h-3.5" />
              <span>Coming Soon</span>
            </span>
          ) : isCompleted ? (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Completed</span>
            </span>
          ) : (
            <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${difficultyColors[task.difficulty] || difficultyColors.Easy}`}>
              {task.difficulty}
            </span>
          )}
        </div>

        <h3 className={`text-lg font-bold mb-2 transition-colors line-clamp-1 ${
          isComingSoon ? 'text-slate-300' : 'text-white group-hover:text-sky-400'
        }`}>
          {task.title}
        </h3>

        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 mb-6">
          {task.description}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-4 mb-4">
          <div className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>~{task.estimated_minutes} mins</span>
          </div>
          <div className="flex items-center space-x-1 font-bold text-amber-400">
            <Award className="w-3.5 h-3.5" />
            <span>+{task.points} pts</span>
          </div>
        </div>

        {isComingSoon ? (
          <div
            aria-disabled="true"
            title="This lab has not been released yet"
            className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 bg-slate-800/60 text-slate-500 border border-slate-700 cursor-not-allowed"
          >
            <Hourglass className="w-4 h-4" />
            <span>Coming Soon</span>
          </div>
        ) : (
          <Link
            to={`/tasks/${task.id}`}
            className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition-all ${
              isCompleted
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30'
            }`}
          >
            <span>{isCompleted ? 'Review Lab' : 'Launch Lab'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
