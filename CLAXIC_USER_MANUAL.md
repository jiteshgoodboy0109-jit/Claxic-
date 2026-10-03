# 🎓 CLAXIC ACADEMIC PLATFORM — OFFICIAL USER & OPERATIONS MANUAL
**Enterprise Admissions, Curriculum Delivery, Faculty Governance & Executive Supervision Guide**

*Document Reference: CLX-MANUAL-2026-V1.0*  
*Last Updated: October 2026*  
*System Author: Claxic Systems Directorate & DeepMind Antigravity Engineering*

---

## 📑 TABLE OF CONTENTS
1. [Platform Architecture & Role Matrix](#1-platform-architecture--role-matrix)
2. [Student Operations Manual](#2-student-operations-manual)
   - 2.1 Registration & Profile Setup
   - 2.2 Course Discovery & Degree Selection
   - 2.3 Application & Fee Payment (GST Invoicing)
   - 2.4 Day-by-Day Learning Hub & Unlocking Schedule
   - 2.5 Video Lectures, Summaries & Learning Materials
   - 2.6 Daily Knowledge Quizzes & Capstone Projects
   - 2.7 Interactive Notification Center
3. [Faculty & Staff Operations Manual](#3-faculty--staff-operations-manual)
   - 3.1 Faculty Gateway & Access
   - 3.2 Course Classes & Curriculum Content Creation
   - 3.3 Class Allotment & Student Progression
   - 3.4 Student Attendance & Milestone Tracking
   - 3.5 Cohort Communications & Announcement Broadcasts
   - 3.6 Admissions Candidate Review & Evaluations
   - 3.7 Capstone Project Reviews & Certification
4. [Admin Executive Supervision Manual](#4-admin-executive-supervision-manual)
   - 4.1 Executive Directorate Console & 360° Analytics
   - 4.2 Admissions Pipeline & CSV Export Governance
   - 4.3 Course Catalog Creation, Faculty Allotment & PDF Export
   - 4.4 Automated "New Launch" Advertising Engine
   - 4.5 Faculty Appointments & Student Directory Control
   - 4.6 Financial Settlements, Razorpay Ledger & Instant Refunds
   - 4.7 Immutable Security Audit Trail & Email Sandbox
5. [Staff-to-Student Class Allotment & Communication Flow Matrix](#5-staff-to-student-class-allotment--communication-flow-matrix)
6. [Troubleshooting & Frequently Asked Questions (FAQ)](#6-troubleshooting--frequently-asked-questions-faq)

---

## 1. PLATFORM ARCHITECTURE & ROLE MATRIX

Claxic operates on an enterprise **Three-Tier Role-Based Access Control (RBAC)** architecture designed for seamless coordination between Students, Faculty, and System Administrators.

| Role | Portal Route | Primary Mandate | System Permissions |
| :--- | :--- | :--- | :--- |
| **Student (`USER`)** | `/student/learning` | Discover courses, enroll, attend scheduled daily classes, complete quizzes, submit projects, and track admission status. | • View Catalog & Apply<br>• Access Enrolled Day-by-Day Classes<br>• Take Daily Quizzes & Submit Projects<br>• View Payment Receipts & Invoices<br>• Receive Targeted Notifications |
| **Faculty / Staff (`STAFF`)** | `/staff/overview` | Manage course curricula, upload class episodes, set release schedules, track student attendance, evaluate candidates, and grade projects. | • Upload & Edit Course Classes<br>• Allot Topics, Summaries & Quizzes<br>• Mark Student Attendance<br>• Broadcast Cohort Announcements<br>• Review Admissions & Capstone Projects |
| **Directorate (`ADMIN`)** | `/admin/overview` | Complete institutional governance, financial settlement oversight, course commissioning, faculty appointment, and audit inspection. | • 360° Analytics & Cohort Growth<br>• Create Courses & Allot Faculty<br>• Broadcast Launch Promo Ads<br>• Appoint & Manage Faculty Accounts<br>• Issue Refunds & View Tax Ledgers<br>• Access Immutable Security Audit Trail |

---

## 2. STUDENT OPERATIONS MANUAL

### 2.1 Registration & Profile Setup
1. **Accessing the Portal**: Navigate to `/register` or click **"Join Claxic"** on the main navigation bar.
2. **Account Creation**: Enter your Full Name, Email Address, Mobile Number, and Secure Password (minimum 8 characters).
3. **Verification**: Enter the 6-digit OTP code sent to your email to verify your student account.
4. **Student Profile**: Navigate to `/student/profile` to update your institutional affiliation, current degree, and graduation year using the searchable Indian Degree selector.

### 2.2 Course Discovery & Degree Selection
1. **Catalog Navigation**: Go to `/courses` to view all active, accredited academic programs.
2. **Filter & Search**:
   - Filter by domain (e.g., *Engineering & Technology, Computer Applications, Management, Artificial Intelligence*).
   - Use the category stream pills with **Left (`<`) and Right (`>`) scroll buttons** to navigate horizontally across all streams.
3. **Course Details**: Click on any course card to inspect curriculum syllabi, weekly modules, lead faculty bio, prerequisites, and cohort schedule.

### 2.3 Application & Fee Payment (GST Invoicing)
1. **Start Application**: Click **"Apply Now"** on any course program.
2. **Fill Details**: Complete the multi-step admission dossier:
   - Personal information & contact details.
   - Academic background (Degree, College/University, CGPA).
   - Select Preferred Start Date / Batch Cohort.
3. **Payment**:
   - Review tuition breakdown including GST (18%).
   - Complete payment securely via the integrated Razorpay gateway (Cards, UPI, Net Banking).
4. **Instant Confirmation**: Upon completion, a permanent tax invoice receipt (`CLX-INV-...`) is generated with QR verification code and saved in `/student/payments`.

### 2.4 Day-by-Day Learning Hub & Unlocking Schedule
1. **Access Learning Hub**: Navigate to `/student/learning` (or `/student/courses`).
2. **Individualized Start Date**: Your daily class schedule starts from the date you selected during application.
3. **Timed Unlocking**:
   - Each day's class unlocks automatically at the scheduled release time (default: **09:00 AM**).
   - Future days are locked with a friendly countdown indicator:
     - `Unlocks today at 9:00 AM`
     - `Unlocks tomorrow at 9:00 AM`
     - `Available on Day N (Date at Time)`
   - Completed classes remain permanently unlocked for review.

### 2.5 Video Lectures, Summaries & Learning Materials
1. **Video Player**: Stream high-definition lectures with playhead controls and full-screen support.
2. **Class Topics**: View the list of specific technical topics covered in that episode.
3. **Post-Class Summary**: Read faculty-curated summary notes explaining key takeaways and architectural concepts.
4. **Downloadable Resources**: Access GitHub repository templates, PDF slides, and documentation links attached by faculty.

### 2.6 Daily Knowledge Quizzes & Capstone Projects
1. **Interactive Quizzes**:
   - After completing the lecture, take the Day Quiz to test comprehension.
   - Immediate scoring with detailed explanations for correct/incorrect answers.
   - Minimum passing threshold (default: 70%) required to earn module badge.
2. **Capstone Project**:
   - Submit your final GitHub project repository link and deployment URL.
   - Track faculty review status (`UNDER_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`).
   - Receive graduation certificate upon approval.

### 2.7 Interactive Notification Center
Click the **Bell Icon** in the top navigation to view interactive notifications:
- 🎨 **Creative Class Alerts**: Real-time notice when faculty uploads a new live episode for your enrolled course.
- 🚀 **Course Launch Promo Ads**: Exclusive discount coupons and new cohort launch announcements.
- 📋 **Application Status Updates**: Immediate alerts when admission dossiers change status.
- 💬 **Faculty Feedback**: Direct comments on submitted capstone projects.

---

## 3. FACULTY & STAFF OPERATIONS MANUAL

### 3.1 Faculty Gateway & Access
1. **Sign In**: Navigate to `/staff/login` with your institutional faculty credentials.
2. **Workspace Navigation**:
   - `Faculty Overview`: Real-time metrics on assigned courses, active students, and pending reviews.
   - `Course Classes & Content`: Uploading curriculum episodes, quizzes, and resources.
   - `Student Progress & Attendance`: Cohort attendance and milestone tracking.
   - `Cohort Notices`: Broadcasting announcements to enrolled students.

### 3.2 Course Classes & Curriculum Content Creation
1. Go to **"Course Classes & Content"** tab and select the course from the dropdown.
2. Click **"Upload New Class"** or **"Add Episode"**:
   - **Day / Class Number**: Enter the sequential day (e.g., Day 1, Day 2).
   - **Class Title**: Provide a clear, descriptive title.
   - **Video URL**: Enter direct streaming URL, YouTube, or Vimeo embed link.
   - **Duration**: Expected learning duration (e.g., `1 hr 30 mins`).
   - **Topics Covered**: Comma-separated technical keywords (e.g., `React Hooks, State Machine, REST API`).
   - **Post-Class Summary**: Detailed notes of what was taught during the session.
   - **Resource Link**: Link to GitHub repo, lecture slides, or documentation.
3. Click **"Publish Class"**:
   - The class is immediately added to the curriculum in strict sequential order.
   - **Automated Student Notification**: A targeted `CREATIVE_CLASS` notification is automatically dispatched to all students enrolled in this specific course.

### 3.3 Class Allotment & Student Progression
1. Faculty can monitor every student enrolled in their courses.
2. The platform automatically calculates:
   - Scheduled unlock date for each student based on their individual cohort start date.
   - Number of completed classes and percentage progress.
   - Quiz completion scores.

### 3.4 Student Attendance & Milestone Tracking
1. Open **"Student Progress & Attendance"** tab.
2. Review the enrolled student roster with individual progress meters.
3. **Mark Attendance**: Click the attendance toggle for any student on a specific class date to record attendance.
4. **Track Performance**: Inspect quiz scores and verify if the student meets criteria for graduation.

### 3.5 Cohort Communications & Announcement Broadcasts
1. Open **"Cohort Notices"** tab.
2. Click **"Broadcast Notice"**:
   - Select Target Course (or choose `ALL COHORTS`).
   - Set Priority: `NORMAL` or `HIGH (Urgent)`.
   - Enter Headline & Announcement Content.
3. Click **"Broadcast"**:
   - The notice is logged in the cohort announcement board.
   - **Real-time Push Notification**: Every enrolled student instantly receives a high-priority notification bell alert linking directly to their learning dashboard.

### 3.6 Admissions Candidate Review & Evaluations
1. Open **"Admissions Review"** pipeline.
2. Review applicant academic credentials, statement of purpose, and selected stream.
3. Assign interview scores, faculty evaluation notes, and update admission status (`UNDER_REVIEW`, `APPROVED`, `REJECTED`).

### 3.7 Capstone Project Reviews & Certification
1. Open **"Project Submissions"** section.
2. Inspect student GitHub repository links and live project deployments.
3. Provide constructive faculty feedback:
   - Select `APPROVED` to grant course completion and issue certification.
   - Select `CHANGES_REQUESTED` to request revisions (the student receives instant feedback).

---

## 4. ADMIN EXECUTIVE SUPERVISION MANUAL

### 4.1 Executive Directorate Console & 360° Analytics
1. **Access**: Sign in via `/admin/login`.
2. **Executive Dashboard (`/admin/overview`)**:
   - **Gross Revenue**: Real-time aggregated financial turnover from Razorpay transactions.
   - **Total Admitted & Enrolled Students**: Active participant count across all academic tracks.
   - **Cohort Capacity Fill Rate**: Real-time meter showing filled seats vs total seat allotment.
   - **12-Month Cohort Growth Analysis**: Comparative month-by-month analysis (Past Year vs YTD Current Year) with applied, admitted, and enrolled breakdowns.
   - **Subject Stream Distribution**: Interactive pie breakdown of students across Engineering, AI, Design, and Management tracks.

### 4.2 Admissions Pipeline & CSV Export Governance
1. Open **"Applications"** tab (`/admin/applications`).
2. Search and filter applications by candidate name, email, application number, course, and status.
3. **Status Controls**: Override or update status (`DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `CONFIRMED`, `REJECTED`).
4. **CSV Export**: Click **"Export Admissions CSV"** to download the complete regulatory ledger for offline reporting and university compliance.

### 4.3 Course Catalog Creation, Faculty Allotment & PDF Export
1. Open **"Course Catalog"** tab (`/admin/courses`).
2. Click **"Add New Course"**:
   - **Basic Information**: Title, slug, category, level, duration, pricing, and seat capacity.
   - **Lead Faculty Allotment**: Select or enter designated Faculty Instructor name, title, bio, and avatar.
   - **Curriculum Outline**: Define module milestones and learning outcomes.
3. **Official PDF Catalog**: Click **"Download Catalog (PDF)"** to generate an executive course brochure with official Claxic branding and course specifications.

### 4.4 Automated "New Launch" Advertising Engine
1. In the Course Catalog, locate any newly created or featured course.
2. Click **"Broadcast Launch Ad"**:
   - Optionally enter custom promotional headline and discount percentage.
3. Click **"Send Broadcast"**:
   - The platform sends an automated, high-impact `COURSE_LAUNCH_AD` notification to **all registered students**.
   - Notifications include course banner art, discount badge (e.g., `35% OFF`), seat countdown, and a direct "Claim Seat" button.

### 4.5 Faculty Appointments & Student Directory Control
1. Open **"Student & Faculty Directory"** tab (`/admin/users`).
2. **Appoint New Faculty**:
   - Click **"Appoint Faculty"**.
   - Enter Full Name, Email, Password, Department, and Designation.
   - The faculty member is instantly provisioned and can immediately log in to `/staff/login`.
3. **User Management**:
   - Edit user profile details (Name, Degree, Mobile, Affiliation).
   - Toggle Account Status (`Active` / `Suspended`).
   - Trigger Admin Password Reset with automatic session termination.
   - Permanently delete user accounts with full cleanup of session tokens and applications.

### 4.6 Financial Settlements, Razorpay Ledger & Instant Refunds
1. Open **"Financial Settlements"** tab (`/admin/financials`).
2. Inspect all completed student transactions, Razorpay order IDs, GST tax components, and payment methods.
3. **Official PDF Financial Audit**: Click **"Download Audit (PDF)"** to export an official audit document for tax compliance.
4. **Process Refund**:
   - Click **"Refund"** on any eligible transaction.
   - Enter official refund rationale.
   - The transaction status is updated to `REFUNDED`, the associated student enrollment is cancelled, and the course seat is automatically restored to the public pool.

### 4.7 Immutable Security Audit Trail & Email Sandbox
1. Open **"Audit Security Trail"** tab (`/admin/audit`).
2. Every administrative, faculty, and financial operation is timestamped and recorded with admin ID, action type, target resource, and IP signature.
3. **Email Sandbox**: Access the system dispatch logs to verify outbound email delivery (welcome emails, verification codes, payment receipts).

---

## 5. STAFF-TO-STUDENT CLASS ALLOTMENT & COMMUNICATION FLOW MATRIX

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ADMIN DIRECTORATE                                │
│   • Commissions Course Program & Sets Capacity (e.g. 40 Seats)              │
│   • Allots Lead Faculty / Staff to the Course                               │
│   • Broadcasts Course Launch Ads to all Students                            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Course & Faculty Allotted
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FACULTY / STAFF                                  │
│   • Uploads Day-by-Day Classes (Day 1..10) with Video, Summary & Quiz       │
│   • Broadcasts Targeted Cohort Announcements                                │
│   • Evaluates Projects & Marks Daily Attendance                             │
└───────────────────┬─────────────────────────────────────┬───────────────────┘
                    │                                     │
    Targeted Class  │                     Targeted Cohort │
    Notification    │                     Notice          │
                    ▼                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                STUDENT                                      │
│   • Enrolls with Individual Start Date                                      │
│   • Automated Daily Schedule: Class unlocks every morning at 09:00 AM       │
│   • Watches Lectures, Reads Post-Class Summary, Takes Day Quiz              │
│   • Submits Capstone Project & Receives Verified Certification              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Automated Guarantees:
1. **Targeted Accuracy**: Creative Class notifications are delivered **strictly** to students enrolled in that course.
2. **Individualized Start Time**: If Student A starts on Sep 1 and Student B starts on Sep 8, their class unlock schedules calculate independently without overlap or content leakage.
3. **Zero-Lag Communication**: Announcements and class uploads trigger immediate real-time updates in the student notification badge.

---

## 5.1 REAL-TIME IN-BUILD POP & NATIVE DEVICE NOTIFICATIONS

Claxic includes a dual-channel real-time notification delivery engine:

### 1. In-Build Floating Pop Notification Card
* **Interactive Toast Banner**: Whenever faculty broadcasts a notice or uploads a creative class, a sleek, glassmorphic pop card slides down at the top-right of the screen (`z-[99999]`).
* **Visual Categorization**:
  * 🎨 **Creative Class**: Indigo glowing banner with film icon and "View Class Lesson" button.
  * 🚀 **Course Launch Promo**: Amber/Flame gradient with "Explore Course Promo" button.
  * 📢 **Faculty Notice**: Vermilion `#EE2D02` banner with priority alert icon and "Open Notice" button.
* **Auto-Dismiss Progress Line**: Features an animated 6-second countdown bar that smoothly dismisses the pop banner, or users can click the card to navigate immediately.
* **Harmonic Web Audio Chime**: Synthesized dual-frequency harmonic chime (D5 $\rightarrow$ A5) plays instantly when a notification pops up.

### 2. Native Device & System OS Push (Windows / macOS / Android)
* **Standard OS Notification**: Uses the browser's Native `window.Notification` API and Background Service Worker (`sw.js`).
* **Background Delivery**: Even if the user has minimized the browser tab or is browsing another window, the computer/phone displays a native system notification.
* **One-Click Enable**: Inside the Notification Bell drawer, click **"Enable Device System Push"** to grant browser permission.
* **Interactive Demo / Test**: Click **"Test Pop Alert"** inside the notification drawer footer at any time to immediately test both the In-Build Pop banner, audio chime, and native device system notification!

---

## 6. TROUBLESHOOTING & FREQUENTLY ASKED QUESTIONS (FAQ)

### Q1: Why is a student's class showing "Locked"?
**Answer**: Classes unlock according to the student's individual cohort start date and the course's daily release time (default 09:00 AM). The lock banner displays the exact date and time the episode will unlock. Once completed, a class remains unlocked permanently.

### Q2: How can Faculty change an uploaded class video or summary?
**Answer**: Faculty can navigate to `/staff/classes`, select the course, and click the **"Edit"** pencil icon next to any class episode. Update the video link, topics, summary, or quiz questions, then click **"Save Changes"**.

### Q3: How does Admin appoint a new Faculty instructor?
**Answer**: Admin opens `/admin/users`, clicks **"Appoint Faculty"**, enters the faculty member's credentials and department, and clicks **"Appoint Staff Member"**. The new instructor can immediately sign in at `/staff/login`.

### Q4: Are Razorpay payment receipts accessible to both Student and Admin?
**Answer**: Yes. Students can view and download their official GST receipt under `/student/payments`. Administrators can inspect, verify, and export all receipts under `/admin/financials`.

### Q5: How do Faculty announcements reach students?
**Answer**: When faculty posts an announcement in `/staff/announcements`, the platform automatically broadcasts a high-priority notification to all students enrolled in that course (or all active students if set to `ALL`).

---
*Claxic Academic Admissions & Curriculum Platform • Enterprise Edition 2026*
