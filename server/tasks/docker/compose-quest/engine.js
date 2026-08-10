/* Compose Quest — game engine.
   Holds the stack the learner builds, simulates running it, and reports
   completion to the platform. Every chapter check inspects the stack object
   below, never the buttons that were clicked. */

var TASK_ID = 11;

var state = {
  chapter: 0,
  services: [],      // [{ kind, name, image, env:{}, volume:bool, published:false|number }]
  ran: false,
  lastRun: null,
  reported: false
};

/* ---------- the stack, and the questions a chapter may ask of it ---------- */
var stack = {
  find: function (kind) { return state.services.filter(function (s) { return s.kind === kind; })[0]; },
  env: function (kind, key) { var s = stack.find(kind); return s && s.env ? s.env[key] : undefined; },
  has: function (kind, what) {
    var s = stack.find(kind);
    if (!s) return false;
    if (what === 'volume') return !!s.volume;
    if (what === 'published') return s.published !== false && s.published !== undefined;
    return false;
  }
};

function chapter() { return CHAPTERS[state.chapter]; }

/* ---------- running the stack: what would actually happen ---------- */
function runStack() {
  var web = stack.find('web');
  var db = stack.find('db');
  var lines = [];
  var reachable = false, ordersLoad = false, survivedRestart = null;

  lines.push('$ docker compose up');
  if (!state.services.length) {
    lines.push('  nothing to start — the stack is empty');
    return { ran: true, lines: lines, reachable: false, ordersLoad: false };
  }
  state.services.forEach(function (s) {
    lines.push('  starting ' + s.name + '  (' + s.image + ')  ... up');
  });
  lines.push('  private network created: every container can reach the others by service name');

  // Can a customer get in at all?
  if (web && web.published) {
    reachable = true;
    lines.push('');
    lines.push('customer opens http://localhost:' + web.published);
    lines.push('  -> forwarded to the ' + web.name + ' container');
  } else {
    lines.push('');
    lines.push('customer opens the shop in a browser');
    lines.push('  -> connection refused: no port is published, so nothing outside can get in');
  }

  // Can the app reach the database?
  if (web) {
    var host = web.env.DB_HOST;
    lines.push('');
    lines.push(web.name + ' tries to load the orders');
    if (!host) {
      lines.push('  -> DB_HOST is not set. The app does not know where the database is.');
    } else if (host === 'localhost') {
      lines.push('  -> looking for a database at localhost, inside its own container');
      lines.push('  -> nothing is listening there. Inside a container, localhost means this container.');
    } else if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      lines.push('  -> looking for a database at ' + host);
      lines.push('  -> no answer. That address belonged to a container that has since been replaced.');
    } else if (!db) {
      lines.push('  -> looking for a database at "' + host + '"');
      lines.push('  -> no container by that name is in this stack.');
    } else if (host !== db.name) {
      lines.push('  -> looking for a database at "' + host + '", but the database service is called "' + db.name + '"');
      lines.push('  -> name not found on the network.');
    } else {
      ordersLoad = true;
      lines.push('  -> resolved "' + host + '" to the ' + db.name + ' container');
      lines.push('  -> connected. Orders load.');
    }
  }

  // Does the data survive?
  if (db && ordersLoad) {
    lines.push('');
    lines.push('a customer places an order, then the database container is restarted');
    if (db.volume) {
      survivedRestart = true;
      lines.push('  -> the data lives on a volume, outside the container');
      lines.push('  -> after restart the order is still there');
    } else {
      survivedRestart = false;
      lines.push('  -> the data lived inside the container, which has been replaced');
      lines.push('  -> the order is gone');
    }
  }

  if (db && db.published) {
    lines.push('');
    lines.push('WARNING: the database is published on port ' + db.published);
    lines.push('  -> anyone who can reach this machine can now reach the database directly');
  }

  return { ran: true, lines: lines, reachable: reachable, ordersLoad: ordersLoad, survivedRestart: survivedRestart };
}

/* ---------- rendering ---------- */
function el(id) { return document.getElementById(id); }

function renderIntro() {
  var c = chapter();
  el('intro-chapter').textContent = 'Chapter ' + (state.chapter + 1) + ' of ' + CHAPTERS.length;
  el('intro-title').textContent = c.title;
  el('intro-body').innerHTML = c.intro;
  el('intro-goal').innerHTML = c.goal.map(function (g) { return '<li>' + g + '</li>'; }).join('');
  show('intro');
}

