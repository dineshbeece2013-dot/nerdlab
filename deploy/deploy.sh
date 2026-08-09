#!/usr/bin/env bash
#
# NerdLab — one-shot deploy to a fresh Google Cloud VM.
#
# Target image: ubuntu-minimal-2604-resolute-amd64-v20260723
# (a minimal image, so this installs everything from scratch)
#
# Usage, as root or with sudo:
#
#   curl -fsSL https://raw.githubusercontent.com/dineshbeece2013-dot/nerdlab/main/deploy/deploy.sh | sudo bash
#
# or after cloning:
#
#   sudo bash deploy/deploy.sh
#
# Re-running it is safe and cheap. Packages already installed are not touched
# (apt is skipped entirely when nothing is missing), dependencies are only
# reinstalled when a lockfile changed, and the frontend is only rebuilt when
# its sources changed. Pass FORCE_BUILD=yes to rebuild regardless. An existing
# /opt/nerdlab/server/.env is never overwritten, so secrets survive.
#
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/dineshbeece2013-dot/nerdlab.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-/opt/nerdlab}"
APP_USER="${APP_USER:-nerdlab}"
APP_PORT="${APP_PORT:-5000}"
DB_NAME="${DB_NAME:-nerdlab}"
DB_USER="${DB_USER:-nerdlab}"
NODE_MAJOR="${NODE_MAJOR:-22}"
SEED_DB="${SEED_DB:-yes}"     # set to "no" to skip demo content on redeploys

