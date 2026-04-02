/**
 * BANKING SYSTEM - OOP CLASSES (GCash-Style)
 * 
 * One account per user. Simple, clean banking.
 * Core concepts:
 * - Encapsulation: User manages own account data
 * - Inheritance: Account extends base
 * - Polymorphism: Different account behavior
 * - Abstraction: Bank controller
 */

// ========== TRANSACTION CLASS ==========
class Transaction {
    constructor(type, amount, timestamp = new Date(), relatedUser = null) {
        if (!type || !amount || amount <= 0) {
            throw new Error('Invalid transaction');
        }
        this.type = type;        // 'deposit', 'withdraw', 'transfer-sent', 'transfer-received'
        this.amount = amount;
        this.timestamp = timestamp;
        this.relatedUser = relatedUser; // username for transfers
    }

    getDetails() {
        return {
            type: this.type,
            amount: this.amount,
            timestamp: this.timestamp,
            relatedUser: this.relatedUser,
            formattedTime: new Date(this.timestamp).toLocaleString()
        };
    }
}

// ========== ACCOUNT CLASS ==========
class Account {
    constructor(accountNumber, accountType = 'savings') {
        if (!accountNumber) {
            throw new Error('Account number required');
        }
        
        this._accountNumber = accountNumber;
        this._accountType = accountType; // 'savings' or 'current'
        this._balance = 0;
        this._transactions = [];
        this._createdDate = new Date();
    }

    get accountNumber() { return this._accountNumber; }
    get accountType() { return this._accountType; }
    get balance() { return this._balance; }
    get transactions() { return [...this._transactions]; }

    // Deposit money
    deposit(amount) {
        if (amount <= 0) {
            throw new Error('Amount must be greater than zero');
        }
        this._balance += amount;
        this._addTransaction('deposit', amount);
        return this._balance;
    }

    // Withdraw money
    withdraw(amount) {
        if (amount <= 0) {
            throw new Error('Amount must be greater than zero');
        }
        if (amount > this._balance) {
            throw new Error(`Insufficient balance. Available: $${this._balance.toFixed(2)}`);
        }
        this._balance -= amount;
        this._addTransaction('withdraw', amount);
        return this._balance;
    }

    getBalance() {
        return this._balance;
    }

    getTransactionHistory() {
        return this._transactions.map(t => ({
            ...t.getDetails(),
            balanceAfter: this._calculateBalanceAfter(t)
        }));
    }

    _addTransaction(type, amount, relatedUser = null) {
        const transaction = new Transaction(type, amount, new Date(), relatedUser);
        this._transactions.push(transaction);
    }

    _calculateBalanceAfter(transaction) {
        let balance = 0;
        for (let t of this._transactions) {
            if (t.type === 'deposit' || t.type === 'transfer-received') {
                balance += t.amount;
            } else {
                balance -= t.amount;
            }
            if (t === transaction) break;
        }
        return balance;
    }

    toJSON() {
        return {
            accountNumber: this._accountNumber,
            accountType: this._accountType,
            balance: this._balance,
            transactions: this._transactions.map(t => ({
                type: t.type,
                amount: t.amount,
                timestamp: t.timestamp,
                relatedUser: t.relatedUser
            })),
            createdDate: this._createdDate
        };
    }

    static fromJSON(data) {
        const account = new Account(data.accountNumber, data.accountType);
        account._balance = data.balance;
        account._createdDate = new Date(data.createdDate);
        
        data.transactions.forEach(t => {
            account._transactions.push(
                new Transaction(t.type, t.amount, new Date(t.timestamp), t.relatedUser)
            );
        });
        
        return account;
    }
}

// ========== USER CLASS ==========
class User {
    constructor(userId, username, password, profile = {}) {
        if (!userId || !username || !password) {
            throw new Error('All fields required');
        }
        
        this._userId = userId;
        this._username = username;
        this._password = password; // Plaintext for demo
        this._fullName = profile.fullName || username;
        this._phoneNumber = profile.phoneNumber || username;
        this._address = profile.address || '';
        this._gmail = profile.gmail || '';
        this._account = null; // Each user has ONE account
        this._createdDate = new Date();
    }

    get userId() { return this._userId; }
    get username() { return this._username; }
    get fullName() { return this._fullName; }
    get phoneNumber() { return this._phoneNumber; }
    get address() { return this._address; }
    get gmail() { return this._gmail; }
    get account() { return this._account; }
    get createdDate() { return this._createdDate; }

    // Create account for this user
    createAccount(accountNumber, accountType = 'savings') {
        if (this._account) {
            throw new Error('User already has an account');
        }
        this._account = new Account(accountNumber, accountType);
        return this._account;
    }

    verifyPassword(plainPassword) {
        return this._password === plainPassword;
    }

    toJSON() {
        return {
            userId: this._userId,
            username: this._username,
            password: this._password,
            fullName: this._fullName,
            phoneNumber: this._phoneNumber,
            address: this._address,
            gmail: this._gmail,
            account: this._account ? this._account.toJSON() : null,
            createdDate: this._createdDate
        };
    }

    static fromJSON(data) {
        const user = new User(data.userId, data.username, data.password, {
            fullName: data.fullName,
            phoneNumber: data.phoneNumber,
            address: data.address,
            gmail: data.gmail
        });
        user._createdDate = new Date(data.createdDate);
        if (data.account) {
            user._account = Account.fromJSON(data.account);
        }
        return user;
    }
}

// ========== BANK CLASS ==========
class Bank {
    constructor() {
        this._users = []; // All registered users
        this._currentUser = null;
        this._nextUserId = 1;
    }