function show(which) {
  ['intro', 'build', 'done'].forEach(function (id) {
    el(id).classList.toggle('hidden', id !== which);
  });
  window.scrollTo(0, 0);
}

function renderBuilder() {
  var c = chapter();
  el('build-title').textContent = 'Chapter ' + (state.chapter + 1) + ': ' + c.title;
  el('build-task').textContent = c.task;
  el('hud-chapter').textContent = (state.chapter + 1) + '/' + CHAPTERS.length;
  el('hud-fill').style.width = (state.chapter / CHAPTERS.length * 100) + '%';

  // palette
  var pal = el('palette');
  pal.innerHTML = '';
  c.offer.forEach(function (kind) {
    var cat = CATALOGUE[kind];
    var already = !!stack.find(kind);
    var b = document.createElement('button');
    b.className = 'chip';
    b.type = 'button';
    b.disabled = already;
    b.innerHTML = '<span class="dot" style="background:' +
      (kind === 'web' ? '#38bdf8' : kind === 'db' ? '#c084fc' : '#fbbf24') + '"></span>' +
      '<span><b>' + cat.name + '</b>' + (already ? ' — added' : '') + '<small>' + cat.blurb + '</small></span>';
    b.addEventListener('click', function () { addService(kind); });
    pal.appendChild(b);
  });

  // wiring options
  var opts = el('options');
  opts.innerHTML = '';
  if (!c.options.length) {
    var none = document.createElement('div');
    none.className = 'opt none';
    none.textContent = 'Nothing to wire up in this chapter.';
    opts.appendChild(none);
  }
  c.options.forEach(function (o) {
    var lab = document.createElement('label');
    lab.className = 'opt';
    var input = document.createElement('input');
    input.type = o.group ? 'radio' : 'checkbox';
    if (o.group) input.name = o.group;
    input.checked = isOptionOn(o);
    input.disabled = !stack.find(o.on);
    input.addEventListener('change', function () { toggleOption(o, input.checked); });
    var txt = document.createElement('span');
    txt.innerHTML = o.label + '<small>' + (stack.find(o.on) ? o.note : 'add the ' + o.on + ' container first') + '</small>';
    lab.appendChild(input); lab.appendChild(txt);
    opts.appendChild(lab);
  });

  renderDiagram();
  el('hud-services').textContent = state.services.length;
  var st = el('hud-state');
  st.textContent = state.ran ? (state.lastRun.ordersLoad ? 'running' : 'up, but broken') : 'not running';
  st.className = state.ran && state.lastRun.ordersLoad ? 'up' : 'down';
  show('build');
}

function renderDiagram() {
  var d = el('diagram');
  var web = stack.find('web');
  var open = web && web.published;
  var html = '<div class="outside"><span class="cloud">🌐 a customer’s browser</span>' +
    '<span class="link ' + (open ? 'open' : 'shut') + '">' +
    (open ? '──── port ' + web.published + ' ───▶' : '──── no way in ────✕') + '</span></div>';

  html += '<div class="stackbox"><div class="stackbox-label">the stack — one private network</div>';
  if (!state.services.length) {
    html += '<p class="empty">No containers yet. Add one from the left.</p>';
  } else {
    html += '<div class="services">';
    state.services.forEach(function (s) {
      html += '<div class="svc ' + s.kind + '">' +
        '<button class="remove" title="remove" data-kind="' + s.kind + '">✕</button>' +
        '<h5>' + s.name + '</h5><span class="img">' + s.image + '</span>';
      if (s.env.DB_HOST) {
        var good = s.env.DB_HOST === 'db';
        html += '<span class="tag ' + (good ? 'good' : 'warn') + '">DB_HOST=' + s.env.DB_HOST + '</span>';
      }
      if (s.volume) html += '<span class="tag good">volume</span>';
      if (s.published) html += '<span class="tag ' + (s.kind === 'db' ? 'warn' : 'good') + '">:' + s.published + '</span>';
      html += '</div>';
    });
    html += '</div>';
  }
  html += '</div>';
  d.innerHTML = html;

  [].forEach.call(d.querySelectorAll('.remove'), function (b) {
    b.addEventListener('click', function () { removeService(b.getAttribute('data-kind')); });
  });
}

