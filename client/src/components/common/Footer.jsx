import React from 'react';
import { Terminal, Shield, Cpu, Code2, Workflow } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-sky-400" />
            </div>
            <span className="font-bold text-white tracking-wide text-lg">NerdLab</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Production-grade interactive DevOps hands-on learning platform powered by PostgreSQL, Node, Express, and React.
          </p>
        </div>

        <div>
          <h4 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Technologies</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center space-x-2"><Code2 className="w-4 h-4 text-sky-400" /><span>Git Version Control</span></li>
            <li className="flex items-center space-x-2"><Cpu className="w-4 h-4 text-emerald-400" /><span>Docker Containers</span></li>
            <li className="flex items-center space-x-2"><Shield className="w-4 h-4 text-purple-400" /><span>Terraform IaC</span></li>
            <li className="flex items-center space-x-2"><Terminal className="w-4 h-4 text-blue-400" /><span>Kubernetes Orchestration</span></li>
            <li className="flex items-center space-x-2"><Workflow className="w-4 h-4 text-amber-400" /><span>Ansible Automation</span></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Quick Navigation</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/tasks" className="hover:text-sky-400 transition-colors">Lab Catalog</a></li>
            <li><a href="/leaderboard" className="hover:text-sky-400 transition-colors">Student Leaderboard</a></li>
            <li><a href="/register" className="hover:text-sky-400 transition-colors">Create Student Account</a></li>
            <li><a href="/login" className="hover:text-sky-400 transition-colors">Sign In</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Deployment Stack</h4>
          <p className="text-xs text-slate-500 mb-3">
            Deployable on Google Cloud Platform using Ubuntu VM, Nginx, PM2, and PostgreSQL.
          </p>
          <span className="inline-block bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs px-3 py-1.5 rounded-lg font-mono">
            v1.0.0 Stable Release
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-slate-900 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} NerdLab Learning Platform. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