log()  { printf '\n\033[1;36m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Run this with sudo or as root."

# ---------------------------------------------------------------- packages ---
# The minimal image ships almost nothing, so ca-certificates/curl/gnupg come first.
PACKAGES="ca-certificates curl gnupg git nginx postgresql postgresql-contrib openssl ufw"
export DEBIAN_FRONTEND=noninteractive

missing=""
for pkg in $PACKAGES; do
  dpkg-query -W -f='${Status}' "$pkg" 2>/dev/null | grep -q "^install ok installed$" || missing="$missing $pkg"
done

if [ -n "$missing" ]; then
  log "Installing system packages:$missing"
  apt-get update -qq
  # shellcheck disable=SC2086
  apt-get install -y -qq --no-install-recommends $missing
else
  # Nothing to fetch — skipping apt-get update too, since refreshing the
  # package indexes alone costs tens of megabytes on every redeploy.
  log "System packages already installed — skipping apt"
fi

# ------------------------------------------------------------------- node ---
need_node=yes
if command -v node >/dev/null 2>&1; then
  current="$(node -p 'process.versions.node.split(".")[0]')"
  [ "$current" -ge "$NODE_MAJOR" ] && need_node=no
fi

if [ "$need_node" = yes ]; then
  log "Installing Node.js ${NODE_MAJOR}.x from NodeSource"
  install -d -m 0755 /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  chmod a+r /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list
  apt-get update -qq
  apt-get install -y -qq nodejs
fi
log "Node $(node --version) / npm $(npm --version)"

# ------------------------------------------------------------------- user ---
if ! id -u "$APP_USER" >/dev/null 2>&1; then
  log "Creating service user '$APP_USER'"
  useradd --system --create-home --shell /usr/sbin/nologin "$APP_USER"
fi

# ------------------------------------------------------------------ source ---
if [ -d "$APP_DIR/.git" ]; then
  log "Updating existing checkout at $APP_DIR"
  git -C "$APP_DIR" remote set-url origin "$REPO_URL"
  git -C "$APP_DIR" fetch --depth 1 origin "$BRANCH"
  git -C "$APP_DIR" reset --hard "origin/$BRANCH"
else
  log "Cloning $REPO_URL into $APP_DIR"
  rm -rf "$APP_DIR"
  git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

# --------------------------------------------------------------- postgres ---
log "Preparing PostgreSQL"
systemctl enable --now postgresql

db_exists()   { su - postgres -c "psql -tAc \"SELECT 1 FROM pg_database WHERE datname='$DB_NAME'\"" | grep -q 1; }
role_exists() { su - postgres -c "psql -tAc \"SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'\"" | grep -q 1; }

ENV_FILE="$APP_DIR/server/.env"

if [ -f "$ENV_FILE" ]; then
  log "Keeping existing $ENV_FILE"
  # shellcheck disable=SC1090
  DB_PASSWORD="$(grep -E '^DB_PASSWORD=' "$ENV_FILE" | cut -d= -f2-)"
  JWT_SECRET="$(grep -E '^JWT_SECRET=' "$ENV_FILE" | cut -d= -f2-)"
  JWT_RESET_SECRET="$(grep -E '^JWT_RESET_SECRET=' "$ENV_FILE" | cut -d= -f2-)"
else
  DB_PASSWORD="$(openssl rand -hex 24)"
  JWT_SECRET="$(openssl rand -hex 48)"
  JWT_RESET_SECRET="$(openssl rand -hex 48)"
fi

if role_exists; then
  su - postgres -c "psql -q -c \"ALTER ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASSWORD'\""
else
  su - postgres -c "psql -q -c \"CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASSWORD'\""
fi

if ! db_exists; then
  log "Creating database '$DB_NAME'"
  su - postgres -c "createdb -O $DB_USER $DB_NAME"
fi
su - postgres -c "psql -q -c \"GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER\""
su - postgres -c "psql -q -d $DB_NAME -c \"GRANT ALL ON SCHEMA public TO $DB_USER\""

# ------------------------------------------------------------------- .env ---
PUBLIC_HOST="$(curl -fsS -H 'Metadata-Flavor: Google' \
  'http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip' 2>/dev/null || true)"
[ -n "$PUBLIC_HOST" ] || PUBLIC_HOST="$(hostname -I | awk '{print $1}')"
CLIENT_URL="${CLIENT_URL:-http://$PUBLIC_HOST}"

if [ ! -f "$ENV_FILE" ]; then
  log "Writing $ENV_FILE"
  cat > "$ENV_FILE" <<EOF
# Generated by deploy/deploy.sh on $(date -u +%FT%TZ)
PORT=$APP_PORT
NODE_ENV=production
CLIENT_URL=$CLIENT_URL

DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
JWT_RESET_SECRET=$JWT_RESET_SECRET

# nginx runs on this host, as does cloudflared if a tunnel is used, so only
# loopback proxies are trusted when working out the real client IP.
TRUST_PROXY=loopback
CORS_ORIGIN=$CLIENT_URL
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email is configured from the admin panel (Admin -> Email Configuration).
# These are only fallbacks used when no setting has been saved.
EMAIL_ENABLED=false
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM_NAME=NerdLab Learning Platform
EMAIL_FROM_ADDRESS=
EOF
fi
chown "$APP_USER":"$APP_USER" "$ENV_FILE"
chmod 600 "$ENV_FILE"

# ------------------------------------------------------------ dependencies ---
# npm ci wipes node_modules and rebuilds it, and the Vite build is the most
# memory-hungry step in this script. Both are skipped when their inputs have
# not changed, so a redeploy that only touches lab HTML costs almost nothing.
# Delete $STATE_DIR (or pass FORCE_BUILD=yes) to force the full path.
STATE_DIR="$APP_DIR/.deploy-state"
install -d -o "$APP_USER" -g "$APP_USER" "$STATE_DIR"

fingerprint() { sha256sum "$@" 2>/dev/null | sha256sum | cut -d' ' -f1; }
unchanged() {  # unchanged <name> <current-hash>
  [ "${FORCE_BUILD:-no}" = yes ] && return 1
  [ -f "$STATE_DIR/$1" ] && [ "$(cat "$STATE_DIR/$1")" = "$2" ]
}
remember() { printf '%s' "$2" > "$STATE_DIR/$1"; chown "$APP_USER":"$APP_USER" "$STATE_DIR/$1"; }

server_hash="$(fingerprint "$APP_DIR/server/package.json" "$APP_DIR/server/package-lock.json")"
if unchanged server-deps "$server_hash" && [ -d "$APP_DIR/server/node_modules" ]; then
  log "Server dependencies unchanged — skipping install"
else
  log "Installing server dependencies"
  su -s /bin/bash "$APP_USER" -c "cd '$APP_DIR/server' && npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev --no-audit --no-fund"
  remember server-deps "$server_hash"
fi

client_hash="$(fingerprint "$APP_DIR/client/package.json" "$APP_DIR/client/package-lock.json")"
if unchanged client-deps "$client_hash" && [ -d "$APP_DIR/client/node_modules" ]; then
  log "Frontend dependencies unchanged — skipping install"
else
  log "Installing frontend dependencies"
  su -s /bin/bash "$APP_USER" -c "cd '$APP_DIR/client' && npm ci --no-audit --no-fund || npm install --no-audit --no-fund"
  remember client-deps "$client_hash"
fi

# Rebuild when anything the bundle is made from has changed.
src_hash="$(find "$APP_DIR/client/src" "$APP_DIR/client/index.html" \
              "$APP_DIR/client/vite.config.js" "$APP_DIR/client/tailwind.config.js" \
              -type f -print0 2>/dev/null | sort -z | xargs -0 sha256sum 2>/dev/null | sha256sum | cut -d' ' -f1)"
if unchanged client-build "$src_hash" && [ -f "$APP_DIR/client/dist/index.html" ]; then
  log "Frontend unchanged — skipping build"
else
  log "Building the frontend"
  su -s /bin/bash "$APP_USER" -c "cd '$APP_DIR/client' && npm run build"
  remember client-build "$src_hash"
fi

# --------------------------------------------------------------- database ---
FIRST_RUN=no
if ! su - postgres -c "psql -tAqc \"SELECT to_regclass('public.tasks')\" -d $DB_NAME" | grep -q tasks; then
  FIRST_RUN=yes
fi

if [ "$FIRST_RUN" = yes ]; then
  log "Creating the schema (first run)"
  su -s /bin/bash "$APP_USER" -c "cd '$APP_DIR/server' && npm run db:migrate"
else
  log "Schema already present — skipping db:migrate (it would DROP every table)"
fi

log "Applying additive migrations"
su -s /bin/bash "$APP_USER" -c "cd '$APP_DIR/server' && npm run db:upgrade"

if [ "$SEED_DB" = yes ]; then
  log "Seeding categories, courses and labs"
  su -s /bin/bash "$APP_USER" -c "cd '$APP_DIR/server' && npm run db:seed"
fi

# ---------------------------------------------------------------- systemd ---
log "Installing the nerdlab-api service"
cat > /etc/systemd/system/nerdlab-api.service <<EOF
[Unit]
Description=NerdLab Learning Platform API
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR/server
EnvironmentFile=$APP_DIR/server/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable nerdlab-api
systemctl restart nerdlab-api

# ------------------------------------------------------------------ nginx ---
log "Configuring nginx"
cat > /etc/nginx/sites-available/nerdlab <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root $APP_DIR/client/dist;
    index index.html;

    client_max_body_size 12m;
    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;

    # Hashed build assets never change under the same name.
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Note: /tasks and /tasks/:id are app routes, not API routes — they must
    # fall through to the SPA below. Lab HTML is served from
    # /api/tasks/:id/content, which the /api/ block above already covers.

    # Single-page app: every other path is handled by React Router.
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

ln -sf /etc/nginx/sites-available/nerdlab /etc/nginx/sites-enabled/nerdlab
rm -f /etc/nginx/sites-enabled/default
# nginx needs to traverse into the build directory
chmod o+x "$APP_DIR" "$APP_DIR/client" 2>/dev/null || true
nginx -t
systemctl enable nginx
systemctl restart nginx

# --------------------------------------------------------------- firewall ---
# The host firewall. GCP's own firewall rules are separate — see the note below.
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH >/dev/null 2>&1 || true
  ufw allow 80/tcp   >/dev/null 2>&1 || true
  ufw allow 443/tcp  >/dev/null 2>&1 || true
  yes | ufw enable   >/dev/null 2>&1 || true
fi

# ----------------------------------------------------------------- verify ---
log "Verifying"
sleep 3
api_status="$(curl -fsS -o /dev/null -w '%{http_code}' "http://127.0.0.1:$APP_PORT/api/health" || echo 000)"
web_status="$(curl -fsS -o /dev/null -w '%{http_code}' "http://127.0.0.1/" || echo 000)"

echo
echo "  API  /api/health : $api_status"
echo "  Site /           : $web_status"

if [ "$api_status" != "200" ]; then
  warn "The API did not answer. Recent logs:"
  journalctl -u nerdlab-api -n 30 --no-pager || true
fi

cat <<EOF

──────────────────────────────────────────────────────────────
  NerdLab is deployed.

  URL            http://$PUBLIC_HOST
  App directory  $APP_DIR
  Service        systemctl status nerdlab-api
  Logs           journalctl -u nerdlab-api -f
  Environment    $ENV_FILE   (contains generated secrets)

  Demo accounts created by the seed:
    admin@devops.platform / AdminPass123!
    student@devops.platform / StudentPass123!
  CHANGE OR DELETE THESE before letting anyone else in.

  Still to do by hand:
    1. Open port 80 in the GCP firewall, from your workstation:
         gcloud compute firewall-rules create nerdlab-http \\
           --allow tcp:80,tcp:443 --target-tags=http-server
         gcloud compute instances add-tags INSTANCE --tags=http-server
    2. Point a domain at $PUBLIC_HOST, then enable HTTPS:
         sudo apt-get install -y certbot python3-certbot-nginx
         sudo certbot --nginx -d your-domain.example
       and set CLIENT_URL / CORS_ORIGIN in $ENV_FILE to the https URL.
    3. Configure SMTP in the app: Admin -> Email Configuration.
──────────────────────────────────────────────────────────────
EOF
