import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { taskService } from '../services/taskService';
import { progressService } from '../services/progressService';
import { certificateService } from '../services/certificateService';
import { useTaskTimer } from '../hooks/useTaskTimer';
import TaskIframeViewer from '../components/tasks/TaskIframeViewer';
import CertificateSheet from '../components/certificates/CertificateSheet';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertBanner from '../components/common/AlertBanner';
import { ArrowLeft, Clock, CheckCircle2, Award, Terminal, RefreshCw, ListChecks, Hourglass, Printer } from 'lucide-react';

const TaskDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const certificateRef = useRef(null);

  const isCompleted = !!progress && progress.status === 'completed';

  // A finished lab has nothing left to time, so the clock stops with it.
  const { seconds, formatTime } = useTaskTimer(task?.id, progress?.time_spent_seconds || 0, !isCompleted);

  useEffect(() => {
    // Always open a lab at the top, including when arriving from a scrolled
    // catalog or reopening the same route.
    window.scrollTo(0, 0);

    const fetchTaskDetails = async () => {
      setLoading(true);
      try {
        const res = await taskService.getTaskById(id);
        setTask(res.data.task);
        setProgress(res.data.progress);

        // Record task open event in database
        await progressService.openTask(id);
      } catch (err) {
        console.error('Failed to load task details:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [id]);

  // Completion is driven exclusively by the task HTML: it posts TASK_COMPLETED
  // only after every step inside the file has been verified. There is no manual
  // "mark complete" action, so points cannot be claimed without finishing the lab.
  const secondsRef = useRef(seconds);
  secondsRef.current = seconds;
  const completingRef = useRef(false);

  const handleAllStepsComplete = useCallback(async () => {
    if (completingRef.current) return;
    completingRef.current = true;
    setCompleting(true);
    setNotification(null);

    try {
      const res = await progressService.completeTask(id, 100, secondsRef.current);
      setProgress(res.data.progress);
      if (res.data.certificate) {
        setCertificate(res.data.certificate);
        // The learner finishes at the bottom of the lab, so bring the
        // certificate to them rather than leaving it below the fold.
        window.setTimeout(() => {
          certificateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
      setNotification(
        res.data.alreadyCompleted
          ? { type: 'info', message: 'All steps complete. You already earned the points for this lab.' }
          : { type: 'success', message: `🎉 All steps complete! +${res.data.pointsEarned} points awarded to your profile.` }
      );
    } catch (err) {
      completingRef.current = false;
      setNotification({
        type: 'error',
        message: err.message || 'Failed to record lab completion.',
      });
    } finally {
      setCompleting(false);
    }
  }, [id]);

  // Reopening a lab that was finished in an earlier session: the completion
  // response is long gone, so look the certificate up instead.
  useEffect(() => {
    if (!task || !task.awards_certificate || !isCompleted || certificate) return;

    let cancelled = false;
    certificateService
      .getMyCertificates()
      .then((res) => {
        if (cancelled) return;
        const mine = res.data.find((c) => c.task_id === task.id);
        if (mine) setCertificate(mine);
      })
      .catch((err) => console.error('Failed to load certificate:', err.message));

    return () => {
      cancelled = true;
    };
  }, [task, isCompleted, certificate]);

  if (loading) {
    return <LoadingSpinner fullPage label="Initializing DevOps Lab Environment..." />;
  }

  if (!task) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 glass-panel rounded-3xl border border-slate-800 text-center space-y-4">
        <Terminal className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Lab Not Found</h2>
        <p className="text-sm text-slate-400">The requested DevOps lab exercise does not exist.</p>
        <Link to="/tasks" className="inline-block px-4 py-2 bg-sky-500 text-white rounded-xl font-semibold">
          Return to Lab Catalog
        </Link>
      </div>
    );
  }

  // The lab file for a coming-soon task is a placeholder, and the API refuses to
  // serve it, so stop here rather than rendering an empty viewport.
  if (task.is_coming_soon) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 glass-panel rounded-3xl border border-amber-500/30 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
          <Hourglass className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">{task.title}</h2>
        <p className="text-sm text-amber-400 font-semibold">This lab is coming soon.</p>
        <p className="text-sm text-slate-400">
          It is still being written, so it cannot be started yet and awards no points. Check back soon.
        </p>
        <Link to="/tasks" className="inline-block px-4 py-2 bg-sky-500 text-white rounded-xl font-semibold">
          Browse available labs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header Navigation Bar — sticky so the timer and status stay in view
          while scrolling a long lab. */}
      <div className="sticky top-2 z-30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800 shadow-xl shadow-slate-950/50">
        <div className="flex items-center space-x-4">
          <Link
            to="/tasks"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-sky-400 mb-0.5">
              <span>{task.category_name}</span>
              <span>•</span>
              <span className="text-slate-400">{task.difficulty}</span>
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">{task.title}</h1>
          </div>
        </div>

        {/* Timer, Points, and Action */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-sm">
            {/* Stops pulsing when the clock stops, so a finished lab does not
                look like it is still counting. */}
            <Clock className={`w-4 h-4 ${isCompleted ? 'text-slate-500' : 'text-sky-400 animate-pulse'}`} />
            <span className={isCompleted ? 'text-slate-400' : undefined}>{formatTime}</span>
            {isCompleted && <span className="text-[10px] uppercase tracking-wider text-slate-500">final</span>}
          </div>

          <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-sm">
            <Award className="w-4 h-4" />
            <span>+{task.points} Pts</span>
          </div>

          {/* Status indicator — read-only. Completion is signalled by the lab itself. */}
          <div
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 border ${
              isCompleted
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Lab Completed</span>
              </>
            ) : completing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                <span>Awarding points...</span>
              </>
            ) : (
              <>
                <ListChecks className="w-4 h-4 text-sky-400" />
                <span>In Progress</span>
              </>
            )}
          </div>
        </div>
      </div>

      {notification && (
        <AlertBanner type={notification.type} message={notification.message} onClose={() => setNotification(null)} />
      )}

      {!isCompleted && (
        <div className="flex items-center space-x-2 text-xs text-slate-500 glass-panel px-4 py-3 rounded-xl border border-slate-800">
          <ListChecks className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <span>
            Complete <strong className="text-slate-300">every step</strong> inside the lab below. Points are awarded
            automatically once the final step passes — there is nothing to submit manually.
          </span>
        </div>
      )}

      {/* HTML Task — the viewer sizes itself to the lab content, so the lab
          never renders its own scrollbar; the page scrolls as one surface. */}
      <TaskIframeViewer
        taskId={task.id}
        /* Bundle labs are served statically from /labs so their relative assets
           resolve; single-file labs come inline from /content (ADR-010). */
        taskUrl={task.lab_url || taskService.getTaskHtmlUrl(task.id)}
        onTaskComplete={handleAllStepsComplete}
      />

      {/* The certificate is shown where the learner actually finishes — at the
          foot of the lab — rather than only on the certificates page. */}
      {certificate && (
        <div ref={certificateRef} className="glass-panel rounded-3xl border border-amber-500/30 p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Your certificate</h2>
                <p className="text-xs text-slate-400">
                  Saved to your profile — code{' '}
                  <span className="font-mono text-slate-300">{certificate.certificate_code}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-sm font-semibold rounded-xl flex items-center space-x-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
              <Link
                to="/certificates"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-sm font-semibold rounded-xl transition-colors"
              >
                All certificates
              </Link>
            </div>
          </div>

          <div id="certificate-print-area" className="overflow-x-auto">
            <CertificateSheet certificate={certificate} recipientName={certificate.recipient_name} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetailPage;
