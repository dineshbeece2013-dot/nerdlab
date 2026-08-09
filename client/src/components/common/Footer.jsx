import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Shield, Cpu, Code2, Workflow, FileCode } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
      {/* Sized to content and spread apart, rather than three equal columns:
          the link lists are short, so equal thirds left the last one with a
          half-empty cell and a gap against the right edge. */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between gap-10 md:gap-12">
        <div className="space-y-4 md:max-w-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-sky-400" />
            </div>
            <span className="font-bold text-white tracking-wide text-lg">NerdLab</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Interactive DevOps hands-on learning platform powered by PostgreSQL, Node, Express, and React.
          </p>
        </div>

        <div>
          <h4 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Technologies</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center space-x-2"><FileCode className="w-4 h-4 text-emerald-400" /><span>YAML Configuration</span></li>
            <li className="flex items-center space-x-2"><Code2 className="w-4 h-4 text-sky-400" /><span>Git Version Control</span></li>
            <li className="flex items-center space-x-2"><Cpu className="w-4 h-4 text-emerald-400" /><span>Docker Containers</span></li>
            <li className="flex items-center space-x-2"><Shield className="w-4 h-4 text-purple-400" /><span>Terraform IaC</span></li>
            <li className="flex items-center space-x-2"><Terminal className="w-4 h-4 text-blue-400" /><span>Kubernetes Orchestration</span></li>
            <li className="flex items-center space-x-2"><Workflow className="w-4 h-4 text-amber-400" /><span>Ansible Automation</span></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Quick Navigation</h4>
          {/* Router links, not plain anchors: a full page load on /tasks is
              handed to the API by the dev proxy instead of the app. */}
          <ul className="space-y-2 text-sm">
            <li><Link to="/tasks" className="hover:text-sky-400 transition-colors">Lab Catalog</Link></li>
            <li><Link to="/leaderboard" className="hover:text-sky-400 transition-colors">Student Leaderboard</Link></li>
            <li><Link to="/register" className="hover:text-sky-400 transition-colors">Create Student Account</Link></li>
            <li><Link to="/login" className="hover:text-sky-400 transition-colors">Sign In</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-slate-900 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} NerdLab Learning Platform. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
