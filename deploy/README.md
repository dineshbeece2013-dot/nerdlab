# Deploying NerdLab to a Google Cloud VM

`deploy.sh` takes a bare Ubuntu VM and leaves you with a running site: Node, PostgreSQL
and nginx installed, the database created and seeded, the API under systemd, and the
built frontend served on port 80.

Written for the image you are using — `ubuntu-minimal-2604-resolute-amd64-v20260723`.
Minimal images ship almost nothing, so the script installs `curl`, `git` and
`ca-certificates` before anything else.

## 1. Create the VM

```bash
gcloud compute instances create nerdlab \
  --zone=us-central1-a \
  --machine-type=e2-small \
  --image=ubuntu-minimal-2604-resolute-amd64-v20260723 \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB \
  --tags=http-server
```

`e2-micro` works but the frontend build is memory-hungry; `e2-small` (2 GB) is the
comfortable minimum. On a 1 GB machine, add swap before deploying:

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 2. Open the firewall

GCP blocks HTTP by default, and this is separate from the VM's own firewall:

```bash
gcloud compute firewall-rules create nerdlab-http \
  --allow tcp:80,tcp:443 --target-tags=http-server
```

## 3. Deploy

SSH in and run one line:

```bash
gcloud compute ssh nerdlab --zone=us-central1-a
```

```bash
curl -fsSL https://raw.githubusercontent.com/dineshbeece2013-dot/nerdlab/main/deploy/deploy.sh | sudo bash
```

It prints the public URL when it finishes, along with the health-check results.

## Re-deploying

Run the same command again. It pulls the latest `main`, reinstalls dependencies,
rebuilds the frontend and restarts the service.

It will **not** overwrite an existing `server/.env`, so the generated database password
and JWT secrets survive. It also skips `db:migrate` when the schema already exists —
that script drops every table — and applies only the additive migrations in
`server/db/migrations/`.

To redeploy without re-running the seed:

```bash
sudo SEED_DB=no bash /opt/nerdlab/deploy/deploy.sh
```

## Knobs

Every setting is an environment variable with a sensible default:

| Variable | Default | Purpose |
|---|---|---|
| `REPO_URL` | the GitHub repo | clone source |
| `BRANCH` | `main` | branch to deploy |
| `APP_DIR` | `/opt/nerdlab` | install location |
| `APP_USER` | `nerdlab` | unprivileged service account |
| `APP_PORT` | `5000` | API port behind nginx |
| `DB_NAME` / `DB_USER` | `nerdlab` | database and role |
| `NODE_MAJOR` | `22` | Node version to install |
| `SEED_DB` | `yes` | run `db:seed` |
| `CLIENT_URL` | detected external IP | used for CORS and reset links |

## After the first deploy

1. **Change the demo accounts.** The seed creates `admin@devops.platform` and
   `student@devops.platform` with published passwords. Change or delete them.
2. **Enable HTTPS**, once a domain points at the VM:
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.example
   ```
   Then set `CLIENT_URL` and `CORS_ORIGIN` in `/opt/nerdlab/server/.env` to the
   `https://` address and `sudo systemctl restart nerdlab-api`. Password reset links
   are built from `CLIENT_URL`, so they stay broken until this is right.
3. **Configure SMTP** in the app under *Admin → Email Configuration*, then send the
   test message. Until email works, students cannot reset their own passwords.

## Troubleshooting

```bash
systemctl status nerdlab-api        # is the API up
journalctl -u nerdlab-api -f        # API logs
sudo nginx -t                       # nginx config valid
curl -s localhost:5000/api/health   # API direct, bypassing nginx
sudo -u postgres psql -d nerdlab -c '\dt'   # tables exist
```

A 502 from nginx means the API is down — check `journalctl`. A blank page with working
`/api/health` usually means the frontend build did not produce `client/dist`; rerun the
script and watch the build step for an out-of-memory kill.
