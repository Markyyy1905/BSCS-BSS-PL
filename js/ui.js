/**
 * UI LAYER - Tofu Bank
 */

let balanceChart = null;

function setActiveNav(navId) {
    const navIds = ['navDashboard', 'navTransactions', 'navProfile'];
    navIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (id === navId) {
            el.className = 'w-full text-left rounded-xl bg-blue-500/20 text-blue-300 px-4 py-3 border border-blue-400/20';
        } else {
            el.className = 'w-full text-left rounded-xl text-slate-300 hover:bg-white/10 px-4 py-3 transition';
        }
    });
}

function showSection(section) {
    const dashboardSection = document.getElementById('dashboardSection');
    const transactionsSection = document.getElementById('transactionsSection');
    const profileSection = document.getElementById('profileSection');

    if (!dashboardSection || !transactionsSection || !profileSection) return;

    dashboardSection.classList.add('hidden');
    transactionsSection.classList.add('hidden');
    profileSection.classList.add('hidden');

    if (section === 'transactions') {
        transactionsSection.classList.remove('hidden');
        setActiveNav('navTransactions');
        return;
    }

    if (section === 'profile') {
        profileSection.classList.remove('hidden');
        setActiveNav('navProfile');
        return;
    }

    dashboardSection.classList.remove('hidden');
    setActiveNav('navDashboard');
}

function renderProfile() {
    if (!window.bank || !window.bank.currentUser) return;

    const user = window.bank.currentUser;

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value || '-';
    };

    setText('profileFullName', user.fullName || user.username);
    setText('profilePhone', user.phoneNumber || user.username);
    setText('profileGmail', user.gmail || '-');
    setText('profileAddress', user.address || '-');
    setText('profileUserId', user.userId || '-');
    setText('profileCreated', user.createdDate ? new Date(user.createdDate).toLocaleString() : '-');
}

function setupNavigation() {
    const navDashboard = document.getElementById('navDashboard');
    const navTransactions = document.getElementById('navTransactions');
    const navProfile = document.getElementById('navProfile');

    if (navDashboard) navDashboard.addEventListener('click', () => showSection('dashboard'));
    if (navTransactions) navTransactions.addEventListener('click', () => showSection('transactions'));
    if (navProfile) navProfile.addEventListener('click', () => showSection('profile'));
}

function showAlert(elementId, message, type = 'error') {
    const alertEl = document.getElementById(elementId);
    if (alertEl) {
        alertEl.textContent = message;
        alertEl.classList.add('hidden');
    }

    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const baseClass = 'rounded-xl border px-4 py-3 text-sm backdrop-blur-md shadow-lg transition-all duration-300 opacity-0 translate-y-2';
    const typeClass = type === 'success'
        ? 'bg-emerald-500/20 border-emerald-300/30 text-emerald-200 shadow-emerald-500/20'
        : 'bg-red-500/20 border-red-300/30 text-red-200 shadow-red-500/20';

    toast.className = `${baseClass} ${typeClass}`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('opacity-0', 'translate-y-2');
    });

    setTimeout(() => {
        toast.classList.add('opacity-0', '-translate-y-1');
        setTimeout(() => toast.remove(), 250);
    }, 2800);
}

function hideAlert(elementId) {
    const alertEl = document.getElementById(elementId);
    if (alertEl) alertEl.classList.add('hidden');
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const panel = modal.firstElementChild;
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    if (panel) {
        panel.classList.add('opacity-0', 'scale-95');
        requestAnimationFrame(() => {
            panel.classList.remove('opacity-0', 'scale-95');
        });
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const panel = modal.firstElementChild;
    if (!panel) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        return;
    }

    panel.classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 180);
}

window.closeModal = closeModal;

function renderBalanceChart(account) {
    const canvas = document.getElementById('balanceChartCanvas');
    if (!canvas || typeof Chart === 'undefined') return;

    const history = account.getTransactionHistory().slice(-12);
    const labels = history.length > 0
        ? history.map((t, i) => `${i + 1}`)
        : ['1'];
    const dataPoints = history.length > 0
        ? history.map(t => Number(t.balanceAfter.toFixed(2)))
        : [0];

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, 'rgba(59,130,246,0.45)');
    gradient.addColorStop(1, 'rgba(59,130,246,0.02)');

    if (balanceChart) {
        balanceChart.data.labels = labels;
        balanceChart.data.datasets[0].data = dataPoints;
        balanceChart.update();
        return;
    }

    balanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Balance',
                data: dataPoints,
                borderColor: '#60a5fa',
                backgroundColor: gradient,
                borderWidth: 2.5,
                fill: true,
                tension: 0.35,
                pointRadius: 2,
                pointHoverRadius: 4,
                pointBackgroundColor: '#93c5fd'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.08)' },
                    ticks: { color: '#cbd5e1' }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.08)' },
                    ticks: { color: '#cbd5e1' }
                }
            }
        }
    });
}

