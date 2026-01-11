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

    // بيانات مراحل النمو (إذا لزم الأمر)
    phases: {
        startup: { monthlyGTV: 200000, commission: 0.05, annualProfit: 120000 },
        breakeven: { monthlyGTV: 1500000, commission: 0.05, annualProfit: 900000 },
        growth: { monthlyGTV: 5000000, commission: 0.05, annualProfit: 3000000 },
        excellent: { monthlyGTV: 21000000, commission: 0.05, annualProfit: 4498647 }
    }
};

// تصدير البيانات للاستخدام من calculator.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PERMANENT_DATA;
}
