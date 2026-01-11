/**
 * SAWYAN Bank - Permanent Data File
 * البيانات الثابتة لهيكل ملكية البنك
 * 
 * هذا الملف هو مصدر الحقيقة الوحيد للبيانات
 * أي تغيير هنا = تغيير دائم على GitHub
 * 
 * آخر تحديث: 2026-01-11
 */

// Ensure global access
window.PERMANENT_DATA = {
    projectName: "هيكل ملكية البنك",
    initialShares: 1000000,
    initialPrice: 0.05,

    rounds: [
        {
            id: 1,
            name: "الجولة 1 تأسيس pre-seed",
            fundingAmount: 60000,
            soldPercentage: 5,
            timing: "التأسيس",
            notes: "قبل الافتتاح"
        },
        {
            id: 3,
            name: "الجولة 3 التعادل SERIES B",
            fundingAmount: 400000,
            soldPercentage: 12,
            timing: "الشهر 11",
            notes: "نقطة التعادل"
        },
        {
            id: 4,
            name: "الجولة 4 EMI SERIES C",
            fundingAmount: 5000000,
            soldPercentage: 10,
            timing: "الشهر 12",
            notes: ""
        },
        {
            id: 5,
            name: "الجولة 5 التوسع الدولي",
            fundingAmount: 20000000,
            soldPercentage: 15,
            timing: "الشهر 36",
            notes: ""
        }
    ],

    phases: {
        launch: {
            name: "الافتتاح",
            month: 1,
            members: 0,
            monthlyGTV: 0,
            commission: 0.05,
            annualProfit: 0
        },
        breakeven: {
            name: "نقطة التعادل",
            month: 11,
            members: 2047,
            monthlyGTV: 1500000,
            commission: 0.05,
            annualProfit: 0
        },
        weak: {
            name: "أرباح ضعيفة",
            month: 12,
            members: 4095,
            monthlyGTV: 3000000,
            commission: 0.05,
            annualProfit: 124254
        },
        good: {
            name: "أرباح جيدة",
            month: 24,
            members: 8000,
            monthlyGTV: 6000000,
            commission: 0.05,
            annualProfit: 500000
        },
        veryGood: {
            name: "أرباح جيدة جداً",
            month: 36,
            members: 15000,
            monthlyGTV: 12000000,
            commission: 0.05,
            annualProfit: 1500000
        },
        excellent: {
            name: "أرباح ممتازة",
            month: 48,
            members: 30000,
            monthlyGTV: 25000000,
            commission: 0.05,
            annualProfit: 4000000
        }
    }
};

// تصدير البيانات للاستخدام من calculator.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PERMANENT_DATA;
}
