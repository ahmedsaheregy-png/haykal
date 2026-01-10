/**
 * Funding Rounds Calculator
 * حاسبة جولات التمويل الاستثمارية
 */

class FundingCalculator {
    constructor() {
        this.rounds = [];
        this.roundCounter = 0;
        this.initialShares = 1000000;
        this.initialPrice = 0.05;
        this.projectName = "هيكل ملكية البنك"; // Default name
        this.projectId = this.getProjectIdFromUrl();
        this.projectsListKey = 'funding_app_projects_list';

        this.init();
    }

    init() {
        // Setup Event Listeners
        document.getElementById('initialShares').addEventListener('input', () => { this.updateInitial(); this.saveState(); });
        document.getElementById('initialPrice').addEventListener('input', () => { this.updateInitial(); this.saveState(); });
        document.getElementById('addRoundBtn').addEventListener('click', () => { this.addRound(); this.saveState(); });

        // Project Management UI interaction
        this.setupProjectUI();

        // Load specific project data or initialize defaults
        this.loadState();

        // --- ADMIN CHECK ---
        this.checkAccessMode();
    }

    getProjectIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('project');
    }

    setupProjectUI() {
        // Create Project Controls if they don't exist
        if (!document.getElementById('projectControls')) {
            const header = document.querySelector('header');
            const controls = document.createElement('div');
            controls.id = 'projectControls';
            controls.className = 'project-controls';
            controls.innerHTML = `
                <div class="project-info">
                    <input type="text" id="projectNameInput" class="project-name-input" value="${this.projectName}" placeholder="اسم المشروع">
                    <button id="saveProjectsMenuBtn" class="btn-secondary"><i class="fa-solid fa-folder-open"></i> مشاريعي</button>
                    <button id="newProjectBtn" class="btn-primary"><i class="fa-solid fa-plus"></i> مشروع جديد</button>
                </div>
                <div id="projectsDropdown" class="projects-dropdown" style="display: none;">
                    <h4>المشاريع المحفوظة</h4>
                    <ul id="projectsList"></ul>
                </div>
            `;
            header.appendChild(controls);

            // Add Styles for controls dynamically
            const style = document.createElement('style');
            style.textContent = `
                .project-controls { display: flex; align-items: center; gap: 1rem; position: relative; }
                .project-name-input { background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); padding: 0.5rem; border-radius: 8px; font-family: 'Tajawal'; width: 200px; }
                .project-name-input:focus { border-color: var(--accent-gold); outline: none; }
                .btn-primary, .btn-secondary { padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-family: 'Tajawal'; font-weight: 600; border: none; display: flex; align-items: center; gap: 5px; }
                .btn-primary { background: var(--accent-gold); color: #000; }
                .btn-secondary { background: var(--card-bg); color: var(--text-primary); border: 1px solid var(--border-color); }
                .projects-dropdown { position: absolute; top: 100%; right: 0; background: var(--card-bg); border: 1px solid var(--border-color); padding: 1rem; border-radius: 12px; width: 300px; z-index: 1000; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
                .projects-dropdown h4 { margin-bottom: 0.5rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }
                .projects-dropdown ul { list-style: none; padding: 0; max-height: 300px; overflow-y: auto; }
                .projects-dropdown li { padding: 0.8rem; border-bottom: 1px solid var(--border-color); cursor: pointer; transition: 0.2s; display: flex; justify-content: space-between; align-items: center; }
                .projects-dropdown li:hover { background: rgba(255,255,255,0.05); }
                .projects-dropdown li a { color: var(--text-primary); text-decoration: none; flex: 1; }
                .delete-project { color: var(--accent-color); cursor: pointer; padding: 5px; }
            `;
            document.head.appendChild(style);
        }

        // Listeners for new controls
        document.getElementById('projectNameInput').addEventListener('input', (e) => {
            this.projectName = e.target.value;
            document.title = this.projectName;
            this.saveState();
        });

        document.getElementById('newProjectBtn').addEventListener('click', () => {
            this.createNewProject();
        });

        document.getElementById('saveProjectsMenuBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleProjectsMenu();
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#projectControls')) {
                document.getElementById('projectsDropdown').style.display = 'none';
            }
        });
    }

    createNewProject() {
        const newId = 'proj_' + Date.now();
        const newUrl = `${window.location.pathname}?project=${newId}`;
        window.open(newUrl, '_blank');
    }

    toggleProjectsMenu() {
        const menu = document.getElementById('projectsDropdown');
        const list = document.getElementById('projectsList');

        if (menu.style.display === 'none') {
            // Load list
            const projects = this.getAllProjects();
            list.innerHTML = '';

            if (projects.length === 0) {
                list.innerHTML = '<li style="color: var(--text-secondary); text-align: center;">لا توجد مشاريع محفوظة</li>';
            } else {
                projects.forEach(p => {
                    const li = document.createElement('li');
                    const isCurrent = p.id === this.projectId;
                    li.innerHTML = `
                        <a href="?project=${p.id}" style="${isCurrent ? 'color: var(--accent-gold); font-weight: bold;' : ''}">
                            ${p.name} <br> <span style="font-size: 0.7rem; color: var(--text-secondary);">${new Date(parseInt(p.id.split('_')[1] || Date.now())).toLocaleDateString('ar-EG')}</span>
                        </a>
                        ${!isCurrent ? `<i class="fa-solid fa-trash delete-project" data-id="${p.id}"></i>` : ''}
                    `;
                    list.appendChild(li);
                });

                // Add delete listeners
                list.querySelectorAll('.delete-project').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (confirm('هل أنت متأكد من حذف هذا المشروع؟')) {
                            this.deleteProject(btn.dataset.id);
                            this.toggleProjectsMenu(); // Refresh
                        }
                    });
                });
            }
            menu.style.display = 'block';
        } else {
            menu.style.display = 'none';
        }
    }

    getAllProjects() {
        try {
            return JSON.parse(localStorage.getItem(this.projectsListKey)) || [];
        } catch (e) {
            return [];
        }
    }

    deleteProject(id) {
        let projects = this.getAllProjects();
        projects = projects.filter(p => p.id !== id);
        localStorage.setItem(this.projectsListKey, JSON.stringify(projects));
        localStorage.removeItem(`funding_data_${id}`);
    }

    saveState() {
        // Generate ID if not exists (for first save of default project)
        if (!this.projectId) {
            this.projectId = 'proj_' + Date.now();
            // Update URL without reload
            const newUrl = `${window.location.pathname}?project=${this.projectId}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
        }

        const state = {
            id: this.projectId,
            name: this.projectName,
            initialShares: this.initialShares,
            initialPrice: this.initialPrice,
            rounds: this.rounds,
            roundCounter: this.roundCounter,
            lastModified: Date.now()
        };

        // Save specific Project Data
        localStorage.setItem(`funding_data_${this.projectId}`, JSON.stringify(state));

        // Update Project List Index
        let projects = this.getAllProjects();
        const existingIndex = projects.findIndex(p => p.id === this.projectId);
        if (existingIndex >= 0) {
            projects[existingIndex].name = this.projectName;
            projects[existingIndex].lastModified = state.lastModified;
        } else {
            projects.push({ id: this.projectId, name: this.projectName, lastModified: state.lastModified });
        }
        localStorage.setItem(this.projectsListKey, JSON.stringify(projects));
    }

    loadState() {
        if (this.projectId) {
            // Try loading specific project
            const savedData = localStorage.getItem(`funding_data_${this.projectId}`);
            if (savedData) {
                const state = JSON.parse(savedData);
                this.projectName = state.name || "مشروع بدون اسم";
                this.initialShares = state.initialShares;
                this.initialPrice = state.initialPrice;
                this.rounds = state.rounds || [];
                this.roundCounter = state.roundCounter || 0;

                // Update UI
                document.getElementById('projectNameInput').value = this.projectName;
                document.title = this.projectName;
                document.getElementById('initialShares').value = this.initialShares;
                document.getElementById('initialPrice').value = this.initialPrice;

                // Clear and Re-render
                document.getElementById('roundsContainer').innerHTML = '';
                this.rounds.forEach(round => this.renderRound(round)); // Just render, don't re-add to array

                // Recalc
                this.updateInitial(); // triggers recalculateAll
                return;
            }
        }

        // Fallback: New Project / No Data found
        // Use Defaults or user's requested "Bank Structure" title
        this.projectName = "هيكل ملكية البنك";
        document.getElementById('projectNameInput').value = this.projectName;
        this.updateInitial();

        // Populate Default Data from User's Request
        if (this.rounds.length === 0) {
            this.addRoundWithData("الجولة 1 تأسيس pre-seed", 60000, 5);
            // this.addRoundWithData("الجولة 2 الافتتاح SERIES A", 100000, 8);
            this.roundCounter++; // Skip Round 2 (ID 2) to replicate numbering jump
            this.addRoundWithData("الجولة 3 التعادل SERIES B", 400000, 12);
            this.addRoundWithData("الجولة 4 EMI SERIES C", 5000000, 10);
            this.addRoundWithData("الجولة 5 التوسع الدولي", 20000000, 15);
        }

        this.saveState(); // Save immediately to create the record
    }

    // Helper to add specific round data
    addRoundWithData(name, funding, percentage) {
        this.roundCounter++;
        const roundId = this.roundCounter;

        const roundData = {
            id: roundId,
            name: name,
            fundingAmount: funding,
            soldPercentage: percentage,
            preValuation: 0,
            postValuation: 0,
            stockPrice: 0,
            roundShares: 0,
            totalShares: 0,
            profitMultiplier: 0
        };

        this.rounds.push(roundData);
        this.renderRound(roundData);
        this.recalculateAll();
    }

    // --- Original Logic Methods (Optimized) ---

    updateInitial() {
        this.initialShares = parseInt(document.getElementById('initialShares').value) || 1000000;
        this.initialPrice = parseFloat(document.getElementById('initialPrice').value) || 0.05;

        const initialValuation = this.initialShares * this.initialPrice;
        document.getElementById('initialValuation').textContent = this.formatCurrency(initialValuation);

        this.recalculateAll();
    }

    addRound() {
        this.roundCounter++;
        const roundId = this.roundCounter;

        const roundData = {
            id: roundId,
            name: this.getDefaultRoundName(roundId),
            fundingAmount: 100000,
            soldPercentage: 10,
            preValuation: 0,
            postValuation: 0,
            stockPrice: 0,
            roundShares: 0,
            totalShares: 0,
            profitMultiplier: 0
        };

        this.rounds.push(roundData);
        this.renderRound(roundData);
        this.recalculateAll();
    }

    getDefaultRoundName(id) {
        const names = ['التأسيس', 'Series A', 'Series B', 'Series C', 'Series D', 'Series E', 'اكتتاب عام'];
        return names[id - 1] || `جولة ${id}`;
    }

    renderRound(roundData) {
        const container = document.getElementById('roundsContainer');
        const roundCard = document.createElement('div');
        roundCard.className = 'round-card';
        roundCard.id = `round-${roundData.id}`;

        roundCard.innerHTML = `
            <div class="round-header">
                <div class="round-title">
                    <div class="round-number">${roundData.id}</div>
                    <input type="text" class="round-name-input" 
                           value="${roundData.name}" 
                           data-round-id="${roundData.id}"
                           placeholder="اسم الجولة">
                </div>
                <button class="btn-delete-round" data-round-id="${roundData.id}" title="حذف الجولة">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            <div class="round-body">
                <div class="round-inputs">
                    <div class="input-group">
                        <label>مبلغ التمويل ($)</label>
                        <input type="number" class="funding-amount" 
                               data-round-id="${roundData.id}"
                               value="${roundData.fundingAmount}" 
                               min="0" step="1000">
                    </div>
                    <div class="input-group">
                        <label>الحصة المباعة (%)</label>
                        <input type="number" class="sold-percentage" 
                               data-round-id="${roundData.id}"
                               value="${roundData.soldPercentage}" 
                               min="0.1" max="100" step="0.1">
                    </div>
                </div>
                <div class="round-outputs">
                    <div class="output-item">
                        <div class="output-label">التقييم قبل</div>
                        <div class="output-value" id="preVal-${roundData.id}">-</div>
                    </div>
                    <div class="output-item">
                        <div class="output-label">التقييم بعد</div>
                        <div class="output-value highlight" id="postVal-${roundData.id}">-</div>
                    </div>
                    <div class="output-item">
                        <div class="output-label">سعر السهم</div>
                        <div class="output-value" id="stockPrice-${roundData.id}">-</div>
                    </div>
                    <div class="output-item">
                        <div class="output-label">مضاعف الربح</div>
                        <div class="output-value multiplier" id="multiplier-${roundData.id}">-</div>
                    </div>
                    <div class="output-item">
                        <div class="output-label">أسهم الجولة</div>
                        <div class="output-value" id="roundShares-${roundData.id}">-</div>
                    </div>
                    <div class="output-item">
                        <div class="output-label">إجمالي الأسهم</div>
                        <div class="output-value highlight" id="totalShares-${roundData.id}">-</div>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(roundCard);
        this.attachRoundListeners(roundCard, roundData);

        // Apply read-mode if necessary
        if (this.isReadOnly) {
            this.setReadOnlyMode(true);
        }
    }

    attachRoundListeners(card, roundData) {
        card.querySelector('.round-name-input').addEventListener('input', (e) => {
            const round = this.rounds.find(r => r.id === roundData.id);
            if (round) { round.name = e.target.value; this.saveState(); }
            this.updateResultsTables();
        });

        card.querySelector('.funding-amount').addEventListener('input', (e) => {
            const round = this.rounds.find(r => r.id === roundData.id);
            if (round) { round.fundingAmount = parseFloat(e.target.value) || 0; this.saveState(); }
            this.recalculateAll();
        });

        card.querySelector('.sold-percentage').addEventListener('input', (e) => {
            const round = this.rounds.find(r => r.id === roundData.id);
            if (round) { round.soldPercentage = parseFloat(e.target.value) || 0; this.saveState(); }
            this.recalculateAll();
        });

        card.querySelector('.btn-delete-round').addEventListener('click', () => {
            this.deleteRound(roundData.id);
        });
    }

    deleteRound(id) {
        if (this.rounds.length <= 1) {
            alert('يجب أن تكون هناك جولة واحدة على الأقل');
            return;
        }
        this.rounds = this.rounds.filter(r => r.id !== id);
        document.getElementById(`round-${id}`).remove();
        this.saveState();
        this.recalculateAll();
    }

    recalculateAll() {
        let previousTotalShares = this.initialShares;
        let previousStockPrice = this.initialPrice;

        this.rounds.forEach((round) => {
            // Calculations
            if (round.soldPercentage > 0) {
                round.postValuation = round.fundingAmount / (round.soldPercentage / 100);
            } else {
                round.postValuation = 0;
            }

            round.preValuation = round.postValuation - round.fundingAmount;

            if (round.soldPercentage < 100) {
                round.totalShares = Math.round(previousTotalShares / (1 - round.soldPercentage / 100));
            } else {
                round.totalShares = previousTotalShares;
            }

            round.roundShares = round.totalShares - previousTotalShares;

            if (round.totalShares > 0) {
                round.stockPrice = round.postValuation / round.totalShares;
            } else {
                round.stockPrice = 0;
            }

            if (previousStockPrice > 0) {
                round.profitMultiplier = round.stockPrice / previousStockPrice;
            } else {
                round.profitMultiplier = 0;
            }

            // Update UI
            this.updateRoundUI(round);
            previousTotalShares = round.totalShares;
            previousStockPrice = round.stockPrice;
        });

        this.updateResultsTables();
    }

    updateRoundUI(round) {
        const el = (id) => document.getElementById(id);
        if (el(`preVal-${round.id}`)) el(`preVal-${round.id}`).textContent = this.formatCurrency(round.preValuation);
        if (el(`postVal-${round.id}`)) el(`postVal-${round.id}`).textContent = this.formatCurrency(round.postValuation);
        if (el(`stockPrice-${round.id}`)) el(`stockPrice-${round.id}`).textContent = this.formatCurrency(round.stockPrice, 4);
        if (el(`multiplier-${round.id}`)) el(`multiplier-${round.id}`).textContent = round.profitMultiplier.toFixed(1) + 'x';
        if (el(`roundShares-${round.id}`)) el(`roundShares-${round.id}`).textContent = this.formatNumber(round.roundShares);
        if (el(`totalShares-${round.id}`)) el(`totalShares-${round.id}`).textContent = this.formatNumber(round.totalShares);
    }

    updateResultsTables() {
        document.getElementById('resultsSection').style.display = 'block';
        const tbody = document.getElementById('resultsBody');
        tbody.innerHTML = '';

        this.rounds.forEach(round => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${round.name}</strong></td>
                <td>${this.formatCurrency(round.fundingAmount)}</td>
                <td>${round.soldPercentage.toFixed(2)}%</td>
                <td>${this.formatCurrency(round.preValuation)}</td>
                <td>${this.formatCurrency(round.postValuation)}</td>
                <td>${this.formatCurrency(round.stockPrice, 4)}</td>
                <td>${round.profitMultiplier.toFixed(1)}x</td>
                <td>${this.formatNumber(round.roundShares)}</td>
                <td>${this.formatNumber(round.totalShares)}</td>
            `;
            tbody.appendChild(row);
        });

        this.updateOwnershipTable();
    }

    updateOwnershipTable() {
        const tbody = document.getElementById('ownershipBody');
        tbody.innerHTML = '';
        if (this.rounds.length === 0) return;

        const lastRound = this.rounds[this.rounds.length - 1];
        const currentValuation = lastRound.postValuation;
        const currentTotalShares = lastRound.totalShares;
        let foundersPaid = this.initialShares * this.initialPrice;
        const foundersShares = this.initialShares;

        const foundersPercentage = (foundersShares / currentTotalShares) * 100;
        const foundersValue = (foundersPercentage / 100) * currentValuation;
        const foundersProfit = foundersValue - foundersPaid;

        const foundersRow = document.createElement('tr');
        foundersRow.innerHTML = `
            <td><strong>المؤسسون</strong></td>
            <td>${this.formatCurrency(foundersPaid)}</td>
            <td>${this.formatNumber(foundersShares)}</td>
            <td>${foundersPercentage.toFixed(2)}%</td>
            <td>${this.formatCurrency(foundersValue)}</td>
            <td class="${foundersProfit >= 0 ? 'positive' : 'negative'}">${this.formatCurrency(foundersProfit)}</td>
        `;
        tbody.appendChild(foundersRow);

        this.rounds.forEach(round => {
            const investorShares = round.roundShares;
            const investorPaid = round.fundingAmount;
            const investorPercentage = (investorShares / currentTotalShares) * 100;
            const investorValue = (investorPercentage / 100) * currentValuation;
            const investorProfit = investorValue - investorPaid;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${round.name}</strong></td>
                <td>${this.formatCurrency(investorPaid)}</td>
                <td>${this.formatNumber(investorShares)}</td>
                <td>${investorPercentage.toFixed(2)}%</td>
                <td>${this.formatCurrency(investorValue)}</td>
                <td class="${investorProfit >= 0 ? 'positive' : 'negative'}">${this.formatCurrency(investorProfit)}</td>
            `;
            tbody.appendChild(row);
        });

        // Totals
        const totalPaid = foundersPaid + this.rounds.reduce((sum, round) => sum + round.fundingAmount, 0);
        const totalShares = foundersShares + this.rounds.reduce((sum, round) => sum + round.roundShares, 0);
        const totalPercentage = 100;
        const totalValue = currentValuation;
        const totalProfit = totalValue - totalPaid;

        const totalRow = document.createElement('tr');
        totalRow.className = 'total-row';
        totalRow.innerHTML = `
            <td><strong>الإجمالي</strong></td>
            <td>${this.formatCurrency(totalPaid)}</td>
            <td>${this.formatNumber(totalShares)}</td>
            <td>${totalPercentage.toFixed(2)}%</td>
            <td>${this.formatCurrency(totalValue)}</td>
            <td class="${totalProfit >= 0 ? 'positive' : 'negative'}">${this.formatCurrency(totalProfit)}</td>
        `;
        tbody.appendChild(totalRow);
    }

    formatCurrency(value, decimals = 0) {
        if (!value && value !== 0) return '-';
        if (value >= 1000000000) return '$' + (value / 1000000000).toFixed(2) + 'B';
        if (value >= 1000000) return '$' + (value / 1000000).toFixed(2) + 'M';
        if (value >= 1000) return '$' + (value / 1000).toFixed(decimals > 0 ? decimals : 0) + 'K';
        return '$' + value.toFixed(decimals);
    }

    formatNumber(value) {
        return new Intl.NumberFormat('en-US').format(Math.round(value));
    }

    // --- Read-Only / Admin Protection Logic ---
    checkAccessMode() {
        // Check if user has "admin" access stored
        const isAdmin = localStorage.getItem('haykal_admin_access') === 'true';

        if (!isAdmin) {
            this.setReadOnlyMode(true);
        } else {
            this.setReadOnlyMode(false); // Enable editing
        }

        this.setupHiddenAdminTrigger();
    }

    setReadOnlyMode(isReadOnly) {
        this.isReadOnly = isReadOnly;

        // 1. Inputs
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            if (isReadOnly) {
                input.setAttribute('disabled', 'true');
                input.style.backgroundColor = 'transparent';
                input.style.border = 'none';
                input.style.color = '#fff'; // Make it look like text
            } else {
                input.removeAttribute('disabled');
                input.style.backgroundColor = ''; // Reset
                input.style.border = '';
            }
        });

        // 2. Buttons (Add Round, Delete Round, New Project, My Projects)
        const buttonsToHide = [
            'addRoundBtn',
            'newProjectBtn',
            'saveProjectsMenuBtn'
        ];

        buttonsToHide.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.style.display = isReadOnly ? 'none' : '';
        });

        // Delete buttons (class based)
        const deleteBtns = document.querySelectorAll('.btn-delete-round');
        deleteBtns.forEach(btn => {
            btn.style.display = isReadOnly ? 'none' : '';
        });

        // Project Name Input specific styling
        const projInput = document.getElementById('projectNameInput');
        if (projInput) {
            if (isReadOnly) {
                projInput.style.pointerEvents = 'none';
                projInput.style.border = 'none';
            } else {
                projInput.style.pointerEvents = 'all';
                projInput.style.border = '';
            }
        }
    }

    setupHiddenAdminTrigger() {
        // Hidden Trigger: Double Click on the Footer Logo text
        const footerLogo = document.querySelector('footer');
        if (footerLogo) {
            footerLogo.title = ""; // No hint

            footerLogo.addEventListener('dblclick', () => {
                if (this.isReadOnly) {
                    const password = prompt("🔐 Admin Access Required\nEnter Password:");
                    if (password === "123456") { // Updated password
                        localStorage.setItem('haykal_admin_access', 'true');
                        alert("✅ Edit Mode Unlocked!");
                        location.reload();
                    } else if (password) {
                        alert("❌ Wrong Password");
                    }
                } else {
                    // Option to lock it back
                    if (confirm("Lock Editing Mode?")) {
                        localStorage.removeItem('haykal_admin_access');
                        location.reload();
                    }
                }
            });
        }
    }
}

// Initialize calculator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.calculator = new FundingCalculator();
});
