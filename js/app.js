/**
 * APP INITIALIZATION
 */

window.bank = null;

function initApp() {
    const loaded = loadFromLocalStorage();
    if (!loaded) {
        window.bank = new Bank();
    }
}

function clearAllData() {
    localStorage.removeItem('bankData');
    window.bank = new Bank();
    window.bankSession = null;
}

window.clearAllData = clearAllData;

initApp();
