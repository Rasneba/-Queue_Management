# Lancet General Hospital — AI-Powered Queue Management System

## Product Overview

**Lancet General Hospital QMS** is a modern, AI-powered healthcare queue management system designed to streamline patient flow, reduce wait times, and improve operational efficiency in hospitals and clinics. Built with cutting-edge web technologies, it provides a complete end-to-end solution — from patient self-check-in to doctor consultation and analytics.

---

## Key Features

### 1. Patient Self-Check-In Kiosk
- Touch-friendly kiosk interface for patient registration
- Automatic queue ticket generation with unique patient IDs
- Supports walk-in and pre-registered patients
- Multi-language support (English, Amharic, Afaan Oromoo)
- Captures: name, age, gender, symptoms, mobile number

### 2. AI-Powered Clinical Triage
- Intelligent triage scoring based on reported symptoms
- Automatic priority assignment (Emergency, High, Medium, Low)
- AI-generated clinical analysis:
  - Priority explanation
  - Clinical precautions
  - Suggested vitals to measure
- Recommended department routing
- Estimated wait time calculation

### 3. Live Waiting Board
- Real-time digital display board for waiting rooms
- Shows patient queue status across all departments
- Auto-refreshing with live updates
- Displays patient number, department, priority, and wait time
- Ideal for lobby screens and monitors

### 4. Doctor & Staff Console
- Dedicated dashboard for doctors and clinical staff
- View patient queue filtered by department
- Call next patient, mark as serving or completed
- Shift logging and session tracking
- View patient symptoms, triage priority, and AI analysis
- Mark patients as No-Show

### 5. Reception Desk
- Front desk management console
- Register new patients or manage existing ones
- Assign patients to departments and rooms
- Print queue tickets
- Real-time queue overview

### 6. Back Office Administration
- **Dashboard**: System-wide overview and statistics
- **Staff Management**: Add, edit, deactivate staff accounts
- **Settings**: Configure departments and roles
- **Reports**: Generate and export operational reports

### 7. Analytics & Reporting
- Real-time queue performance metrics
- Department-wise and priority-wise breakdowns
- Average wait time tracking
- Patient volume trends
- Visual charts and graphs (bar charts, line charts)
- Exportable reports

### 8. QR Code & Patient Tracking
- QR code generation for each patient
- Patients can track their queue status via URL
- Mobile-friendly patient status modal

---

## Patient Journey (Workflow)

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  CHECK-IN    │───>│   TRIAGE      │───>│   WAITING     │───>│   DOCTOR     │───>│  COMPLETED   │
│  (Kiosk)     │    │  (AI Score)   │    │   (Board)     │    │ (Consult)    │    │              │
└─────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

1. **Patient arrives** → Checks in at the self-service kiosk or reception desk
2. **AI Triage** → System analyzes symptoms, assigns priority score and recommended department
3. **Waiting** → Patient appears on the live waiting board; estimated wait time displayed
4. **Doctor Consultation** → Doctor calls patient, views full clinical summary, provides care
5. **Completion** → Patient marked as completed; data stored for analytics

---

## Supported Departments

| Department | Department | Department |
|------------|------------|------------|
| General Medicine | Pediatrics | Cardiology |
| Orthopedics | Emergency | Neurology |
| Oncology | Gynecology | Ophthalmology |
| ENT | Dermatology | Radiology |
| Laboratory | Pharmacy | |

*Departments are fully configurable from the Back Office.*

---

## User Roles

| Role | Access Level | Description |
|------|-------------|-------------|
| **Admin** | Full access | System configuration, staff management, reports |
| **Reception** | Front desk | Patient registration, queue management |
| **Triage** | Clinical triage | Symptom input, priority assignment |
| **Doctor** | Consultation | Patient queue, clinical view, status updates |

*Roles are configurable. Custom roles can be added via Back Office settings.*

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL (Neon-compatible) |
| AI Integration | Google Gemini API |
| Charts | Recharts |
| Animations | Motion (Framer Motion) |
| Icons | Lucide React |
| Print Server | Custom Node.js server |
| TTS Server | Python-based text-to-speech |

---

## Multi-Language Support

The system supports **3 languages** out of the box:

- **English** — Default language
- **Amharic** (አማርኛ) — Ethiopia's official language
- **Afaan Oromoo** (ኦሮማ) — Widely spoken in Ethiopia

Language can be switched instantly from the top navigation bar.

---

## System Architecture

