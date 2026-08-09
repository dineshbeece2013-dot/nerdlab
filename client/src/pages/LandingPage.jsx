import React from 'react';
import { Link } from 'react-router-dom';
import {
  Terminal,
  Container,
  GitBranch,
  Layers,
  Server,
  ArrowRight,
  CheckCircle,
  Zap,
  Workflow,
  FileCode,
} from 'lucide-react';

const LandingPage = () => {
  const categories = [
    {
      name: 'YAML Configuration',
      icon: FileCode,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Fundamentals',
      desc: 'Start here. Text and numbers, lists and nesting, and how to write a settings file the tools below all depend on.',
    },
    {
      name: 'Git Version Control',
      icon: GitBranch,
      color: 'from-orange-500 to-amber-500',
      badge: 'Git Level 1',
      desc: 'Master branch strategies, rebasing, commit cherry-picking, and remote repository workflows.',
    },
    {
      name: 'Docker & Containers',
      icon: Container,
      color: 'from-sky-500 to-blue-600',
      badge: 'Containers',
      desc: 'Build multi-stage Dockerfiles, compose services, inspect networks, and optimize images.',
    },
    {
      name: 'Terraform IaC',
      icon: Layers,
      color: 'from-purple-500 to-indigo-600',
      badge: 'Infrastructure',
      desc: 'Provision scalable cloud resources using HashiCorp Configuration Language (HCL) and state management.',
    },
    {
      name: 'Kubernetes Orchestration',
      icon: Server,
      color: 'from-blue-500 to-cyan-500',
      badge: 'Cloud Native',
      desc: 'Deploy resilient microservices, scale replicas, expose NodePort services, and manage ingress.',
    },
    {
      name: 'Ansible Automation',
      icon: Workflow,
      color: 'from-red-500 to-rose-600',
      badge: 'Configuration',
      desc: 'Write inventories and playbooks, split work into roles, and roll changes out in batches without downtime.',
    },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/30 via-slate-950 to-slate-950 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass-panel border border-sky-500/30 text-sky-400 text-sm font-medium animate-pulse-slow">
            <Zap className="w-4 h-4" />
            <span>Interactive DevOps Hands-On Exercises</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Master DevOps Infrastructure <br />
            <span className="bg-gradient-to-r from-sky-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">
              Through Real Hands-On Labs
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            Dynamic HTML lab exercises embedded right in your browser. Practice Git, Docker, Terraform, and Kubernetes with automatic progress tracking in PostgreSQL.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-xl shadow-sky-500/25 flex items-center justify-center space-x-3 transition-all duration-200 hover:-translate-y-0.5"
            >
              <span>Start Learning Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/tasks"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-slate-200 glass-panel hover:bg-slate-800/80 border border-slate-700 flex items-center justify-center space-x-2 transition-colors"
            >
              <Terminal className="w-5 h-5 text-sky-400" />
              <span>Explore Lab Catalog</span>
            </Link>
          </div>

          {/* Interactive Code Mockup */}
          <div className="pt-10 max-w-4xl mx-auto">
            <div className="rounded-2xl glass-panel border border-slate-800 shadow-2xl p-4 text-left font-mono text-sm relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="text-xs text-slate-400 font-sans ml-2">tasks/docker/task1.html — Interactive DevOps Shell</span>
                </div>
                <span className="text-xs text-emerald-400 font-sans flex items-center space-x-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Backend PostgreSQL Synced</span>
                </span>
              </div>
              <pre className="text-slate-300 overflow-x-auto space-y-1">
                <span className="text-sky-400"># Step 1: Initialize Docker Container Lab</span>{'\n'}
                <span className="text-emerald-400">$ docker run -d -p 8080:80 --name devops-web nginx:alpine</span>{'\n'}
                <span className="text-slate-400">Container 8f9a2b1c3d4e started on port 8080...</span>{'\n'}
                <span className="text-sky-400"># Step 2: Signal Completion Event to Platform</span>{'\n'}
                <span className="text-purple-400">window.parent.postMessage({'{ type: "TASK_COMPLETED", taskId: 2 }'}, "*");</span>{'\n'}
                <span className="text-emerald-400">✓ Progress recorded! +150 Points awarded to Alex Student</span>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Category Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-extrabold text-white">DevOps Learning Modules</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Hands-on exercises designed to teach real industry practices step by step.
          </p>
        </div>

        {/* Six modules in even rows: 2x3 on tablets, 3x2 from laptops up.
            Squeezing all six across would leave the cards too narrow. */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl glass-panel p-6 border border-slate-800 hover:border-sky-500/50 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${cat.color} p-3 text-white mb-6 shadow-lg`}>
                    <Icon className="w-full h-full" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 block mb-1">
                    {cat.badge}
                  </span>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-6">
                    {cat.desc}
                  </p>
                </div>
                <Link
                  to={`/tasks?category=${cat.name.toLowerCase().split(' ')[0]}`}
                  className="inline-flex items-center space-x-2 text-sm font-semibold text-sky-400 hover:text-sky-300 group-hover:translate-x-1 transition-all"
                >
                  <span>Start Lab</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
