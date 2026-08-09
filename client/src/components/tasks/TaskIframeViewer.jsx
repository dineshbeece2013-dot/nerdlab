import React, { useEffect, useRef, useState, useCallback } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';

// The lab HTML signals that ALL of its internal steps have passed by posting one
// of these message types. This is the only way a task can be marked complete.
const COMPLETION_EVENTS = ['TASK_COMPLETED', 'TASK_COMPLETE'];

const MIN_HEIGHT = 520;
const MAX_HEIGHT = 6000;
const PADDING = 24;

// Two reference heights used once, at load, to classify the lab's layout.
const PROBE_SMALL = 400;
const PROBE_LARGE = 800;

// Only treat a lab as viewport-sized when its content tracks the probe height
// nearly 1:1 (e.g. `#app { height: 100vh }`). A partial dependency stays in
// content mode, where the runaway guard handles it if it misbehaves.
const VIEWPORT_TRACKING_RATIO = 0.6;

// Runaway detection. A real lab settles in a handful of growth steps; a feedback
// loop grows every animation frame. Measured over a time window rather than as a
// consecutive run — observers fire repeatedly per layout, and an unchanged
// reading in between must not reset the count.
const RUNAWAY_WINDOW_MS = 1200;
const RUNAWAY_MAX_GROWTHS = 20;

// Injected into every lab. Note overflow-y is `auto`, never `hidden`: when the
// frame is sized correctly no scrollbar appears anyway, but if we ever
// under-measure, the student can still reach the content instead of losing it.
const IFRAME_STYLES = `
  html, body {
    overflow-x: hidden !important;
    overflow-y: auto !important;
    height: auto !important;
    min-height: 0 !important;
    scrollbar-width: thin;
    scrollbar-color: #334155 transparent;
  }
  body { margin: 0; }
  *::-webkit-scrollbar { width: 6px; height: 6px; }
  *::-webkit-scrollbar-track { background: transparent; }
  *::-webkit-scrollbar-thumb { background: #334155; border-radius: 999px; }
  *::-webkit-scrollbar-thumb:hover { background: #475569; }
  * { scrollbar-width: thin; scrollbar-color: #334155 transparent; }
`;

// A viewport-sized lab gets a fixed, generous frame and manages its own internal
// layout — trying to fit it to content is what caused runaway growth.
const viewportLabHeight = () =>
  Math.round(Math.max(MIN_HEIGHT, Math.min(900, (window.innerHeight || 900) * 0.85)));

