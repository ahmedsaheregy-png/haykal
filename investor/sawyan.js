// ========================================
// SAWYAN Bank - Investor Portal JavaScript
// Animations, Interactions & Dynamic Data
// ========================================

// ===== DYNAMIC DATA LOADER =====
function loadDynamicData() {
    try {
        // 1. Get Project ID (most recent or from URL)
        let projectId = new URLSearchParams(window.location.search).get('project');

        if (!projectId) {
            const projects = JSON.parse(localStorage.getItem('funding_app_projects_list') || '[]');
            if (projects.length > 0) {
                // Sort by lastModified descending
                projects.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
                projectId = projects[0].id;
            }
        }

        if (!projectId) {
            console.warn('No project data found. Using default values.');
            return;
        }

        // 2. Load Data
        const dataStr = localStorage.getItem(`funding_data_${projectId}`);
        if (!dataStr) return;

        const data = JSON.parse(dataStr);
        if (!data.rounds || data.rounds.length === 0) return;

        // 3. Extract Metrics
        const lastRound = data.rounds[data.rounds.length - 1]; // Use last round for exit
        const initialPrice = data.initialPrice || 0.05;
        const finalPrice = lastRound.stockPrice || 0;
        const exitValuation = lastRound.postValuation || 0;

        // Annual Profit (Year 4 / Month 48 / Excellent Phase)
        let annualProfit = 0;
        if (data.phases && data.phases['excellent']) {
            annualProfit = data.phases['excellent'].annualProfit;
        }

        // Calculations
        const growthPercentage = initialPrice > 0
            ? ((finalPrice - initialPrice) / initialPrice) * 100
            : 0;

        // Helpers
        const formatCurrency = (val) => {
            if (val >= 1000000000) return '$' + (val / 1000000000).toFixed(1) + 'B';
            if (val >= 1000000) return '$' + (val / 1000000).toFixed(1) + 'M';
            if (val >= 1000) return '$' + (val / 1000).toFixed(1) + 'K';
            return '$' + val.toLocaleString();
        };
        const formatCurrencyPrecise = (val) => '$' + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const formatPercentage = (val) => '+' + Math.round(val).toLocaleString() + '%';

        // 4. Update UI Elements

        // Timeline Prices (Capital Growth Chart)
        // Map to: Initial -> Round 1 -> Round 2/3 -> Final
        updateText('timeline-price-1', formatCurrencyPrecise(initialPrice));

        if (data.rounds.length > 0) {
            // Intermediate price (Launch phase - roughly round 1 or 2)
            const launchRound = data.rounds.length > 1 ? data.rounds[1] : data.rounds[0];
            updateText('timeline-price-2', formatCurrencyPrecise(launchRound.stockPrice));

            // License phase (Round 3 usually)
            const licenseRound = data.rounds.length > 2 ? data.rounds[2] : data.rounds[data.rounds.length - 1];
            updateText('timeline-price-3', formatCurrencyPrecise(licenseRound.stockPrice));

            // Final expansion
            updateText('timeline-price-4', formatCurrencyPrecise(finalPrice));
        }

        // Revenue Breakdown (Derived from Annual Profit)
        // Ratios based on original static data ($4.5M Total):
        // Fees: 2.0 / 4.5 = ~0.444
        // Subs: 1.2 / 4.5 = ~0.266
        // Interest: 1.3 / 4.5 = ~0.288

        const feeVal = annualProfit * 0.4444;
        const subVal = annualProfit * 0.2666;
        const intVal = annualProfit * 0.2888; // Slightly adjusted to sum closer to 1

        updateText('rev-fees', formatCurrency(feeVal));
        updateText('rev-subs', formatCurrency(subVal));
        updateText('rev-interest', formatCurrency(intVal));

        // GTV Calculation (Derived from Annual Profit to keep consistency)
        // Target: $21.0M GTV / $4.5M Profit = ~4.666
        const gtvValue = annualProfit * 4.6666;
        updateText('hero-floating-gtv', formatCurrency(gtvValue));
        updateText('bento-gtv', formatCurrency(gtvValue));

        // Hero Stats
        updateText('hero-exit-valuation', formatCurrency(exitValuation));
        updateText('hero-stock-growth', formatPercentage(growthPercentage));
        updateText('hero-annual-profit', formatCurrency(annualProfit));

        // Floating Card
        const priceRange = `من ${formatCurrencyPrecise(initialPrice)} إلى ${formatCurrencyPrecise(finalPrice)}`;
        updateText('hero-floating-price-range', priceRange);
        // Duration is generally fixed to "4 years" in this context unless phases change heavily, keeping hardcoded or mapped if needed.

        // Bento Grid
        updateText('bento-annual-profit', formatCurrency(annualProfit));
        updateText('bento-net-profit', '$' + annualProfit.toLocaleString()); // Net profit here refers to annual profit in year 4
        updateText('bento-stock-price', formatCurrencyPrecise(finalPrice));
        updateText('bento-exit-valuation', formatCurrency(exitValuation));

    } catch (e) {
        console.error('Error loading dynamic data:', e);
    }
}

function updateText(id, text) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = text;
        // Re-trigger animation if it exists
        el.removeAttribute('data-target'); // Remove old animation triggers to avoid conflict
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
    // animateMetrics(); // Optional: Re-enable if we want counters to animate from 0 to new values
});

// ========================================
// Animated Metrics Counter
// ========================================

function animateMetrics() {
    const metrics = document.querySelectorAll('.metric-value[data-target]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.target);
                const prefix = el.dataset.prefix || '';
                const suffix = el.dataset.suffix || '';

                animateValue(el, 0, target, 2500, prefix, suffix);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    metrics.forEach(m => observer.observe(m));
}

function animateValue(element, start, end, duration, prefix, suffix) {
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + (end - start) * easeOut);

        element.textContent = prefix + current.toLocaleString('en-US') + suffix;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

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
                // Check if navbar exists before getting offsetHeight
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
