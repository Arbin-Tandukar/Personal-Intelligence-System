/* ============================================================
   Task & Quest Manager Module — Personal Intelligence System
   ============================================================ */

class Tasks {
    static activeFilter = 'all';

    static async render() {
        const content = document.getElementById('app-content');
        if (!content) return;

        try {
            const [tasks, quests, achievements, stats] = await Promise.all([
                api.get('/tasks'),
                api.get('/tasks/quests'),
                api.get('/tasks/achievements'),
                api.get('/tasks/stats'),
            ]);

            window.pisQuests = quests;

            // Filter tasks
            const filteredTasks = tasks.filter(t => {
                if (this.activeFilter === 'pending') return t.status !== 'completed';
                if (this.activeFilter === 'completed') return t.status === 'completed';
                return true;
            });

            content.innerHTML = `
                <div class="module-header-bar">
                    <div>
                        <h2><i class="fas fa-trophy"></i> Gamified Task & Quest Hub</h2>
                        <p class="text-secondary">Conquer quests, execute daily objectives, and earn XP to level up your command rank</p>
                    </div>
                    <div class="action-buttons-group">
                        <button class="btn btn-primary" onclick="Tasks.openTaskModal()">
                            <i class="fas fa-plus"></i> New Task
                        </button>
                        <button class="btn btn-secondary" onclick="Tasks.openQuestModal()">
                            <i class="fas fa-shield-alt"></i> New Quest
                        </button>
                    </div>
                </div>

                <!-- Gamification Rank Banner -->
                <div class="card gamification-banner mb-4">
                    <div class="rank-badge-wrap">
                        <div class="rank-avatar">
                            <i class="fas fa-medal"></i>
                        </div>
                        <div class="rank-details">
                            <h3>Level ${stats.level} Operative</h3>
                            <p class="text-secondary">Progress to Level ${stats.level + 1}: ${stats.xp_in_level} / ${stats.xp_needed} XP</p>
                            <div class="progress-bar-bg mt-1">
                                <div class="progress-bar-fill" style="width: ${stats.level_progress_percent}%; background: linear-gradient(90deg, #6c5ce7, #00cec9);"></div>
                            </div>
                        </div>
                    </div>
                    <div class="rank-meta-counters">
                        <div class="rank-counter">
                            <span class="count-val">${stats.completed_tasks}</span>
                            <span class="count-lbl">Completed</span>
                        </div>
                        <div class="rank-counter">
                            <span class="count-val">${stats.pending_tasks}</span>
                            <span class="count-lbl">Pending</span>
                        </div>
                        <div class="rank-counter">
                            <span class="count-val">${stats.completion_rate}%</span>
                            <span class="count-lbl">Win Rate</span>
                        </div>
                    </div>
                </div>

                <!-- Quests Section -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h3><i class="fas fa-dungeon"></i> Active Quests & Epics</h3>
                    </div>
                    <div class="card-body">
                        ${quests.length ? `
                            <div class="quests-grid">
                                ${quests.map(q => {
                                    const questTasks = tasks.filter(t => t.quest_id === q.id);
                                    const doneCount = questTasks.filter(t => t.status === 'completed').length;
                                    const totalCount = questTasks.length;
                                    const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
                                    const isComplete = q.status === 'completed';

                                    return `
                                        <div class="quest-card ${isComplete ? 'quest-completed' : ''}">
                                            <div class="quest-card-header">
                                                <h4>${escapeHtml(q.title)}</h4>
                                                <span class="badge ${isComplete ? 'badge-success' : 'badge-primary'}">+${q.xp_reward} XP</span>
                                            </div>
                                            <p class="quest-desc text-secondary text-sm">${escapeHtml(q.description || 'No description provided.')}</p>
                                            <div class="quest-progress-box mt-3">
                                                <div class="progress-info text-xs">
                                                    <span>${doneCount}/${totalCount} objectives cleared</span>
                                                    <span>${pct}%</span>
                                                </div>
                                                <div class="progress-bar-bg mt-1">
                                                    <div class="progress-bar-fill" style="width: ${pct}%; background: #00cec9;"></div>
                                                </div>
                                            </div>
                                            <div class="quest-actions mt-3">
                                                ${!isComplete ? `
                                                    <button class="btn btn-secondary btn-xs" onclick="Tasks.completeQuest('${q.id}')">
                                                        <i class="fas fa-check"></i> Complete Quest
                                                    </button>
                                                ` : '<span class="text-xs text-accent-success"><i class="fas fa-check-circle"></i> Quest Mastered</span>'}
                                                <button class="btn btn-ghost btn-xs text-danger" onclick="Tasks.deleteQuest('${q.id}')">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        ` : `
                            <div class="empty-state"><p>No active quests. Group multiple tasks into an Epic Quest to earn massive XP!</p></div>
                        `}
                    </div>
                </div>

                <!-- Tasks Filter Bar & Task List -->
                <div class="card mb-4">
                    <div class="card-header task-header-flex">
                        <h3><i class="fas fa-tasks"></i> Task Objective Registry</h3>
                        <div class="filter-pills">
                            <button class="filter-pill ${this.activeFilter === 'all' ? 'active' : ''}" onclick="Tasks.setFilter('all')">All</button>
                            <button class="filter-pill ${this.activeFilter === 'pending' ? 'active' : ''}" onclick="Tasks.setFilter('pending')">Pending</button>
                            <button class="filter-pill ${this.activeFilter === 'completed' ? 'active' : ''}" onclick="Tasks.setFilter('completed')">Completed</button>
                        </div>
                    </div>
                    <div class="card-body">
                        ${filteredTasks.length ? `
                            <div class="tasks-list">
                                ${filteredTasks.map(t => {
                                    const isDone = t.status === 'completed';
                                    let priClass = 'badge-primary';
                                    if (t.priority === 'urgent') priClass = 'badge-danger';
                                    if (t.priority === 'high') priClass = 'badge-warning';
                                    if (t.priority === 'low') priClass = 'badge-ghost';

                                    return `
                                        <div class="task-item-card ${isDone ? 'task-done' : ''}">
                                            <div class="task-checkbox-wrap" onclick="Tasks.toggleTaskStatus('${t.id}', '${t.status}')">
                                                <i class="fas ${isDone ? 'fa-check-square text-accent-success' : 'fa-square'} task-check-icon"></i>
                                            </div>
                                            <div class="task-details">
                                                <div class="task-title-row">
                                                    <h4 class="task-title ${isDone ? 'line-through' : ''}">${escapeHtml(t.title)}</h4>
                                                    <span class="badge ${priClass}">${t.priority}</span>
                                                    <span class="badge badge-xp">+${t.xp_reward || 10} XP</span>
                                                </div>
                                                ${t.description ? `<p class="task-desc">${escapeHtml(t.description)}</p>` : ''}
                                                <div class="task-footer-meta">
                                                    ${t.category ? `<span class="tag tag-xs"><i class="fas fa-tag"></i> ${escapeHtml(t.category)}</span>` : ''}
                                                    ${t.deadline ? `<span class="tag tag-xs text-secondary"><i class="far fa-clock"></i> ${formatDate(t.deadline)}</span>` : ''}
                                                </div>
                                            </div>
                                            <div class="task-actions">
                                                <button class="btn btn-ghost btn-xs text-danger" onclick="Tasks.deleteTask('${t.id}')">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        ` : `
                            <div class="empty-state"><p>No tasks match this filter.</p></div>
                        `}
                    </div>
                </div>

                <!-- Unlocked Achievements Showcase -->
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-award"></i> Unlocked Achievements & Badges</h3>
                    </div>
                    <div class="card-body">
                        ${achievements.length ? `
                            <div class="achievements-grid">
                                ${achievements.map(a => `
                                    <div class="achievement-badge-card">
                                        <div class="ach-icon"><i class="fas ${a.icon || 'fa-medal'}"></i></div>
                                        <div class="ach-info">
                                            <h4>${escapeHtml(a.title)}</h4>
                                            <p>${escapeHtml(a.description || '')}</p>
                                            <span class="badge badge-success">+${a.xp_reward} XP</span>
                                            <span class="text-xs text-muted block mt-1">Unlocked ${formatDate(a.unlocked_at)}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="empty-state"><p>No achievements unlocked yet. Complete tasks and reach Level 5 to earn badges!</p></div>
                        `}
                    </div>
                </div>
            `;
        } catch (err) {
            console.error('Failed to load tasks module:', err);
            content.innerHTML = `<div class="card error-card"><p>Failed to load tasks data: ${err.message}</p></div>`;
        }
    }

    static setFilter(filter) {
        this.activeFilter = filter;
        this.render();
    }

    static async toggleTaskStatus(id, currentStatus) {
        const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        try {
            await api.put(`/tasks/${id}`, { status: nextStatus });
            showToast(nextStatus === 'completed' ? 'Objective Cleared! XP Awarded!' : 'Objective reset', 'info');
            await Auth.loadUser();
            this.render();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    static openTaskModal() {
        const modalTitle = document.getElementById('detail-modal-title');
        const modalBody = document.getElementById('detail-modal-body');
        if (!modalBody) return;

        const quests = window.pisQuests || [];

        modalTitle.textContent = 'Create Objective / Task';
        modalBody.innerHTML = `
            <form onsubmit="Tasks.handleCreateTask(event)">
                <div class="form-group">
                    <label>Task Title *</label>
                    <input type="text" id="task-title" class="form-input" required placeholder="e.g. Implement dynamic data visualizer">
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="task-desc" class="form-textarea" rows="2" placeholder="Details or acceptance criteria"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group col-6">
                        <label>Priority</label>
                        <select id="task-priority" class="form-select">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                    <div class="form-group col-6">
                        <label>XP Reward</label>
                        <input type="number" id="task-xp" class="form-input" value="15" min="5" max="100">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group col-6">
                        <label>Category</label>
                        <input type="text" id="task-category" class="form-input" placeholder="e.g. Work, Study, Health">
                    </div>
                    <div class="form-group col-6">
                        <label>Epic / Quest</label>
                        <select id="task-quest" class="form-select">
                            <option value="">None (Standalone)</option>
                            ${quests.map(q => `<option value="${q.id}">${escapeHtml(q.title)}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Deadline (Optional)</label>
                    <input type="datetime-local" id="task-deadline" class="form-input">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-ghost" onclick="hideModal('detail-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Task</button>
                </div>
            </form>
        `;
        showModal('detail-modal');
    }

    static async handleCreateTask(e) {
        e.preventDefault();
        const title = document.getElementById('task-title')?.value.trim();
        const description = document.getElementById('task-desc')?.value.trim();
        const priority = document.getElementById('task-priority')?.value;
        const xp_reward = parseInt(document.getElementById('task-xp')?.value, 10) || 15;
        const category = document.getElementById('task-category')?.value.trim();
        const quest_id = document.getElementById('task-quest')?.value || null;
        const deadlineRaw = document.getElementById('task-deadline')?.value;
        const deadline = deadlineRaw ? new Date(deadlineRaw).toISOString() : null;

        try {
            await api.post('/tasks', {
                title, description, priority, xp_reward, category, quest_id, deadline
            });
            hideModal('detail-modal');
            showToast('Task created!', 'success');
            this.render();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    static async deleteTask(id) {
        confirmDialog('Delete this task?', async () => {
            try {
                await api.delete(`/tasks/${id}`);
                showToast('Task removed', 'info');
                Tasks.render();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    static openQuestModal() {
        const modalTitle = document.getElementById('detail-modal-title');
        const modalBody = document.getElementById('detail-modal-body');
        if (!modalBody) return;

        modalTitle.textContent = 'Create Epic Quest';
        modalBody.innerHTML = `
            <form onsubmit="Tasks.handleCreateQuest(event)">
                <div class="form-group">
                    <label>Quest Title *</label>
                    <input type="text" id="quest-title" class="form-input" required placeholder="e.g. Master Deep Learning Foundations">
                </div>
                <div class="form-group">
                    <label>Description & Scope</label>
                    <textarea id="quest-desc" class="form-textarea" rows="3" placeholder="What major objective does this quest achieve?"></textarea>
                </div>
                <div class="form-group">
                    <label>Completion XP Reward</label>
                    <input type="number" id="quest-xp" class="form-input" value="75" min="20" max="500">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-ghost" onclick="hideModal('detail-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Initiate Quest</button>
                </div>
            </form>
        `;
        showModal('detail-modal');
    }

    static async handleCreateQuest(e) {
        e.preventDefault();
        const title = document.getElementById('quest-title')?.value.trim();
        const description = document.getElementById('quest-desc')?.value.trim();
        const xp_reward = parseInt(document.getElementById('quest-xp')?.value, 10) || 75;

        try {
            await api.post('/tasks/quests', { title, description, xp_reward });
            hideModal('detail-modal');
            showToast('Quest initiated!', 'success');
            this.render();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    static async completeQuest(id) {
        try {
            await api.put(`/tasks/quests/${id}`, { status: 'completed' });
            showToast('Quest Accomplished! Huge XP reward granted!', 'success');
            await Auth.loadUser();
            this.render();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    static async deleteQuest(id) {
        confirmDialog('Delete this quest?', async () => {
            try {
                await api.delete(`/tasks/quests/${id}`);
                showToast('Quest removed', 'info');
                Tasks.render();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }
}
