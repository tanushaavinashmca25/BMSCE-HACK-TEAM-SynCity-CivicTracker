# Civic Tracker - Municipal Command Center

The "Strategic Command" layer of the Civic Tracker ecosystem. A professional Next.js admin dashboard for city officials to monitor infrastructure health and manage repair workflows.

## 🚀 Core Features

### 1. Municipal Command Center
- **Strategic KPIs:** Real-time tracking of Mean Time to Resolution (MTTR) and SLA Compliance.
- **Urgency Matrix:** Automatic prioritization of civic issues based on Gemini AI urgency scores.
- **Predictive Governance:** Analysis of issue trends to move from reactive to proactive maintenance.

### 2. Geospatial Intelligence
- **Issue Packets:** Visualizes reports grouped by PostGIS `ST_ClusterDBSCAN` to identify high-density problem zones.
- **Ward Oversight:** Automatically routes issues to specific administrative zones.
- **Deduplication Analytics:** Monitors the efficiency of the spatial filtering layer.

### 3. Workforce Management
- **Audit Trails:** Tracks the lifecycle of a report from capture to verified resolution.
- **Proof of Fix:** Displays "Before vs. After" semantic verification results.

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **UI Components:** [Shadcn UI](https://ui.shadcn.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)

## 🏁 Getting Started

### 1. Installation
```bash
cd admin
npm install
```

### 2. Configuration
```bash
cp .env.example .env.local
```
Set `NEXT_PUBLIC_API_URL` to your backend's URL (e.g. `http://localhost:8000` or the ngrok HTTPS URL).

### 3. Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure
- `src/app/page.tsx`: Main dashboard with KPIs and recent issues.
- `src/components/ui/`: Reusable Shadcn UI components.
