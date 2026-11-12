/* ============================================================
   Study Tracker Module — Personal Intelligence System
   ============================================================ */

class Study {
    static chartInstances = {};

    static async render() {
        const content = document.getElementById('app-content');
        if (!content) return;

        try {
            const [subjects, sessions, exams, stats] = await Promise.all([
                api.get('/study/subjects'),
                api.get('/study/sessions'),
                api.get('/study/exams'),
                api.get('/study/stats'),
            ]);

            window.studySubjects = subjects;

            content.innerHTML = `
                <div class="module-header-bar">
                    <div>
                        <h2><i class="fas fa-book-open"></i> Academic & Study Tracker</h2>
                        <p class="text-secondary">Track subjects, deep work sessions, curriculum progress, and test scores</p>
                    </div>
                    <div class="action-buttons-group">
                        <button class="btn btn-primary" onclick="Study.openSessionModal()">
                            <i class="fas fa-plus"></i> Log Session
                        </button>
                        <button class="btn btn-secondary" onclick="Study.openSubjectModal()">
                            <i class="fas fa-folder-plus"></i> Add Subject
                        </button>
                        <button class="btn btn-secondary" onclick="Study.openExamModal()">
                            <i class="fas fa-graduation-cap"></i> Record Exam
                        </button>
                    </div>
                </div>

                <!-- Study Summary Stats -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(108, 92, 231, 0.2); color: #6c5ce7;">
                            <i class="fas fa-hourglass-half"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Total Study Time</span>
                            <h3 class="stat-value">${stats.total_hours} <span class="stat-sub">hours</span></h3>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(0, 206, 201, 0.2); color: #00cec9;">
                            <i class="fas fa-layer-group"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Active Subjects</span>
                            <h3 class="stat-value">${subjects.length}</h3>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(0, 184, 148, 0.2); color: #00b894;">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Study Sessions</span>
                            <h3 class="stat-value">${sessions.length}</h3>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(253, 203, 110, 0.2); color: #fdcb6e;">
                            <i class="fas fa-award"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Exams Logged</span>
                            <h3 class="stat-value">${exams.length}</h3>
                        </div>
                    </div>
                </div>

                <!-- Charts Section -->
                <div class="charts-row">
                    <div class="card chart-card">
                        <div class="card-header">
                            <h3><i class="fas fa-chart-bar"></i> Hours by Subject</h3>
                        </div>
                        <div class="card-body">
                            <div class="chart-wrapper">
                                <canvas id="studySubjectChart"></canvas>
                            </div>
                        </div>
                    </div>

                    <div class="card chart-card">
                        <div class="card-header">
                            <h3><i class="fas fa-chart-area"></i> Daily Study Velocity</h3>
                        </div>
                        <div class="card-body">
                            <div class="chart-wrapper">
                                <canvas id="studyVelocityChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Subjects Cards -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h3><i class="fas fa-books"></i> Subject Curriculum</h3>
                    </div>
                    <div class="card-body">
                        ${subjects.length ? `
                            <div class="subjects-grid">
                                ${subjects.map(s => {
                                    const subStat = stats.subject_breakdown.find(b => b.id === s.id) || { total_hours: 0 };
                                    const target = s.target_hours || 0;
                                    const pct = target > 0 ? Math.min(100, Math.round((subStat.total_hours / target) * 100)) : 0;
                                    return `
                                        <div class="subject-card" style="border-left: 4px solid ${s.color || '#6c5ce7'};">
                                            <div class="subject-card-header">
                                                <h4>${escapeHtml(s.name)}</h4>
                                                <button class="btn btn-ghost btn-xs text-danger" onclick="Study.deleteSubject('${s.id}')">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                            <p class="text-secondary text-sm">${escapeHtml(s.category || 'General')}</p>
                                            <div class="subject-progress">
                                                <div class="progress-info">
                                                    <span>${subStat.total_hours}h studied</span>
                                                    <span>${target > 0 ? target + 'h target' : 'No target'}</span>
                                                </div>
                                                ${target > 0 ? `
                                                    <div class="progress-bar-bg">
                                                        <div class="progress-bar-fill" style="width: ${pct}%; background: ${s.color || '#6c5ce7'};"></div>
                                                    </div>
                                                ` : ''}
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        ` : `
                            <div class="empty-state">
                                <p>No subjects added yet. Create your first subject above to start organizing study sessions!</p>
                            </div>
                        `}
                    </div>
                </div>

                <!-- Study Sessions Log Table -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h3><i class="fas fa-history"></i> Study Sessions Log</h3>
                    </div>
                    <div class="card-body">
                        ${sessions.length ? `
                            <div class="table-responsive">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Subject</th>
                                            <th>Duration</th>
                                            <th>Topics Covered</th>
                                            <th>Notes</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${sessions.map(sess => {
                                            const sub = subjects.find(s => s.id === sess.subject_id);
                                            return `
                                                <tr>
                                                    <td>${formatDate(sess.date)}</td>
                                                    <td>
                                                        <span class="badge" style="background: ${sub?.color ? sub.color + '33' : '#6c5ce733'}; color: ${sub?.color || '#6c5ce7'};">
                                                            ${escapeHtml(sub?.name || 'Unknown')}
                                                        </span>
                                                    </td>
                                                    <td><strong>${sess.duration_minutes} min</strong> (${roundHours(sess.duration_minutes)}h)</td>
                                                    <td>${escapeHtml(sess.topics || '—')}</td>
                                                    <td>${escapeHtml(sess.notes || '—')}</td>
                                                    <td>
                                                        <button class="btn btn-ghost btn-xs text-danger" onclick="Study.deleteSession('${sess.id}')">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : `
                            <div class="empty-state"><p>No study sessions logged yet.</p></div>
                        `}
                    </div>
                </div>

                <!-- Exam Results Table -->
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-clipboard-check"></i> Exams & Test Results</h3>
                    </div>
                    <div class="card-body">
                        ${exams.length ? `
                            <div class="table-responsive">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Subject</th>
                                            <th>Exam Name</th>
                                            <th>Score</th>
                                            <th>Percentage</th>
                                            <th>Notes</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${exams.map(e => {
                                            const sub = subjects.find(s => s.id === e.subject_id);
                                            const pct = e.max_score > 0 ? Math.round((e.score / e.max_score) * 100) : 0;
                                            return `
                                                <tr>
                                                    <td>${formatDate(e.date)}</td>
                                                    <td>${escapeHtml(sub?.name || 'Unknown')}</td>
                                                    <td><strong>${escapeHtml(e.exam_name)}</strong></td>
                                                    <td>${e.score} / ${e.max_score}</td>
                                                    <td>
                                                        <span class="badge ${pct >= 80 ? 'badge-success' : pct >= 50 ? 'badge-warning' : 'badge-danger'}">
                                                            ${pct}%
                                                        </span>
                                                    </td>
                                                    <td>${escapeHtml(e.notes || '—')}</td>
                                                    <td>
                                                        <button class="btn btn-ghost btn-xs text-danger" onclick="Study.deleteExam('${e.id}')">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : `
                            <div class="empty-state"><p>No exam results recorded yet.</p></div>
                        `}
                    </div>
                </div>
            `;

            this.renderCharts(stats);

        } catch (err) {
            console.error('Failed to load study module:', err);
            content.innerHTML = `<div class="card error-card"><p>Failed to load study data: ${err.message}</p></div>`;
        }
    }

    static renderCharts(stats) {
        const isLight = document.body.classList.contains('light-mode');
        const textColor = isLight ? '#2d3436' : '#e0e0f0';
        const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';

        // Subject Breakdown Chart
        const subCtx = document.getElementById('studySubjectChart');
        if (subCtx && stats.subject_breakdown) {
            if (this.chartInstances['studySub']) this.chartInstances['studySub'].destroy();

            this.chartInstances['studySub'] = new Chart(subCtx, {
                type: 'bar',
                data: {
                    labels: stats.subject_breakdown.map(b => b.name),
                    datasets: [{
                        label: 'Hours Studied',
                        data: stats.subject_breakdown.map(b => b.total_hours),
                        backgroundColor: stats.subject_breakdown.map(b => b.color || '#6c5ce7'),
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

        // Daily Velocity Chart
        const velCtx = document.getElementById('studyVelocityChart');
        if (velCtx && stats.daily_trend) {
            if (this.chartInstances['studyVel']) this.chartInstances['studyVel'].destroy();

            this.chartInstances['studyVel'] = new Chart(velCtx, {
                type: 'line',
                data: {
                    labels: stats.daily_trend.map(t => formatDate(t.date)),
                    datasets: [{
                        label: 'Minutes Studied',
                        data: stats.daily_trend.map(t => t.minutes),
                        borderColor: '#6c5ce7',
                        backgroundColor: 'rgba(108, 92, 231, 0.15)',
                        fill: true,
                        tension: 0.35,
                        pointBackgroundColor: '#6c5ce7',
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

    static openSubjectModal() {
        const modalTitle = document.getElementById('detail-modal-title');
        const modalBody = document.getElementById('detail-modal-body');
        if (!modalBody) return;

        modalTitle.textContent = 'Add Study Subject';
        modalBody.innerHTML = `
            <form onsubmit="Study.handleCreateSubject(event)">
                <div class="form-group">
                    <label>Subject Name *</label>
                    <input type="text" id="sub-name" class="form-input" required placeholder="e.g. Operating Systems">
                </div>
                <div class="form-group">
                    <label>Category</label>
                    <input type="text" id="sub-cat" class="form-input" placeholder="e.g. Computer Science">
                </div>
                <div class="form-group">
                    <label>Target Hours</label>
                    <input type="number" id="sub-target" class="form-input" min="0" step="0.5" placeholder="e.g. 50">
                </div>
                <div class="form-group">
                    <label>Theme Color</label>
                    <input type="color" id="sub-color" class="form-color-picker" value="#6c5ce7">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-ghost" onclick="hideModal('detail-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Subject</button>
                </div>
            </form>
        `;
        showModal('detail-modal');
    }

    static async handleCreateSubject(e) {
        e.preventDefault();
        const name = document.getElementById('sub-name')?.value.trim();
        const category = document.getElementById('sub-cat')?.value.trim();
        const target = parseFloat(document.getElementById('sub-target')?.value) || null;
        const color = document.getElementById('sub-color')?.value;

        try {
            await api.post('/study/subjects', { name, category, target_hours: target, color });
            hideModal('detail-modal');
            showToast('Subject created!', 'success');
            this.render();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    static async deleteSubject(id) {
        confirmDialog('Delete this subject and all its recorded sessions?', async () => {
            try {
                await api.delete(`/study/subjects/${id}`);
                showToast('Subject deleted', 'info');
                Study.render();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    static openSessionModal() {
        const subjects = window.studySubjects || [];
        if (subjects.length === 0) {
            showToast('Please add at least one subject first!', 'warning');
            this.openSubjectModal();
            return;
        }

        const modalTitle = document.getElementById('detail-modal-title');
        const modalBody = document.getElementById('detail-modal-body');
        if (!modalBody) return;

        const today = new Date().toISOString().split('T')[0];

        modalTitle.textContent = 'Log Study Session';
        modalBody.innerHTML = `
            <form onsubmit="Study.handleCreateSession(event)">
                <div class="form-group">
                    <label>Subject *</label>
                    <select id="sess-sub" class="form-select" required>
                        ${subjects.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Date *</label>
                    <input type="date" id="sess-date" class="form-input" required value="${today}">
                </div>
                <div class="form-group">
                    <label>Duration (Minutes) *</label>
                    <input type="number" id="sess-duration" class="form-input" required min="1" max="1440" value="45">
                </div>
                <div class="form-group">
                    <label>Topics Covered</label>
                    <input type="text" id="sess-topics" class="form-input" placeholder="e.g. Chapter 4 - Virtual Memory">
                </div>
                <div class="form-group">
                    <label>Session Notes</label>
                    <textarea id="sess-notes" class="form-textarea" rows="2" placeholder="Key takeaways..."></textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-ghost" onclick="hideModal('detail-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Log Session (+XP)</button>
                </div>
            </form>
        `;
        showModal('detail-modal');
    }

    static async handleCreateSession(e) {
        e.preventDefault();
        const subject_id = document.getElementById('sess-sub')?.value;
        const date = document.getElementById('sess-date')?.value;
        const duration_minutes = parseInt(document.getElementById('sess-duration')?.value, 10);
        const topics = document.getElementById('sess-topics')?.value.trim();
        const notes = document.getElementById('sess-notes')?.value.trim();

        try {
            await api.post('/study/sessions', {
                subject_id, date, duration_minutes, topics, notes
            });
            hideModal('detail-modal');
            showToast(`Session recorded! Earned XP.`, 'success');
            await Auth.loadUser();
            this.render();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    static async deleteSession(id) {
        confirmDialog('Delete this study session?', async () => {
            try {
                await api.delete(`/study/sessions/${id}`);
                showToast('Session deleted', 'info');
                Study.render();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    static openExamModal() {
        const subjects = window.studySubjects || [];
        if (subjects.length === 0) {
            showToast('Please add at least one subject first!', 'warning');
            return;
        }

        const modalTitle = document.getElementById('detail-modal-title');
        const modalBody = document.getElementById('detail-modal-body');
        if (!modalBody) return;

        const today = new Date().toISOString().split('T')[0];

        modalTitle.textContent = 'Record Exam / Test Result';
        modalBody.innerHTML = `
            <form onsubmit="Study.handleCreateExam(event)">
                <div class="form-group">
                    <label>Subject *</label>
                    <select id="exam-sub" class="form-select" required>
                        ${subjects.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Exam Name *</label>
                    <input type="text" id="exam-name" class="form-input" required placeholder="e.g. Midterm Examination">
                </div>
                <div class="form-group">
                    <label>Date *</label>
                    <input type="date" id="exam-date" class="form-input" required value="${today}">
                </div>
                <div class="form-row">
                    <div class="form-group col-6">
                        <label>Your Score *</label>
                        <input type="number" id="exam-score" class="form-input" required min="0" step="0.5" value="85">
                    </div>
                    <div class="form-group col-6">
                        <label>Max Score *</label>
                        <input type="number" id="exam-max" class="form-input" required min="1" step="0.5" value="100">
                    </div>
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <input type="text" id="exam-notes" class="form-input" placeholder="e.g. Strong on algorithms, review graphs">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-ghost" onclick="hideModal('detail-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Exam (+15 XP)</button>
                </div>
            </form>
        `;
        showModal('detail-modal');
    }

    static async handleCreateExam(e) {
        e.preventDefault();
        const subject_id = document.getElementById('exam-sub')?.value;
        const exam_name = document.getElementById('exam-name')?.value.trim();
        const date = document.getElementById('exam-date')?.value;
        const score = parseFloat(document.getElementById('exam-score')?.value);
        const max_score = parseFloat(document.getElementById('exam-max')?.value);
        const notes = document.getElementById('exam-notes')?.value.trim();

        try {
            await api.post('/study/exams', {
                subject_id, exam_name, date, score, max_score, notes
            });
            hideModal('detail-modal');
            showToast('Exam result recorded! +15 XP', 'success');
            await Auth.loadUser();
            this.render();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    static async deleteExam(id) {
        confirmDialog('Delete this exam result?', async () => {
            try {
                await api.delete(`/study/exams/${id}`);
                showToast('Exam deleted', 'info');
                Study.render();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }
}

function roundHours(minutes) {
    return (minutes / 60).toFixed(1);
}
