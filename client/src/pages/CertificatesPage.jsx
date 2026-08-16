import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { certificateService } from '../services/certificateService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import CertificateSheet from '../components/certificates/CertificateSheet';
import { Award, ShieldCheck, Printer, Terminal } from 'lucide-react';

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const CertificatesPage = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // The certificate currently rendered into the print area. Only one is ever
  // printed at a time, so the print stylesheet has a single target.
  const [printing, setPrinting] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await certificateService.getMyCertificates();
        setCertificates(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load certificates.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Render the sheet first, then print — otherwise the print area is still empty
  // when the dialog opens.
  useEffect(() => {
    if (!printing) return;
    const id = window.setTimeout(() => {
      window.print();
      setPrinting(null);
    }, 60);
    return () => window.clearTimeout(id);
  }, [printing]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Student DevOps Certificates</h1>
        <p className="text-slate-400 text-sm mt-1">
          Certificates are issued automatically when you finish a lab that awards one.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading your certificates..." />
      ) : error ? (
        <div className="text-center py-16 glass-panel rounded-3xl border border-slate-800 space-y-3">
          <h3 className="text-lg font-bold text-white">Could not load certificates</h3>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      ) : certificates.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-3xl border border-slate-800 space-y-4">
          <Terminal className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No certificates yet</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Finish a lab that awards a certificate and it will appear here automatically.
          </p>
          <Link
            to="/tasks"
            className="inline-block px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl transition-colors"
          >
            Browse labs
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="rounded-3xl glass-panel p-8 border border-slate-800 space-y-6 relative overflow-hidden bg-slate-900/60"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider block">
                      Verified Achievement
                    </span>
                    <span className="text-sm font-bold text-white">NerdLab Learning Platform</span>
                  </div>
                </div>
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-white">{cert.title}</h3>
                <p className="text-xs text-slate-400">
                  Awarded to{' '}
                  <span className="text-sky-400 font-semibold">{cert.recipient_name || user?.name}</span> on{' '}
                  {formatDate(cert.issued_at)}
                </p>
                {cert.category_name && (
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300 uppercase tracking-wider font-semibold">
                    {cert.category_name}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs">
                <div className="font-mono text-slate-400">
                  Code: <span className="text-slate-200">{cert.certificate_code}</span>
                </div>

                <button
                  onClick={() => setPrinting(cert)}
                  className="px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 font-semibold rounded-xl flex items-center space-x-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden on screen; the print stylesheet reveals only this. */}
      <div id="certificate-print-area" className="hidden print:block">
        {printing && <CertificateSheet certificate={printing} recipientName={printing.recipient_name || user?.name} />}
      </div>
    </div>
  );
};

export default CertificatesPage;
