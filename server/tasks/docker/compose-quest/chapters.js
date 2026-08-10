/* Compose Quest — chapter data.
   Kept in its own file so the story can be edited without touching the engine.
   Each chapter says what the learner is building, which pieces are available,
   and how to tell whether the stack they built is right. */

var CATALOGUE = {
  web:   { kind: 'web',   name: 'web',   image: 'nerdlab/shop:1.0', blurb: 'the shop itself — serves pages' },
  db:    { kind: 'db',    name: 'db',    image: 'postgres:16',      blurb: 'stores the orders' },
  cache: { kind: 'cache', name: 'cache', image: 'redis:7',          blurb: 'remembers recent lookups' }
};

var CHAPTERS = [
{
  title: 'One container is not an application',
  intro:
    '<p><strong>Docker Compose</strong> runs several containers together as one stack. Before it can, ' +
    'you have to decide what the pieces are.</p>' +
    '<p>The shop needs two: the app that serves pages, and a database that stores the orders. ' +
    'They are separate containers on purpose — you can restart, upgrade or scale one without ' +
    'touching the other.</p>' +
    '<p>Start with just the app and see what a half-built stack does.</p>',
  goal: ['add the <code>web</code> container', 'run the stack and read what happens'],
  task: 'Add the web container, then run the stack.',
  offer: ['web'],
  options: [],
  hints: ['There is one thing in the list on the left. Add it.',
          'Then press “Run the stack” — the run is part of the chapter, not just a check.'],
  check: function (s, r) {
    if (!s.find('web')) return { ok: false, msg: 'There is no <code>web</code> container in the stack yet.' };
    if (!r.ran) return { ok: false, msg: 'Now run it. Seeing it fail is the point of this chapter.' };
    return { ok: true, msg: 'The app starts, and cannot serve a single order — it has nowhere to read them from. That is the next chapter.' };
  }
},
{
  title: 'Add the database, and watch it still fail',
  intro:
    '<p>Add the database and the obvious expectation is that things now work. They will not, and the ' +
    'reason is worth meeting early.</p>' +
    '<p>Two containers in the same stack can reach each other, but the app still has to be <em>told</em> ' +
    'where the database is. It looks for an address in a setting called <code>DB_HOST</code>, and right ' +
    'now that setting is empty.</p>',
  goal: ['add the <code>db</code> container', 'run the stack again and read the error'],
  task: 'Add the database container and run the stack.',
  offer: ['web', 'db'],
  options: [],
  hints: ['Add <code>db</code> from the list, keeping <code>web</code>.',
          'Run it. The error tells you exactly what is missing.'],
  check: function (s, r) {
    if (!s.find('web')) return { ok: false, msg: 'Keep the <code>web</code> container — the shop still needs it.' };
    if (!s.find('db')) return { ok: false, msg: 'The database container is not in the stack yet.' };
    if (!r.ran) return { ok: false, msg: 'Run the stack to see what two unconnected containers do.' };
    return { ok: true, msg: 'Both containers are up, and the app still cannot find the database. Nothing has told it where to look.' };
  }
},
{
  title: 'Containers find each other by name',
  intro:
    '<p>Here is the piece that surprises people. Compose puts every container in the stack on a private ' +
    'network and gives each one an address that is simply <strong>its service name</strong>.</p>' +
    '<p>So the database is reachable at <code>db</code>. Not an IP address you have to look up — the ' +
    'name you already gave it. Set the app’s <code>DB_HOST</code> to that and the two connect.</p>' +
    '<p>Set it to <code>localhost</code> instead and it fails, because inside a container ' +
    '<code>localhost</code> means <em>this container</em> — the app looking for a database inside itself.</p>',
  goal: ['point the app at the database using the right address', 'run the stack and get a working order page'],
  task: 'Give the web container a DB_HOST, then run the stack.',
  offer: ['web', 'db'],
  options: [
    { id: 'dbhost_localhost', label: 'DB_HOST = localhost', note: 'inside the container, this means itself', on: 'web', group: 'dbhost' },
    { id: 'dbhost_db',        label: 'DB_HOST = db',        note: 'the name of the other service',          on: 'web', group: 'dbhost' },
    { id: 'dbhost_ip',        label: 'DB_HOST = 172.17.0.3', note: 'an address that changes on restart',    on: 'web', group: 'dbhost' }
  ],
  hints: ['Only one of the three addresses survives a restart and points at the right container.',
          'Compose names the network address after the service.',
          'Choose <code>DB_HOST = db</code>.'],
  check: function (s, r) {
    if (!s.find('web') || !s.find('db')) return { ok: false, msg: 'Both containers need to be in the stack.' };
    var h = s.env('web', 'DB_HOST');
    if (!h) return { ok: false, msg: 'The app still has no <code>DB_HOST</code>, so it does not know where to look.' };
    if (h === 'localhost') return { ok: false, msg: 'Inside a container, <code>localhost</code> is that container. The app is looking for a database inside itself.' };
    if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) return { ok: false, msg: 'That address works until something restarts and Docker hands out a different one. Use a name that does not change.' };
    if (h !== 'db') return { ok: false, msg: 'The address should be the other service’s name: <code>db</code>.' };
    if (!r.ran) return { ok: false, msg: 'Run the stack to confirm the two now connect.' };
    return { ok: true, msg: 'The app reaches the database by name. Orders load.' };
  }
},
{
  title: 'The container that forgets',
  intro:
    '<p>An order goes in. The database is restarted for an upgrade. The order is gone.</p>' +
    '<p>A container’s own storage is temporary: it exists while the container does, and disappears with ' +
    'it. That is what makes containers disposable, and it is exactly wrong for a database.</p>' +
    '<p>A <strong>volume</strong> is storage that lives outside the container. Attach one and the data ' +
    'survives the container being replaced.</p>',
  goal: ['attach a volume to the database', 'run the stack and restart it — the order should still be there'],
  task: 'Give the database somewhere permanent to keep its data.',
  offer: ['web', 'db'],
  options: [
    { id: 'dbhost_db', label: 'DB_HOST = db', note: 'keep this from the last chapter', on: 'web', group: 'dbhost' },
    { id: 'vol_db',    label: 'Volume on db', note: 'storage that outlives the container', on: 'db' }
  ],
  hints: ['Keep everything from the last chapter, and add one thing to the database.',
          'The option is on the <code>db</code> container.',
          'Tick “Volume on db”, then run the stack.'],
  check: function (s, r) {
    if (s.env('web', 'DB_HOST') !== 'db') return { ok: false, msg: 'Keep <code>DB_HOST = db</code> from the last chapter, or the app loses the database again.' };
    if (!s.has('db', 'volume')) return { ok: false, msg: 'The database still has no volume, so a restart wipes every order.' };
    if (!r.ran) return { ok: false, msg: 'Run it — the simulation restarts the database and checks whether the order survived.' };
    return { ok: true, msg: 'The database restarted and the order is still there.' };
  }
},
{
  title: 'Nobody can reach it yet',
  intro:
    '<p>Everything works — from inside. A real customer opening a browser still gets nothing, because ' +
    'the stack’s network is private. Containers can talk to each other and nothing outside can talk to ' +
    'them.</p>' +
    '<p><strong>Publishing a port</strong> opens one specific door: traffic arriving on a port of the host ' +
    'machine is forwarded to a port inside a container.</p>' +
    '<p>Publish the app so customers can reach it. Do not publish the database — an internal service ' +
    'exposed to the internet is how databases end up ransomed.</p>',
  goal: ['publish the app on port 80', 'leave the database unpublished', 'run the stack and serve a real customer'],
  task: 'Open a door to the app, and only to the app.',
  offer: ['web', 'db'],
  options: [
    { id: 'dbhost_db',  label: 'DB_HOST = db',     note: 'keep this',                         on: 'web', group: 'dbhost' },
    { id: 'vol_db',     label: 'Volume on db',     note: 'keep this',                         on: 'db' },
    { id: 'port_web',   label: 'Publish web on 80', note: 'customers arrive here',            on: 'web' },
    { id: 'port_db',    label: 'Publish db on 5432', note: 'exposes the database to everyone', on: 'db' }
  ],
  hints: ['Two of the four boxes are carried over from earlier chapters — keep them ticked.',
          'One new box should be ticked. One should definitely not.',
          'Publish <code>web</code>. Leave <code>db</code> closed.'],
  check: function (s, r) {
    if (s.env('web', 'DB_HOST') !== 'db') return { ok: false, msg: 'Keep <code>DB_HOST = db</code>.' };
    if (!s.has('db', 'volume')) return { ok: false, msg: 'Keep the volume on the database, or the orders vanish on restart.' };
    if (s.has('db', 'published')) return { ok: false, msg: 'The database is published to the outside world. Nothing outside the stack needs to reach it directly — close it.' };
    if (!s.has('web', 'published')) return { ok: false, msg: 'Nothing is published, so a customer’s browser cannot reach the shop at all.' };
    if (!r.ran) return { ok: false, msg: 'Run the stack and let a customer through.' };
    return { ok: true, msg: 'A customer reaches the shop, the shop reaches the database, and the database keeps what it is given.' };
  }
}
];
