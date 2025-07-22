document.addEventListener('DOMContentLoaded', () => {

    // Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBPS0hsov3pT7BrnLO-1T2RRkd2yTUU4pk",
  authDomain: "doctoribrahim-5aa53.firebaseapp.com",
  projectId: "doctoribrahim-5aa53",
  storageBucket: "doctoribrahim-5aa53.firebasestorage.app",
  messagingSenderId: "864152688454",
  appId: "1:864152688454:web:e206b306e226d0c8daf747",
  measurementId: "G-8D2JDQBGQM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
    };

    const sitePassword = "2211";

    const elements = {
        passwordModal: document.getElementById('password-modal'),
        passwordForm: document.getElementById('password-form'),
        passwordInput: document.getElementById('password-input'),
        passwordError: document.getElementById('password-error'),
        togglePasswordVisibility: document.getElementById('toggle-password-visibility'),
        allViewsAndIndicators: document.querySelectorAll('.view, #status-indicator'),
        autoSyncToggle: document.getElementById('auto-sync-toggle'),
        syncStatusIcon: document.getElementById('sync-status-icon'),
        syncStatusText: document.getElementById('sync-status-text'),
        statusIndicator: document.getElementById('status-indicator'),
        statusText: document.getElementById('status-text'),
        dashboardView: document.getElementById('dashboard-view'),
        medicinesView: document.getElementById('medicines-view'),
        debtsView: document.getElementById('debts-view'),
        shortagesView: document.getElementById('shortages-view'),
        allViews: document.querySelectorAll('.view'),
        openMedicinesBtn: document.getElementById('open-medicines-btn'),
        openDebtsBtn: document.getElementById('open-debts-btn'),
        openShortagesBtn: document.getElementById('open-shortages-btn'),
        backButtons: document.querySelectorAll('.back-btn'),
        backupDataBtn: document.getElementById('backup-data-btn'),
        importDataBtn: document.getElementById('import-data-btn'),
        importFileInput: document.getElementById('import-file-input'),
        medicineTimelineContainer: document.getElementById('medicine-timeline-container'),
        debtListContainer: document.getElementById('debt-list-container'),
        shortageListContainer: document.getElementById('shortage-list-container'),
        searchDebtsInput: document.getElementById('search-debts-input'),
        searchMedicinesInput: document.getElementById('search-medicines-input'),
        searchShortagesInput: document.getElementById('search-shortages-input'),
        totalDebtsAmountEl: document.getElementById('total-debts-amount'),
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
        githubSaveBtn: document.getElementById('github-save-btn'),
        githubLoadBtn: document.getElementById('github-load-btn'),
        // Archive elements
        debtArchiveModal: document.getElementById('debt-archive-modal'),
        openDebtArchiveBtn: document.getElementById('open-debt-archive-btn'),
        debtArchiveList: document.getElementById('debt-archive-list'),
        clearArchiveBtn: document.getElementById('clear-archive-btn'),
    };

    let medicines = [];
    let debts = [];
    let shortages = [];
    let archivedDebts = [];
    let debounceTimer;
    let isAutoSyncEnabled = localStorage.getItem('autoSyncEnabled') === 'true';

    const showStatus = (text) => {
        elements.statusText.textContent = text;
        elements.statusIndicator.classList.remove('hidden');
    };
    const hideStatus = () => {
        elements.statusIndicator.classList.add('hidden');
    };
    const saveData = () => {
        localStorage.setItem('medicines', JSON.stringify(medicines));
        localStorage.setItem('debts', JSON.stringify(debts));
        localStorage.setItem('shortages', JSON.stringify(shortages));
        localStorage.setItem('archivedDebts', JSON.stringify(archivedDebts));
        triggerAutoSave();
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

    const archiveSettledDebts = () => {
        const customerDebtsMap = debts.reduce((acc, debt) => {
            acc[debt.customer] = acc[debt.customer] || [];
            acc[debt.customer].push(debt);
            return acc;
        }, {});

        let aChangeWasMade = false;
        Object.keys(customerDebtsMap).forEach(customer => {
            const customerTotal = customerDebtsMap[customer].reduce((sum, debt) => sum + parseFloat(debt.amount), 0);
            if (customerTotal <= 0) {
                const transactionsToArchive = debts.filter(d => d.customer === customer);
                transactionsToArchive.forEach(t => {
                    t.archiveReason = 'تمت التسوية بالكامل';
                    t.archiveDate = new Date().toISOString();
                });
                archivedDebts.push(...transactionsToArchive);
                debts = debts.filter(d => d.customer !== customer);
                aChangeWasMade = true;
            }
        });
        if (aChangeWasMade) {
            saveData();
        }
    };

    const renderDebts = (searchTerm = '') => {
        archiveSettledDebts();

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
        
        const sortedArchive = archivedDebts.sort((a, b) => new Date(b.archiveDate) - new Date(a.archiveDate));
        elements.debtArchiveList.innerHTML = sortedArchive.map(item => {
            const amount = parseFloat(item.amount);
            const isPayment = amount < 0;
            return `
            <div class="archive-item">
                <div class="archive-item-info">
                    <h4>${item.customer}</h4>
                    <p><strong class="${isPayment ? 'text-green' : 'text-red'}">${isPayment ? 'دفعة: ' : 'دين: '}${Math.abs(amount).toFixed(2)} شيكل</strong> - بتاريخ: ${item.date}</p>
                    <p class="archive-reason">سبب الأرشفة: ${item.archiveReason || 'غير محدد'} (${new Date(item.archiveDate).toLocaleDateString('ar-EG')})</p>
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
        renderShortages(elements.searchShortagesInput.value);
    };

    function setSyncStatus(status, text) {
        elements.syncStatusIcon.className = 'fa-solid';
        switch (status) {
            case 'on': elements.syncStatusIcon.classList.add('fa-check', 'sync-on'); break;
            case 'pending': elements.syncStatusIcon.classList.add('fa-floppy-disk', 'sync-pending'); break;
            case 'in-progress': elements.syncStatusIcon.classList.add('fa-arrows-rotate', 'fa-spin', 'sync-in-progress'); break;
            default: elements.syncStatusIcon.classList.add('fa-power-off', 'sync-off'); break;
        }
        elements.syncStatusText.textContent = text;
    }

    const handleGithubSave = async (isAuto = false) => {
        if (!isAuto) showStatus('جارٍ حفظ البيانات...');
        setSyncStatus('in-progress', 'جارٍ الحفظ...');
        elements.githubSaveBtn.disabled = true;
        
        try {
            const allData = { 
                medicines: JSON.parse(localStorage.getItem('medicines')) || [],
                debts: JSON.parse(localStorage.getItem('debts')) || [],
                shortages: JSON.parse(localStorage.getItem('shortages')) || [],
                archivedDebts: JSON.parse(localStorage.getItem('archivedDebts')) || []
            };

            if (allData.medicines.length === 0 && allData.debts.length === 0 && allData.shortages.length === 0 && allData.archivedDebts.length === 0) {
                setSyncStatus('on', 'لا توجد بيانات للحفظ');
                if (!isAuto) hideStatus();
                elements.githubSaveBtn.disabled = false;
                return;
            }

            const response = await fetch('/api/save-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...GITHUB_CONFIG, ...allData })
            });

            if (!response.ok) throw new Error((await response.json()).error || `Server error: ${response.statusText}`);

            if (!isAuto) alert("تم حفظ البيانات بنجاح في السحابة!");
            setSyncStatus(isAutoSyncEnabled ? 'on' : 'off', isAutoSyncEnabled ? 'كل شيء محدّث' : 'تم الحفظ يدوياً');
        } catch (error) {
            if (!isAuto) alert(`فشل حفظ البيانات: ${error.message}`);
            setSyncStatus('pending', 'فشل الحفظ');
        } finally {
            if (!isAuto) hideStatus();
            elements.githubSaveBtn.disabled = false;
        }
    };
        
    const handleGithubLoad = async () => {
        if (!confirm('سيتم استبدال البيانات المحلية بالبيانات الموجودة في السحابة. هل أنت متأكد؟')) return;
        elements.githubLoadBtn.disabled = true;
        await loadInitialData({ showIndicators: true, showSuccessAlert: true, forceCloud: true });
        elements.githubLoadBtn.disabled = false;
    };

    function triggerAutoSave() {
        if (!isAutoSyncEnabled) return;
        clearTimeout(debounceTimer);
        setSyncStatus('pending', 'تغييرات لم تُحفظ');
        debounceTimer = setTimeout(() => handleGithubSave(true), 3000);
    }
    
    function setupAutoSync() {
        elements.autoSyncToggle.checked = isAutoSyncEnabled;
        setSyncStatus(isAutoSyncEnabled ? 'on' : 'off', isAutoSyncEnabled ? 'المزامنة فعّالة' : 'المزامنة متوقفة');
        elements.autoSyncToggle.addEventListener('change', (e) => {
            isAutoSyncEnabled = e.target.checked;
            localStorage.setItem('autoSyncEnabled', isAutoSyncEnabled);
            if (isAutoSyncEnabled) { setSyncStatus('on', 'المزامنة فعّالة'); triggerAutoSave(); }
            else { setSyncStatus('off', 'المزامنة متوقفة'); clearTimeout(debounceTimer); }
        });
    }
    
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

    function setupAppListeners() {
        elements.openMedicinesBtn.addEventListener('click', () => showView(elements.medicinesView));
        elements.openDebtsBtn.addEventListener('click', () => showView(elements.debtsView));
        elements.openShortagesBtn.addEventListener('click', () => showView(elements.shortagesView));
        elements.backButtons.forEach(btn => btn.addEventListener('click', () => showView(elements.dashboardView)));
        elements.closeButtons.forEach(btn => btn.addEventListener('click', (e) => closeModal(e.target.closest('.modal'))));
        
        elements.githubSaveBtn.addEventListener('click', () => handleGithubSave(false));
        elements.githubLoadBtn.addEventListener('click', handleGithubLoad);
        elements.backupDataBtn.addEventListener('click', () => {
             const allData = { medicines, debts, shortages, archivedDebts };
             if (medicines.length === 0 && debts.length === 0 && shortages.length === 0 && archivedDebts.length === 0) return alert('لا توجد بيانات لعمل نسخة احتياطية.');
             const dataStr = JSON.stringify(allData, null, 2); 
             const blob = new Blob([dataStr], { type: 'application/json' }); 
             const url = URL.createObjectURL(blob); 
             const a = document.createElement('a'); 
             a.href = url; a.download = `pharmacy_backup_${new Date().toISOString().slice(0, 10)}.json`; 
             a.click(); 
             URL.revokeObjectURL(url); 
        });
        elements.importDataBtn.addEventListener('click', () => elements.importFileInput.click());

        elements.addMedicineForm.addEventListener('submit', (e) => { e.preventDefault(); medicines.push({ id: Date.now(), name: document.getElementById('med-name').value.trim(), barcode: document.getElementById('med-barcode').value, expiry: document.getElementById('med-expiry').value, price: parseFloat(document.getElementById('med-price').value) }); saveData(); renderAll(); closeModal(elements.addMedicineModal); e.target.reset(); });
        
        // === تطبيق الإصلاح على نموذج إضافة الدين ===
        elements.addDebtForm.addEventListener('submit', (e) => { 
            e.preventDefault(); 
            const rawCustomerName = document.getElementById('debt-customer').value;
            const finalCustomerName = getCanonicalCustomerName(rawCustomerName);
            debts.push({ id: Date.now(), customer: finalCustomerName, amount: Math.abs(parseFloat(document.getElementById('debt-amount').value)), date: document.getElementById('debt-date').value, details: document.getElementById('debt-details').value.trim() }); 
            saveData(); 
            renderAll(); 
            closeModal(elements.addDebtModal); 
            e.target.reset(); 
        });
        
        elements.addShortageForm.addEventListener('submit', (e) => { e.preventDefault(); shortages.push({ id: Date.now(), name: document.getElementById('shortage-name').value.trim(), notes: document.getElementById('shortage-notes').value.trim(), purchased: false }); saveData(); renderAll(); closeModal(elements.addShortageModal); e.target.reset(); });
        
        // === تطبيق الإصلاح على نموذج إضافة الدفعة ===
        elements.addPaymentForm.addEventListener('submit', (e) => { 
            e.preventDefault(); 
            const rawCustomerName = elements.paymentCustomerNameInput.value;
            const finalCustomerName = getCanonicalCustomerName(rawCustomerName);
            debts.push({ id: Date.now(), customer: finalCustomerName, amount: -Math.abs(parseFloat(document.getElementById('payment-amount').value)), date: document.getElementById('payment-date').value, details: document.getElementById('payment-details').value.trim() || 'دفعة نقدية' }); 
            saveData(); 
            renderAll(); 
            closeModal(elements.addPaymentModal); 
            e.target.reset(); 
        });
        
        elements.searchDebtsInput.addEventListener('input', () => renderDebts(elements.searchDebtsInput.value));
        elements.searchMedicinesInput.addEventListener('input', () => renderMedicines(elements.searchMedicinesInput.value));
        elements.searchShortagesInput.addEventListener('input', () => renderShortages(elements.searchShortagesInput.value));

        elements.importFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                if (!confirm('سيتم استبدال جميع البيانات الحالية. هل أنت متأكد؟')) return;
                try {
                    const data = JSON.parse(e.target.result);
                    if (data && Array.isArray(data.medicines) && Array.isArray(data.debts) && Array.isArray(data.shortages)) {
                        medicines = data.medicines;
                        debts = data.debts;
                        shortages = data.shortages;
                        archivedDebts = data.archivedDebts || [];
                        saveData();
                        renderAll();
                        alert('تم استيراد البيانات بنجاح!');
                    } else { alert('ملف غير صالح.'); }
                } catch { alert('خطأ في قراءة الملف.'); }
            };
            reader.readAsText(file);
            elements.importFileInput.value = '';
        });

        elements.shortageListContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('shortage-item-checkbox')) {
                const shortageItem = shortages.find(s => s.id == e.target.dataset.id);
                if (shortageItem) {
                    shortageItem.purchased = e.target.checked;
                    saveData();
                    renderShortages(elements.searchShortagesInput.value);
                }
            }
        });

        document.body.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const id = target.dataset.id;
            const customerName = target.dataset.customer;

            // Debt Archive
            if (target.id === 'open-debt-archive-btn') { renderDebtArchive(); openModal(elements.debtArchiveModal); }
            else if (target.matches('.restore-debt-btn')) {
                const debtToRestore = archivedDebts.find(d => d.id == id);
                if (debtToRestore) {
                    delete debtToRestore.archiveReason; delete debtToRestore.archiveDate;
                    debts.push(debtToRestore);
                    archivedDebts = archivedDebts.filter(d => d.id != id);
                    saveData(); renderDebtArchive(); renderDebts(elements.searchDebtsInput.value);
                }
            }
            else if (target.matches('.perm-delete-debt-btn')) {
                if (confirm('هل أنت متأكد من حذف هذه المعاملة نهائياً؟ لا يمكن التراجع.')) {
                    archivedDebts = archivedDebts.filter(d => d.id != id);
                    saveData(); renderDebtArchive();
                }
            }
            else if (target.id === 'clear-archive-btn') {
                if (confirm('هل أنت متأكد من تفريغ سلة المحذوفات بالكامل؟ سيتم الحذف نهائياً.')) {
                    archivedDebts = []; saveData(); renderDebtArchive();
                }
            }
            // Add Modals
            else if (target.id === 'show-add-medicine-modal-btn') { elements.addMedicineForm.reset(); document.getElementById('med-expiry').valueAsDate = new Date(); openModal(elements.addMedicineModal); }
            else if (target.id === 'add-new-debt-btn') {
                elements.addDebtForm.reset();
                document.getElementById('debt-customer').disabled = false;
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
            else if (target.id === 'show-add-shortage-modal-btn') { elements.addShortageForm.reset(); openModal(elements.addShortageModal); }
            
            // Delete Buttons
            else if (target.matches('.delete-debt-btn')) {
                const debtToArchive = debts.find(d => d.id == id);
                if (debtToArchive) {
                    debtToArchive.archiveReason = 'محذوف يدويًا';
                    debtToArchive.archiveDate = new Date().toISOString();
                    archivedDebts.push(debtToArchive);
                    debts = debts.filter(d => d.id != id);
                    saveData(); renderDebts(elements.searchDebtsInput.value);
                }
            } 
            else if (target.matches('.delete-med-btn')) { if(confirm('هل أنت متأكد من حذف هذا الدواء؟')) { medicines = medicines.filter(m => m.id != id); saveData(); renderAll(); }}
            else if (target.matches('.delete-shortage-btn')) { if(confirm('هل أنت متأكد من حذف هذا الصنف؟')) { shortages = shortages.filter(s => s.id != id); saveData(); renderAll(); }}
            else if (target.id === 'delete-selected-shortages-btn') {
                const purchasedCount = shortages.filter(s => s.purchased).length;
                if (purchasedCount > 0 && confirm(`هل أنت متأكد من حذف الـ ${purchasedCount} صنف/أصناف المحددة؟`)) {
                    shortages = shortages.filter(s => !s.purchased);
                    saveData(); renderAll();
                }
            }
        });
    }

    const loadInitialData = async (options = {}) => {
        const { showIndicators = false, showSuccessAlert = false, forceCloud = false } = options;

        if (showIndicators) showStatus('جارٍ تحميل البيانات...');
        let dataLoadedFromCloud = false;

        if (forceCloud || isAutoSyncEnabled) {
            try {
                const response = await fetch('/api/load-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(GITHUB_CONFIG) });
                if (response.ok) {
                    let data = await response.json();
                    if (typeof data === 'string') data = JSON.parse(data);
                    
                    if (data && typeof data === 'object' && Array.isArray(data.medicines) && Array.isArray(data.debts) && Array.isArray(data.shortages)) {
                        medicines = data.medicines;
                        debts = data.debts;
                        shortages = data.shortages;
                        archivedDebts = data.archivedDebts || [];
                        saveData();
                        if(showSuccessAlert) alert('تم استيراد أحدث البيانات من السحابة بنجاح!');
                        dataLoadedFromCloud = true;
                    } else if (showIndicators && showSuccessAlert) {
                        alert('صيغة البيانات من السحابة غير صالحة، سيتم استخدام البيانات المحلية.');
                    }
                } else if (response.status !== 404 && showIndicators && showSuccessAlert) {
                    alert(`خطأ في الاتصال بالسحابة (${response.status}). سيتم استخدام البيانات المحلية.`);
                }
            } catch (error) {
                if (showIndicators && showSuccessAlert) alert("فشل الاتصال بالشبكة. سيتم استخدام البيانات المحلية.");
            }
        }
        
        if (!dataLoadedFromCloud) {
            medicines = JSON.parse(localStorage.getItem('medicines')) || [];
            debts = JSON.parse(localStorage.getItem('debts')) || [];
            shortages = JSON.parse(localStorage.getItem('shortages')) || [];
            archivedDebts = JSON.parse(localStorage.getItem('archivedDebts')) || [];
        }

        if (showIndicators) hideStatus();
        renderAll();
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
                await loadInitialData({ showIndicators: true, showSuccessAlert: false });
                elements.allViewsAndIndicators.forEach(el => el.style.visibility = 'visible');
                setupAutoSync();
                setupAppListeners();
            } else {
                elements.passwordError.textContent = 'كلمة المرور غير صحيحة. حاول مرة أخرى.';
                elements.passwordInput.select();
            }
        });
    }

    initializePasswordCheck();
});