const TaskIframeViewer = ({ taskId, taskUrl, onTaskComplete }) => {
  const iframeRef = useRef(null);
  const cleanupRef = useRef(null);
  const heightRef = useRef(MIN_HEIGHT);
  const measuringRef = useRef(false);
  const rafRef = useRef(0);
  const modeRef = useRef('pending'); // 'pending' | 'content' | 'viewport'
  const growthRef = useRef({ count: 0, since: 0 });

  const [height, setHeight] = useState(MIN_HEIGHT);
  const [ready, setReady] = useState(false);
  // True once we've stopped fitting to content and pinned a fixed frame.
  const [, setScrollFallback] = useState(false);

  const applyHeight = useCallback((value) => {
    const next = Math.round(value);
    heightRef.current = next;
    if (iframeRef.current) iframeRef.current.style.height = `${next}px`;
    setHeight(next);
  }, []);

  /* ---------------- completion signal ---------------- */
  useEffect(() => {
    const handleMessage = (event) => {
      // Only trust messages coming from our own iframe
      if (iframeRef.current && event.source !== iframeRef.current.contentWindow) return;
      if (!event.data) return;

      if (COMPLETION_EVENTS.includes(event.data.type)) {
        if (onTaskComplete) onTaskComplete(event.data.taskId || taskId);
      }

      // Explicit hint from a lab that knows its own height (used for cross-origin
      // or canvas-driven content that measurement can't reach).
      if (event.data.type === 'TASK_RESIZE' && Number(event.data.height) > 0) {
        modeRef.current = 'content';
        applyHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Number(event.data.height) + PADDING)));
        setReady(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [taskId, onTaskComplete, applyHeight]);

  /* ---------------- measurement ---------------- */

  // Stop trying to fit the frame to the content and give the lab a fixed, generous
  // frame that it scrolls internally. Used for viewport-sized labs, labs we cannot
  // measure (cross-origin), and as the runaway-growth backstop. Content always
  // stays reachable because the lab keeps overflow-y:auto.
  const enterViewportMode = useCallback(() => {
    if (modeRef.current === 'viewport') return;
    modeRef.current = 'viewport';
    setScrollFallback(true);
    applyHeight(viewportLabHeight());

    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc?.body) {
        doc.documentElement.style.setProperty('overflow-y', 'auto', 'important');
        doc.body.style.setProperty('overflow-y', 'auto', 'important');
      }
    } catch {
      /* cross-origin — the frame's own scrollbar is already in play */
    }

    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    const onWindowResize = () => applyHeight(viewportLabHeight());
    window.addEventListener('resize', onWindowResize);
    cleanupRef.current = () => window.removeEventListener('resize', onWindowResize);
  }, [applyHeight]);

  // Read the lab's content height while the frame is pinned to `probe` px.
  // Runs synchronously so the browser never paints the intermediate size.
  const contentHeightAt = useCallback((probe) => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!iframe || !doc?.body) return null;

    const previous = iframe.style.height;
    iframe.style.height = `${probe}px`;
    const measured = Math.max(
      doc.body.scrollHeight,
      doc.body.offsetHeight,
      doc.documentElement.scrollHeight,
      doc.documentElement.offsetHeight
    );
    iframe.style.height = previous;
    return measured;
  }, []);

  // Does this lab size itself to the viewport instead of to its content? Only a
  // near 1:1 tracking of the probe counts, so partially-viewport labs stay in
  // content mode and get measured accurately.
  const detectMode = useCallback(() => {
    const small = contentHeightAt(PROBE_SMALL);
    const large = contentHeightAt(PROBE_LARGE);
    if (small == null || large == null) return 'content';

    const tracking = (large - small) / (PROBE_LARGE - PROBE_SMALL);
    return tracking >= VIEWPORT_TRACKING_RATIO ? 'viewport' : 'content';
  }, [contentHeightAt]);

  const measureNow = useCallback(() => {
    if (modeRef.current === 'viewport') return;

    const iframe = iframeRef.current;
    if (!iframe) return;

    let content;
    measuringRef.current = true;
    try {
      const doc = iframe.contentDocument;
      if (!doc?.body) {
        measuringRef.current = false;
        return;
      }
      // Measured at the CURRENT applied height, so whatever the lab actually
      // renders is what we fit to — this cannot under-measure and clip content.
      content = Math.max(
        doc.body.scrollHeight,
        doc.body.offsetHeight,
        doc.documentElement.scrollHeight,
        doc.documentElement.offsetHeight
      );
    } catch {
      measuringRef.current = false;
      enterViewportMode();
      return;
    }
    measuringRef.current = false;

    if (!content || content <= 0) return;

    if (content + PADDING >= MAX_HEIGHT) {
      enterViewportMode();
      return;
    }

    const target = Math.max(MIN_HEIGHT, content + PADDING);

    // Growth is the only direction that can feed back on itself, so that is the
    // only direction we police.
    if (target > heightRef.current + 2) {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const g = growthRef.current;
      if (now - g.since > RUNAWAY_WINDOW_MS) {
        g.count = 0;
        g.since = now;
      }
      g.count += 1;
      if (g.count > RUNAWAY_MAX_GROWTHS) {
        enterViewportMode();
        return;
      }
    }

    if (Math.abs(heightRef.current - target) > 2) applyHeight(target);
  }, [applyHeight, enterViewportMode]);

  // At most one measurement per animation frame, so observer storms during
  // drag/drop interactions can't thrash layout.
  const scheduleMeasure = useCallback(() => {
    if (measuringRef.current || rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      measureNow();
    });
  }, [measureNow]);

  const handleLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    if (cleanupRef.current) cleanupRef.current();

    let doc;
    try {
      doc = iframe.contentDocument;
    } catch {
      setReady(true);
      enterViewportMode();
      return;
    }

    if (!doc || !doc.body) {
      setReady(true);
      enterViewportMode();
      return;
    }

    // Append to <head> when it exists, otherwise <body> — a missing stylesheet
    // would leave the lab's own viewport-height rules active.
    const style = doc.createElement('style');
    style.setAttribute('data-injected-by', 'task-viewer');
    style.textContent = IFRAME_STYLES;
    (doc.head || doc.body).appendChild(style);

    growthRef.current = { count: 0, since: 0 };
    modeRef.current = detectMode();
    setReady(true);

    if (modeRef.current === 'viewport') {
      modeRef.current = 'pending'; // let enterViewportMode() run its full setup
      enterViewportMode();
      return;
    }

    // Content-sized lab: track its height as steps expand and collapse.
    measureNow();

    const observers = [];
    const view = doc.defaultView;

    if (typeof view?.ResizeObserver === 'function') {
      const ro = new view.ResizeObserver(scheduleMeasure);
      ro.observe(doc.body);
      observers.push(() => ro.disconnect());
    }

    if (typeof view?.MutationObserver === 'function') {
      const mo = new view.MutationObserver(scheduleMeasure);
      mo.observe(doc.body, { childList: true, subtree: true, attributes: true, characterData: true });
      observers.push(() => mo.disconnect());
    }

    // Late-loading assets (fonts, images) can change layout after observers fire
    const timers = [80, 250, 600, 1200, 2500].map((ms) => setTimeout(measureNow, ms));
    observers.push(() => timers.forEach(clearTimeout));

    const onWindowResize = () => scheduleMeasure();
    window.addEventListener('resize', onWindowResize);
    observers.push(() => window.removeEventListener('resize', onWindowResize));

    cleanupRef.current = () => observers.forEach((fn) => fn());
  }, [detectMode, measureNow, scheduleMeasure, enterViewportMode]);

  // Reset when switching to a different task
  useEffect(() => {
    setReady(false);
    setScrollFallback(false);
    modeRef.current = 'pending';
    growthRef.current = { count: 0, since: 0 };
    applyHeight(MIN_HEIGHT);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      if (cleanupRef.current) cleanupRef.current();
      cleanupRef.current = null;
    };
  }, [taskUrl, applyHeight]);

  return (
    <div className="relative w-full rounded-2xl glass-panel border border-slate-800 overflow-hidden shadow-2xl bg-slate-950">
      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950">
          <LoadingSpinner label="Loading lab environment..." />
        </div>
      )}

      {/* No `scrolling="no"`: when the frame is sized correctly the lab has
          nothing to scroll and no bar appears, but if sizing is ever short the
          student can still reach the rest of the task. */}
      <iframe
        ref={iframeRef}
        src={taskUrl}
        onLoad={handleLoad}
        title={`NerdLab Task #${taskId}`}
        style={{ height: `${height}px` }}
        className="lab-frame w-full block border-none bg-slate-950"
        sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
      />
    </div>
  );
};

export default TaskIframeViewer;
