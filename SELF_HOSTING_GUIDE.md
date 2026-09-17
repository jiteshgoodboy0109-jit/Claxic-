# 🚀 Claxic Platform — Self-Hosting & Staff Management Guide

Welcome to the production deployment and operations manual for **Claxic** — the Educational Course Admissions, Faculty Instruction & Learning Management Platform.

---

## 📋 Table of Contents
1. [Platform Audit & Final Conclusion](#1-platform-audit--final-conclusion)
2. [Default Credentials & Access Portals](#2-default-credentials--access-portals)
3. [Simple VPS / Server Self-Hosting with PM2 (Recommended)](#3-simple-vps--server-self-hosting-with-pm2-recommended)
4. [Running with Standard Node.js (Quick Local / Development Start)](#4-running-with-standard-nodejs-quick-local--development-start)
5. [Domain & Automatic SSL/HTTPS Setup (Caddy / Nginx)](#5-domain--automatic-sslhttps-setup-caddy--nginx)
6. [How to Appoint & Manage Faculty/Staff](#6-how-to-appoint--manage-facultystaff)
7. [Database Persistence, Backup & Restore](#7-database-persistence-backup--restore)

---

## 1. Platform Audit & Final Conclusion

The Claxic platform has been verified and audited for production deployment:

| System Component | Status | Capability / Coverage |
| :--- | :--- | :--- |
| **Public Portal & Course Catalog** | ✅ Verified | Filter tracks, view syllabus, seat counters, dynamic enrollment |
| **Admissions Application Pipeline** | ✅ Verified | Multi-step application submission, profile validation, status tracking |
| **Payments & Billing Sandbox** | ✅ Verified | Razorpay integration ready + Instant Sandbox payment simulation & PDF tax receipts |
| **Student Learning Portal** | ✅ Verified | Day-wise sequential curriculum, video players, assessments, project submissions |
| **Staff & Faculty Directorate** | ✅ Verified | Review queues, application approvals/rejections, class scheduling, content release |
| **Admin Executive Command** | ✅ Verified | Revenue analytics, user directory, RBAC governance, audit trails, PDF dossiers |
| **Staff Appointment Engine** | ✅ Ready | Direct 1-click faculty provisioning modal + role elevation from directory |
| **Database & Persistence Engine** | ✅ Verified | Node.js 24 native SQLite WAL (`claxic.db`) with zero external DB dependencies |

---

## 2. Default Credentials & Access Portals

Claxic comes pre-seeded with 3 reference accounts for immediate testing:

| Role | Email | Password | Dedicated Login Portal |
| :--- | :--- | :--- | :--- |
| **Executive Administrator** | `admin@claxic.edu` | `Admin@123456` | `http://<your-server>:5000/admin/login` |
| **Academic Faculty / Staff** | `staff@claxic.edu` | `Staff@123456` | `http://<your-server>:5000/staff/login` |
| **Student / Applicant** | `student@claxic.edu` | `Student@123456` | `http://<your-server>:5000/student/login` |

> 🔒 **Security Best Practice**: Immediately log in as `admin@claxic.edu` upon first boot, navigate to **Student & Faculty Directory**, and update passwords.

---

## 3. Simple VPS / Server Self-Hosting with PM2 (Recommended)

Running directly with **PM2** on Linux is lightweight, fast, and uses minimal RAM (no container overhead or virtualization required).

### Prerequisites
- Any Linux server (Ubuntu 22.04 / 24.04, Debian, Rocky Linux, AWS EC2, DigitalOcean Droplet, Hetzner, Linode, Hostinger).
- Node.js **v22.5.0 or higher** (v24 LTS recommended):
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```
- PM2 process manager installed:
  ```bash
  sudo npm install -g pm2
  ```

### Step-by-Step Deployment (4 Steps)

1. **Clone your repository on the server**:
   ```bash
   git clone <your-repo-url> /var/www/claxic
   cd /var/www/claxic
   ```

2. **Install dependencies & verify health**:
   ```bash
   npm run install:all
   npm run check
   ```

3. **Build the production frontend bundle**:
   ```bash
   npm run build:prod
   ```

4. **Launch Claxic with PM2**:
   ```bash
   pm2 start ecosystem.config.cjs --env production
   pm2 save
   pm2 startup
   ```

Your platform is now permanently running in background on **Port 5000** and will automatically reboot if the server restarts!

---

## 4. Running with Standard Node.js (Quick Local / Development Start)

If running on Windows, Mac, or for local testing:

```bash
# 1. Install all dependencies
npm run install:all

# 2. Build frontend
npm run build:prod

# 3. Start unified server on Port 5000
npm run start:prod
```

Visit: `http://localhost:5000`

---

## 5. Domain & Automatic SSL/HTTPS Setup (Caddy / Nginx)

To give your platform a professional domain like `https://academy.yourdomain.com`:

### Option 1: Automatic SSL via Caddy (Easiest - Zero SSL Maintenance)
Caddy automatically provisions and auto-renews free Let's Encrypt SSL certificates.

Install Caddy:
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```

Create `/etc/caddy/Caddyfile`:
```caddy
academy.yourdomain.com {
    reverse_proxy localhost:5000
}
```
Reload Caddy:
```bash
sudo systemctl reload caddy
```

### Option 2: Nginx + Certbot
```nginx
server {
    server_name academy.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Obtain free SSL:
```bash
sudo certbot --nginx -d academy.yourdomain.com
```

---

## 6. How to Appoint & Manage Faculty/Staff

As the owner/admin, you can appoint staff members in two convenient ways:

### Approach 1: Direct 1-Click Faculty Appointment (Brand New Staff)
1. Log in at `http://<your-domain>/admin/login` as an Administrator (`admin@claxic.edu`).
2. On the left sidebar navigation, click **Student & Faculty Directory**.
3. Click the amber **`[+ Appoint Faculty / Staff]`** button in the header.
4. Fill out the appointment form:
   - **Full Name**: e.g., *Dr. Alan Turing*
   - **Official Email**: e.g., *alan@claxic.edu*
   - **System Role**: Select `STAFF (Faculty & Course Instructor)` or `ADMIN`.
   - **Temporary Password**: Click **Auto Generate** or type a secure password.
   - **Department / Wing**: e.g., *School of Artificial Intelligence*
   - **Academic Title**: e.g., *Lead Instructor*
5. Click **Appoint Faculty Member**.
6. The modal confirms the appointment and provides a **Copy Credentials Slip** button to share login details with the staff member.
7. The staff member can immediately navigate to `/staff/login` and log in with their credentials!

### Approach 2: Elevate an Existing Registered User to Staff
If a colleague already signed up with their email address:
1. In the **Student & Faculty Directory**, search for their name or email.
2. Click the **Edit** action button next to their row.
3. In the dropdown, either:
   - Choose **Promote to Faculty (STAFF)** for instant elevation, OR
   - Click **Edit Profile & Role** to adjust their department, phone, and permissions.
4. Changes take effect immediately without requiring re-login.

### What Appointed Staff Can Do
Once logged in at `/staff/login`, staff members can:
- **Curriculum Management**: Create new courses, define duration (e.g. 10 Days), and configure daily lesson release times.
- **Session Scheduling**: Upload daily video lessons, lecture notes, syllabus PDF attachments, and assessment quizzes.
- **Application Reviews**: Review candidate statements, approve/reject admissions, and provide feedback notes.
- **Student Grading**: Review student assessment scores, inspect submitted final capstone projects, and issue grading remarks.

---

## 7. Database Persistence, Backup & Restore

Claxic stores all data in Node.js's native SQLite engine (`backend/db/claxic.db`) in Write-Ahead-Logging (WAL) mode for high concurrency.

### Database Location
- `backend/db/claxic.db` (and temporary `claxic.db-wal` / `claxic.db-shm` during active transactions).

### Automated Daily Backup Script
Add a cron job to backup the database nightly:
```bash
crontab -e
```
Add this line (runs every night at 2:00 AM):
```cron
0 2 * * * cp /var/www/claxic/backend/db/claxic.db /backups/claxic_backup_$(date +\%Y\%m\%d).db
```

### Restoring from Backup
To restore a snapshot:
```bash
# 1. Stop the application
pm2 stop claxic-platform

# 2. Copy the backup file over claxic.db
cp /backups/claxic_backup_YYYYMMDD.db /var/www/claxic/backend/db/claxic.db

# 3. Restart the application
pm2 restart claxic-platform
```

---

## 🎯 Summary Checklist for Launch

- [x] Tested production build (`npm run build:prod`)
- [x] Verified pre-flight diagnostics (`npm run check`)
- [x] Pure native Node.js / PM2 hosting configured (no Docker needed)
- [x] Direct staff appointment endpoint & modal implemented
- [x] Default admin, staff, and student accounts pre-seeded
- [x] Single-port unified serving (`SERVE_FRONTEND=true` on port 5000)
- [x] Zero external database dependencies required (Node 24 native SQLite)
