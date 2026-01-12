// ========================================
// SAWYAN Bank - Investor Portal Logic
// Version: 4.0 (DIRECT READ MODE)
// ========================================

// ===== DYNAMIC DATA ENGINE (AUTO-SYNC MODE) =====
async function loadDynamicData() {
    console.log('🔄 Loading Data (Auto-Sync Mode)...');

    // 1. Initialize Cloud Storage (it's an object, not a class)
    CloudStorage.init();

    // 2. PRIMARY SOURCE: Cloud (Supabase) - For Live Auto-Sync
    let projectData = await CloudStorage.load();

    // 3. FALLBACK: data.js (PERMANENT_DATA) if cloud is empty
    if (!projectData || !projectData.rounds || projectData.rounds.length === 0) {
        console.log('☁️ Cloud empty, using PERMANENT_DATA fallback');
        projectData = window.PERMANENT_DATA;
    }

    if (!projectData || !projectData.rounds) {
        console.error('❌ No data source found!');
        return;
    }

    console.log('✅ Data Loaded:', projectData);

    const rounds = projectData.rounds || [];
    const phases = projectData.phases || {};

    // --- Sorting Logic (Visual Only) ---
    // We sort to ensure Timeline Logic maps correctly (Round 1 -> Round 2 -> ...)
    // But we trust the values inside the round objects.
    const getRoundMonth = (round) => {
        const timing = round.timing;
        const name = round.name;
        if (timing) {
            const match = timing.match(/-?\d+/);
            if (match) return parseInt(match[0]);
            if (timing.includes('التأسيس') || timing.includes('الافتتاح')) return 1;
        }
        if (name) {
            if (name.includes('قبل') || name.includes('pre-') || name.includes('Pre-')) return 0;
            if (name.includes('جولة 1 ') || name.includes('Round 1') || name.includes('تأسيس')) return 1;
        }
        return 999;
    };

    rounds.sort((a, b) => {
        const monthA = getRoundMonth(a);
        const monthB = getRoundMonth(b);
        if (monthA === monthB) return a.id - b.id;
        return monthA - monthB;
    });

    // 4. READ VALUES DIRECTLY (True Binding - Highest Valuation Logic)
    if (rounds.length === 0) return;

    // First Round (Founding/Start) - DETERMINISTIC LOGIC:
    // We find the round with the LOWEST non-zero Post-Money Valuation.
    // This represents the 'Start' of the value creation journey.
    // First Round (Founding/Start) - USER REQUEST:
    // Always use the First Round in the sequence (chronological start).
    const firstRound = rounds[0];

    // Last Round (Exit) - DETERMINISTIC LOGIC:
    // Instead of trusting array order (which can be messy), we find the round
    // with the HIGHEST Post-Money Valuation. This represents the 'Exit' state.
    const lastRound = rounds.reduce((max, round) => {
        return (round.postValuation > max.postValuation) ? round : max;
    }, rounds[0]);

    console.log('🎯 Bound to Exit Round:', lastRound.name, 'Price:', lastRound.stockPrice);

    // READ from saved calculated properties
    const startSharePrice = firstRound.stockPrice || 0;
    const lastSharePrice = lastRound.stockPrice || 0;
    const exitValuation = lastRound.postValuation || 0;

    // --- Update DOM ---

    // 1. Hero Metrics
    updateText('hero-exit-valuation', formatCurrency(exitValuation));
    updateText('bento-exit-valuation', formatCurrency(exitValuation));

    // 2. Annual Profit (Excellent Phase)
    const annualProfit = phases.excellent ? (phases.excellent.annualProfit || 0) : 0;
    updateText('hero-annual-profit', formatCurrency(annualProfit));
    updateText('bento-net-profit', formatCurrency(annualProfit));

    // 3. Stock Price & Growth
    updateText('bento-stock-price', formatCurrency(lastSharePrice, false)); // No 'M' suffix

    if (startSharePrice > 0) {
        // Growth calc: (End - Start) / Start
        const growth = ((lastSharePrice - startSharePrice) / startSharePrice) * 100;
        updateText('hero-stock-growth', `${Math.round(growth)}%`); // Removed + and ,

        // Restore: Update sub-label in Bento
        const bentoSubLabel = document.getElementById('bento-metric-badge');
        if (bentoSubLabel) {
            bentoSubLabel.innerHTML = `Start: ${formatCurrency(startSharePrice, false)} &rarr; Exit: ${formatCurrency(lastSharePrice, false)}`;
        }
    }

    // 4. Timeline Prices (Direct Read)
    const timelineIds = ['timeline-price-1', 'timeline-price-2', 'timeline-price-3', 'timeline-price-4'];

    // Map the first 4 rounds found to the timeline
    rounds.slice(0, 4).forEach((round, i) => {
        if (timelineIds[i]) {
            // Read stockPrice directly
            updateText(timelineIds[i], formatCurrency(round.stockPrice || 0, false));
        }
    });

    // 5. Hero Floating Price Range
    updateText('start-price-display', formatCurrency(startSharePrice, false));
    updateText('end-price-display', formatCurrency(lastSharePrice, false));

    updateText('bento-metric-badge', `Start: ${formatCurrency(startSharePrice, false)} ➔ Exit: ${formatCurrency(lastSharePrice, false)}`);

    console.log('✅ UI Updated with DIRECT READ values');
}

// Helper: Format Currency
function formatCurrency(value, useSuffix = true) {
    if (value >= 1000000 && useSuffix) {
        return '$' + (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000 && useSuffix) {
        return '$' + (value / 1000).toFixed(1) + 'K';
    }
    return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function updateText(id, text) {
    const el = document.getElementById(id);
    if (el) {
        el.innerHTML = text;
        el.classList.add('updated-flash'); // CSS animation for update
        setTimeout(() => el.classList.remove('updated-flash'), 1000);
    }
}

// ===== SMART NAVIGATION (Hide on Scroll Down, Show on Scroll Up) =====
let lastScrollTop = 0;
let scrollThreshold = 100;
const floatingNav = document.querySelector('.floating-nav');

if (floatingNav) {
    window.addEventListener('scroll', function () {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop < scrollThreshold) {
            floatingNav.style.transform = 'translateX(-50%) translateY(0)';
            return;
        }

        if (scrollTop > lastScrollTop) {
            floatingNav.style.transform = 'translateX(-50%) translateY(-120%)';
        } else {
            floatingNav.style.transform = 'translateX(-50%) translateY(0)';
        }

        lastScrollTop = scrollTop;
    }, { passive: true });
}

document.addEventListener('DOMContentLoaded', () => {
    loadDynamicData(); // Load data first
    initScrollAnimations();
    initSmoothScroll();
    initNavbarScroll();
});

// ========================================
// Scroll Animations
// ========================================

function initScrollAnimations() {
    const elements = document.querySelectorAll(
        '.problem-card, .feature-item, .metric-card, .bridge-point, .lean-column, .flow-step, .summary-box, .bento-card'
    );

    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, i * 80);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '-50px' });

    elements.forEach(el => observer.observe(el));
}

// ========================================
// Smooth Scroll
// ========================================

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const navbar = document.querySelector('.navbar');
                const navHeight = navbar ? navbar.offsetHeight : 0;
                window.scrollTo({
                    top: target.offsetTop - navHeight - 20,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ========================================
// Navbar Scroll Effect
// ========================================

function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(10, 10, 20, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.4)';
        } else {
            navbar.style.background = 'rgba(10, 10, 20, 0.9)';
            navbar.style.boxShadow = 'none';
        }
    });
}