    get users() { return [...this._users]; }
    get currentUser() { return this._currentUser; }
    get isLoggedIn() { return this._currentUser !== null; }

    /**
     * Register a new user (create bank account).
     */
    register(userData, password) {
        let username = '';
        let fullName = '';
        let phoneNumber = '';
        let address = '';
        let gmail = '';
        let finalPassword = password;

        if (typeof userData === 'object' && userData !== null) {
            fullName = (userData.fullName || '').trim();
            phoneNumber = (userData.phoneNumber || '').trim();
            address = (userData.address || '').trim();
            gmail = (userData.gmail || '').trim().toLowerCase();
            finalPassword = userData.password;
            username = phoneNumber;

            if (!fullName || !phoneNumber || !gmail || !finalPassword) {
                throw new Error('Name, number, gmail, and password are required');
            }

            if (!gmail.endsWith('@gmail.com')) {
                throw new Error('Please enter a valid Gmail address');
            }
        } else {
            username = userData;
            if (!username || !finalPassword) {
                throw new Error('Username and password required');
            }
            fullName = username;
            phoneNumber = username;
        }

        if (this._users.some(u => u.username === username)) {
            throw new Error('Number already exists');
        }

        if (gmail && this._users.some(u => (u.gmail || '').toLowerCase() === gmail)) {
            throw new Error('Gmail already exists');
        }

        if (finalPassword.length < 3) {
            throw new Error('Password must be at least 3 characters');
        }

        const userId = `user_${this._nextUserId++}`;
        const user = new User(userId, username, finalPassword, {
            fullName,
            phoneNumber,
            address,
            gmail
        });
        
        // Create account for user (GCash-style: one account per user)
        const accountNumber = this._generateAccountNumber();
        user.createAccount(accountNumber, 'savings');
        
        this._users.push(user);
        return user;
    }

    /**
     * Login user.
     */
    login(identifier, password) {
        const normalized = (identifier || '').trim().toLowerCase();
        const user = this._users.find(u =>
            u.username === identifier ||
            u.phoneNumber === identifier ||
            ((u.gmail || '').toLowerCase() === normalized)
        );
        
        if (!user) {
            throw new Error('User not found');
        }

        if (!user.verifyPassword(password)) {
            throw new Error('Incorrect password');
        }

        this._currentUser = user;
        return user;
    }

    /**
     * Logout user.
     */
    logout() {
        this._currentUser = null;
    }

    /**
     * Get current user's account.
     */
    getMyAccount() {
        if (!this._currentUser) {
            throw new Error('Not logged in');
        }
        return this._currentUser.account;
    }

    /**
     * Deposit to current user's account.
     */
    deposit(amount) {
        if (!this._currentUser) {
            throw new Error('Not logged in');
        }

        if (!amount || amount <= 0) {
            throw new Error('Amount must be greater than zero');
        }

        const account = this._currentUser.account;
        if (!account) {
            throw new Error('Account not found');
        }

        return account.deposit(amount);
    }

    /**
     * Withdraw from current user's account.
     */
    withdraw(amount) {
        if (!this._currentUser) {
            throw new Error('Not logged in');
        }

        if (!amount || amount <= 0) {
            throw new Error('Amount must be greater than zero');
        }

        const account = this._currentUser.account;
        if (!account) {
            throw new Error('Account not found');
        }

        return account.withdraw(amount);
    }

    /**
     * Transfer to another user by username.
     */
    transfer(toUsername, amount) {
        if (!this._currentUser) {
            throw new Error('Not logged in');
        }

        if (!amount || amount <= 0) {
            throw new Error('Amount must be greater than zero');
        }

        if (this._currentUser.username === toUsername) {
            throw new Error('Cannot transfer to yourself');
        }

        const toUser = this._users.find(u => u.username === toUsername);
        if (!toUser) {
            throw new Error(`User "${toUsername}" not found`);
        }

        if (!toUser.account) {
            throw new Error('Recipient has no account');
        }

        const fromAccount = this._currentUser.account;
        const toAccount = toUser.account;

        if (amount > fromAccount.balance) {
            throw new Error(`Insufficient balance. Available: $${fromAccount.balance.toFixed(2)}`);
        }

        // Perform transfer
        fromAccount.withdraw(amount);
        toAccount.deposit(amount);

        // Update transaction types
        const fromTxns = fromAccount._transactions;
        const toTxns = toAccount._transactions;
        fromTxns[fromTxns.length - 1].type = 'transfer-sent';
        fromTxns[fromTxns.length - 1].relatedUser = toUsername;
        toTxns[toTxns.length - 1].type = 'transfer-received';
        toTxns[toTxns.length - 1].relatedUser = this._currentUser.username;

        return {
            success: true,
            to: toUsername,
            amount: amount,
            newBalance: fromAccount.balance
        };
    }

    /**
     * Get user by username (for transfer search).
     */
    getUserByUsername(username) {
        const user = this._users.find(u => u.username === username);
        if (!user || !user.account) {
            throw new Error(`User "${username}" not found`);
        }
        return {
            username: user.username,
            fullName: user.fullName,
            accountNumber: user.account.accountNumber
        };
    }

    _generateAccountNumber() {
        return `ACC_${Date.now()}_${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }

    toJSON() {
        return {
            users: this._users.map(u => u.toJSON()),
            nextUserId: this._nextUserId
        };
    }

    static fromJSON(data) {
        const bank = new Bank();
        data.users.forEach(userData => {
            const user = User.fromJSON(userData);
            bank._users.push(user);
        });
        bank._nextUserId = data.nextUserId || 1;
        return bank;
    }
}
