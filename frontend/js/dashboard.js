/* ============================================================
   Dashboard Module — Personal Intelligence System
   ============================================================ */

class Dashboard {
    static chartInstances = {};

    static async render() {
        const content = document.getElementById('app-content');
        if (!content) return;

        try {
            const data = await api.get('/analytics/dashboard');
            const summary = data.summary;
            const weekly = data.weekly_activity;
            const finSummary = await api.get('/finance/summary');

            const todayFormatted = new Date().toLocaleDateString(undefined, {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });

            content.innerHTML = `
                <div class="dashboard-header-bar">
                    <div class="dashboard-date-info">
                        <h2>Personal Command Center</h2>
                        <p class="text-secondary"><i class="far fa-calendar-alt"></i> ${todayFormatted}</p>
                    </div>
                    <div class="quick-actions-bar">
                        <button class="btn btn-primary btn-sm" onclick="App.navigate('tasks')">
                            <i class="fas fa-plus"></i> New Task
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="App.navigate('study')">
                            <i class="fas fa-book-reader"></i> Log Study
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="App.navigate('fitness')">
                            <i class="fas fa-dumbbell"></i> Log Workout
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="App.navigate('finance')">
                            <i class="fas fa-dollar-sign"></i> Add Expense
                        </button>
                    </div>
                </div>

                <!-- Metrics Grid -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(108, 92, 231, 0.2); color: #6c5ce7;">
                            <i class="fas fa-book"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Study Today / Week</span>
                            <h3 class="stat-value">${summary.study_hours_today}h <span class="stat-sub">(${summary.study_hours_week}h wk)</span></h3>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(0, 206, 201, 0.2); color: #00cec9;">
                            <i class="fas fa-check-double"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Tasks Completed</span>
                            <h3 class="stat-value">${summary.tasks_completed_today} <span class="stat-sub">(${summary.tasks_pending} pending)</span></h3>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(0, 184, 148, 0.2); color: #00b894;">
                            <i class="fas fa-bullseye"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Habits Today</span>
                            <h3 class="stat-value">${summary.habits_completed_today}/${summary.habits_total} <span class="stat-sub">(${summary.habits_rate_today}%)</span></h3>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(225, 112, 85, 0.2); color: #e17055;">
                            <i class="fas fa-fire"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Workout Status</span>
                            <h3 class="stat-value">${summary.workout_done_today ? 'Completed ✓' : 'Resting / Pending'}</h3>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(253, 203, 110, 0.2); color: #fdcb6e;">
                            <i class="fas fa-wallet"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Month Net Savings</span>
                            <h3 class="stat-value">${formatCurrency(summary.month_savings, summary.currency)}</h3>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(116, 185, 255, 0.2); color: #74b9ff;">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Level & XP</span>
                            <h3 class="stat-value">Lvl ${summary.level} <span class="stat-sub">(${summary.xp} total XP)</span></h3>
                        </div>
                    </div>
                </div>

                <!-- Charts Section -->
                <div class="charts-row">
                    <div class="card chart-card">
                        <div class="card-header">
                            <h3><i class="fas fa-chart-line"></i> Weekly Activity Overview</h3>
                        </div>
                        <div class="card-body">
                            <div class="chart-wrapper">
                                <canvas id="weeklyActivityChart"></canvas>
                            </div>
                        </div>
                    </div>

                    <div class="card chart-card">
                        <div class="card-header">
                            <h3><i class="fas fa-chart-pie"></i> Spending by Category</h3>
                        </div>
                        <div class="card-body">
                            <div class="chart-wrapper">
                                <canvas id="financeCategoryChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Navigation Quick-Cards -->
                <div class="card mt-4">
                    <div class="card-header">
                        <h3><i class="fas fa-compass"></i> Module Navigation</h3>
                    </div>
                    <div class="card-body">
                        <div class="module-shortcuts-grid">
                            <div class="shortcut-item" onclick="App.navigate('study')">
                                <i class="fas fa-book shortcut-icon" style="color: #6c5ce7;"></i>
                                <h4>Study Tracker</h4>
                                <p>Subjects, sessions & exams</p>
                            </div>
                            <div class="shortcut-item" onclick="App.navigate('fitness')">
                                <i class="fas fa-dumbbell shortcut-icon" style="color: #e17055;"></i>
                                <h4>Fitness Tracker</h4>
                                <p>Workouts, exercises & PRs</p>
                            </div>
                            <div class="shortcut-item" onclick="App.navigate('habits')">
                                <i class="fas fa-check-circle shortcut-icon" style="color: #00b894;"></i>
                                <h4>Habit Tracker</h4>
                                <p>Consistency & streaks</p>
                            </div>
                            <div class="shortcut-item" onclick="App.navigate('finance')">
                                <i class="fas fa-wallet shortcut-icon" style="color: #fdcb6e;"></i>
                                <h4>Finance Tracker</h4>
                                <p>Transactions & budgets</p>
                            </div>
                            <div class="shortcut-item" onclick="App.navigate('tasks')">
                                <i class="fas fa-trophy shortcut-icon" style="color: #74b9ff;"></i>
                                <h4>Tasks & Quests</h4>
                                <p>Gamified life management</p>
                            </div>
                            <div class="shortcut-item" onclick="App.navigate('journal')">
                                <i class="fas fa-pen-nib shortcut-icon" style="color: #a29bfe;"></i>
                                <h4>Personal Journal</h4>
                                <p>Ideas, reflections & notes</p>
                            </div>
                            <div class="shortcut-item" onclick="App.navigate('analytics')">
                                <i class="fas fa-chart-bar shortcut-icon" style="color: #00cec9;"></i>
                                <h4>Analytics</h4>
                                <p>Multi-module correlations</p>
                            </div>
                            <div class="shortcut-item" onclick="App.navigate('ai')">
                                <i class="fas fa-robot shortcut-icon" style="color: #fab1a0;"></i>
                                <h4>AI Assistant</h4>
                                <p>Personal life queries</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Initialize charts
            this.renderWeeklyChart(weekly);
            this.renderFinanceChart(finSummary);

        } catch (err) {
            console.error('Failed to load dashboard:', err);
            content.innerHTML = `<div class="card error-card"><p>Failed to load dashboard data: ${err.message}</p></div>`;
        }
    }

    static renderWeeklyChart(weekly) {
        const ctx = document.getElementById('weeklyActivityChart');
        if (!ctx) return;

        if (this.chartInstances['weekly']) {
            this.chartInstances['weekly'].destroy();
        }

        const isLight = document.body.classList.contains('light-mode');
        const textColor = isLight ? '#2d3436' : '#e0e0f0';
        const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';

        this.chartInstances['weekly'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weekly.labels,
                datasets: [
                    {
                        label: 'Study Hours',
                        data: weekly.study_hours,
                        backgroundColor: '#6c5ce7',
                        borderRadius: 6,
                    },
                    {
                        label: 'Tasks Completed',
                        data: weekly.tasks_completed,
                        backgroundColor: '#00cec9',
                        borderRadius: 6,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: textColor } }
                },
                scales: {
                    x: { ticks: { color: textColor }, grid: { color: gridColor } },
                    y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true }
                }
            }
        });
    }

    static renderFinanceChart(finSummary) {
        const ctx = document.getElementById('financeCategoryChart');
        if (!ctx) return;

        if (this.chartInstances['finance']) {
            this.chartInstances['finance'].destroy();
        }

        const isLight = document.body.classList.contains('light-mode');
        const textColor = isLight ? '#2d3436' : '#e0e0f0';
        const categories = Object.keys(finSummary.expense_by_category || {});
        const values = Object.values(finSummary.expense_by_category || {});

        if (categories.length === 0) {
            categories.push('No Expenses Logged');
            values.push(1);
        }

        const colors = ['#6c5ce7', '#00cec9', '#00b894', '#fdcb6e', '#e17055', '#74b9ff', '#d63031', '#e84393'];

        this.chartInstances['finance'] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, categories.length),
                    borderWidth: 2,
                    borderColor: isLight ? '#ffffff' : '#1a1a2e',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor, boxWidth: 12 }
                    }
                }
            }
        });
    }
}
