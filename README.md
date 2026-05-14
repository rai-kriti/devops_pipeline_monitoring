# DevOps Pipeline Monitor

**Devops Pipeline Monitor** is an intelligent, real-time observability and diagnostics platform designed for engineering teams. It allows developers and managers to instantly assess the CI/CD health of an entire GitHub organization, track key delivery metrics, and use AI to automatically triage and diagnose pipeline failures.

## 🚀 Core Value Proposition
Instead of manually digging through hundreds of lines of raw GitHub Actions logs to figure out why a build failed, developers can simply look at the unified dashboard. If a pipeline is red, a single click triggers an AI agent (powered by Claude 3 Haiku) to analyze the failure metadata, pinpoint the exact step that crashed, explain the root cause, and offer immediate fix instructions.

## ✨ Key Features

### 1. Organizational Health Dashboard
- Search for any public GitHub organization or user (e.g., `vercel`, `facebook`).
- Instantly view an aggregated summary of their Total Repositories, Active Workflows, and an **Overall Pipeline Health Score**.
- Clean, responsive grid layout with expandable accordion panels for deep-dive analytics.

### 2. AI Auto-Triage (One-Click Diagnostics)
- Replaces tedious manual log-reading with instantaneous AI summaries.
- **Smart Metadata Extraction:** Instead of failing on massive log limits, the backend intelligently extracts structured metadata (job names, step conclusions, execution times).
- The AI returns a clean, structured report: **Summary**, **Root Cause**, **Fix Instructions**, and **Action Required**.

### 3. DORA Metrics Integration
- Automatically calculates industry-standard DORA metrics for every active repository:
  - **Change Failure Rate (CFR):** The percentage of recent deployments that resulted in a pipeline failure.
  - **Mean Time To Recovery (MTTR):** Calculates exactly how many hours it takes the engineering team to ship a successful fix after a pipeline goes red.
- **Visualizations:** Features an interactive Recharts bar chart tracking deployment frequency (Success vs. Failure) over the last 10 days.

### 4. Systemic Pattern Detection Engine
- Operates like a virtual DevOps engineer continuously monitoring the repository's history.
- Automatically analyzes up to 10 of the most recent pipeline failures.
- If it detects that a specific step (e.g., `npm install`) is responsible for **more than 60%** of the recent crashes, it flags the repository with a high-priority "Systemic Issue Detected" warning banner.

## 🛠️ Technology Stack
- **Frontend:** React 19, Vite, Tailwind CSS, Recharts, Lucide Icons.
- **Backend:** Node.js, Express, Axios.
- **AI Integration:** OpenRouter API (Anthropic Claude 3 Haiku).
- **External APIs:** GitHub REST API.
- **Infrastructure:** Docker & Docker Compose (Containerized multi-service architecture).

## 💡 How It Works
1. The user inputs a GitHub organization name into the UI.
2. The Node backend securely interfaces with the GitHub API, pulling down repositories and their 30 most recent GitHub Actions workflow runs.
3. The frontend calculates the health scores and renders the repository cards.
4. When a user expands the analytics panel, the frontend renders the DORA metrics and triggers the Pattern Detection engine.
5. If a user clicks the "Bot" icon on a failed run, the backend parses the failed job's steps and sends the metadata to the LLM to generate the diagnostic report.