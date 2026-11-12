/* ============================================================
   Profile Module — Personal Intelligence System
   ============================================================ */

class Profile {
    static async render() {
        const content = document.getElementById('app-content');
        if (!content) return;

        try {
            const profile = await api.get('/profile');
            const user = window.pisUser || await api.get('/auth/me');

            // Parse json arrays safely
            const goals = this.safeParseArray(profile.goals);
            const skills = this.safeParseArray(profile.skills);
            const interests = this.safeParseArray(profile.interests);
            const milestones = this.safeParseArray(profile.milestones);

            content.innerHTML = `
                <div class="profile-layout">
                    <!-- Left Column: User Card & Quick Actions -->
                    <div class="profile-sidebar-card card">
                        <div class="profile-avatar-large">
                            <i class="fas fa-user-astronaut"></i>
                        </div>
                        <h2 class="profile-name">${escapeHtml(profile.full_name || user.username)}</h2>
                        <span class="badge badge-primary">Level ${user.level} Citizen</span>
                        <p class="profile-bio">${escapeHtml(profile.bio || 'No personal bio set yet. Click Edit Profile below to customize your command profile.')}</p>

                        <div class="profile-meta-list">
                            <div class="meta-item">
                                <i class="fas fa-envelope"></i>
                                <span>${escapeHtml(user.email)}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-coins"></i>
                                <span>Currency: ${user.currency || 'NPR'}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-star"></i>
                                <span>Total Experience: ${user.xp} XP</span>
                            </div>
                        </div>

                        <div class="profile-actions-column">
                            <button class="btn btn-primary btn-block" onclick="Profile.openEditModal()">
                                <i class="fas fa-edit"></i> Edit Profile
                            </button>
                            <a href="/api/backup/export" class="btn btn-secondary btn-block" download>
                                <i class="fas fa-download"></i> Export Data Backup
                            </a>
                        </div>
                    </div>

                    <!-- Right Column: Goals, Skills, Milestones, Notes -->
                    <div class="profile-main-column">
                        <!-- Skills & Interests -->
                        <div class="card mb-4">
                            <div class="card-header">
                                <h3><i class="fas fa-brain"></i> Skills & Interests</h3>
                            </div>
                            <div class="card-body">
                                <h4>Learning Skills</h4>
                                <div class="tags-container mb-3">
                                    ${skills.length ? skills.map(s => `<span class="tag tag-skill"><i class="fas fa-code"></i> ${escapeHtml(s)}</span>`).join('') : '<p class="text-muted">No skills logged yet.</p>'}
                                </div>
                                <h4>Interests</h4>
                                <div class="tags-container">
                                    ${interests.length ? interests.map(i => `<span class="tag tag-interest"><i class="fas fa-heart"></i> ${escapeHtml(i)}</span>`).join('') : '<p class="text-muted">No interests logged yet.</p>'}
                                </div>
                            </div>
                        </div>

                        <!-- Personal Goals -->
                        <div class="card mb-4">
                            <div class="card-header">
                                <h3><i class="fas fa-flag-checkered"></i> Strategic Personal Goals</h3>
                            </div>
                            <div class="card-body">
                                ${goals.length ? `
                                    <ul class="profile-goals-list">
                                        ${goals.map(g => `<li><i class="fas fa-check-circle text-accent-success"></i> <span>${escapeHtml(g)}</span></li>`).join('')}
                                    </ul>
                                ` : '<p class="text-muted">No personal goals added yet.</p>'}
                            </div>
                        </div>

                        <!-- Important Milestones -->
                        <div class="card mb-4">
                            <div class="card-header">
                                <h3><i class="fas fa-history"></i> Milestones & Life Timeline</h3>
                            </div>
                            <div class="card-body">
                                ${milestones.length ? `
                                    <div class="timeline-container">
                                        ${milestones.map(m => `
                                            <div class="timeline-node">
                                                <div class="timeline-dot"></div>
                                                <div class="timeline-content">
                                                    <p>${escapeHtml(m)}</p>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : '<p class="text-muted">No life milestones recorded yet.</p>'}
                            </div>
                        </div>

                        <!-- Personal Notes -->
                        <div class="card">
                            <div class="card-header">
                                <h3><i class="fas fa-sticky-note"></i> Personal Notes & Philosophy</h3>
                            </div>
                            <div class="card-body">
                                <p style="white-space: pre-line;">${escapeHtml(profile.notes || 'Add personal guiding principles, mantras, or important notes.')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            window.currentProfile = profile;
        } catch (err) {
            console.error('Failed to render profile:', err);
            content.innerHTML = `<div class="card error-card"><p>Failed to load profile: ${err.message}</p></div>`;
        }
    }

    static safeParseArray(jsonStr) {
        if (!jsonStr) return [];
        try {
            const parsed = JSON.parse(jsonStr);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return jsonStr.split(',').map(s => s.trim()).filter(Boolean);
        }
    }

    static openEditModal() {
        const p = window.currentProfile || {};
        const detailModal = document.getElementById('detail-modal');
        const modalTitle = document.getElementById('detail-modal-title');
        const modalBody = document.getElementById('detail-modal-body');

        if (!detailModal || !modalBody) return;

        modalTitle.textContent = 'Edit Personal Profile';

        const skillsStr = this.safeParseArray(p.skills).join(', ');
        const interestsStr = this.safeParseArray(p.interests).join(', ');
        const goalsStr = this.safeParseArray(p.goals).join('\n');
        const milestonesStr = this.safeParseArray(p.milestones).join('\n');

        modalBody.innerHTML = `
            <form onsubmit="Profile.handleSave(event)">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="prof-name" class="form-input" value="${escapeHtml(p.full_name || '')}">
                </div>
                <div class="form-group">
                    <label>Personal Bio / Mission</label>
                    <textarea id="prof-bio" class="form-textarea" rows="3">${escapeHtml(p.bio || '')}</textarea>
                </div>
                <div class="form-group">
                    <label>Skills (comma separated)</label>
                    <input type="text" id="prof-skills" class="form-input" value="${escapeHtml(skillsStr)}" placeholder="e.g. Python, Machine Learning, System Design">
                </div>
                <div class="form-group">
                    <label>Interests (comma separated)</label>
                    <input type="text" id="prof-interests" class="form-input" value="${escapeHtml(interestsStr)}" placeholder="e.g. Astrophysics, Chess, Cybernetics">
                </div>
                <div class="form-group">
                    <label>Strategic Goals (one per line)</label>
                    <textarea id="prof-goals" class="form-textarea" rows="3" placeholder="Enter goals, one per line">${escapeHtml(goalsStr)}</textarea>
                </div>
                <div class="form-group">
                    <label>Milestones (one per line)</label>
                    <textarea id="prof-milestones" class="form-textarea" rows="3" placeholder="Enter milestone moments">${escapeHtml(milestonesStr)}</textarea>
                </div>
                <div class="form-group">
                    <label>Personal Notes & Core Principles</label>
                    <textarea id="prof-notes" class="form-textarea" rows="3">${escapeHtml(p.notes || '')}</textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-ghost" onclick="hideModal('detail-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
            </form>
        `;

        showModal('detail-modal');
    }

    static async handleSave(e) {
        e.preventDefault();
        const fullName = document.getElementById('prof-name')?.value.trim();
        const bio = document.getElementById('prof-bio')?.value.trim();
        const skillsRaw = document.getElementById('prof-skills')?.value || '';
        const interestsRaw = document.getElementById('prof-interests')?.value || '';
        const goalsRaw = document.getElementById('prof-goals')?.value || '';
        const milestonesRaw = document.getElementById('prof-milestones')?.value || '';
        const notes = document.getElementById('prof-notes')?.value.trim();

        const skills = skillsRaw.split(',').map(s => s.trim()).filter(Boolean);
        const interests = interestsRaw.split(',').map(s => s.trim()).filter(Boolean);
        const goals = goalsRaw.split('\n').map(s => s.trim()).filter(Boolean);
        const milestones = milestonesRaw.split('\n').map(s => s.trim()).filter(Boolean);

        try {
            await api.put('/profile', {
                full_name: fullName,
                bio: bio,
                skills: JSON.stringify(skills),
                interests: JSON.stringify(interests),
                goals: JSON.stringify(goals),
                milestones: JSON.stringify(milestones),
                notes: notes,
            });
            hideModal('detail-modal');
            showToast('Profile updated successfully!', 'success');
            this.render();
        } catch (err) {
            showToast(err.message || 'Failed to update profile', 'error');
        }
    }
}
