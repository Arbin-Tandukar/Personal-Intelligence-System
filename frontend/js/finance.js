/* ============================================================
   Finance Tracker Module — Personal Intelligence System
   ============================================================ */

class Finance {
    static chartInstances = {};

    static async render() {
        const content = document.getElementById('app-content');
        if (!content) return;

        try {
            const [transactions, summary] = await Promise.all([
                api.get('/finance/transactions'),
                api.get('/finance/summary'),
            ]);

            const currency = summary.currency || 'NPR';

            content.innerHTML = `
                <div class="module-header-bar">
                    <div>
                        <h2><i class="fas fa-wallet"></i> Personal Finance Tracker</h2>
                        <p class="text-secondary">Monitor cashflow, track monthly budgets, and optimize your personal savings rate</p>
                    </div>
                    <div class="action-buttons-group">
                        <button class="btn btn-primary" onclick="Finance.openTransactionModal('expense')">
                            <i class="fas fa-minus-circle"></i> Add Expense
                        </button>
                        <button class="btn btn-success" onclick="Finance.openTransactionModal('income')">
                            <i class="fas fa-plus-circle"></i> Add Income
                        </button>
                        <button class="btn btn-secondary" onclick="Finance.openBudgetModal()">
                            <i class="fas fa-sliders-h"></i> Set Budget
                        </button>
                    </div>
                </div>

                <!-- Financial Highlights -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(0, 184, 148, 0.2); color: #00b894;">
                            <i class="fas fa-arrow-down"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Month Income</span>
                            <h3 class="stat-value text-accent-success">${formatCurrency(summary.total_income, currency)}</h3>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(225, 112, 85, 0.2); color: #e17055;">
                            <i class="fas fa-arrow-up"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Month Expenses</span>
                            <h3 class="stat-value text-accent-danger">${formatCurrency(summary.total_expense, currency)}</h3>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(108, 92, 231, 0.2); color: #6c5ce7;">
                            <i class="fas fa-piggy-bank"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Net Savings</span>
                            <h3 class="stat-value ${summary.net_savings >= 0 ? 'text-accent-success' : 'text-accent-danger'}">
                                ${formatCurrency(summary.net_savings, currency)}
                            </h3>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(253, 203, 110, 0.2); color: #fdcb6e;">
                            <i class="fas fa-chart-pie"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Savings Rate</span>
                            <h3 class="stat-value">
                                ${summary.total_income > 0 ? Math.round((summary.net_savings / summary.total_income) * 100) : 0}%
                            </h3>
                        </div>
                    </div>
                </div>

                <!-- Budgets Progress Section -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h3><i class="fas fa-layer-group"></i> Monthly Category Budgets</h3>
                    </div>
                    <div class="card-body">
                        ${summary.budget_status && summary.budget_status.length ? `
                            <div class="budget-items-grid">
                                ${summary.budget_status.map(b => {
                                    const pct = Math.min(100, b.percent_used);
                                    let barColor = '#00b894';
                                    if (b.percent_used > 80) barColor = '#fdcb6e';
                                    if (b.percent_used > 100) barColor = '#e17055';

                                    return `
                                        <div class="budget-card">
                                            <div class="budget-card-header">
                                                <h4>${escapeHtml(b.category)}</h4>
                                                <span class="badge ${b.is_over ? 'badge-danger' : 'badge-primary'}">
                                                    ${b.is_over ? 'Over Budget' : b.percent_used + '% Used'}
                                                </span>
                                            </div>
                                            <div class="budget-numbers">
                                                <span>Spent: ${formatCurrency(b.spent, currency)}</span>
                                                <span>Limit: ${formatCurrency(b.budgeted, currency)}</span>
                                            </div>
                                            <div class="progress-bar-bg mt-2">
                                                <div class="progress-bar-fill" style="width: ${pct}%; background: ${barColor};"></div>
                                            </div>
                                            <div class="budget-footer text-xs text-muted mt-2">
                                                Remaining: ${formatCurrency(b.remaining, currency)}
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        ` : `
                            <div class="empty-state">
                                <p>No category budgets configured for this month. Click "Set Budget" above to manage spending caps.</p>
                            </div>
                        `}
                    </div>
                </div>

                <!-- Charts Section -->
                <div class="charts-row">
                    <div class="card chart-card">
                        <div class="card-header">
                            <h3><i class="fas fa-chart-pie"></i> Spending Distribution</h3>
                        </div>
                        <div class="card-body">
                            <div class="chart-wrapper">
                                <canvas id="financeCategoryFullChart"></canvas>
                            </div>
                        </div>
                    </div>

                    <div class="card chart-card">
                        <div class="card-header">
                            <h3><i class="fas fa-balance-scale"></i> Income vs Expense</h3>
                        </div>
                        <div class="card-body">
                            <div class="chart-wrapper">
                                <canvas id="financeBalanceChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Transaction Ledger Table -->
                <div class="card mt-4">
                    <div class="card-header">
                        <h3><i class="fas fa-receipt"></i> Transaction Ledger</h3>
                    </div>
                    <div class="card-body">
                        ${transactions.length ? `
                            <div class="table-responsive">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Category</th>
                                            <th>Description</th>
                                            <th>Amount</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${transactions.map(t => {
                                            const isIncome = t.transaction_type === 'income';
                                            return `
                                                <tr>
                                                    <td>${formatDate(t.date)}</td>
                                                    <td>
                                                        <span class="badge ${isIncome ? 'badge-success' : 'badge-danger'}">
                                                            <i class="fas ${isIncome ? 'fa-arrow-down' : 'fa-arrow-up'}"></i> ${t.transaction_type}
                                                        </span>
                                                    </td>
                                                    <td><strong>${escapeHtml(t.category)}</strong></td>
                                                    <td>${escapeHtml(t.description || '—')}</td>
                                                    <td class="${isIncome ? 'text-accent-success' : 'text-accent-danger'}">
                                                        <strong>${isIncome ? '+' : '-'}${formatCurrency(t.amount, t.currency)}</strong>
                                                    </td>
                                                    <td>
                                                        <button class="btn btn-ghost btn-xs text-danger" onclick="Finance.deleteTransaction('${t.id}')">
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
                            <div class="empty-state"><p>No transactions recorded yet.</p></div>
                        `}
                    </div>
                </div>
            `;

            this.renderCharts(summary);

        } catch (err) {
            console.error('Failed to load finance module:', err);
            content.innerHTML = `<div class="card error-card"><p>Failed to load finance data: ${err.message}</p></div>`;
        }
    }

    static renderCharts(summary) {
        const isLight = document.body.classList.contains('light-mode');
        const textColor = isLight ? '#2d3436' : '#e0e0f0';

        // 1. Doughnut chart
        const catCtx = document.getElementById('financeCategoryFullChart');
        if (catCtx) {
            if (this.chartInstances['finCat']) this.chartInstances['finCat'].destroy();

            const cats = Object.keys(summary.expense_by_category || {});
            const vals = Object.values(summary.expense_by_category || {});
            if (cats.length === 0) { cats.push('No Expenses'); vals.push(1); }

            const colors = ['#6c5ce7', '#00cec9', '#00b894', '#fdcb6e', '#e17055', '#74b9ff', '#d63031', '#e84393'];

            this.chartInstances['finCat'] = new Chart(catCtx, {
                type: 'doughnut',
                data: {
                    labels: cats,
                    datasets: [{
                        data: vals,
                        backgroundColor: colors.slice(0, cats.length),
                        borderColor: isLight ? '#ffffff' : '#1a1a2e',
                        borderWidth: 2,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { color: textColor, boxWidth: 12 } } }
                }
            });
        }

        // 2. Bar balance chart
        const balCtx = document.getElementById('financeBalanceChart');
        if (balCtx) {
            if (this.chartInstances['finBal']) this.chartInstances['finBal'].destroy();

            const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';

            this.chartInstances['finBal'] = new Chart(balCtx, {
                type: 'bar',
                data: {
                    labels: ['Income', 'Expenses', 'Net Savings'],
                    datasets: [{
                        label: 'Amount (' + (summary.currency || 'NPR') + ')',
                        data: [summary.total_income, summary.total_expense, summary.net_savings],
                        backgroundColor: ['#00b894', '#e17055', '#6c5ce7'],
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

    static openTransactionModal(defaultType = 'expense') {
        const modalTitle = document.getElementById('detail-modal-title');
        const modalBody = document.getElementById('detail-modal-body');
        if (!modalBody) return;

        const today = new Date().toISOString().split('T')[0];
        const defaultCurrency = window.pisUser?.currency || 'NPR';

        modalTitle.textContent = defaultType === 'income' ? 'Record Income' : 'Record Expense';
        modalBody.innerHTML = `
            <form onsubmit="Finance.handleCreateTransaction(event)">
                <div class="form-row">
                    <div class="form-group col-6">
                        <label>Transaction Type *</label>
                        <select id="tx-type" class="form-select" required>
                            <option value="expense" ${defaultType === 'expense' ? 'selected' : ''}>Expense</option>
                            <option value="income" ${defaultType === 'income' ? 'selected' : ''}>Income</option>
                        </select>
                    </div>
                    <div class="form-group col-6">
                        <label>Date *</label>
                        <input type="date" id="tx-date" class="form-input" required value="${today}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group col-6">
                        <label>Amount *</label>
                        <input type="number" id="tx-amount" class="form-input" required min="0.01" step="0.01" placeholder="0.00">
                    </div>
                    <div class="form-group col-6">
                        <label>Currency</label>
                        <input type="text" id="tx-currency" class="form-input" value="${defaultCurrency}">
                    </div>
                </div>

                <div class="form-group">
                    <label>Category *</label>
                    <input type="text" id="tx-category" class="form-input" required placeholder="e.g. Food, Books, Rent, Salary, Freelance">
                </div>

                <div class="form-group">
                    <label>Description</label>
                    <input type="text" id="tx-desc" class="form-input" placeholder="e.g. Machine learning textbook">
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-ghost" onclick="hideModal('detail-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Transaction</button>
                </div>
            </form>
        `;
        showModal('detail-modal');
    }

    static async handleCreateTransaction(e) {
        e.preventDefault();
        const transaction_type = document.getElementById('tx-type')?.value;
        const date = document.getElementById('tx-date')?.value;
        const amount = parseFloat(document.getElementById('tx-amount')?.value);
        const currency = document.getElementById('tx-currency')?.value.trim() || 'NPR';
        const category = document.getElementById('tx-category')?.value.trim();
        const description = document.getElementById('tx-desc')?.value.trim();

        try {
            await api.post('/finance/transactions', {
                transaction_type, date, amount, currency, category, description
            });
            hideModal('detail-modal');
            showToast('Transaction saved successfully!', 'success');
            this.render();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    static async deleteTransaction(id) {
        confirmDialog('Delete this transaction?', async () => {
            try {
                await api.delete(`/finance/transactions/${id}`);
                showToast('Transaction deleted', 'info');
                Finance.render();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    static openBudgetModal() {
        const modalTitle = document.getElementById('detail-modal-title');
        const modalBody = document.getElementById('detail-modal-body');
        if (!modalBody) return;

        const now = new Date();

        modalTitle.textContent = 'Set Monthly Category Budget';
        modalBody.innerHTML = `
            <form onsubmit="Finance.handleCreateBudget(event)">
                <div class="form-group">
                    <label>Category Name *</label>
                    <input type="text" id="bg-cat" class="form-input" required placeholder="e.g. Groceries, Entertainment, Education">
                </div>
                <div class="form-group">
                    <label>Budget Limit (${window.pisUser?.currency || 'NPR'}) *</label>
                    <input type="number" id="bg-amount" class="form-input" required min="1" step="10" placeholder="e.g. 5000">
                </div>
                <div class="form-row">
                    <div class="form-group col-6">
                        <label>Month (1-12)</label>
                        <input type="number" id="bg-month" class="form-input" required min="1" max="12" value="${now.getMonth() + 1}">
                    </div>
                    <div class="form-group col-6">
                        <label>Year</label>
                        <input type="number" id="bg-year" class="form-input" required min="2020" max="2050" value="${now.getFullYear()}">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-ghost" onclick="hideModal('detail-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Budget</button>
                </div>
            </form>
        `;
        showModal('detail-modal');
    }

    static async handleCreateBudget(e) {
        e.preventDefault();
        const category = document.getElementById('bg-cat')?.value.trim();
        const amount = parseFloat(document.getElementById('bg-amount')?.value);
        const month = parseInt(document.getElementById('bg-month')?.value, 10);
        const year = parseInt(document.getElementById('bg-year')?.value, 10);

        try {
            await api.post('/finance/budgets', { category, amount, month, year });
            hideModal('detail-modal');
            showToast('Budget configured!', 'success');
            this.render();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
}