function renderDashboard() {
    try {
        if (!window.bank || !window.bank.isLoggedIn) return;

        const account = window.bank.getMyAccount();
        const accountType = account.constructor.name === 'SavingsAccount' ? 'Savings Account' : 'Current Account';

        document.getElementById('username').textContent = window.bank.currentUser.fullName || window.bank.currentUser.username;
        document.getElementById('balance').textContent = account.balance.toFixed(2);
        document.getElementById('accountNumber').textContent = account.accountNumber;

        const history = account.getTransactionHistory();
        const totalDeposits = history
            .filter(t => t.type === 'deposit' || t.type === 'transfer-received')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalWithdrawals = history
            .filter(t => t.type === 'withdraw' || t.type === 'transfer-sent')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalDepositsEl = document.getElementById('totalDeposits');
        const totalWithdrawalsEl = document.getElementById('totalWithdrawals');
        if (totalDepositsEl) totalDepositsEl.textContent = totalDeposits.toFixed(2);
        if (totalWithdrawalsEl) totalWithdrawalsEl.textContent = totalWithdrawals.toFixed(2);

        const accountTypeEl = document.getElementById('accountTypeDisplay');
        if (accountTypeEl) accountTypeEl.textContent = accountType;

        renderTransactions(account);
        renderBalanceChart(account);
        renderProfile();
    } catch (error) {
        console.error('Error rendering dashboard:', error);
    }
}

