/**
 * UI LAYER - Minimal GCash-Style Banking
 */

function showAlert(elementId, message, type = 'error') {
    const alertEl = document.getElementById(elementId);
    if (!alertEl) return;

    alertEl.className = type === 'success'
        ? 'p-2 bg-green-50 text-green-700 text-sm rounded'
        : 'p-2 bg-red-50 text-red-700 text-sm rounded';

    alertEl.textContent = message;
    alertEl.classList.remove('hidden');

    setTimeout(() => {
        alertEl.classList.add('hidden');
    }, 3000);
}

function hideAlert(elementId) {
    const alertEl = document.getElementById(elementId);
    if (alertEl) alertEl.classList.add('hidden');
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('hidden');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
}

function renderDashboard() {
    try {
        if (!window.bank || !window.bank.isLoggedIn) return;

        const account = window.bank.getMyAccount();
        const accountType = account.constructor.name === 'SavingsAccount' ? 'Savings Account' : 'Current Account';

        document.getElementById('username').textContent = window.bank.currentUser.username;
        document.getElementById('balance').textContent = account.balance.toFixed(2);
        document.getElementById('accountNumber').textContent = account.accountNumber;

        const accountTypeEl = document.getElementById('accountTypeDisplay');
        if (accountTypeEl) accountTypeEl.textContent = accountType;

        renderTransactions(account);
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
    list.innerHTML = history.map((t) => {
        const icon = {
            'deposit': '[IN]',
            'withdraw': '[OUT]',
            'transfer-sent': '[SEND]',
            'transfer-received': '[RECV]'
        }[t.type] || '[TXN]';

        const label = {
            'deposit': 'Deposit',
            'withdraw': 'Withdrawal',
            'transfer-sent': `Sent to ${t.relatedUser}`,
            'transfer-received': `Received from ${t.relatedUser}`
        }[t.type] || t.type;

        const isIn = t.type === 'deposit' || t.type === 'transfer-received';

        return `
            <div class="flex justify-between items-center text-sm border-b pb-3 last:border-b-0">
                <div>
                    <div class="font-semibold text-gray-800">${icon} ${label}</div>
                    <div class="text-xs text-gray-500">${new Date(t.timestamp).toLocaleString()}</div>
                </div>
                <div class="text-right">
                    <div class="font-semibold ${isIn ? 'text-green-600' : 'text-red-600'}">${isIn ? '+' : '-'}$${t.amount.toFixed(2)}</div>
                    <div class="text-xs text-gray-500">bal $${t.balanceAfter.toFixed(2)}</div>
                </div>
            </div>
        `;
    }).join('');
}

function setupAuthEvents() {
    document.getElementById('loginTabBtn').addEventListener('click', () => {
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('registerForm').classList.add('hidden');
        document.getElementById('loginTabBtn').className = 'flex-1 py-2 px-4 bg-blue-600 text-white rounded font-semibold text-sm';
        document.getElementById('registerTabBtn').className = 'flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded font-semibold text-sm hover:bg-gray-300';
    });

    document.getElementById('registerTabBtn').addEventListener('click', () => {
        document.getElementById('registerForm').classList.remove('hidden');
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerTabBtn').className = 'flex-1 py-2 px-4 bg-blue-600 text-white rounded font-semibold text-sm';
        document.getElementById('loginTabBtn').className = 'flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded font-semibold text-sm hover:bg-gray-300';
    });

    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            hideAlert('loginAlert');
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;

            if (!username || !password) {
                showAlert('loginAlert', 'Username and password required');
                return;
            }

            window.bank.login(username, password);
            setSession(username);
            document.getElementById('authScreen').classList.add('hidden');
            document.getElementById('dashboardScreen').classList.remove('hidden');
            document.getElementById('loginForm').reset();
            document.getElementById('registerForm').reset();
            renderDashboard();
            saveToLocalStorage();
        } catch (error) {
            showAlert('loginAlert', error.message);
        }
    });

    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            hideAlert('registerAlert');
            const username = document.getElementById('registerUsername').value.trim();
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('registerPasswordConfirm').value;

            if (!username || !password) {
                showAlert('registerAlert', 'Username and password required');
                return;
            }

            if (password !== confirmPassword) {
                showAlert('registerAlert', 'Passwords do not match');
                return;
            }

            window.bank.register(username, password);
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
                showAlert('transferAlert', 'Enter username and valid amount');
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
        window.bank.getUserByUsername(username);
        document.getElementById('transferToName').textContent = username;
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

        // Backward compatibility: old format stored only Bank JSON.
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

    if (window.bank && window.bank.isLoggedIn) {
        document.getElementById('authScreen').classList.add('hidden');
        document.getElementById('dashboardScreen').classList.remove('hidden');
        renderDashboard();
    }
}

document.addEventListener('DOMContentLoaded', initUI);
