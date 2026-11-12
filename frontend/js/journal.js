/* ============================================================
   Journal & Knowledge Base Module — Personal Intelligence System
   ============================================================ */

class Journal {
    static activeTypeFilter = 'all';
    static searchQuery = '';

    static async render() {
        const content = document.getElementById('app-content');
        if (!content) return;

        try {
            const params = {};
            if (this.activeTypeFilter !== 'all') params.entry_type = this.activeTypeFilter;
            if (this.searchQuery) params.search = this.searchQuery;

            const entries = await api.get('/journal', params);
            window.journalEntries = entries;

            content.innerHTML = `
                <div class="module-header-bar">
                    <div>
                        <h2><i class="fas fa-pen-fancy"></i> Personal Journal & Knowledge Base</h2>
                        <p class="text-secondary">Capture fleeting thoughts, record daily reflections, and synthesize your personal knowledge</p>
                    </div>
                    <div>
                        <button class="btn btn-primary" onclick="Journal.openEntryModal()">
                            <i class="fas fa-plus"></i> New Entry
                        </button>
                    </div>
                </div>

                <!-- Search & Filters -->
                <div class="card mb-4">
                    <div class="card-body">
                        <div class="journal-controls-bar">
                            <div class="search-input-wrap">
                                <i class="fas fa-search"></i>
                                <input type="text" id="journal-search-input" class="form-input" 
                                       placeholder="Search entries by title, content, or tag..."
                                       value="${escapeHtml(this.searchQuery)}"
                                       oninput="Journal.handleSearch(this.value)">
                            </div>
                            <div class="filter-pills">
                                <button class="filter-pill ${this.activeTypeFilter === 'all' ? 'active' : ''}" onclick="Journal.setTypeFilter('all')">All</button>
                                <button class="filter-pill ${this.activeTypeFilter === 'journal' ? 'active' : ''}" onclick="Journal.setTypeFilter('journal')">Reflections</button>
                                <button class="filter-pill ${this.activeTypeFilter === 'idea' ? 'active' : ''}" onclick="Journal.setTypeFilter('idea')">Ideas</button>
                                <button class="filter-pill ${this.activeTypeFilter === 'learning' ? 'active' : ''}" onclick="Journal.setTypeFilter('learning')">Learning</button>
                                <button class="filter-pill ${this.activeTypeFilter === 'note' ? 'active' : ''}" onclick="Journal.setTypeFilter('note')">Notes</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Entries Grid -->
                <div class="journal-entries-container">
                    ${entries.length ? `
                        <div class="journal-grid">
                            ${entries.map(e => {
                                const tags = e.tags ? e.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
                                const preview = e.content.length > 180 ? e.content.substring(0, 180) + '...' : e.content;

                                return `
                                    <div class="journal-card ${e.is_pinned ? 'journal-pinned' : ''}" onclick="Journal.viewEntry('${e.id}')">
                                        <div class="journal-card-top">
                                            <div class="journal-meta">
                                                <span class="badge badge-primary">${e.entry_type}</span>
                                                ${e.mood ? `<span class="mood-pill">${escapeHtml(e.mood)}</span>` : ''}
                                                <span class="text-xs text-muted">${formatDate(e.created_at)}</span>
                                            </div>
                                            <div class="journal-actions-top" onclick="event.stopPropagation()">
                                                <button class="btn btn-ghost btn-xs ${e.is_pinned ? 'text-accent-warning' : 'text-muted'}" title="Toggle pin" onclick="Journal.togglePin('${e.id}', ${!e.is_pinned})">
                                                    <i class="fas fa-thumbtack"></i>
                                                </button>
                                                <button class="btn btn-ghost btn-xs text-danger" title="Delete" onclick="Journal.deleteEntry('${e.id}')">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>

                                        <h3 class="journal-title">${escapeHtml(e.title)}</h3>
                                        <p class="journal-preview">${escapeHtml(preview)}</p>

                                        ${tags.length ? `
                                            <div class="journal-tags">
                                                ${tags.map(tag => `<span class="tag tag-xs">#${escapeHtml(tag)}</span>`).join('')}
                                            </div>
                                        ` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : `
                        <div class="card empty-state p-5">
                            <i class="fas fa-book-open fa-3x text-accent-primary mb-3"></i>
                            <h3>No Journal Entries Found</h3>
                            <p class="text-secondary">Start recording your thoughts, breakthroughs, and daily reflections.</p>
                            <button class="btn btn-primary mt-3" onclick="Journal.openEntryModal()">
                                <i class="fas fa-plus"></i> Write First Entry
                            </button>
                        </div>
                    `}
                </div>
            `;
        } catch (err) {
            console.error('Failed to load journal:', err);
            content.innerHTML = `<div class="card error-card"><p>Failed to load journal data: ${err.message}</p></div>`;
        }
    }

    static setTypeFilter(type) {
        this.activeTypeFilter = type;
        this.render();
    }

    static handleSearch(val) {
        this.searchQuery = val;
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => this.render(), 300);
    }

    static viewEntry(id) {
        const entry = (window.journalEntries || []).find(e => e.id === id);
        if (!entry) return;

        const modalTitle = document.getElementById('detail-modal-title');
        const modalBody = document.getElementById('detail-modal-body');
        if (!modalBody) return;

        const tags = entry.tags ? entry.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

        modalTitle.textContent = entry.title;
        modalBody.innerHTML = `
            <div class="entry-view-header mb-3">
                <span class="badge badge-primary">${entry.entry_type}</span>
                ${entry.category ? `<span class="badge badge-secondary">${escapeHtml(entry.category)}</span>` : ''}
                ${entry.mood ? `<span class="mood-pill">${escapeHtml(entry.mood)}</span>` : ''}
                <span class="text-secondary text-sm ml-2">${formatDate(entry.created_at)}</span>
            </div>
            <div class="entry-view-content" style="white-space: pre-wrap; line-height: 1.7; font-size: 1.05rem;">
                ${escapeHtml(entry.content)}
            </div>
            ${tags.length ? `
                <div class="tags-container mt-4 pt-3 border-top">
                    ${tags.map(t => `<span class="tag tag-sm">#${escapeHtml(t)}</span>`).join('')}
                </div>
            ` : ''}
            <div class="modal-footer mt-4">
                <button type="button" class="btn btn-ghost" onclick="hideModal('detail-modal')">Close</button>
                <button type="button" class="btn btn-secondary" onclick="Journal.editEntry('${entry.id}')">Edit</button>
            </div>
        `;
        showModal('detail-modal');
    }

    static openEntryModal(existing = null) {
        const modalTitle = document.getElementById('detail-modal-title');
        const modalBody = document.getElementById('detail-modal-body');
        if (!modalBody) return;

        modalTitle.textContent = existing ? 'Edit Journal Entry' : 'Write Journal / Knowledge Entry';
        modalBody.innerHTML = `
            <form onsubmit="Journal.handleSaveEntry(event, '${existing ? existing.id : ''}')">
                <div class="form-group">
                    <label>Title *</label>
                    <input type="text" id="j-title" class="form-input" required placeholder="Entry headline" value="${escapeHtml(existing?.title || '')}">
                </div>
                <div class="form-row">
                    <div class="form-group col-4">
                        <label>Entry Type</label>
                        <select id="j-type" class="form-select">
                            <option value="journal" ${existing?.entry_type === 'journal' ? 'selected' : ''}>Journal Reflection</option>
                            <option value="idea" ${existing?.entry_type === 'idea' ? 'selected' : ''}>Idea & Brainstorm</option>
                            <option value="learning" ${existing?.entry_type === 'learning' ? 'selected' : ''}>Learning Note</option>
                            <option value="experience" ${existing?.entry_type === 'experience' ? 'selected' : ''}>Experience</option>
                            <option value="note" ${existing?.entry_type === 'note' ? 'selected' : ''}>Quick Note</option>
                        </select>
                    </div>
                    <div class="form-group col-4">
                        <label>Category</label>
                        <input type="text" id="j-cat" class="form-input" placeholder="e.g. Philosophy, Career" value="${escapeHtml(existing?.category || '')}">
                    </div>
                    <div class="form-group col-4">
                        <label>Mood / State</label>
                        <select id="j-mood" class="form-select">
                            <option value="">None</option>
                            <option value="⚡ Energetic" ${existing?.mood === '⚡ Energetic' ? 'selected' : ''}>⚡ Energetic</option>
                            <option value="🧘 Focused" ${existing?.mood === '🧘 Focused' ? 'selected' : ''}>🧘 Focused</option>
                            <option value="💡 Creative" ${existing?.mood === '💡 Creative' ? 'selected' : ''}>💡 Creative</option>
                            <option value="😌 Calm" ${existing?.mood === '😌 Calm' ? 'selected' : ''}>😌 Calm</option>
                            <option value="⚠️ Challenged" ${existing?.mood === '⚠️ Challenged' ? 'selected' : ''}>⚠️ Challenged</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Content *</label>
                    <textarea id="j-content" class="form-textarea" rows="8" required placeholder="Write your thoughts here...">${escapeHtml(existing?.content || '')}</textarea>
                </div>
                <div class="form-group">
                    <label>Tags (comma separated)</label>
                    <input type="text" id="j-tags" class="form-input" placeholder="e.g. mental-models, ai, habits" value="${escapeHtml(existing?.tags || '')}">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-ghost" onclick="hideModal('detail-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">${existing ? 'Update Entry' : 'Save Entry (+10 XP)'}</button>
                </div>
            </form>
        `;
        showModal('detail-modal');
    }

    static editEntry(id) {
        const entry = (window.journalEntries || []).find(e => e.id === id);
        if (entry) this.openEntryModal(entry);
    }

    static async handleSaveEntry(e, existingId = '') {
        e.preventDefault();
        const title = document.getElementById('j-title')?.value.trim();
        const entry_type = document.getElementById('j-type')?.value;
        const category = document.getElementById('j-cat')?.value.trim();
        const mood = document.getElementById('j-mood')?.value;
        const content = document.getElementById('j-content')?.value.trim();
        const tags = document.getElementById('j-tags')?.value.trim();

        try {
            if (existingId) {
                await api.put(`/journal/${existingId}`, {
                    title, entry_type, category, mood, content, tags
                });
                showToast('Entry updated!', 'success');
            } else {
                await api.post('/journal', {
                    title, entry_type, category, mood, content, tags
                });
                showToast('Entry saved! +10 XP', 'success');
                await Auth.loadUser();
            }
            hideModal('detail-modal');
            this.render();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    static async togglePin(id, isPinned) {
        try {
            await api.put(`/journal/${id}`, { is_pinned: isPinned });
            showToast(isPinned ? 'Entry pinned to top' : 'Entry unpinned', 'info');
            this.render();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    static async deleteEntry(id) {
        confirmDialog('Delete this journal entry?', async () => {
            try {
                await api.delete(`/journal/${id}`);
                showToast('Entry deleted', 'info');
                Journal.render();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }
}
