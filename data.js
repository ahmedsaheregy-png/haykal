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
            name: "الجولة 1 تأسيس",
            fundingAmount: 60000,
            soldPercentage: 5,
            timing: "-6",
            notes: "قبل الافتتاح",
            // Pre-calculated values (from Calculator)
            postValuation: 1200000,
            preValuation: 1140000,
            totalShares: 1052632,
            roundShares: 52632,
            stockPrice: 1.14
        },
        {
            id: 2,
            name: "الجولة 2 الافتتاح",
            fundingAmount: 400000,
            soldPercentage: 15,
            timing: "1",
            notes: "",
            postValuation: 2666667,
            preValuation: 2266667,
            totalShares: 1238390,
            roundShares: 185758,
            stockPrice: 2.1533
        },
        {
            id: 3,
            name: "الجولة 3 رخصة EMI",
            fundingAmount: 5000000,
            soldPercentage: 15,
            timing: "12",
            notes: "",
            postValuation: 33333333,
            preValuation: 28333333,
            totalShares: 1456930,
            roundShares: 218540,
            stockPrice: 22.8791
        },
        {
            id: 4,
            name: "الجولة 4 التوسع الدولي",
            fundingAmount: 20000000,
            soldPercentage: 15,
            timing: "36",
            notes: "",
            postValuation: 133333333,
            preValuation: 113333333,
            totalShares: 1714035,
            roundShares: 257105,
            stockPrice: 77.7891
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
            members: 16383,
            monthlyGTV: 15831083, /* Approx derived from profit */
            commission: 0.05,
            annualProfit: 949865
        },
        veryGood: {
            name: "أرباح جيدة جداً",
            month: 36,
            members: 32767,
            monthlyGTV: 33089016, /* Approx derived from profit */
            commission: 0.05,
            annualProfit: 1985341
        },
        excellent: {
            name: "أرباح ممتازة",
            month: 48,
            members: 65535,
            monthlyGTV: 74977450, /* Approx derived from profit */
            commission: 0.05,
            annualProfit: 4498647
        }
    }
};

// تصدير البيانات للاستخدام من calculator.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PERMANENT_DATA;
}
