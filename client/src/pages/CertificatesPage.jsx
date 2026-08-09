import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Award, ShieldCheck, Download, CheckCircle2 } from 'lucide-react';

const CertificatesPage = () => {
  const { user } = useAuth();

  const certificates = [
    {
      id: 1,
      title: 'DevOps Git Version Control Specialist',
      code: 'CERT-GIT-2026-8819',
      issuedDate: '2026-08-01',
      issuer: 'NerdLab Learning Platform',
      category: 'Git Version Control',
    },
    {
      id: 2,
      title: 'Docker & Containerization Master',
      code: 'CERT-DCK-2026-9402',
      issuedDate: '2026-08-02',
      issuer: 'NerdLab Learning Platform',
      category: 'Docker & Microservices',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Student DevOps Certificates</h1>
        <p className="text-slate-400 text-sm mt-1">Verified digital certificates awarded for completing course modules.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certificates.map((cert) => (
          <div key={cert.id} className="rounded-3xl glass-panel p-8 border border-slate-800 space-y-6 relative overflow-hidden bg-slate-900/60">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider block">Verified Achievement</span>
                  <span className="text-sm font-bold text-white">{cert.issuer}</span>
                </div>
              </div>
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-white">{cert.title}</h3>
              <p className="text-xs text-slate-400">Awarded to <span className="text-sky-400 font-semibold">{user?.name}</span> on {cert.issuedDate}</p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs">
              <div className="font-mono text-slate-400">
                Code: <span className="text-slate-200">{cert.code}</span>
              </div>

              <button
                onClick={() => alert(`Downloading official PDF Certificate: ${cert.code}`)}
                className="px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 font-semibold rounded-xl flex items-center space-x-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CertificatesPage;