function renderTransactions(account) {
    const history = account.getTransactionHistory().slice(0, 10);
    const list = document.getElementById('transactionList');
    const noMsg = document.getElementById('noTransactions');

    if (history.length === 0) {
        list.innerHTML = '';
        noMsg.classList.remove('hidden');
        return;
    }

    noMsg.classList.add('hidden');
    list.innerHTML = history.map((t, index) => {
        const label = {
            'deposit': 'Deposit',
            'withdraw': 'Withdraw',
            'transfer-sent': `Transfer to ${t.relatedUser}`,
            'transfer-received': `Transfer from ${t.relatedUser}`
        }[t.type] || t.type;

        const isIn = t.type === 'deposit' || t.type === 'transfer-received';
        const badgeClass = t.type === 'deposit' || t.type === 'transfer-received'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-300/20'
            : t.type === 'withdraw'
                ? 'bg-red-500/20 text-red-300 border border-red-300/20'
                : 'bg-blue-500/20 text-blue-300 border border-blue-300/20';

        const iconBg = t.type === 'deposit' || t.type === 'transfer-received'
            ? 'bg-emerald-500/20 text-emerald-300'
            : t.type === 'withdraw'
                ? 'bg-red-500/20 text-red-300'
                : 'bg-blue-500/20 text-blue-300';

        const icon = t.type === 'deposit' || t.type === 'transfer-received'
            ? '+'
            : t.type === 'withdraw'
                ? '-'
                : '<>';

        return `
            <div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 hover:bg-white/10 transition animate-[fadeIn_.3s_ease]" style="animation-delay:${index * 40}ms">
                <div class="flex items-start gap-3">
                    <div class="h-10 w-10 rounded-full ${iconBg} flex items-center justify-center font-bold">${icon}</div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-3">
                            <p class="font-semibold text-slate-100 truncate">${label}</p>
                            <p class="font-bold ${isIn ? 'text-emerald-300' : 'text-red-300'}">${isIn ? '+' : '-'}$${t.amount.toFixed(2)}</p>
                        </div>
                        <div class="mt-1 flex items-center justify-between gap-3 text-xs text-slate-400">
                            <p>${new Date(t.timestamp).toLocaleString()}</p>
                            <span class="inline-flex px-2 py-1 rounded-full text-xs font-semibold ${badgeClass}">Completed</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function setAuthTab(activeTab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginBtn = document.getElementById('loginTabBtn');
    const registerBtn = document.getElementById('registerTabBtn');
    const indicator = document.getElementById('authTabIndicator');

    if (activeTab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        loginBtn.classList.remove('text-slate-300');
        loginBtn.classList.add('text-white');
        registerBtn.classList.remove('text-white');
        registerBtn.classList.add('text-slate-300');
        if (indicator) indicator.style.transform = 'translateX(0%)';
    } else {
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        registerBtn.classList.remove('text-slate-300');
        registerBtn.classList.add('text-white');
        loginBtn.classList.remove('text-white');
        loginBtn.classList.add('text-slate-300');
        if (indicator) indicator.style.transform = 'translateX(100%)';
    }
}

function setupMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('appSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (!menuBtn || !sidebar || !backdrop) return;

    const openMenu = () => {
        sidebar.classList.remove('-translate-x-[120%]');
        backdrop.classList.remove('hidden');
    };

    const closeMenu = () => {
        sidebar.classList.add('-translate-x-[120%]');
        backdrop.classList.add('hidden');
    };

    menuBtn.addEventListener('click', openMenu);
    backdrop.addEventListener('click', closeMenu);

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            backdrop.classList.add('hidden');
            sidebar.classList.remove('-translate-x-[120%]');
        } else {
            sidebar.classList.add('-translate-x-[120%]');
        }
    });
}

function setupFabActions() {
    const fabToggle = document.getElementById('fabToggle');
    const fabActions = document.getElementById('fabActions');
    const fabDepositBtn = document.getElementById('fabDepositBtn');
    const fabWithdrawBtn = document.getElementById('fabWithdrawBtn');
    const fabTransferBtn = document.getElementById('fabTransferBtn');

    if (!fabToggle || !fabActions) return;

    fabToggle.addEventListener('click', () => {
        fabActions.classList.toggle('hidden');
        fabToggle.textContent = fabActions.classList.contains('hidden') ? '+' : 'x';
    });

    if (fabDepositBtn) {
        fabDepositBtn.addEventListener('click', () => {
            fabActions.classList.add('hidden');
            fabToggle.textContent = '+';
            document.getElementById('depositBtn').click();
        });
    }

    if (fabWithdrawBtn) {
        fabWithdrawBtn.addEventListener('click', () => {
            fabActions.classList.add('hidden');
            fabToggle.textContent = '+';
            document.getElementById('withdrawBtn').click();
        });
    }

    if (fabTransferBtn) {
        fabTransferBtn.addEventListener('click', () => {
            fabActions.classList.add('hidden');
            fabToggle.textContent = '+';
            document.getElementById('transferBtn').click();
        });
    }
}

function setupAuthEvents() {
    document.getElementById('loginTabBtn').addEventListener('click', () => {
        setAuthTab('login');
    });

    document.getElementById('registerTabBtn').addEventListener('click', () => {
        setAuthTab('register');
    });

    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            hideAlert('loginAlert');
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;

            if (!username || !password) {
                showAlert('loginAlert', 'Number/Gmail and password required');
                return;
            }

            const user = window.bank.login(username, password);
            setSession(user.username);
            document.getElementById('authScreen').classList.add('hidden');
            document.getElementById('dashboardScreen').classList.remove('hidden');
            document.getElementById('loginForm').reset();
            document.getElementById('registerForm').reset();
            renderDashboard();
            showSection('dashboard');
            saveToLocalStorage();
            showAlert('loginAlert', 'Welcome back!', 'success');
        } catch (error) {
            showAlert('loginAlert', error.message);
        }
    });

    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            hideAlert('registerAlert');
            const fullName = document.getElementById('registerFullName').value.trim();
            const phoneNumber = document.getElementById('registerPhoneNumber').value.trim();
            const address = document.getElementById('registerAddress').value.trim();
            const gmail = document.getElementById('registerGmail').value.trim();
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('registerPasswordConfirm').value;

            if (!fullName || !phoneNumber || !gmail || !password) {
                showAlert('registerAlert', 'Name, number, gmail, and password are required');
                return;
            }

            if (password !== confirmPassword) {
                showAlert('registerAlert', 'Passwords do not match');
                return;
            }

            window.bank.register({ fullName, phoneNumber, address, gmail, password });
            showAlert('registerAlert', 'Account created. You can now log in.', 'success');
            document.getElementById('loginTabBtn').click();
            document.getElementById('registerForm').reset();
            saveToLocalStorage();
        } catch (error) {
            showAlert('registerAlert', error.message);
        }
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        window.bank.logout();
        clearSession();
        document.getElementById('dashboardScreen').classList.add('hidden');
        document.getElementById('authScreen').classList.remove('hidden');
        document.getElementById('loginForm').reset();
        document.getElementById('registerForm').reset();
        saveToLocalStorage();
    });
}

function setupDepositEvent() {
    document.getElementById('depositBtn').addEventListener('click', () => {
        hideAlert('depositAlert');
        document.getElementById('depositAmount').value = '';
        openModal('depositModal');
    });

    document.getElementById('depositForm').addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            const amount = parseFloat(document.getElementById('depositAmount').value);
            if (!amount || amount <= 0) {
                showAlert('depositAlert', 'Enter valid amount');
                return;
            }

            window.bank.deposit(amount);
            showAlert('depositAlert', `Deposited $${amount.toFixed(2)}`, 'success');

            setTimeout(() => {
                closeModal('depositModal');
                renderDashboard();
                saveToLocalStorage();
            }, 700);
        } catch (error) {
            showAlert('depositAlert', error.message);
        }
    });
}

function setupWithdrawEvent() {
    document.getElementById('withdrawBtn').addEventListener('click', () => {
        hideAlert('withdrawAlert');
        document.getElementById('withdrawAmount').value = '';
        openModal('withdrawModal');
    });

    document.getElementById('withdrawForm').addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            const amount = parseFloat(document.getElementById('withdrawAmount').value);
            if (!amount || amount <= 0) {
                showAlert('withdrawAlert', 'Enter valid amount');
                return;
            }

            window.bank.withdraw(amount);
            showAlert('withdrawAlert', `Withdrawn $${amount.toFixed(2)}`, 'success');

            setTimeout(() => {
                closeModal('withdrawModal');
                renderDashboard();
                saveToLocalStorage();
            }, 700);
        } catch (error) {
            showAlert('withdrawAlert', error.message);
        }
    });
}

function setupTransferEvent() {
    document.getElementById('transferBtn').addEventListener('click', () => {
        hideAlert('transferAlert');
        document.getElementById('transferToUsername').value = '';
        document.getElementById('transferAmount').value = '';
        document.getElementById('transferToInfo').classList.add('hidden');
        openModal('transferModal');
    });

    document.getElementById('transferToUsername').addEventListener('change', searchUser);
    document.getElementById('transferToUsername').addEventListener('keyup', searchUser);

    document.getElementById('transferForm').addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            const toUsername = document.getElementById('transferToUsername').value.trim();
            const amount = parseFloat(document.getElementById('transferAmount').value);

            if (!toUsername || !amount || amount <= 0) {
                showAlert('transferAlert', 'Enter number and valid amount');
                return;
            }

            window.bank.transfer(toUsername, amount);
            showAlert('transferAlert', `Transferred $${amount.toFixed(2)} to ${toUsername}`, 'success');

            setTimeout(() => {
                closeModal('transferModal');
                renderDashboard();
                saveToLocalStorage();
            }, 700);
        } catch (error) {
            showAlert('transferAlert', error.message);
        }
    });
}

function searchUser() {
    const username = document.getElementById('transferToUsername').value.trim();
    const infoEl = document.getElementById('transferToInfo');

    if (!username) {
        infoEl.classList.add('hidden');
        return;
    }

    try {
        const user = window.bank.getUserByUsername(username);
        document.getElementById('transferToName').textContent = `${user.fullName} (${user.username})`;
        infoEl.classList.remove('hidden');
    } catch (error) {
        infoEl.classList.add('hidden');
    }
}

function generateSessionToken() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }
    return `tok_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function setSession(username) {
    window.bankSession = {
        token: generateSessionToken(),
        username
    };
}

function clearSession() {
    window.bankSession = null;
}

function saveToLocalStorage() {
    try {
        const payload = {
            version: 1,
            bank: window.bank.toJSON(),
            session: window.bankSession || null
        };
        localStorage.setItem('bankData', JSON.stringify(payload));
    } catch (error) {
        console.error('Error saving:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const raw = localStorage.getItem('bankData');
        if (!raw) return false;

        const parsed = JSON.parse(raw);

        if (parsed && Array.isArray(parsed.users)) {
            window.bank = Bank.fromJSON(parsed);
            clearSession();
            return true;
        }

        if (!parsed || !parsed.bank) return false;

        window.bank = Bank.fromJSON(parsed.bank);
        window.bankSession = parsed.session || null;

        if (window.bankSession && window.bankSession.username) {
            const user = window.bank.users.find(u => u.username === window.bankSession.username);
            if (user) {
                window.bank._currentUser = user;
            } else {
                clearSession();
            }
        }

        return true;
    } catch (error) {
        console.error('Error loading:', error);
        return false;
    }
}

function initUI() {
    setupAuthEvents();
    setupDepositEvent();
    setupWithdrawEvent();
    setupTransferEvent();
    setupMobileMenu();
    setupFabActions();
    setupNavigation();
    setAuthTab('login');

    if (window.bank && window.bank.isLoggedIn) {
        document.getElementById('authScreen').classList.add('hidden');
        document.getElementById('dashboardScreen').classList.remove('hidden');
        renderDashboard();
        showSection('dashboard');
    }
}

document.addEventListener('DOMContentLoaded', initUI);