/* ---------- actions ---------- */
function addService(kind) {
  if (stack.find(kind)) return;
  var cat = CATALOGUE[kind];
  state.services.push({ kind: kind, name: cat.name, image: cat.image, env: {}, volume: false, published: false });
  invalidateRun();
  renderBuilder();
}

function removeService(kind) {
  state.services = state.services.filter(function (s) { return s.kind !== kind; });
  invalidateRun();
  renderBuilder();
}

function isOptionOn(o) {
  var s = stack.find(o.on);
  if (!s) return false;
  if (o.id.indexOf('dbhost_') === 0) {
    var want = o.label.split('=')[1].trim();
    return s.env.DB_HOST === want;
  }
  if (o.id.indexOf('vol_') === 0) return !!s.volume;
  if (o.id.indexOf('port_') === 0) return s.published !== false;
  return false;
}

function toggleOption(o, on) {
  var s = stack.find(o.on);
  if (!s) return;
  if (o.id.indexOf('dbhost_') === 0) {
    s.env.DB_HOST = on ? o.label.split('=')[1].trim() : undefined;
  } else if (o.id.indexOf('vol_') === 0) {
    s.volume = on;
  } else if (o.id.indexOf('port_') === 0) {
    var port = parseInt(o.label.replace(/\D+/g, ''), 10);
    s.published = on ? port : false;
  }
  invalidateRun();
  renderBuilder();
}

function invalidateRun() {
  state.ran = false;
  state.lastRun = null;
  el('trace').textContent = 'The stack changed. Run it again.';
  el('verdict').className = 'verdict';
}

/* ---------- run + check ---------- */
function onRun() {
  var result = runStack();
  state.ran = true;
  state.lastRun = result;
  el('trace').textContent = result.lines.join('\n');

  var verdict = el('verdict');
  var outcome = chapter().check(stack, { ran: true, run: result });
  if (!outcome.ok) {
    verdict.className = 'verdict bad show';
    verdict.innerHTML = '<b>✗ Not yet — </b>' + outcome.msg;
    renderBuilder();
    return;
  }
  verdict.className = 'verdict good show';
  verdict.innerHTML = '<b>✓ Chapter complete. </b>' + outcome.msg +
    ' <button class="btn" id="next" style="margin-left:.6rem">' +
    (state.chapter + 1 < CHAPTERS.length ? 'Next chapter →' : 'Finish') + '</button>';
  el('hud-fill').style.width = ((state.chapter + 1) / CHAPTERS.length * 100) + '%';
  el('next').addEventListener('click', nextChapter);
  renderDiagram();
}

function nextChapter() {
  state.chapter++;
  if (state.chapter >= CHAPTERS.length) return finish();
  state.ran = false;
  state.lastRun = null;
  el('trace').textContent = 'Press “Run the stack” to try it.';
  el('verdict').className = 'verdict';
  el('hintbox').innerHTML = '';
  hintsShown = 0;
  renderIntro();
}

function resetChapter() {
  state.services = [];
  invalidateRun();
  renderBuilder();
}

var hintsShown = 0;
function onHint() {
  var hs = chapter().hints;
  if (hintsShown >= hs.length) return;
  var d = document.createElement('div');
  d.innerHTML = '<b>Hint ' + (hintsShown + 1) + ':</b> ' + hs[hintsShown];
  el('hintbox').appendChild(d);
  hintsShown++;
}

function finish() {
  // Single source of truth for completion: every chapter check passed against
  // the stack the learner actually built.
  if (!state.reported) {
    state.reported = true;
    try { window.parent.postMessage({ type: 'TASK_COMPLETED', taskId: TASK_ID }, '*'); } catch (e) {}
  }
  el('done-body').innerHTML =
    '<p>Two containers, one private network, one volume and exactly one door open to the world. ' +
    'That is a real stack, and it is the same shape whether it runs on a laptop or a hundred servers.</p>';
  show('done');
}

/* ---------- start ---------- */
el('intro-go').addEventListener('click', function () { renderBuilder(); });
el('run').addEventListener('click', onRun);
el('reset').addEventListener('click', resetChapter);
el('hint').addEventListener('click', onHint);
renderIntro();
