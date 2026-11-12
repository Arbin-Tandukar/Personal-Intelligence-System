/* ============================================================
   Fitness Tracker Module — Personal Intelligence System
   ============================================================ */

class Fitness {
    static chartInstances = {};
    static currentExerciseRows = [];

    static async render() {
        const content = document.getElementById('app-content');
        if (!content) return;

        try {
            const [workouts, stats] = await Promise.all([
                api.get('/fitness/workouts'),
                api.get('/fitness/stats'),
            ]);

            content.innerHTML = `
                <div class="module-header-bar">
                    <div>
                        <h2><i class="fas fa-dumbbell"></i> Fitness & Physical Activity</h2>
                        <p class="text-secondary">Log strength sessions, cardio, flexibility, and track personal athletic milestones</p>
                    </div>
                    <div>
                        <button class="btn btn-primary" onclick="Fitness.openWorkoutModal()">
                            <i class="fas fa-plus"></i> Log Workout
                        </button>
                    </div>
                </div>

                <!-- Fitness Summary Cards -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(225, 112, 85, 0.2); color: #e17055;">
                            <i class="fas fa-running"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Total Workouts</span>
                            <h3 class="stat-value">${stats.total_workouts}</h3>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(0, 206, 201, 0.2); color: #00cec9;">
                            <i class="fas fa-stopwatch"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Active Time</span>
                            <h3 class="stat-value">${stats.total_duration_minutes} <span class="stat-sub">minutes</span></h3>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(253, 203, 110, 0.2); color: #fdcb6e;">
                            <i class="fas fa-fire-alt"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Calories Burned</span>
                            <h3 class="stat-value">${stats.total_calories_burned.toLocaleString()} <span class="stat-sub">kcal</span></h3>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(108, 92, 231, 0.2); color: #6c5ce7;">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Personal Records</span>
                            <h3 class="stat-value">${stats.personal_records.length} <span class="stat-sub">PRs</span></h3>
                        </div>
                    </div>
                </div>

                <!-- PR Showcase & Charts -->
                <div class="charts-row">
                    <div class="card chart-card">
                        <div class="card-header">
                            <h3><i class="fas fa-medal"></i> Personal Record Hall</h3>
                        </div>
                        <div class="card-body">
                            ${stats.personal_records.length ? `
                                <div class="pr-grid">
                                    ${stats.personal_records.map(pr => `
                                        <div class="pr-card">
                                            <div class="pr-icon"><i class="fas fa-award"></i></div>
                                            <div class="pr-info">
                                                <h4>${escapeHtml(pr.name)}</h4>
                                                <p>
                                                    ${pr.weight ? `<strong>${pr.weight} kg</strong> ` : ''}
                                                    ${pr.reps ? `× ${pr.reps} reps ` : ''}
                                                    ${pr.distance ? `• ${pr.distance} km ` : ''}
                                                </p>
                                                <span class="text-xs text-muted">${formatDate(pr.workout_date)}</span>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div class="empty-state"><p>No personal records recorded yet. Check "Personal Record" when logging exercises!</p></div>
                            `}
                        </div>
                    </div>

                    <div class="card chart-card">
                        <div class="card-header">
                            <h3><i class="fas fa-chart-pie"></i> Workout Types Distribution</h3>
                        </div>
                        <div class="card-body">
                            <div class="chart-wrapper">
                                <canvas id="fitnessTypeChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Workout History List -->
                <div class="card mt-4">
                    <div class="card-header">
                        <h3><i class="fas fa-history"></i> Workout History</h3>
                    </div>
                    <div class="card-body">
                        ${workouts.length ? `
                            <div class="workout-history-list">
                                ${workouts.map(w => `
                                    <div class="workout-entry-card">
                                        <div class="workout-entry-header">
                                            <div class="workout-meta">
                                                <span class="badge badge-primary">${escapeHtml(w.workout_type)}</span>
                                                <span class="workout-date"><i class="far fa-calendar"></i> ${formatDate(w.date)}</span>
                                                <span class="workout-duration"><i class="far fa-clock"></i> ${w.duration_minutes} min</span>
                                                ${w.calories_burned ? `<span class="workout-cal"><i class="fas fa-fire"></i> ${w.calories_burned} kcal</span>` : ''}
                                            </div>
                                            <button class="btn btn-ghost btn-xs text-danger" onclick="Fitness.deleteWorkout('${w.id}')">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>

                                        ${w.notes ? `<p class="workout-notes">${escapeHtml(w.notes)}</p>` : ''}

                                        ${w.exercises && w.exercises.length ? `
                                            <div class="workout-exercises-table-wrap">
                                                <table class="exercises-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Exercise</th>
                                                            <th>Sets</th>
                                                            <th>Reps</th>
                                                            <th>Weight</th>
                                                            <th>Distance / Time</th>
                                                            <th>PR</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        ${w.exercises.map(ex => `
                                                            <tr>
                                                                <td><strong>${escapeHtml(ex.name)}</strong></td>
                                                                <td>${ex.sets || '—'}</td>
                                                                <td>${ex.reps || '—'}</td>
                                                                <td>${ex.weight ? ex.weight + ' kg' : '—'}</td>
                                                                <td>${ex.distance ? ex.distance + ' km' : ex.duration_seconds ? ex.duration_seconds + ' s' : '—'}</td>
                                                                <td>${ex.is_personal_record ? '<span class="badge badge-warning"><i class="fas fa-star"></i> PR</span>' : '—'}</td>
                                                            </tr>
                                                        `).join('')}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="empty-state"><p>No workouts recorded yet. Click "Log Workout" above to start building momentum!</p></div>
                        `}
                    </div>
                </div>
            `;

            this.renderChart(stats);

        } catch (err) {
            console.error('Failed to load fitness tracker:', err);
            content.innerHTML = `<div class="card error-card"><p>Failed to load fitness data: ${err.message}</p></div>`;
        }
    }

    static renderChart(stats) {
        const ctx = document.getElementById('fitnessTypeChart');
        if (!ctx) return;

        if (this.chartInstances['fitType']) this.chartInstances['fitType'].destroy();

        const isLight = document.body.classList.contains('light-mode');
        const textColor = isLight ? '#2d3436' : '#e0e0f0';

        const types = Object.keys(stats.type_distribution || {});
        const counts = Object.values(stats.type_distribution || {});

        if (types.length === 0) {
            types.push('No workouts yet');
            counts.push(1);
        }

        const colors = ['#e17055', '#6c5ce7', '#00cec9', '#00b894', '#fdcb6e', '#74b9ff'];

        this.chartInstances['fitType'] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: types,
                datasets: [{
                    data: counts,
                    backgroundColor: colors.slice(0, types.length),
                    borderColor: isLight ? '#ffffff' : '#1a1a2e',
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor, boxWidth: 12 } }
                }
            }
        });
    }

    static openWorkoutModal() {
        const modalTitle = document.getElementById('detail-modal-title');
        const modalBody = document.getElementById('detail-modal-body');
        if (!modalBody) return;

        this.currentExerciseRows = [];
        const today = new Date().toISOString().split('T')[0];

        modalTitle.textContent = 'Log Workout Session';
        modalBody.innerHTML = `
            <form onsubmit="Fitness.handleCreateWorkout(event)">
                <div class="form-row">
                    <div class="form-group col-6">
                        <label>Date *</label>
                        <input type="date" id="w-date" class="form-input" required value="${today}">
                    </div>
                    <div class="form-group col-6">
                        <label>Workout Type *</label>
                        <select id="w-type" class="form-select" required>
                            <option value="Strength">Strength Training</option>
                            <option value="Cardio">Cardio / Running</option>
                            <option value="Flexibility">Flexibility & Mobility</option>
                            <option value="HIIT">HIIT / Circuit</option>
                            <option value="Calisthenics">Calisthenics</option>
                            <option value="Sports">Sports / Athletics</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group col-6">
                        <label>Duration (Minutes) *</label>
                        <input type="number" id="w-duration" class="form-input" required min="1" max="600" value="45">
                    </div>
                    <div class="form-group col-6">
                        <label>Calories Burned (Estimated)</label>
                        <input type="number" id="w-calories" class="form-input" min="0" placeholder="e.g. 350">
                    </div>
                </div>

                <div class="form-group">
                    <label>Session Notes</label>
                    <textarea id="w-notes" class="form-textarea" rows="2" placeholder="e.g. Felt energetic, increased bench press weight"></textarea>
                </div>

                <!-- Exercise Rows Section -->
                <div class="workout-exercises-builder mt-3 mb-3">
                    <div class="builder-header">
                        <h4>Exercises in this Session</h4>
                        <button type="button" class="btn btn-secondary btn-xs" onclick="Fitness.addExerciseRow()">
                            <i class="fas fa-plus"></i> Add Exercise
                        </button>
                    </div>
                    <div id="exercise-rows-container" class="mt-2"></div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-ghost" onclick="hideModal('detail-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Workout (+20 XP)</button>
                </div>
            </form>
        `;

        this.addExerciseRow(); // Add one row by default
        showModal('detail-modal');
    }

    static addExerciseRow() {
        const container = document.getElementById('exercise-rows-container');
        if (!container) return;

        const rowId = 'ex-row-' + Date.now() + Math.random().toString(36).substring(2, 5);
        const rowDiv = document.createElement('div');
        rowDiv.className = 'exercise-input-row';
        rowDiv.id = rowId;

        rowDiv.innerHTML = `
            <div class="row g-2 align-items-center">
                <div class="col-4">
                    <input type="text" class="form-input ex-name" placeholder="Exercise name *" required>
                </div>
                <div class="col-2">
                    <input type="number" class="form-input ex-sets" placeholder="Sets" min="1">
                </div>
                <div class="col-2">
                    <input type="number" class="form-input ex-reps" placeholder="Reps" min="1">
                </div>
                <div class="col-2">
                    <input type="number" class="form-input ex-weight" placeholder="kg" step="0.5" min="0">
                </div>
                <div class="col-1 text-center">
                    <label class="pr-label" title="Personal Record">
                        <input type="checkbox" class="ex-pr"> PR
                    </label>
                </div>
                <div class="col-1">
                    <button type="button" class="btn btn-ghost btn-xs text-danger" onclick="document.getElementById('${rowId}').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(rowDiv);
    }

    static async handleCreateWorkout(e) {
        e.preventDefault();
        const date = document.getElementById('w-date')?.value;
        const workout_type = document.getElementById('w-type')?.value;
        const duration_minutes = parseInt(document.getElementById('w-duration')?.value, 10);
        const calories_burned = parseInt(document.getElementById('w-calories')?.value, 10) || null;
        const notes = document.getElementById('w-notes')?.value.trim();

        // Extract exercises
        const rows = document.querySelectorAll('#exercise-rows-container .exercise-input-row');
        const exercises = [];
        rows.forEach(r => {
            const name = r.querySelector('.ex-name')?.value.trim();
            if (name) {
                const sets = parseInt(r.querySelector('.ex-sets')?.value, 10) || null;
                const reps = parseInt(r.querySelector('.ex-reps')?.value, 10) || null;
                const weight = parseFloat(r.querySelector('.ex-weight')?.value) || null;
                const is_personal_record = r.querySelector('.ex-pr')?.checked || false;
                exercises.push({ name, sets, reps, weight, is_personal_record });
            }
        });

        try {
            await api.post('/fitness/workouts', {
                date, workout_type, duration_minutes, calories_burned, notes, exercises
            });
            hideModal('detail-modal');
            showToast('Workout logged! Earned XP.', 'success');
            await Auth.loadUser();
            this.render();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    static async deleteWorkout(id) {
        confirmDialog('Delete this workout and all associated exercise records?', async () => {
            try {
                await api.delete(`/fitness/workouts/${id}`);
                showToast('Workout deleted', 'info');
                Fitness.render();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }
}
