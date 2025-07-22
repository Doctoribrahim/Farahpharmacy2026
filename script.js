// Import the functions you need from the SDKs you need using full URLs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    writeBatch, 
    serverTimestamp,
    setDoc,
    onSnapshot // <<=== جديد: استيراد onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Optionally import analytics if you intend to use it
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

document.addEventListener('DOMContentLoaded', () => {

    // ===== Firebase Configuration - Provided by the user =====
    const firebaseConfig = {
        apiKey: "AIzaSyBPS0hsov3pT7BrnLO-1T2RRkd2yTUU4pk",
        authDomain: "doctoribrahim-5aa53.firebaseapp.com",
        projectId: "doctoribrahim-5aa53",
        storageBucket: "doctoribrahim-5aa53.firebasestorage.app",
        messagingSenderId: "864152688454",
        appId: "1:864152688454:web:e206b306e226d0c8daf747",
        measurementId: "G-8D2JDQBGQM"
    };

    // Initialize Firebase and Firestore
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    // const analytics = getAnalytics(app); // Uncomment if using analytics

    const sitePassword = "2211"; // كلمة المرور الحالية للتطبيق (تذكر: هذه ليست مصادقة آمنة لـ Firebase)

    const elements = {
        passwordModal: document.getElementById('password-modal'),
        passwordForm: document.getElementById('password-form'),
        passwordInput: document.getElementById('password-input'),
        passwordError: document.getElementById('password-error'),
        togglePasswordVisibility: document.getElementById('toggle-password-visibility'),
        allViewsAndIndicators: document.querySelectorAll('.view, #status-indicator'),
        statusIndicator: document.getElementById('status-indicator'),
        statusText: document.getElementById('status-text'),
        dashboardView: document.getElementById('dashboard-view'),
        medicinesView: document.getElementById('medicines-view'),
        debtsView: document.getElementById('debts-view'),
        last3MonthsDebtsView: document.getElementById('last-3-months-debts-view'), 
        shortagesView: document.getElementById('shortages-view'),
        allViews: document.querySelectorAll('.view'),
        openMedicinesBtn: document.getElementById('open-medicines-btn'),
        openDebtsBtn: document.getElementById('open-debts-btn'),
        openLast3MonthsDebtsBtn: document.getElementById('open-last-3-months-debts-btn'), 
        openShortagesBtn: document.getElementById('open-shortages-btn'),
        backButtons: document.querySelectorAll('.back-btn'),
        backupDataBtn: document.getElementById('backup-data-btn'),
        importDataBtn: document.getElementById('import-data-btn'),
        importFileInput: document.getElementById('import-file-input'),
        medicineTimelineContainer: document.getElementById('medicine-timeline-container'),
        debtListContainer: document.getElementById('debt-list-container'),
        last3MonthsDebtListContainer: document.getElementById('last-3-months-debt-list-container'), 
        shortageListContainer: document.getElementById('shortage-list-container'),
        searchDebtsInput: document.getElementById('search-debts-input'),
        searchLast3MonthsDebtsInput: document.getElementById('search-last-3-months-debts-input'), 
        searchMedicinesInput: document.getElementById('search-medicines-input'),
        searchShortagesInput: document.getElementById('search-shortages-input'),
        totalDebtsAmountEl: document.getElementById('total-debts-amount'),
        totalLast3MonthsDebtsAmountEl: document.getElementById('total-last-3-months-debts-amount'), 
        addMedicineModal: document.getElementById('add-medicine-modal'),
        addMedicineForm: document.getElementById('add-medicine-form'),
        showAddMedicineModalBtn: document.getElementById('show-add-medicine-modal-btn'),
        addDebtModal: document.getElementById('add-debt-modal'),
        addDebtForm: document.getElementById('add-debt-form'),
        addNewDebtBtn: document.getElementById('add-new-debt-btn'),
        addShortageModal: document.getElementById('add-shortage-modal'),
        addShortageForm: document.getElementById('add-shortage-form'),
        showAddShortageModalBtn: document.getElementById('show-add-shortage-modal-btn'),
        deleteSelectedShortagesBtn: document.getElementById('delete-selected-shortages-btn'),
        addPaymentModal: document.getElementById('add-payment-modal'),
        addPaymentForm: document.getElementById('add-payment-form'),
        paymentCustomerNameInput: document.getElementById('payment-customer-name'),
        paymentCustomerDisplay: document.getElementById('payment-customer-display'),
        closeButtons: document.querySelectorAll('.close-btn'),
        // Archive elements
        debtArchiveModal: document.getElementById('debt-archive-modal'),
        openDebtArchiveBtn: document.getElementById('open-debt-archive-btn'),
        debtArchiveList: document.getElementById('debt-archive-list'),
        clearArchiveBtn: document.getElementById('clear-archive-btn'),
    };

    // سنقوم بتخزين البيانات محليًا هنا بعد تحميلها من Firestore
    let medicines = [];
    let debts = [];
    let shortages = [];
    let archivedDebts = [];

    // متغيرات لتخزين دوال إلغاء الاشتراك من مستمعي onSnapshot
    let unsubscribeMedicines = null;
    let unsubscribeDebts = null;
    let unsubscribeShortages = null;
    let unsubscribeArchivedDebts = null;

    const showStatus = (text) => {
        elements.statusText.textContent = text;
        elements.statusIndicator.classList.remove('hidden');
    };
    const hideStatus = () => {
        elements.statusIndicator.classList.add('hidden');
    };
    
    // هذه الدالة ستقوم فقط بتحديث localStorage كـ "cache" للنسخ الاحتياطي/الاستيراد المحلي
    // سيتم استدعاؤها الآن داخل مستمعي onSnapshot لضمان أن الكاش المحلي محدث دائماً
    const updateLocalDataCache = () => {
        localStorage.setItem('medicines', JSON.stringify(medicines));
        localStorage.setItem('debts', JSON.stringify(debts));
        localStorage.setItem('shortages', JSON.stringify(shortages));
        localStorage.setItem('archivedDebts', JSON.stringify(archivedDebts));
    };

    const showView = (viewToShow) => {
        elements.allViews.forEach(view => view.classList.remove('active-view'));
        viewToShow.classList.add('active-view');
    };
    const openModal = (modal) => {
        modal.style.display = 'flex';
    };
    const closeModal = (modal) => {
        modal.style.display = 'none';
    };

    const renderMedicines = (searchTerm = '') => {
        elements.medicineTimelineContainer.innerHTML = '';
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        let filteredMedicines = medicines.sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
        if (lowerSearchTerm) {
            filteredMedicines = filteredMedicines.filter(med =>
                med.name.toLowerCase().includes(lowerSearchTerm) ||
                (med.barcode && med.barcode.toLowerCase().includes(lowerSearchTerm)) ||
                med.expiry.includes(lowerSearchTerm) ||
                String(med.price).includes(lowerSearchTerm)
            );
        }
        if (filteredMedicines.length === 0) {
            elements.medicineTimelineContainer.innerHTML = `<p class="empty-state">${searchTerm ? 'لا توجد أدوية مطابقة.' : 'لا توجد أدوية لإدارتها.'}</p>`;
            return;
        }
        const groupedByMonth = filteredMedicines.reduce((acc, med) => {
            const monthYear = new Date(med.expiry).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
            acc[monthYear] = acc[monthYear] || [];
            acc[monthYear].push(med);
            return acc;
        }, {});
        let html = '';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(today.getMonth() + 6);
        for (const monthYear in groupedByMonth) {
            html += `<div class="timeline-month">${monthYear}</div>`;
            groupedByMonth[monthYear].forEach(med => {
                const expiryDate = new Date(med.expiry);
                expiryDate.setHours(0,0,0,0);
                let statusClass = 'ok';
                if (expiryDate < today) statusClass = 'expired';
                else if (expiryDate < sixMonthsFromNow) statusClass = 'near-expiry';
                const timeDiff = expiryDate.getTime() - today.getTime();
                const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                let remainingDaysText = diffDays > 0 ? `متبقي ${diffDays} يوم` : (diffDays === 0 ? 'ينتهي اليوم' : `منتهي منذ ${Math.abs(diffDays)} يوم`);
                html += `
                    <div class="timeline-item ${statusClass}">
                        <div class="item-main">
                            <div class="item-text">
                                <span class="item-title">${med.name}</span>
                                <span class="item-subtitle">ينتهي في: ${med.expiry}</span>
                            </div>
                        </div>
                        <div class="item-details">
                            <div class="item-days-remaining">${remainingDaysText}</div>
                            <span class="item-price">${(med.price || 0).toFixed(2)} شيكل</span>
                            <button class="btn-icon delete delete-med-btn" data-id="${med.id}" title="حذف"><i class="fa-solid fa-trash-alt"></i></button>
                        </div>
                    </div>`;
            });
        }
        elements.medicineTimelineContainer.innerHTML = html;
    };

    const archiveSettledDebts = async () => {
        const customerDebtsMap = debts.reduce((acc, debt) => {
            acc[debt.customer] = acc[debt.customer] || [];
            acc[debt.customer].push(debt);
            return acc;
        }, {});

        let batch = writeBatch(db);
        let aChangeWasMade = false;
        
        for (const customer in customerDebtsMap) {
            const customerTotal = customerDebtsMap[customer].reduce((sum, debt) => sum + parseFloat(debt.amount), 0);
            if (customerTotal <= 0) {
                const transactionsToArchive = debts.filter(d => d.customer === customer);
                for (const t of transactionsToArchive) {
                    const archivedDocRef = doc(collection(db, 'archivedDebts')); // Firestore generates ID for new doc
                    batch.set(archivedDocRef, {
                        ...t,
                        archiveReason: 'تمت التسوية بالكامل',
                        archiveDate: serverTimestamp()
                    });
                    const debtDocRef = doc(db, 'debts', t.id); // Reference to the original debt document
                    batch.delete(debtDocRef);
                }
                aChangeWasMade = true;
            }
        }

        if (aChangeWasMade) {
            showStatus('جارٍ أرشفة الديون المسددة...');
            try {
                await batch.commit();
                console.log("Settled debts archived and deleted from debts collection.");
                // لا نحتاج إلى loadInitialData هنا لأن onSnapshot سيتولى التحديث
                hideStatus();
            } catch (error) {
                console.error("Error archiving settled debts:", error);
                alert("فشل أرشفة الديون المسددة.");
                hideStatus();
            }
        }
    };

    const renderDebts = (searchTerm = '') => {
        elements.debtListContainer.innerHTML = '';
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        let grandTotal = 0;
        
        const customerDebtsMap = debts.reduce((acc, debt) => {
            acc[debt.customer] = acc[debt.customer] || [];
            acc[debt.customer].push(debt);
            return acc;
        }, {});

        let filteredCustomers = Object.keys(customerDebtsMap);
        if(lowerSearchTerm) {
            filteredCustomers = filteredCustomers.filter(customerName => {
                if (customerName.toLowerCase().includes(lowerSearchTerm)) return true;
                return customerDebtsMap[customerName].some(debt =>
                    String(parseFloat(debt.amount).toFixed(2)).includes(lowerSearchTerm) ||
                    debt.date.includes(lowerSearchTerm) ||
                    (debt.details && debt.details.toLowerCase().includes(lowerSearchTerm))
                );
            });
        }

        if (filteredCustomers.length === 0) {
            elements.debtListContainer.innerHTML = `<p class="empty-state">${searchTerm ? 'لا توجد نتائج مطابقة.' : 'لا توجد ديون نشطة حالياً.'}</p>`;
            elements.totalDebtsAmountEl.textContent = `0.00 شيكل`;
            return;
        }
        
        const sortedCustomers = filteredCustomers.sort((a,b) => a.localeCompare(b));

        let html = sortedCustomers.map(customer => {
            const history = customerDebtsMap[customer].sort((a, b) => new Date(a.date) - new Date(b.date));
            const customerTotal = history.reduce((sum, debt) => sum + parseFloat(debt.amount), 0);
            grandTotal += customerTotal;
            const transactionsHTML = history.map(debt => {
                const amount = parseFloat(debt.amount);
                const isPayment = amount < 0;
                return `<li class="debt-transaction-item">
                            <div class="transaction-info">
                                <span class="transaction-amount ${isPayment ? 'payment' : 'debt'}">${isPayment ? '' : '+'}${amount.toFixed(2)} شيكل</span>
                                <span class="transaction-date">${debt.date}</span>
                                ${debt.details ? `<div class="transaction-details">${debt.details}</div>` : ''}
                            </div>
                            <div class="item-actions">
                                <button class="btn-icon delete delete-debt-btn" data-id="${debt.id}" title="نقل للأرشيف"><i class="fa-solid fa-archive"></i></button>
                            </div>
                        </li>`;
            }).join('');
            
            return `<div class="debt-card">
                        <div class="debt-card-header">
                            <div class="customer-info"><h3>${customer}</h3><div class="customer-balance">${customerTotal.toFixed(2)} شيكل</div></div>
                            <div class="debt-card-actions">
                                <button class="btn btn-red-action btn-add-debt-for-customer" data-customer="${customer}" title="إضافة دين جديد"><i class="fa-solid fa-plus"></i> دين</button>
                                <button class="btn btn-green-action btn-add-payment" data-customer="${customer}" title="تسجيل دفعة"><i class="fa-solid fa-hand-holding-dollar"></i> دفعة</button>
                            </div>
                        </div>
                        <div class="debt-card-body"><ul class="debt-transaction-list">${transactionsHTML}</ul></div>
                     </div>`;
        }).join('');

        elements.debtListContainer.innerHTML = html;
        elements.totalDebtsAmountEl.textContent = `${grandTotal.toFixed(2)} شيكل`;
    };

    // دالة مساعدة لتحديد ما إذا كان التاريخ يقع ضمن آخر 3 أشهر
    const isWithinLast3Months = (dateString) => {
        const debtDate = new Date(dateString);
        const today = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        threeMonthsAgo.setDate(1); // Start from the beginning of the month 3 months ago
        threeMonthsAgo.setHours(0, 0, 0, 0);

        // Ensure the debtDate is not in the future and is within the last 3 months
        return debtDate <= today && debtDate >= threeMonthsAgo;
    };

    const renderLast3MonthsDebts = (searchTerm = '') => {
        elements.last3MonthsDebtListContainer.innerHTML = '';
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        let grandTotal = 0;

        // تصفية الديون لآخر 3 أشهر أولاً
        const recentDebts = debts.filter(debt => isWithinLast3Months(debt.date));
        
        const customerDebtsMap = recentDebts.reduce((acc, debt) => {
            acc[debt.customer] = acc[debt.customer] || [];
            acc[debt.customer].push(debt);
            return acc;
        }, {});

        let filteredCustomers = Object.keys(customerDebtsMap);
        if(lowerSearchTerm) {
            filteredCustomers = filteredCustomers.filter(customerName => {
                if (customerName.toLowerCase().includes(lowerSearchTerm)) return true;
                return customerDebtsMap[customerName].some(debt =>
                    String(parseFloat(debt.amount).toFixed(2)).includes(lowerSearchTerm) ||
                    debt.date.includes(lowerSearchTerm) ||
                    (debt.details && debt.details.toLowerCase().includes(lowerSearchTerm))
                );
            });
        }

        if (filteredCustomers.length === 0) {
            elements.last3MonthsDebtListContainer.innerHTML = `<p class="empty-state">${searchTerm ? 'لا توجد نتائج مطابقة لآخر 3 أشهر.' : 'لا توجد ديون نشطة في آخر 3 أشهر حالياً.'}</p>`;
            elements.totalLast3MonthsDebtsAmountEl.textContent = `0.00 شيكل`;
            return;
        }
        
        const sortedCustomers = filteredCustomers.sort((a,b) => a.localeCompare(b));

        let html = sortedCustomers.map(customer => {
            const history = customerDebtsMap[customer].sort((a, b) => new Date(a.date) - new Date(b.date));
            const customerTotal = history.reduce((sum, debt) => sum + parseFloat(debt.amount), 0);
            grandTotal += customerTotal;
            const transactionsHTML = history.map(debt => {
                const amount = parseFloat(debt.amount);
                const isPayment = amount < 0;
                return `<li class="debt-transaction-item">
                            <div class="transaction-info">
                                <span class="transaction-amount ${isPayment ? 'payment' : 'debt'}">${isPayment ? '' : '+'}${amount.toFixed(2)} شيكل</span>
                                <span class="transaction-date">${debt.date}</span>
                                ${debt.details ? `<div class="transaction-details">${debt.details}</div>` : ''}
                            </div>
                            <div class="item-actions">
                                <button class="btn-icon delete delete-debt-btn" data-id="${debt.id}" title="نقل للأرشيف"><i class="fa-solid fa-archive"></i></button>
                            </div>
                        </li>`;
            }).join('');
            
            return `<div class="debt-card">
                        <div class="debt-card-header">
                            <div class="customer-info"><h3>${customer}</h3><div class="customer-balance">${customerTotal.toFixed(2)} شيكل</div></div>
                            <div class="debt-card-actions">
                                <button class="btn btn-red-action btn-add-debt-for-customer" data-customer="${customer}" title="إضافة دين جديد"><i class="fa-solid fa-plus"></i> دين</button>
                                <button class="btn btn-green-action btn-add-payment" data-customer="${customer}" title="تسجيل دفعة"><i class="fa-solid fa-hand-holding-dollar"></i> دفعة</button>
                            </div>
                        </div>
                        <div class="debt-card-body"><ul class="debt-transaction-list">${transactionsHTML}</ul></div>
                     </div>`;
        }).join('');

        elements.last3MonthsDebtListContainer.innerHTML = html;
        elements.totalLast3MonthsDebtsAmountEl.textContent = `${grandTotal.toFixed(2)} شيكل`;
    };

    const renderShortages = (searchTerm = '') => {
        elements.shortageListContainer.innerHTML = '';
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        const filteredShortages = shortages.filter(item =>
            (item.name.toLowerCase().includes(lowerSearchTerm)) ||
            (item.notes && item.notes.toLowerCase().includes(lowerSearchTerm))
        );
        if (filteredShortages.length === 0) {
            elements.shortageListContainer.innerHTML = `<p class="empty-state">${searchTerm ? 'لا توجد أصناف مطابقة.' : 'لا توجد أصناف ناقصة حالياً.'}</p>`;
        } else {
            elements.shortageListContainer.innerHTML = filteredShortages.map(item => `
                <div class="list-item ${item.purchased ? 'purchased' : ''}">
                    <div class="list-item-selector">
                        <input type="checkbox" class="shortage-item-checkbox" data-id="${item.id}" id="shortage-check-${item.id}" ${item.purchased ? 'checked' : ''}>
                        <label for="shortage-check-${item.id}"></label>
                    </div>
                    <div class="list-item-content">
                        <div class="item-title">${item.name}</div>
                        ${item.notes ? `<div class="item-notes">${item.notes}</div>` : ''}
                    </div>
                    <div class="item-actions">
                        <button class="btn-icon delete delete-shortage-btn" data-id="${item.id}" title="حذف الصنف نهائياً"><i class="fa-solid fa-trash-alt"></i></button>
                    </div>
                </div>`).join('');
        }
        elements.deleteSelectedShortagesBtn.classList.toggle('hidden', !shortages.some(item => item.purchased));
    };

    const renderDebtArchive = () => {
        elements.debtArchiveList.innerHTML = '';
        const archiveIsEmpty = archivedDebts.length === 0;
        elements.clearArchiveBtn.disabled = archiveIsEmpty;

        if (archiveIsEmpty) {
            elements.debtArchiveList.innerHTML = `<p class="empty-state">سلة المحذوفات فارغة.</p>`;
            return;
        }
        
        const sortedArchive = archivedDebts.sort((a, b) => {
            const dateA = a.archiveDate instanceof Date ? a.archiveDate : (a.archiveDate ? new Date(a.archiveDate) : new Date(0));
            const dateB = b.archiveDate instanceof Date ? b.archiveDate : (b.archiveDate ? new Date(b.archiveDate) : new Date(0));
            return dateB.getTime() - dateA.getTime();
        });

        elements.debtArchiveList.innerHTML = sortedArchive.map(item => {
            const amount = parseFloat(item.amount);
            const isPayment = amount < 0;
            const archiveDateDisplay = item.archiveDate instanceof Date ? item.archiveDate.toLocaleDateString('ar-EG') : 'تاريخ غير محدد';
            return `
            <div class="archive-item">
                <div class="archive-item-info">
                    <h4>${item.customer}</h4>
                    <p><strong class="${isPayment ? 'text-green' : 'text-red'}">${isPayment ? 'دفعة: ' : 'دين: '}${Math.abs(amount).toFixed(2)} شيكل</strong> - بتاريخ: ${item.date}</p>
                    <p class="archive-reason">سبب الأرشفة: ${item.archiveReason || 'غير محدد'} (${archiveDateDisplay})</p>
                </div>
                <div class="archive-item-actions">
                    <button class="btn btn-green-action restore-debt-btn" data-id="${item.id}"><i class="fa-solid fa-undo"></i> استعادة</button>
                    <button class="btn btn-red-action perm-delete-debt-btn" data-id="${item.id}"><i class="fa-solid fa-trash-can"></i> حذف نهائي</button>
                </div>
            </div>`;
        }).join('');
    };

    const renderAll = () => {
        renderMedicines(elements.searchMedicinesInput.value);
        renderDebts(elements.searchDebtsInput.value);
        renderLast3MonthsDebts(elements.searchLast3MonthsDebtsInput.value);
        renderShortages(elements.searchShortagesInput.value);
    };

    function setupPermanentListeners() {
        elements.togglePasswordVisibility.addEventListener('click', () => {
            const isPassword = elements.passwordInput.type === 'password';
            elements.passwordInput.type = isPassword ? 'text' : 'password';
            elements.togglePasswordVisibility.classList.toggle('fa-eye', !isPassword);
            elements.togglePasswordVisibility.classList.toggle('fa-eye-slash', isPassword);
        });
        window.addEventListener('click', (e) => { 
            if (e.target.classList.contains('modal') && e.target.id !== 'password-modal') {
                closeModal(e.target);
            }
        });
    }
    
    // === الدالة الذكية للتحقق من اسم العميل ===
    const getCanonicalCustomerName = (name) => {
        const trimmedName = name.trim();
        const existingNames = [...new Set(debts.map(d => d.customer))];
        const foundName = existingNames.find(en => en.trim() === trimmedName);
        return foundName || trimmedName;
    };

    // <==== وظيفة إعداد مستمعي Firestore onSnapshot (جديد بالكامل) ====>
    const setupFirestoreListeners = () => {
        // Medicines Listener
        unsubscribeMedicines = onSnapshot(collection(db, 'medicines'), (snapshot) => {
            medicines = snapshot.docs.map(docItem => ({ id: docItem.id, ...docItem.data(), createdAt: docItem.data().createdAt?.toDate() }));
            updateLocalDataCache();
            renderMedicines(elements.searchMedicinesInput.value);
            console.log("Medicines updated by onSnapshot.");
        }, (error) => {
            console.error("Error listening to medicines:", error);
        });

        // Debts Listener
        unsubscribeDebts = onSnapshot(collection(db, 'debts'), (snapshot) => {
            debts = snapshot.docs.map(docItem => ({ id: docItem.id, ...docItem.data(), createdAt: docItem.data().createdAt?.toDate() }));
            updateLocalDataCache();
            renderDebts(elements.searchDebtsInput.value);
            renderLast3MonthsDebts(elements.searchLast3MonthsDebtsInput.value); // تحديث شاشة آخر 3 أشهر أيضاً
            console.log("Debts updated by onSnapshot.");
        }, (error) => {
            console.error("Error listening to debts:", error);
        });

        // Shortages Listener
        unsubscribeShortages = onSnapshot(collection(db, 'shortages'), (snapshot) => {
            shortages = snapshot.docs.map(docItem => ({ id: docItem.id, ...docItem.data(), createdAt: docItem.data().createdAt?.toDate() }));
            updateLocalDataCache();
            renderShortages(elements.searchShortagesInput.value);
            console.log("Shortages updated by onSnapshot.");
        }, (error) => {
            console.error("Error listening to shortages:", error);
        });

        // Archived Debts Listener
        unsubscribeArchivedDebts = onSnapshot(collection(db, 'archivedDebts'), (snapshot) => {
            archivedDebts = snapshot.docs.map(docItem => ({ 
                id: docItem.id, 
                ...docItem.data(), 
                createdAt: docItem.data().createdAt?.toDate(), 
                archiveDate: docItem.data().archiveDate?.toDate() 
            }));
            updateLocalDataCache();
            if (elements.debtArchiveModal.style.display === 'flex') { // تحديث الأرشيف فقط إذا كانت نافذته مفتوحة
                renderDebtArchive();
            }
            console.log("Archived debts updated by onSnapshot.");
        }, (error) => {
            console.error("Error listening to archived debts:", error);
        });
    };
    // <==== نهاية وظيفة إعداد مستمعي Firestore onSnapshot ====>

    function setupAppListeners() {
        elements.openMedicinesBtn.addEventListener('click', () => showView(elements.medicinesView));
        elements.openDebtsBtn.addEventListener('click', () => { showView(elements.debtsView); archiveSettledDebts(); }); 
        elements.openLast3MonthsDebtsBtn.addEventListener('click', () => { showView(elements.last3MonthsDebtsView); renderLast3MonthsDebts(elements.searchLast3MonthsDebtsInput.value); }); 
        elements.openShortagesBtn.addEventListener('click', () => showView(elements.shortagesView));
        elements.backButtons.forEach(btn => btn.addEventListener('click', () => showView(elements.dashboardView)));
        elements.closeButtons.forEach(btn => btn.addEventListener('click', (e) => closeModal(e.target.closest('.modal'))));
        
        elements.backupDataBtn.addEventListener('click', () => {
             const allData = { medicines, debts, shortages, archivedDebts };
             if (medicines.length === 0 && debts.length === 0 && shortages.length === 0 && archivedDebts.length === 0) {
                alert('لا توجد بيانات لعمل نسخة احتياطية.');
                return;
             }
             const dataStr = JSON.stringify(allData, null, 2); 
             const blob = new Blob([dataStr], { type: 'application/json' }); 
             const url = URL.createObjectURL(blob); 
             const a = document.createElement('a'); 
             a.href = url; a.download = `pharmacy_backup_${new Date().toISOString().slice(0, 10)}.json`; 
             a.click(); 
             URL.revokeObjectURL(url); 
        });
        elements.importDataBtn.addEventListener('click', () => elements.importFileInput.click());

        elements.addMedicineForm.addEventListener('submit', async (e) => { 
            e.preventDefault(); 
            showStatus('جارٍ إضافة الدواء...');
            const newMed = { 
                name: document.getElementById('med-name').value.trim(), 
                barcode: document.getElementById('med-barcode').value, 
                expiry: document.getElementById('med-expiry').value, 
                price: parseFloat(document.getElementById('med-price').value),
                createdAt: serverTimestamp() 
            };
            try {
                await addDoc(collection(db, 'medicines'), newMed);
                // لا نحتاج لتحديث القائمة المحلية يدوياً أو renderAll() هنا، onSnapshot سيتولى ذلك
                closeModal(elements.addMedicineModal); 
                e.target.reset(); 
            } catch (error) {
                console.error("Error adding medicine: ", error);
                alert("فشل إضافة الدواء.");
            } finally { hideStatus(); }
        });
        
        elements.addDebtForm.addEventListener('submit', async (e) => { 
            e.preventDefault(); 
            showStatus('جارٍ إضافة الدين...');
            const rawCustomerName = document.getElementById('debt-customer').value;
            const finalCustomerName = getCanonicalCustomerName(rawCustomerName);
            const newDebt = { 
                customer: finalCustomerName, 
                amount: Math.abs(parseFloat(document.getElementById('debt-amount').value)), 
                date: document.getElementById('debt-date').value, 
                details: document.getElementById('debt-details').value.trim(),
                createdAt: serverTimestamp()
            };
            try {
                await addDoc(collection(db, 'debts'), newDebt);
                // لا نحتاج لتحديث القائمة المحلية يدوياً أو renderAll() هنا، onSnapshot سيتولى ذلك
                closeModal(elements.addDebtModal); 
                e.target.reset(); 
            } catch (error) {
                console.error("Error adding debt: ", error);
                alert("فشل إضافة الدين.");
            } finally { hideStatus(); }
        });
        
        elements.addShortageForm.addEventListener('submit', async (e) => { 
            e.preventDefault(); 
            showStatus('جارٍ إضافة الصنف الناقص...');
            const newShortage = { 
                name: document.getElementById('shortage-name').value.trim(), 
                notes: document.getElementById('shortage-notes').value.trim(), 
                purchased: false,
                createdAt: serverTimestamp()
            };
            try {
                await addDoc(collection(db, 'shortages'), newShortage);
                // لا نحتاج لتحديث القائمة المحلية يدوياً أو renderAll() هنا، onSnapshot سيتولى ذلك
                closeModal(elements.addShortageModal); 
                e.target.reset(); 
            } catch (error) {
                console.error("Error adding shortage: ", error);
                alert("فشل إضافة الصنف الناقص.");
            } finally { hideStatus(); }
        });
        
        elements.addPaymentForm.addEventListener('submit', async (e) => { 
            e.preventDefault(); 
            showStatus('جارٍ تسجيل الدفعة...');
            const rawCustomerName = elements.paymentCustomerNameInput.value;
            const finalCustomerName = getCanonicalCustomerName(rawCustomerName);
            const newPayment = { 
                customer: finalCustomerName, 
                amount: -Math.abs(parseFloat(document.getElementById('payment-amount').value)), // Payments are negative
                date: document.getElementById('payment-date').value, 
                details: document.getElementById('payment-details').value.trim() || 'دفعة نقدية',
                createdAt: serverTimestamp()
            };
            try {
                await addDoc(collection(db, 'debts'), newPayment);
                // لا نحتاج لتحديث القائمة المحلية يدوياً أو renderAll() هنا، onSnapshot سيتولى ذلك
                closeModal(elements.addPaymentModal); 
                e.target.reset(); 
            } catch (error) {
                console.error("Error adding payment: ", error);
                alert("فشل تسجيل الدفعة.");
            } finally { hideStatus(); }
        });
        
        elements.searchDebtsInput.addEventListener('input', () => renderDebts(elements.searchDebtsInput.value));
        elements.searchLast3MonthsDebtsInput.addEventListener('input', () => renderLast3MonthsDebts(elements.searchLast3MonthsDebtsInput.value)); 
        elements.searchMedicinesInput.addEventListener('input', () => renderMedicines(elements.searchMedicinesInput.value));
        elements.searchShortagesInput.addEventListener('input', () => renderShortages(elements.searchShortagesInput.value));

        elements.importFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = async (e) => { 
                if (!confirm('سيتم استبدال جميع البيانات الحالية في قاعدة البيانات السحابية والمحلية. هل أنت متأكد؟')) return;
                showStatus('جارٍ استيراد البيانات...');
                try {
                    const data = JSON.parse(e.target.result);
                    if (data && Array.isArray(data.medicines) && Array.isArray(data.debts) && Array.isArray(data.shortages) && Array.isArray(data.archivedDebts)) {
                        
                        // إيقاف مستمعي onSnapshot مؤقتاً لتجنب التحديثات المتكررة أثناء الاستيراد الكبير
                        unsubscribeMedicines && unsubscribeMedicines();
                        unsubscribeDebts && unsubscribeDebts();
                        unsubscribeShortages && unsubscribeShortages();
                        unsubscribeArchivedDebts && unsubscribeArchivedDebts();

                        const deleteAllDocsInCollection = async (collectionRef) => {
                            const q = query(collectionRef);
                            const snapshot = await getDocs(q);
                            const batch = writeBatch(db);
                            snapshot.docs.forEach(docItem => batch.delete(docItem.ref));
                            await batch.commit();
                        };
                        
                        await Promise.all([
                            deleteAllDocsInCollection(collection(db, 'medicines')),
                            deleteAllDocsInCollection(collection(db, 'debts')),
                            deleteAllDocsInCollection(collection(db, 'shortages')),
                            deleteAllDocsInCollection(collection(db, 'archivedDebts'))
                        ]);

                        const addImportedDataToCollection = async (collectionName, items) => {
                            const batch = writeBatch(db);
                            items.forEach(item => {
                                const docRef = doc(collection(db, collectionName)); 
                                const cleanedItem = { ...item };
                                if (cleanedItem.createdAt && typeof cleanedItem.createdAt === 'object' && cleanedItem.createdAt.seconds !== undefined) {
                                    // Already a Firebase Timestamp, keep it as is
                                } else if (cleanedItem.createdAt) {
                                    const dateObj = new Date(cleanedItem.createdAt);
                                    if (!isNaN(dateObj.getTime())) { // Use getTime() for robust check
                                        cleanedItem.createdAt = dateObj; 
                                    } else {
                                        cleanedItem.createdAt = serverTimestamp(); 
                                    }
                                } else {
                                    cleanedItem.createdAt = serverTimestamp(); 
                                }

                                if (cleanedItem.archiveDate && typeof cleanedItem.archiveDate === 'object' && cleanedItem.archiveDate.seconds !== undefined) {
                                    // Already a Firebase Timestamp
                                } else if (cleanedItem.archiveDate) {
                                    const dateObj = new Date(cleanedItem.archiveDate);
                                    if (!isNaN(dateObj.getTime())) { // Use getTime() for robust check
                                        cleanedItem.archiveDate = dateObj; 
                                    } else {
                                        cleanedItem.archiveDate = serverTimestamp(); 
                                    }
                                }
                                
                                batch.set(docRef, cleanedItem); 
                            });
                            await batch.commit();
                        };

                        await addImportedDataToCollection('medicines', data.medicines);
                        await addImportedDataToCollection('debts', data.debts);
                        await addImportedDataToCollection('shortages', data.shortages);
                        await addImportedDataToCollection('archivedDebts', data.archivedDebts);

                        // إعادة تفعيل مستمعي onSnapshot بعد اكتمال الاستيراد
                        setupFirestoreListeners(); 
                        alert('تم استيراد البيانات بنجاح إلى Firebase Firestore!');
                    } else { alert('ملف غير صالح أو بنيته غير صحيحة.'); }
                } catch (error) { 
                    console.error("Error importing data: ", error);
                    alert('خطأ في قراءة أو استيراد الملف.'); 
                } finally { hideStatus(); }
            };
            reader.readAsText(file);
            elements.importFileInput.value = '';
        });

        elements.shortageListContainer.addEventListener('change', async (e) => {
            if (e.target.classList.contains('shortage-item-checkbox')) {
                const shortageId = e.target.dataset.id;
                const newPurchasedStatus = e.target.checked;
                showStatus('جارٍ تحديث حالة الصنف...');
                try {
                    const shortageDocRef = doc(db, 'shortages', shortageId);
                    await updateDoc(shortageDocRef, { purchased: newPurchasedStatus });
                    // onSnapshot سيتولى تحديث الواجهة
                } catch (error) {
                    console.error("Error updating shortage status: ", error);
                    alert("فشل تحديث حالة الصنف.");
                } finally { hideStatus(); }
            }
        });

        document.body.addEventListener('click', async (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const id = target.dataset.id;
            const customerName = target.dataset.customer; 

            // Debt Archive
            if (target.id === 'open-debt-archive-btn') { 
                renderDebtArchive(); 
                openModal(elements.debtArchiveModal); 
            }
            else if (target.matches('.restore-debt-btn')) {
                showStatus('جارٍ استعادة الدين...');
                try {
                    const debtToRestore = archivedDebts.find(d => d.id == id);
                    if (debtToRestore) {
                        const { archiveReason, archiveDate, ...rest } = debtToRestore;
                        await addDoc(collection(db, 'debts'), { ...rest, createdAt: serverTimestamp() }); 
                        await deleteDoc(doc(db, 'archivedDebts', id)); 
                        // onSnapshot سيتولى تحديث الواجهة
                    }
                } catch (error) {
                    console.error("Error restoring debt: ", error);
                    alert("فشل استعادة الدين.");
                } finally { hideStatus(); }
            }
            else if (target.matches('.perm-delete-debt-btn')) {
                if (confirm('هل أنت متأكد من حذف هذه المعاملة نهائياً؟ لا يمكن التراجع.')) {
                    showStatus('جارٍ الحذف النهائي...');
                    try {
                        await deleteDoc(doc(db, 'archivedDebts', id));
                        // onSnapshot سيتولى تحديث الواجهة
                    } catch (error) {
                        console.error("Error permanently deleting debt: ", error);
                        alert("فشل الحذف النهائي للدين.");
                    } finally { hideStatus(); }
                }
            }
            else if (target.id === 'clear-archive-btn') {
                if (confirm('هل أنت متأكد من تفريغ سلة المحذوفات بالكامل؟ سيتم الحذف نهائياً.')) {
                    showStatus('جارٍ تفريغ سلة المحذوفات...');
                    try {
                        const q = query(collection(db, 'archivedDebts'));
                        const snapshot = await getDocs(q);
                        const batch = writeBatch(db);
                        snapshot.docs.forEach(docItem => batch.delete(docItem.ref));
                        await batch.commit();
                        // onSnapshot سيتولى تحديث الواجهة
                    } catch (error) {
                        console.error("Error clearing archive: ", error);
                        alert("فشل تفريغ سلة المحذوفات.");
                    } finally { hideStatus(); }
                }
            }
            // Add Modals - هذه الأجزاء لن تتغير بشكل جوهري، فقط عمليات onSnapshot تستمع للتغييرات
            else if (target.id === 'show-add-medicine-modal-btn') { 
                elements.addMedicineForm.reset(); 
                document.getElementById('med-expiry').valueAsDate = new Date(); 
                openModal(elements.addMedicineModal); 
            }
            else if (target.id === 'add-new-debt-btn') { 
                elements.addDebtForm.reset();
                document.getElementById('debt-date').valueAsDate = new Date();
                openModal(elements.addDebtModal);
            }
            else if (target.matches('.btn-add-debt-for-customer')) { 
                elements.addDebtForm.reset();
                document.getElementById('debt-customer').value = customerName;
                document.getElementById('debt-date').valueAsDate = new Date();
                openModal(elements.addDebtModal);
            }
            else if (target.matches('.btn-add-payment')) { 
                elements.addPaymentForm.reset();
                elements.paymentCustomerNameInput.value = customerName;
                elements.paymentCustomerDisplay.value = customerName;
                document.getElementById('payment-date').valueAsDate = new Date();
                openModal(elements.addPaymentModal);
            }
            else if (target.id === 'show-add-shortage-modal-btn') { 
                elements.addShortageForm.reset(); 
                openModal(elements.addShortageModal); 
            }
            
            // Delete Buttons - عمليات الحذف/الأرشفة ستعتمد على onSnapshot للتحديث
            else if (target.matches('.delete-debt-btn')) {
                if (confirm('هل أنت متأكد من نقل هذا الدين للأرشيف؟')) {
                    showStatus('جارٍ أرشفة الدين...');
                    try {
                        const debtToArchive = debts.find(d => d.id == id);
                        if (debtToArchive) {
                            const archivedDocRef = doc(collection(db, 'archivedDebts'));
                            await setDoc(archivedDocRef, { 
                                ...debtToArchive, 
                                archiveReason: 'محذوف يدويًا',
                                archiveDate: serverTimestamp()
                            });
                            await deleteDoc(doc(db, 'debts', id)); 
                            // onSnapshot سيتولى تحديث الواجهة
                        }
                    } catch (error) {
                        console.error("Error archiving debt: ", error);
                        alert("فشل أرشفة الدين.");
                    } finally { hideStatus(); }
                }
            } 
            else if (target.matches('.delete-med-btn')) { 
                if(confirm('هل أنت متأكد من حذف هذا الدواء؟')) { 
                    showStatus('جارٍ حذف الدواء...');
                    try {
                        await deleteDoc(doc(db, 'medicines', id));
                        // onSnapshot سيتولى تحديث الواجهة
                    } catch (error) {
                        console.error("Error deleting medicine: ", error);
                        alert("فشل حذف الدواء.");
                    } finally { hideStatus(); }
                }
            }
            else if (target.matches('.delete-shortage-btn')) { 
                if(confirm('هل أنت متأكد من حذف هذا الصنف؟')) { 
                    showStatus('جارٍ حذف الصنف...');
                    try {
                        await deleteDoc(doc(db, 'shortages', id));
                        // onSnapshot سيتولى تحديث الواجهة
                    } catch (error) {
                        console.error("Error deleting shortage: ", error);
                        alert("فشل حذف الصنف.");
                    } finally { hideStatus(); }
                }
            }
            else if (target.id === 'delete-selected-shortages-btn') {
                const purchasedCount = shortages.filter(s => s.purchased).length;
                if (purchasedCount > 0 && confirm(`هل أنت متأكد من حذف الـ ${purchasedCount} صنف/أصناف المحددة؟`)) {
                    showStatus('جارٍ حذف الأصناف المحددة...');
                    const batch = writeBatch(db);
                    shortages.filter(s => s.purchased).forEach(s => {
                        batch.delete(doc(db, 'shortages', s.id));
                    });
                    try {
                        await batch.commit();
                        // onSnapshot سيتولى تحديث الواجهة
                    } catch (error) {
                        console.error("Error deleting selected shortages: ", error);
                        alert("فشل حذف الأصناف المحددة.");
                    } finally { hideStatus(); }
                }
            }
        });
    }

    // هذه الدالة الآن مسؤولة فقط عن إعداد مستمعي onSnapshot
    // التي ستقوم بتعبئة القوائم المحلية وعرضها
    const loadInitialData = async (options = {}) => {
        const { showIndicators = false, showSuccessAlert = false } = options;
        if (showIndicators) showStatus('جارٍ تحميل البيانات...');
        
        // إعداد مستمعي onSnapshot
        setupFirestoreListeners();

        // لإظهار مؤشر التحميل ثم إخفائه فوراً بعد إعداد المستمعات
        // المستمعات نفسها ستجلب البيانات وتعرضها
        if (showIndicators) hideStatus();
        if(showSuccessAlert) alert('تم تهيئة المزامنة السحابية بنجاح!');
        // البيانات الأولية ستظهر بمجرد أن يقوم onSnapshot بجلبها
    };
    
    function initializePasswordCheck() {
        elements.allViewsAndIndicators.forEach(el => el.style.visibility = 'hidden');
        elements.passwordModal.style.display = 'flex';
        elements.passwordInput.focus();
        
        setupPermanentListeners();

        elements.passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (elements.passwordInput.value === sitePassword) {
                elements.passwordModal.style.display = 'none';
                await loadInitialData({ showIndicators: true, showSuccessAlert: false }); // ستقوم بإعداد المستمعات
                elements.allViewsAndIndicators.forEach(el => el.style.visibility = 'visible');
                setupAppListeners();
            } else {
                elements.passwordError.textContent = 'كلمة المرور غير صحيحة. حاول مرة أخرى.';
                elements.passwordInput.select();
            }
        });
    }

    initializePasswordCheck();
});