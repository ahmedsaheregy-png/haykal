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

        // Undo/Redo stacks
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistorySize = 50;

        this.init();
    }

    init() {
        // Setup Event Listeners
        document.getElementById('initialShares').addEventListener('input', () => { this.updateInitial(); this.saveState(); });
        document.getElementById('initialPrice').addEventListener('input', () => { this.updateInitial(); this.saveState(); });
        document.getElementById('addRoundBtn').addEventListener('click', () => { this.addRound(); this.saveState(); });

        // Project Management UI interaction
        this.setupProjectUI();

        // 1. Check URL for project ID
        const urlParams = new URLSearchParams(window.location.search);
        this.projectId = urlParams.get('project');

        // 2. If no ID in URL, try to load the LAST edited project
        if (!this.projectId) {
            const projects = this.getAllProjects();
            if (projects.length > 0) {
                // Sort by lastModified descending to get the most recent one
                projects.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
                this.projectId = projects[0].id;

                // Update URL to reflect this project without reloading
                const newUrl = `${window.location.pathname}?project=${this.projectId}`;
                window.history.replaceState({ path: newUrl }, '', newUrl);
            }
        }

        // 3. Load state or initialize default
        if (this.projectId) {
            this.loadState();
        } else {
            // New visitor or really no projects
            this.initializeDefaultData();
            this.saveState();
        }

        // --- ADMIN CHECK ---
        this.checkAccessMode();

        // --- INVESTOR JOURNEY ---
        this.initInvestorJourney();

        // --- UNDO/REDO KEYBOARD SHORTCUTS ---
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                this.undo();
            } else if (e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                this.redo();
            }
        });
    }

    getProjectIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('project');
    }

    setupProjectUI() {
        // Listeners for existing controls
        const nameInput = document.getElementById('projectNameInput');
        if (nameInput) {
            nameInput.value = this.projectName || '';
            nameInput.addEventListener('input', (e) => {
                this.projectName = e.target.value;
                document.title = this.projectName || 'حاسبة جولات التمويل';
                this.saveState();
            });
        }

        document.getElementById('newProjectBtn').addEventListener('click', () => {
            this.createNewProject();
        });

        document.getElementById('saveProjectsMenuBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleProjectsMenu();
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#projectsDropdown') && !e.target.closest('#saveProjectsMenuBtn')) {
                const dropdown = document.getElementById('projectsDropdown');
                if (dropdown) dropdown.style.display = 'none';
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
                // Add Cleanup Button
                const cleanupBtn = document.createElement('li');
                cleanupBtn.innerHTML = '<button id="cleanupProjectsBtn" style="width:100%; padding:5px; background:rgba(233,69,96,0.2); color:var(--accent-color); border:none; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-broom"></i> تنظيف المشاريع الفارغة</button>';
                cleanupBtn.style.textAlign = 'center';
                cleanupBtn.style.marginBottom = '10px';
                list.appendChild(cleanupBtn);

                // Add Cleanup Listener
                setTimeout(() => {
                    const btn = document.getElementById('cleanupProjectsBtn');
                    if (btn) btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.cleanupEmptyProjects();
                    });
                }, 0);

                projects.forEach(p => {
                    const li = document.createElement('li');
                    const isCurrent = p.id === this.projectId;
                    li.innerHTML = `
                        <a href="?project=${p.id}" class="project-link ${isCurrent ? 'active-project' : ''}" onclick="${isCurrent ? 'location.reload()' : ''}">
                            <span class="project-name">${p.name}</span>
                            <span class="project-date">${new Date(parseInt(p.id.split('_')[1] || Date.now())).toLocaleDateString('ar-EG')}, ${new Date(p.lastModified || parseInt(p.id.split('_')[1] || Date.now())).toLocaleTimeString('ar-EG')}</span>
                        </a>
                        ${!isCurrent ? `<i class="fa-solid fa-trash delete-project" data-id="${p.id}" title="حذف"></i>` : '<i class="fa-solid fa-circle-check current-indicator" title="المشروع الحالي"></i>'}
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
            lastModified: Date.now(),
            // حفظ بيانات مراحل النمو
            phases: this.phases,
            distributionRate: parseFloat(document.getElementById('distributionRate')?.value) || 30,
            currentPhase: this.currentPhase
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

        this.showSaveIndicator();
        this.updateHeaderProjectName();
    }

    showSaveIndicator() {
        let indicator = document.getElementById('saveIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'saveIndicator';
            indicator.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: rgba(46, 204, 113, 0.9);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 0.9rem;
                opacity: 0;
                transition: opacity 0.3s;
                z-index: 1000;
                pointer-events: none;
            `;
            indicator.innerHTML = '<i class="fa-solid fa-check"></i> تم الحفظ';
            document.body.appendChild(indicator);
        }

        // Flash the indicator
        indicator.style.opacity = '1';
        setTimeout(() => {
            indicator.style.opacity = '0';
        }, 1500);
    }

    updateHeaderProjectName() {
        const input = document.getElementById('projectNameInput');
        if (input) {
            input.value = this.projectName || '';
            document.title = this.projectName || 'حاسبة جولات التمويل';
        }
    }

    cleanupEmptyProjects() {
        if (!confirm('هل تريد حذف جميع المشاريع الفارغة أو غير المسماة (Default Project)؟\nلن يتم حذف المشروع الحالي.')) return;

        let projects = this.getAllProjects();
        const initialCount = projects.length;

        projects = projects.filter(p => {
            // Keep current project
            if (p.id === this.projectId) return true;

            // Filter out "Default Project" or those older than 24h with no custom name
            if (p.name === 'Default Project') return false;

            return true;
        });

        const deletedCount = initialCount - projects.length;
        localStorage.setItem(this.projectsListKey, JSON.stringify(projects));

        // Also clean up data keys for deleted
        // (Advanced cleanup would loop all localStorage keys, but this is safer for now)

        alert(`تم تنظيف ${deletedCount} مشاريع فارغة.`);
        this.toggleProjectsMenu(); // Refresh menu
    }

    // --- UNDO/REDO METHODS ---

    pushToUndoStack() {
        // Deep copy of current state
        const snapshot = JSON.stringify({
            rounds: this.rounds,
            roundCounter: this.roundCounter
        });

        this.undoStack.push(snapshot);

        // Limit stack size
        if (this.undoStack.length > this.maxHistorySize) {
            this.undoStack.shift();
        }

        // Clear redo stack on new action
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length === 0) {
            console.log('Nothing to undo');
            return;
        }

        // Save current state to redo stack
        const currentSnapshot = JSON.stringify({
            rounds: this.rounds,
            roundCounter: this.roundCounter
        });
        this.redoStack.push(currentSnapshot);

        // Restore previous state
        const previousSnapshot = JSON.parse(this.undoStack.pop());
        this.rounds = previousSnapshot.rounds;
        this.roundCounter = previousSnapshot.roundCounter;

        // Re-render UI
        this.reRenderAllRounds();
        this.recalculateAll();
        this.saveState();

        console.log('Undo performed');
    }

    redo() {
        if (this.redoStack.length === 0) {
            console.log('Nothing to redo');
            return;
        }

        // Save current state to undo stack
        const currentSnapshot = JSON.stringify({
            rounds: this.rounds,
            roundCounter: this.roundCounter
        });
        this.undoStack.push(currentSnapshot);

        // Restore next state
        const nextSnapshot = JSON.parse(this.redoStack.pop());
        this.rounds = nextSnapshot.rounds;
        this.roundCounter = nextSnapshot.roundCounter;

        // Re-render UI
        this.reRenderAllRounds();
        this.recalculateAll();
        this.saveState();

        console.log('Redo performed');
    }

    reRenderAllRounds() {
        // Clear existing round cards
        const container = document.getElementById('roundsContainer');
        container.innerHTML = '';

        // Re-render all rounds
        this.rounds.forEach(roundData => {
            this.renderRound(roundData);
        });
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

                // استعادة بيانات مراحل النمو المحفوظة
                if (state.phases) {
                    this.savedPhases = state.phases;
                }
                if (state.distributionRate !== undefined) {
                    this.savedDistributionRate = state.distributionRate;
                }
                if (state.currentPhase) {
                    this.savedCurrentPhase = state.currentPhase;
                }

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
            this.addRoundWithData("الجولة 1 تأسيس pre-seed", 60000, 5, "");
            this.addRoundWithData("الجولة 2 الافتتاح SERIES A", 100000, 8, "الشهر 1");
            this.addRoundWithData("الجولة 3 التعادل SERIES B", 400000, 12, "الشهر 11");
            this.addRoundWithData("الجولة 4 EMI SERIES C", 5000000, 10, "الشهر 12");
            this.addRoundWithData("الجولة 5 التوسع الدولي", 20000000, 15, "الشهر 36");
        }

        this.saveState(); // Save immediately to create the record
    }

    // Helper to add specific round data
    addRoundWithData(name, funding, percentage, timing = '') {
        this.roundCounter++;
        const roundId = this.roundCounter;

        const roundData = {
            id: roundId,
            name: name,
            fundingAmount: funding,
            soldPercentage: percentage,
            timing: timing,
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
            timing: '',
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
                    <div class="input-group">
                    <label>التوقيت (شهر رقم)</label>
                    <input type="text" class="round-timing" 
                           data-round-id="${roundData.id}"
                           value="${roundData.timing || ''}" 
                           placeholder="مثال: 12">
                </div>
                <div class="input-group">
                    <label>ملاحظات</label>
                    <input type="text" class="round-notes" 
                           data-round-id="${roundData.id}"
                           value="${roundData.notes || ''}" 
                           placeholder="مثال: قبل الافتتاح">
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

        card.querySelector('.round-timing').addEventListener('input', (e) => {
            const round = this.rounds.find(r => r.id === roundData.id);
            if (round) {
                round.timing = e.target.value;
                this.updateResultsTables();
                this.updateRoundTags();
                this.saveState();
            }
        });

        card.querySelector('.round-notes').addEventListener('input', (e) => {
            const round = this.rounds.find(r => r.id === roundData.id);
            if (round) {
                round.notes = e.target.value;
                this.saveState();
            }
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
        // Save state before deletion for undo
        this.pushToUndoStack();

        this.rounds = this.rounds.filter(r => r.id !== id);

        // إعادة ترقيم الجولات بشكل تسلسلي
        this.rounds.forEach((round, index) => {
            round.id = index + 1;
        });
        this.roundCounter = this.rounds.length;

        // إعادة رندر جميع الجولات مع الأرقام الجديدة
        this.reRenderAllRounds();

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

        // Update investor journey with new data
        if (this.phases) {
            this.updateInvestorJourney();
        }
    }

    updateRoundUI(round) {
        const el = (id) => document.getElementById(id);
        if (el(`preVal-${round.id}`)) el(`preVal-${round.id}`).textContent = this.formatCurrency(round.preValuation);
        if (el(`postVal-${round.id}`)) el(`postVal-${round.id}`).textContent = this.formatCurrency(round.postValuation);
        if (el(`stockPrice-${round.id}`)) el(`stockPrice-${round.id}`).textContent = this.formatCurrency(round.stockPrice, 4);
        if (el(`multiplier-${round.id}`)) el(`multiplier-${round.id}`).textContent = round.profitMultiplier.toFixed(2) + 'x';
        if (el(`roundShares-${round.id}`)) el(`roundShares-${round.id}`).textContent = this.formatNumber(round.roundShares);
        if (el(`totalShares-${round.id}`)) el(`totalShares-${round.id}`).textContent = this.formatNumber(round.totalShares);
    }

    updateResultsTables() {
        document.getElementById('resultsSection').style.display = 'block';
        const tbody = document.getElementById('resultsBody');
        tbody.innerHTML = '';

        // توقيت افتراضي لكل جولة
        const defaultTimings = {
            0: 'التأسيس',
            1: 'الشهر 1',
            2: 'الشهر 11',
            3: 'الشهر 12',
            4: 'الشهر 36'
        };

        this.rounds.forEach((round, index) => {
            // استخدام التوقيت المُدخل أو الافتراضي
            const timing = round.timing || defaultTimings[index] || '-';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${round.name}</strong></td>
                <td>${timing}</td>
                <td>${this.formatCurrency(round.fundingAmount)}</td>
                <td>${round.soldPercentage.toFixed(2)}%</td>
                <td>${this.formatCurrency(round.preValuation)}</td>
                <td>${this.formatCurrency(round.postValuation)}</td>
                <td>${this.formatCurrency(round.stockPrice, 4)}</td>
                <td>${round.profitMultiplier.toFixed(2)}x</td>
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

        this.setupAdminControls();
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

        // 2. Buttons (Add Round, Delete Round, New Project)
        const buttonsToHide = [
            'addRoundBtn',
            'newProjectBtn'
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

    setupAdminControls() {
        const toggleBtn = document.getElementById('toggleEditBtn');
        if (!toggleBtn) return;
        const icon = toggleBtn.querySelector('i');

        // Initial State
        if (this.isReadOnly) {
            toggleBtn.classList.add('locked');
            toggleBtn.classList.remove('unlocked');
            icon.className = 'fa-solid fa-lock';
            toggleBtn.title = "اضغط لفتح التعديل";
        } else {
            toggleBtn.classList.add('unlocked');
            toggleBtn.classList.remove('locked');
            icon.className = 'fa-solid fa-lock-open';
            toggleBtn.title = "اضغط لقفل التعديل";
        }

        // Click Handler
        // Remove existing listeners to avoid duplicates (though nice to have, standard add doesn't overwrite)
        // Cloning node is a quick way to clear listeners if needed, but we'll assume single init.

        toggleBtn.onclick = () => {
            if (this.isReadOnly) {
                const password = prompt("🔐 مطلوب كلمة مرور الأدمن\nأدخل كلمة المرور:");
                if (password === "123456") {
                    localStorage.setItem('haykal_admin_access', 'true');
                    alert("✅ تم فتح وضع التعديل!");
                    location.reload();
                } else if (password) {
                    alert("❌ كلمة المرور غير صحيحة");
                }
            } else {
                if (confirm("هل تريد قفل وضع التعديل؟")) {
                    localStorage.removeItem('haykal_admin_access');
                    location.reload();
                }
            }
        };
    }

    // ===== INVESTOR JOURNEY METHODS =====

    initInvestorJourney() {
        // القيم الافتراضية للمراحل
        const defaultPhases = {
            launch: {
                name: 'الافتتاح',
                month: 1,
                members: 0,
                annualProfit: 0,
                target: 'الهدف: إطلاق التطبيق',
                roundIndex: 1
            },
            breakeven: {
                name: 'نقطة التعادل',
                month: 11,
                members: 2047,
                annualProfit: 0,
                target: 'الهدف: 2,047 عضو نشط',
                roundIndex: 2
            },
            weak: {
                name: 'أرباح ضعيفة',
                month: 12,
                members: 4095,
                annualProfit: 124254,
                target: 'الهدف: 4,095 عضو نشط',
                roundIndex: 3
            },
            good: {
                name: 'أرباح جيدة',
                month: 24,
                members: 16383,
                annualProfit: 949865,
                target: 'الهدف: 16,383 عضو نشط',
                roundIndex: 3
            },
            veryGood: {
                name: 'أرباح جيدة جداً',
                month: 36,
                members: 32767,
                annualProfit: 1985341,
                target: 'الهدف: 32,767 عضو نشط',
                roundIndex: 4
            },
            excellent: {
                name: 'أرباح ممتازة',
                month: 48,
                members: 65535,
                annualProfit: 4498647,
                target: 'الهدف: 65,535 عضو نشط',
                roundIndex: 4
            }
        };

        // استخدام البيانات المحفوظة إن وجدت، وإلا استخدام الافتراضية
        if (this.savedPhases) {
            this.phases = this.savedPhases;
        } else {
            this.phases = defaultPhases;
        }

        // استعادة المرحلة المحددة
        this.currentPhase = this.savedCurrentPhase || 'weak';

        // استعادة نسبة التوزيع
        const distInput = document.getElementById('distributionRate');
        if (distInput && this.savedDistributionRate !== undefined) {
            distInput.value = this.savedDistributionRate;
            document.getElementById('reinvestmentRate').textContent = (100 - this.savedDistributionRate) + '%';
        }

        // Setup listeners
        this.setupInvestorJourneyListeners();

        // Initial calculation
        this.updateInvestorJourney();

        // Render phases settings table
        this.renderPhasesSettings();

        // Update round tags on timeline
        this.updateRoundTags();

        // تفعيل التاب المحفوظ
        const activePoint = document.querySelector(`[data-phase="${this.currentPhase}"]`);
        if (activePoint) {
            document.querySelectorAll('.timeline-point').forEach(p => p.classList.remove('active'));
            activePoint.classList.add('active');
        }
    }

    setupInvestorJourneyListeners() {
        // Distribution rate input
        const distInput = document.getElementById('distributionRate');
        if (distInput) {
            distInput.addEventListener('input', (e) => {
                const rate = parseFloat(e.target.value) || 0;
                document.getElementById('reinvestmentRate').textContent = (100 - rate) + '%';
                this.updateInvestorJourney();
                this.saveState();
            });
        }

        // Expected profit input
        const profitInput = document.getElementById('expectedProfit');
        if (profitInput) {
            profitInput.addEventListener('input', () => {
                this.updateInvestorJourney();
                this.saveState();
            });
        }

        // Timeline points click
        const timelinePoints = document.querySelectorAll('.timeline-point');
        timelinePoints.forEach(point => {
            point.addEventListener('click', () => {
                // Remove active from all
                timelinePoints.forEach(p => p.classList.remove('active'));
                // Add to clicked
                point.classList.add('active');
                // Update phase
                this.currentPhase = point.dataset.phase;
                this.updateInvestorJourney();
            });
        });

        // Apply read-only if needed
        if (this.isReadOnly) {
            const journeyInputs = document.querySelectorAll('#investorJourneySection input');
            journeyInputs.forEach(input => {
                input.setAttribute('disabled', 'true');
                input.style.backgroundColor = 'transparent';
                input.style.border = 'none';
                input.style.color = '#fff';
            });
        }
    }

    updateInvestorJourney() {
        // Get values from inputs
        const distributionRate = parseFloat(document.getElementById('distributionRate')?.value) || 30;
        const reinvestRate = 100 - distributionRate;

        // Get current phase data
        const phase = this.phases[this.currentPhase];
        const annualProfit = phase.annualProfit;

        // Update the profit input to show current phase profit
        const profitInput = document.getElementById('expectedProfit');
        if (profitInput) {
            profitInput.value = annualProfit;
        }

        // Get stock price from the round that matches the phase MONTH (not fixed index)
        const phaseMonth = phase.month;

        // البحث عن الجولة التي توقيتها يتطابق مع شهر المرحلة
        let phaseRound = this.rounds.find(r => {
            if (!r.timing) return false;
            const roundMonth = parseInt(r.timing.match(/\d+/)?.[0] || 0);
            return roundMonth === phaseMonth;
        });

        // إذا لم تجد جولة بنفس الشهر، ابحث عن أقرب جولة سابقة
        if (!phaseRound && this.rounds.length > 0) {
            // ترتيب الجولات بالتوقيت وأخذ أقرب واحدة
            const sortedRounds = [...this.rounds]
                .filter(r => r.timing)
                .sort((a, b) => {
                    const aMonth = parseInt(a.timing.match(/\d+/)?.[0] || 0);
                    const bMonth = parseInt(b.timing.match(/\d+/)?.[0] || 0);
                    return bMonth - aMonth; // ترتيب تنازلي
                });

            // أخذ أقرب جولة لها توقيت أقل من أو يساوي شهر المرحلة
            phaseRound = sortedRounds.find(r => {
                const rMonth = parseInt(r.timing.match(/\d+/)?.[0] || 0);
                return rMonth <= phaseMonth;
            }) || this.rounds[this.rounds.length - 1]; // fallback للجولة الأخيرة
        }

        // Get baseline (first round or initial) for comparison
        const baseStockPrice = this.initialPrice;
        const phaseStockPrice = phaseRound ? phaseRound.stockPrice : this.initialPrice;
        const totalShares = phaseRound ? phaseRound.totalShares : this.initialShares;

        // EPS calculation based on shares at that phase
        const eps = totalShares > 0 ? annualProfit / totalShares : 0;

        // Distribution calculations
        const cashPerShare = eps * (distributionRate / 100);
        const reinvestPerShare = eps * (reinvestRate / 100);

        // Growth from initial price
        const priceGrowth = baseStockPrice > 0 ? ((phaseStockPrice - baseStockPrice) / baseStockPrice) * 100 : 0;

        // Update UI
        this.updateInvestorJourneyUI({
            phase,
            distributionRate,
            reinvestRate,
            cashPerShare,
            reinvestPerShare,
            eps,
            baseStockPrice,
            phaseStockPrice,
            priceGrowth,
            annualProfit,
            roundName: phaseRound ? phaseRound.name : 'التأسيس'
        });
    }

    updateInvestorJourneyUI(data) {
        const el = (id) => document.getElementById(id);

        // Phase info
        if (el('phaseBadge')) el('phaseBadge').textContent = data.phase.name;
        if (el('phaseTarget')) el('phaseTarget').textContent = data.phase.target;

        // Percentages
        if (el('cashPercentage')) el('cashPercentage').textContent = data.distributionRate + '%';
        if (el('reinvestPercentage')) el('reinvestPercentage').textContent = data.reinvestRate + '%';

        // Card values (formatted)
        if (el('expectedProfitValue')) el('expectedProfitValue').textContent = this.formatCurrency(data.annualProfit);
        if (el('cashValue')) el('cashValue').textContent = this.formatCurrency(data.cashPerShare, 2);
        if (el('reinvestValue')) el('reinvestValue').textContent = this.formatCurrency(data.reinvestPerShare, 2);
        if (el('totalEPS')) el('totalEPS').textContent = this.formatCurrency(data.eps, 2);

        // Stock price - Shows price AT this phase from linked round
        // Display the phase stock price as the main value
        if (el('currentStockPrice')) el('currentStockPrice').textContent = '$' + data.phaseStockPrice.toFixed(4);
        if (el('projectedStockPrice')) el('projectedStockPrice').textContent = '$' + data.phaseStockPrice.toFixed(2);

        if (el('projectedGrowth')) {
            const growth = data.priceGrowth;
            if (growth > 0) {
                el('projectedGrowth').textContent = '+' + growth.toFixed(0) + '%';
                el('projectedGrowth').style.color = 'var(--success-color)';
                el('projectedGrowth').style.background = 'rgba(0, 210, 106, 0.1)';
            } else {
                el('projectedGrowth').textContent = growth.toFixed(0) + '%';
                el('projectedGrowth').style.color = 'var(--accent-color)';
                el('projectedGrowth').style.background = 'rgba(233, 69, 96, 0.1)';
            }
        }
    }

    // Render phases settings table
    renderPhasesSettings() {
        const tbody = document.getElementById('phasesSettingsBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        Object.entries(this.phases).forEach(([key, phase]) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="phase-name">${phase.name}</td>
                <td><input type="number" class="phase-month" data-phase="${key}" value="${phase.month}" min="1" max="120"></td>
                <td><input type="number" class="phase-members" data-phase="${key}" value="${phase.members}" min="0" step="100"></td>
                <td><input type="number" class="phase-profit" data-phase="${key}" value="${phase.annualProfit}" min="0" step="1000"></td>
            `;
            tbody.appendChild(row);
        });

        // Add listeners to phase inputs
        tbody.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => {
                const phaseKey = e.target.dataset.phase;
                const phase = this.phases[phaseKey];

                if (e.target.classList.contains('phase-month')) {
                    phase.month = parseInt(e.target.value) || 1;
                    // Update timeline point label
                    const point = document.querySelector(`[data-phase="${phaseKey}"] .point-label`);
                    if (point) point.textContent = 'الشهر ' + phase.month;
                } else if (e.target.classList.contains('phase-members')) {
                    phase.members = parseInt(e.target.value) || 0;
                } else if (e.target.classList.contains('phase-profit')) {
                    phase.annualProfit = parseInt(e.target.value) || 0;
                }

                this.updateInvestorJourney();
                this.updateRoundTags();
                this.saveState();
            });
        });
    }

    // Update round tags on timeline based on round timings
    updateRoundTags() {
        // Remove all existing round tags first
        document.querySelectorAll('.round-tag').forEach(tag => tag.style.display = 'none');

        // Map round timings to phase months
        this.rounds.forEach((round, index) => {
            if (!round.timing) return;

            // Extract month number from timing (e.g., "12", "Month 12", "شهر 12")
            const monthMatch = round.timing.match(/\d+/);
            if (!monthMatch) return;
            const roundMonth = parseInt(monthMatch[0]);

            // Find matching phase by month
            Object.entries(this.phases).forEach(([key, phase]) => {
                if (phase.month === roundMonth) {
                    const point = document.querySelector(`[data-phase="${key}"] .round-tag`);
                    if (point) {
                        point.style.display = 'block';
                        point.textContent = `جولة ${index + 1}`;
                    }
                }
            });
        });
    }
}

// Initialize calculator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.calculator = new FundingCalculator();
});
