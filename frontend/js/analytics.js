/* ============================================================
   Analytics Engine Module — Personal Intelligence System
   ============================================================ */

class Analytics {
    static chartInstances = {};
    static currentPeriod = 'weekly';

    static async render() {
        const content = document.getElementById('app-content');
        if (!content) return;

        try {
            const report = await api.get('/analytics/report', { period: this.currentPeriod });
            const summary = report.summary;
            const correlations = report.correlations || [];
            const weekly = report.weekly_activity;

            content.innerHTML = `
                <div class="module-header-bar">
                    <div>
                        <h2><i class="fas fa-chart-network"></i> Analytics & Pattern Intelligence</h2>
                        <p class="text-secondary">Cross-module correlation engine, behavior trends, and data-backed diagnostics</p>
                    </div>
                    <div class="filter-pills">
                        <button class="filter-pill ${this.currentPeriod === 'weekly' ? 'active' : ''}" onclick="Analytics.setPeriod('weekly')">7-Day Analysis</button>
                        <button class="filter-pill ${this.currentPeriod === 'monthly' ? 'active' : ''}" onclick="Analytics.setPeriod('monthly')">30-Day Analysis</button>
                    </div>
                </div>

                <!-- Cross-Module Synergy & Correlation Alerts -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h3><i class="fas fa-project-diagram"></i> Cross-Module Correlations & Behavior Insights</h3>
                    </div>
                    <div class="card-body">
                        ${correlations.length ? `
                            <div class="correlations-grid">
                                ${correlations.map(c => `
                                    <div class="insight-card ${c.significance === 'high' ? 'insight-high' : ''}">
                                        <div class="insight-icon"><i class="fas fa-lightbulb"></i></div>
                                        <div class="insight-content">
                                            <h4>${escapeHtml(c.title)}</h4>
                                            <p>${escapeHtml(c.description)}</p>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="empty-state p-4">
                                <i class="fas fa-brain fa-2x text-accent-secondary mb-2"></i>
                                <p>System requires at least 5 days of multi-module activity to detect behavioral correlations without fabricating data.</p>
                            </div>
                        `}
                    </div>
                </div>

                <!-- Metrics Overview -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(108, 92, 231, 0.2); color: #6c5ce7;">
                            <i class="fas fa-book-reader"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Study Focus</span>
                            <h3 class="stat-value">${summary.study_hours_week} <span class="stat-sub">hours</span></h3>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(225, 112, 85, 0.2); color: #e17055;">
                            <i class="fas fa-dumbbell"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Workouts</span>
                            <h3 class="stat-value">${summary.workouts_this_week} <span class="stat-sub">sessions</span></h3>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(0, 184, 148, 0.2); color: #00b894;">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Habit Discipline</span>
                            <h3 class="stat-value">${summary.habits_rate_today}%</h3>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(0, 206, 201, 0.2); color: #00cec9;">
                            <i class="fas fa-tasks"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Tasks Completed</span>
                            <h3 class="stat-value">${summary.tasks_completed_today}</h3>
                        </div>
                    </div>
                </div>

                <!-- Analytics Charts -->
                <div class="charts-row">
                    <div class="card chart-card">
                        <div class="card-header">
                            <h3><i class="fas fa-chart-line"></i> Daily Productivity Dynamics</h3>
                        </div>
                        <div class="card-body">
                            <div class="chart-wrapper">
                                <canvas id="analyticsProductivityChart"></canvas>
                            </div>
                        </div>
                    </div>

                    <div class="card chart-card">
                        <div class="card-header">
                            <h3><i class="fas fa-chart-bar"></i> Physical Workout Minutes</h3>
                        </div>
                        <div class="card-body">
                            <div class="chart-wrapper">
                                <canvas id="analyticsFitnessChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this.renderCharts(weekly);

        } catch (err) {
            console.error('Failed to load analytics module:', err);
            content.innerHTML = `<div class="card error-card"><p>Failed to load analytics data: ${err.message}</p></div>`;
        }
    }

    static setPeriod(period) {
        this.currentPeriod = period;
        this.render();
    }

    static renderCharts(weekly) {
        const isLight = document.body.classList.contains('light-mode');
        const textColor = isLight ? '#2d3436' : '#e0e0f0';
        const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';

        // Productivity Chart
        const prodCtx = document.getElementById('analyticsProductivityChart');
        if (prodCtx) {
            if (this.chartInstances['analyticsProd']) this.chartInstances['analyticsProd'].destroy();

            this.chartInstances['analyticsProd'] = new Chart(prodCtx, {
                type: 'line',
                data: {
                    labels: weekly.labels,
                    datasets: [
                        {
                            label: 'Study Hours',
                            data: weekly.study_hours,
                            borderColor: '#6c5ce7',
                            backgroundColor: 'rgba(108, 92, 231, 0.1)',
                            yAxisID: 'y',
                            tension: 0.3,
                        },
                        {
                            label: 'Tasks Completed',
                            data: weekly.tasks_completed,
                            borderColor: '#00cec9',
                            backgroundColor: 'rgba(0, 206, 201, 0.1)',
                            yAxisID: 'y1',
                            tension: 0.3,
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: textColor } } },
                    scales: {
                        x: { ticks: { color: textColor }, grid: { color: gridColor } },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            ticks: { color: textColor },
                            grid: { color: gridColor },
                            title: { display: true, text: 'Hours', color: textColor }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            ticks: { color: textColor },
                            grid: { drawOnChartArea: false },
                            title: { display: true, text: 'Tasks', color: textColor }
                        }
                    }
                }
            });
        }

        // Fitness Minutes Chart
        const fitCtx = document.getElementById('analyticsFitnessChart');
        if (fitCtx) {
            if (this.chartInstances['analyticsFit']) this.chartInstances['analyticsFit'].destroy();

            this.chartInstances['analyticsFit'] = new Chart(fitCtx, {
                type: 'bar',
                data: {
                    labels: weekly.labels,
                    datasets: [{
                        label: 'Workout Minutes',
                        data: weekly.workout_minutes,
                        backgroundColor: '#e17055',
                        borderRadius: 6,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: textColor }, grid: { color: gridColor } },
                        y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true }
                    }
                }
            });
        }
    }
}
