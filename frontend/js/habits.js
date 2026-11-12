/* ============================================================
   Habit Tracker Module — Personal Intelligence System
   ============================================================ */

class Habits {
    static async render() {
        const content = document.getElementById('app-content');
        if (!content) return;

        try {
            const overview = await api.get('/habits/overview');
            const habits = overview.habits || [];
            const todayStr = overview.today;

            content.innerHTML = `
                <div class="module-header-bar">
                    <div>
                        <h2><i class="fas fa-check-circle"></i> Habit & Discipline Tracker</h2>
                        <p class="text-secondary">Cultivate positive routines, protect your daily streaks, and visualize 30-day consistency</p>
                    </div>
                    <div>
                        <button class="btn btn-primary" onclick="Habits.openCreateModal()">
                            <i class="fas fa-plus"></i> Create Habit
                        </button>
                    </div>
                </div>

                <!-- Habits Summary -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(0, 184, 148, 0.2); color: #00b894;">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Today's Progress</span>
                            <h3 class="stat-value">${overview.completed_today_count} / ${overview.total_active}</h3>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(225, 112, 85, 0.2); color: #e17055;">
                            <i class="fas fa-fire"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Best Active Streak</span>
                            <h3 class="stat-value">${habits.length ? Math.max(...habits.map(h => h.current_streak)) : 0} <span class="stat-sub">days</span></h3>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(108, 92, 231, 0.2); color: #6c5ce7;">
                            <i class="fas fa-percent"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Avg Consistency (30d)</span>
                            <h3 class="stat-value">${habits.length ? Math.round(habits.reduce((acc, h) => acc + h.completion_rate, 0) / habits.length) : 0}%</h3>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(253, 203, 110, 0.2); color: #fdcb6e;">
                            <i class="fas fa-award"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">All-Time Longest</span>
                            <h3 class="stat-value">${habits.length ? Math.max(...habits.map(h => h.longest_streak)) : 0} <span class="stat-sub">days</span></h3>
                        </div>
                    </div>
                </div>

                <!-- Habits List -->
                <div class="habits-container mt-4">
                    ${habits.length ? `
                        <div class="habits-grid">
                            ${habits.map(h => {
                                const isDone = h.completed_today;
                                const color = h.color || '#00b894';
                                return `
                                    <div class="habit-card card" style="border-top: 4px solid ${color};">
                                        <div class="habit-card-header">
                                            <div>
                                                <h3 class="habit-title">${escapeHtml(h.name)}</h3>
                                                <span class="habit-category text-muted text-xs">${escapeHtml(h.category || 'General')} • ${h.frequency}</span>
                                            </div>
                                            <div class="habit-streaks">
                                                <span class="streak-badge" title="Current Streak"><i class="fas fa-fire text-danger"></i> ${h.current_streak}d</span>
                                                <span class="streak-badge text-muted" title="Longest Streak"><i class="fas fa-trophy text-warning"></i> ${h.longest_streak}d</span>
                                            </div>
                                        </div>

                                        <div class="habit-toggle-row">
                                            <button class="btn habit-check-btn ${isDone ? 'btn-success is-done' : 'btn-ghost'}" onclick="Habits.toggleHabit('${h.id}', '${todayStr}')">
                                                <i class="fas ${isDone ? 'fa-check-circle' : 'fa-circle'}"></i>
                                                <span>${isDone ? 'Completed Today (+10 XP)' : 'Mark Done Today'}</span>
                                            </button>
                                            <span class="habit-consistency-tag">${h.completion_rate}% (30d)</span>
                                        </div>

                                        <!-- Mini 14-day heatmap -->
                                        <div class="habit-heatmap-label">Recent 14 Days:</div>
                                        <div class="habit-mini-heatmap">
                                            ${this.renderMiniHeatmap(h.history, color)}
                                        </div>

                                        <div class="habit-card-footer">
                                            <button class="btn btn-ghost btn-xs text-danger" onclick="Habits.deleteHabit('${h.id}')">
                                                <i class="fas fa-trash"></i> Delete
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : `
                        <div class="card empty-state p-5">
                            <i class="fas fa-seedling fa-3x text-accent-success mb-3"></i>
                            <h3>No Habits Configured Yet</h3>
                            <p class="text-secondary">Habits build character and momentum. Add your first habit like "Read 20 mins", "Meditation", or "Morning Exercise"!</p>
                            <button class="btn btn-primary mt-3" onclick="Habits.openCreateModal()">
                                <i class="fas fa-plus"></i> Create Habit
                            </button>
                        </div>
                    `}
                </div>
            `;
        } catch (err) {
            console.error('Failed to load habits tracker:', err);
            content.innerHTML = `<div class="card error-card"><p>Failed to load habits data: ${err.message}</p></div>`;
        }
    }

    static renderMiniHeatmap(historyMap, color) {
        const cells = [];
        const today = new Date();

        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const isDone = historyMap[dateStr] === true;
            const title = `${formatDate(dateStr)}: ${isDone ? 'Done' : 'Missed'}`;

            cells.push(`
                <div class="heatmap-cell ${isDone ? 'done' : ''}" 
                     style="${isDone ? `background-color: ${color};` : ''}" 
                     title="${title}">
                </div>
            `);
        }
        return cells.join('');
    }

    static async toggleHabit(habitId, dateStr) {
        try {
            const res = await api.post('/habits/toggle', {
                habit_id: habitId,
                date: dateStr,
                completed: true
            });
            showToast(res.completed ? 'Habit marked completed! +10 XP' : 'Habit unmarked', 'info');
            await Auth.loadUser();
            this.render();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    static openCreateModal() {
        const modalTitle = document.getElementById('detail-modal-title');
        const modalBody = document.getElementById('detail-modal-body');
        if (!modalBody) return;

        modalTitle.textContent = 'Create New Habit';
        modalBody.innerHTML = `
            <form onsubmit="Habits.handleCreateHabit(event)">
                <div class="form-group">
                    <label>Habit Name *</label>
                    <input type="text" id="habit-name" class="form-input" required placeholder="e.g. Morning 20m Meditation">
                </div>
                <div class="form-row">
                    <div class="form-group col-6">
                        <label>Category</label>
                        <input type="text" id="habit-cat" class="form-input" placeholder="e.g. Mindfulness, Health, Learning">
                    </div>
                    <div class="form-group col-6">
                        <label>Frequency</label>
                        <select id="habit-freq" class="form-select">
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Color Accent</label>
                    <input type="color" id="habit-color" class="form-color-picker" value="#00b894">
                </div>
                <div class="form-group">
                    <label>Description / Motivation</label>
                    <textarea id="habit-desc" class="form-textarea" rows="2" placeholder="Why is this habit essential to your personal system?"></textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-ghost" onclick="hideModal('detail-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Habit</button>
                </div>
            </form>
        `;
        showModal('detail-modal');
    }

    static async handleCreateHabit(e) {
        e.preventDefault();
        const name = document.getElementById('habit-name')?.value.trim();
        const category = document.getElementById('habit-cat')?.value.trim();
        const frequency = document.getElementById('habit-freq')?.value;
        const color = document.getElementById('habit-color')?.value;
        const description = document.getElementById('habit-desc')?.value.trim();

        try {
            await api.post('/habits', { name, category, frequency, color, description });
            hideModal('detail-modal');
            showToast('Habit created successfully!', 'success');
            this.render();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    static async deleteHabit(id) {
        confirmDialog('Delete this habit and all its streak history?', async () => {
            try {
                await api.delete(`/habits/${id}`);
                showToast('Habit deleted', 'info');
                Habits.render();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }
}
