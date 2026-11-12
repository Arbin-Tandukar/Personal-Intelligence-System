# Personal Intelligence System (PIS)

A centralized, private personal life-management and intelligence platform that transforms everyday activities and records into structured data, meaningful statistics, progress reports, and actionable insights.

---

## 🚀 Key Features & Modules

### 1. Personal Profile
- Bio, core guiding principles, and mission statement
- Learning skills badges & personal interests tags
- Strategic life milestones timeline
- Direct local JSON database backup & export

### 2. Study Tracker
- Subject curriculum management with custom color accents & target study hours
- Deep work study session logging with topics covered and XP rewards
- Exam & test result tracking with automatic grade percentage calculation
- Daily study velocity trends and subject distribution visualizations via Chart.js

### 3. Fitness Tracker
- Workout logging (Strength, Cardio, Flexibility/Mobility, HIIT, Calisthenics, Sports)
- Exercise builder with sets, repetitions, weight (kg), distance (km), and duration
- Personal Record (PR) hall of fame
- Workout type distribution and total active minutes analytics

### 4. Habit Tracker
- Daily habit check-ins with instant XP feedback
- Continuous streak counters (current & all-time longest streak)
- 30-day consistency percentage and visual 14-day calendar heatmap for each routine

### 5. Finance Tracker
- Income & expense ledger with custom categories (default currency: **NPR**, configurable)
- Monthly category budgets with live visual spending limit bars
- Net savings rate, expense category doughnut chart, and income-vs-expense balance charts

### 6. Gamified Tasks & Quests
- Tasks with priority levels (`urgent`, `high`, `medium`, `low`) and deadline tracking
- Epic Quests that group related objectives with substantial completion XP
- Real-time level progression (100 XP per level) and unlocked achievement badges

### 7. Journal & Knowledge Base
- Rich reflections, ideas, learning notes, and experiences
- Mood state tracker (`⚡ Energetic`, `🧘 Focused`, `💡 Creative`, `😌 Calm`, `⚠️ Challenged`)
- Full-text search, tag indexing, and pinned entry capabilities

### 8. Analytics & Correlation Engine
- Daily, 7-day, and 30-day cross-module productivity analytics
- Cross-module correlation discovery (e.g., workout days vs. study focus synergy) without fabricating statistics

### 9. AI Personal Assistant
- Conversational assistant answering natural-language queries about personal records
- Grounded strictly in verified database context (never invents personal history)
- Transparent Data Context inspection drawer for privacy verification
- Works locally with built-in heuristic intelligence or connects to Gemini via `.env`

---

## 🛠 Tech Stack

- **Backend**: FastAPI, SQLAlchemy 2.0, Pydantic v2, Passlib (bcrypt), Python-Jose (JWT)
- **Database**: SQLite (local-first; designed to easily scale to PostgreSQL)
- **Frontend**: Vanilla JavaScript (SPA), Semantic HTML5, Custom Dark-Mode Cyberpunk CSS
- **Visualizations**: Chart.js v4
- **Icons & Typography**: Font Awesome 6.5, Inter font

---

## 📦 Setup & Installation

### 1. Clone / Navigate to Project Directory
```powershell
cd C:\Users\user\.gemini\antigravity\scratch\pis
```

### 2. Activate Virtual Environment
```powershell
.\venv\Scripts\activate
```

### 3. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 4. Seed Database with Comprehensive Sample Data (Optional)
```powershell
python -m backend.seed
```
*Creates demo user: `demo` / `password123` with full multi-module history.*

### 5. Launch the Application
```powershell
python run.py
```
Open **[http://127.0.0.1:8000](http://127.0.0.1:8000)** in your browser.
API documentation (Swagger UI) is available at **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**.

---

## 🔒 Security & Privacy

- **Local-First**: All personal data is saved locally on your device in `pis.db`.
- **Hashed Passwords**: Passwords hashed using industry-standard bcrypt.
- **Stateless JWT**: Secure token-based session management.
- **Data Portability**: Full JSON export and backup available directly from the Profile module.
- **Privacy-First AI**: The AI assistant only receives authorized, aggregate facts from your database.