```
┌────────────────────────────────────────────────────┐
│                    CLIENT LAYER                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Kiosk    │ │ Board    │ │ Doctor   │           │
│  │ (Tablet) │ │ (Screen) │ │ (PC)     │           │
│  └──────────┘ └──────────┘ └──────────┘           │
└──────────────────────┬─────────────────────────────┘
                       │
┌──────────────────────┴─────────────────────────────┐
│                  NEXT.JS SERVER                     │
│  ┌──────────────────────────────────────────┐      │
│  │  API Routes (REST)                       │      │
│  │  /api/patients  /api/doctors             │      │
│  │  /api/staff     /api/settings            │      │
│  │  /api/stats     /api/reports             │      │
│  │  /api/events    /api/track               │      │
│  └──────────────────────────────────────────┘      │
│  ┌──────────────────────────────────────────┐      │
│  │  Real-time Updates (Server-Sent Events)  │      │
│  └──────────────────────────────────────────┘      │
└──────────────────────┬─────────────────────────────┘
                       │
┌──────────────────────┴─────────────────────────────┐
│                PostgreSQL DATABASE                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ patients │ │ staff    │ │ doctor   │           │
│  │          │ │          │ │ _sessions│           │
│  └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────────────┐ ┌────────────────────┐      │
│  │ system_settings  │ │ patient_counter    │      │
│  └──────────────────┘ └────────────────────┘      │
└────────────────────────────────────────────────────┘
```

---

## Database Schema

### `patients` Table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Unique patient ID (e.g., P-1) |
| name | TEXT | Patient full name |
| age | INTEGER | Patient age |
| gender | TEXT | Male / Female / Other |
| symptoms | TEXT | Reported symptoms |
| triage_priority | TEXT | Emergency / High / Medium / Low |
| triage_score | INTEGER | AI-assigned score (1-5) |
| recommended_department | TEXT | Suggested department |
| assigned_room | TEXT | Assigned consultation room |
| status | TEXT | Waiting / Called / Serving / Completed / NoShow |
| check_in_time | TIMESTAMPTZ | Check-in timestamp |
| called_time | TIMESTAMPTZ | When patient was called |
| completed_time | TIMESTAMPTZ | When consultation finished |
| estimated_wait_minutes | INTEGER | Estimated wait time |
| mobile | TEXT | Contact number |
| service | TEXT | Service type |
| priority_level | TEXT | Standard / Urgent / VIP |

### `staff` Table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Unique staff ID |
| name | TEXT | Staff member name |
| role | TEXT | Reception / Triage / Doctor / Admin |
| password | TEXT | Login password |
| department | TEXT | Assigned department |
| desk | TEXT | Assigned desk |
| category | TEXT | Staff category |
| is_active | BOOLEAN | Active status |

### `doctor_sessions` Table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Session ID |
| doctor_name | TEXT | Doctor name |
| room | TEXT | Room assignment |
| department | TEXT | Department |
| start_time | TIMESTAMPTZ | Session start |
| end_time | TIMESTAMPTZ | Session end |
| is_active | BOOLEAN | Current session status |
| patients_treated | TEXT[] | Array of treated patient IDs |

---

## Benefits

- **Reduced Wait Times**: AI-powered triage ensures critical patients are seen first
- **Improved Patient Experience**: Self-service kiosks and transparent queue visibility
- **Operational Efficiency**: Automated queue routing and department assignment
- **Data-Driven Decisions**: Real-time analytics and historical reporting
- **Scalable**: Supports multiple departments, doctors, and rooms
- **Easy Deployment**: Web-based, runs on any modern browser; no app installation needed
- **Offline Capable**: Graceful degradation with local state management
- **Dark Mode**: Full dark mode support for all interfaces
- **Mobile Responsive**: Works on tablets, phones, and desktops

---

## Deployment Options

1. **Cloud Hosted** — Deploy on Vercel, AWS, or any Node.js hosting
2. **On-Premise** — Run on local hospital servers
3. **Neon PostgreSQL** — Managed cloud database (recommended)
4. **Self-Hosted PostgreSQL** — For air-gapped environments

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure database
cp .env.example .env.local
# Edit .env.local with your PostgreSQL credentials

# 3. Run development server
npm run dev

# 4. Access the application
# Open http://localhost:3000
```

---

## System Requirements

| Requirement | Minimum |
|-------------|---------|
| Node.js | v18+ |
| PostgreSQL | v14+ |
| Browser | Chrome, Firefox, Safari, Edge (latest) |
| Display | 1024x768 (kiosk: tablet recommended) |
| Network | LAN or internet connectivity |

---

## Pricing Model

*Contact sales for custom pricing based on:*

- Number of departments
- Number of concurrent users
- Deployment type (cloud vs. on-premise)
- Support and maintenance level
- Customization requirements

---

## Support & Maintenance

- Technical documentation included
- Database auto-migration on startup
- Built-in health checks and error recovery
- Automatic retry logic for transient database errors
- Real-time server-sent events for live updates

---

## Contact

**Lancet General Hospital**
Megenagna, Afarensis Building, Addis Ababa, Ethiopia
Phone: +251 977 171 71

---

*Built with Next.js 15 · React 19 · PostgreSQL · AI-Powered Triage*
