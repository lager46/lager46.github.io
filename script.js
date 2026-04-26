class DataStore {
    constructor() {
        this.initStorage();
    }
    
    initStorage() {
        if (!localStorage.getItem('users')) {
            localStorage.setItem('users', JSON.stringify([]));
        }
        
        const users = JSON.parse(localStorage.getItem('users'));
        if (users.length === 0) {
            const testUsers = [
                {
                    id: 1,
                    email: "admin@test.ru",
                    password: "admin123",
                    username: "Админ",
                    phone: "+79991112233",
                    role: "admin",
                    isBlocked: false,
                    createdAt: new Date().toISOString(),
                    balance: 100000
                },
                {
                    id: 2,
                    email: "user@test.ru",
                    password: "user123",
                    username: "Иван",
                    phone: "+79992223344",
                    role: "user",
                    isBlocked: false,
                    createdAt: new Date().toISOString(),
                    balance: 50000
                }
            ];
            localStorage.setItem('users', JSON.stringify(testUsers));
        }
        
        if (!localStorage.getItem('motorcycles')) {
            localStorage.setItem('motorcycles', JSON.stringify([
                {
                    id: 1,
                    title: "Harley-Davidson Sportster",
                    brand: "Harley-Davidson",
                    model: "Sportster 1200",
                    year: 2020,
                    startingPrice: 850000,
                    currentPrice: 920000,
                    description: "Идеальное состояние, пробег 5000 км. Полностью обслужен, без ДТП. В комплекте чехол и дополнительные ключи.",
                    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                    sellerId: 1,
                    status: "active",
                    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    bids: [
                        { userId: 2, amount: 850000, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), username: "Иван" },
                        { userId: 1, amount: 920000, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), username: "Админ" }
                    ]
                },
                {
                    id: 2,
                    title: "Yamaha R1",
                    brand: "Yamaha",
                    model: "YZF-R1",
                    year: 2021,
                    startingPrice: 1000000,
                    currentPrice: 1800000,
                    description: "Спортивный мотоцикл в отличном состоянии. Установлена спортивная выхлопная система. Пробег 3000 км.",
                    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                    sellerId: 2,
                    status: "active",
                    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                    bids: [
                        { userId: 1, amount: 21000, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), username: "Админ" },
                        { userId: 2, amount: 22000, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), username: "Иван" },
                        { userId: 1, amount: 22500, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), username: "Админ" }
                    ]
                },
                {
                    id: 3,
                    title: "Honda CBR600RR",
                    brand: "Honda",
                    model: "CBR600RR",
                    year: 2019,
                    startingPrice: 12000,
                    currentPrice: 12000,
                    description: "Отличный спортивный мотоцикл для трека. Пробег 8000 км. Все оригинальные запчасти.",
                    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                    sellerId: 1,
                    status: "pending",
                    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
                    bids: []
                }
            ]));
        }
        
        if (!localStorage.getItem('sales')) {
            localStorage.setItem('sales', JSON.stringify([]));
        }
        
        if (!localStorage.getItem('complaints')) {
            localStorage.setItem('complaints', JSON.stringify([]));
        }
        
        if (!localStorage.getItem('theme')) {
            localStorage.setItem('theme', 'dark');
        }
    }
    
    getUsers() {
        return JSON.parse(localStorage.getItem('users')) || [];
    }
    
    saveUser(user) {
        const users = this.getUsers();
        user.id = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        user.createdAt = new Date().toISOString();
        user.role = user.role || 'user';
        user.isBlocked = false;
        user.balance = user.balance || 0;
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
        return user;
    }
    
    findUserByEmail(email) {
        const users = this.getUsers();
        return users.find(user => user.email === email);
    }
    
    getMotorcycles() {
        return JSON.parse(localStorage.getItem('motorcycles')) || [];
    }
    
    saveMotorcycle(motorcycle) {
        const motorcycles = this.getMotorcycles();
        motorcycle.id = motorcycles.length > 0 ? Math.max(...motorcycles.map(m => m.id)) + 1 : 1;
        motorcycle.createdAt = new Date().toISOString();
        motorcycle.status = motorcycle.status || 'pending';
        motorcycle.bids = motorcycle.bids || [];
        motorcycle.images = motorcycle.images || [motorcycle.image];
        motorcycles.push(motorcycle);
        localStorage.setItem('motorcycles', JSON.stringify(motorcycles));
        return motorcycle;
    }
    
    updateMotorcycle(id, updates) {
        const motorcycles = this.getMotorcycles();
        const index = motorcycles.findIndex(m => m.id === id);
        if (index !== -1) {
            motorcycles[index] = { ...motorcycles[index], ...updates };
            localStorage.setItem('motorcycles', JSON.stringify(motorcycles));
            return motorcycles[index];
        }
        return null;
    }
    
    deleteMotorcycle(id) {
        const motorcycles = this.getMotorcycles();
        const filtered = motorcycles.filter(m => m.id !== id);
        localStorage.setItem('motorcycles', JSON.stringify(filtered));
        return true;
    }
    
    addBid(motorcycleId, userId, amount, username) {
        const motorcycles = this.getMotorcycles();
        const motorcycle = motorcycles.find(m => m.id === motorcycleId);
        if (motorcycle) {
            const bid = {
                userId: userId,
                amount: amount,
                timestamp: new Date().toISOString(),
                username: username
            };
            motorcycle.bids.push(bid);
            if (bid.amount > motorcycle.currentPrice) {
                motorcycle.currentPrice = bid.amount;
            }
            localStorage.setItem('motorcycles', JSON.stringify(motorcycles));
            return true;
        }
        return false;
    }
    
    getSales() {
        return JSON.parse(localStorage.getItem('sales')) || [];
    }
    
    saveSale(sale) {
        const sales = this.getSales();
        sale.id = sales.length + 1;
        sale.date = new Date().toISOString();
        sales.push(sale);
        localStorage.setItem('sales', JSON.stringify(sales));
        return sale;
    }
    
    getComplaints() {
        return JSON.parse(localStorage.getItem('complaints')) || [];
    }
}

class AuthSystem {
    constructor() {
        this.dataStore = new DataStore();
        this.currentUser = this.getCurrentUser();
    }
    
    register(email, password, username, phone) {
        if (this.dataStore.findUserByEmail(email)) {
            return { success: false, message: 'Пользователь с таким email уже существует' };
        }
        const user = { email, password, username, phone, role: 'user' };
        this.dataStore.saveUser(user);
        return { success: true, message: 'Регистрация успешна' };
    }
    
    login(email, password) {
        const user = this.dataStore.findUserByEmail(email);
        if (!user) return { success: false, message: 'Пользователь не найден' };
        if (user.password !== password) return { success: false, message: 'Неверный пароль' };
        if (user.isBlocked) return { success: false, message: 'Аккаунт заблокирован' };
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUser = user;
        return { success: true, message: 'Вход выполнен', user };
    }
    
    logout() {
        localStorage.removeItem('currentUser');
        this.currentUser = null;
        window.location.href = 'index.html';
    }
    
    getCurrentUser() {
        const userJson = localStorage.getItem('currentUser');
        return userJson ? JSON.parse(userJson) : null;
    }
    
    isLoggedIn() {
        return this.currentUser !== null;
    }
    
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }
}

class AuctionSystem {
    constructor() {
        this.dataStore = new DataStore();
        this.auth = new AuthSystem();
    }
    
    getActiveAuctions() {
        const motorcycles = this.dataStore.getMotorcycles();
        return motorcycles.filter(m => m.status === 'active');
    }
    
    createAuction(motorcycleData) {
        if (!this.auth.isLoggedIn()) {
            return { success: false, message: 'Необходима авторизация' };
        }
        motorcycleData.sellerId = this.auth.currentUser.id;
        motorcycleData.status = 'pending';
        motorcycleData.currentPrice = motorcycleData.startingPrice;
        motorcycleData.bids = [];
        if (!motorcycleData.images || motorcycleData.images.length === 0) {
            motorcycleData.images = [motorcycleData.image];
        }
        const motorcycle = this.dataStore.saveMotorcycle(motorcycleData);
        return { success: true, message: 'Лот создан и ожидает подтверждения', motorcycle };
    }
    
    placeBid(motorcycleId, amount) {
        if (!this.auth.isLoggedIn()) {
            return { success: false, message: 'Необходима авторизация' };
        }
        const motorcycle = this.dataStore.getMotorcycles().find(m => m.id === motorcycleId);
        if (!motorcycle) return { success: false, message: 'Лот не найден' };
        if (motorcycle.status !== 'active') return { success: false, message: 'Аукцион не активен' };
        if (amount <= motorcycle.currentPrice) return { success: false, message: 'Ставка должна быть выше текущей цены' };
        const success = this.dataStore.addBid(motorcycleId, this.auth.currentUser.id, amount, this.auth.currentUser.username);
        return success ? { success: true, message: 'Ставка принята' } : { success: false, message: 'Ошибка при размещении ставки' };
    }
    
    approveAuction(motorcycleId) {
        if (!this.auth.isAdmin()) {
            return { success: false, message: 'Требуются права администратора' };
        }
        const updated = this.dataStore.updateMotorcycle(motorcycleId, { status: 'active' });
        return updated ? { success: true, message: 'Лот подтвержден' } : { success: false, message: 'Лот не найден' };
    }
    
    deleteAuction(motorcycleId) {
        if (!this.auth.isAdmin()) {
            return { success: false, message: 'Требуются права администратора' };
        }
        const deleted = this.dataStore.deleteMotorcycle(motorcycleId);
        return deleted ? { success: true, message: 'Лот удален' } : { success: false, message: 'Лот не найден' };
    }
    
    completeAuction(motorcycleId, buyerId, finalPrice) {
        if (!this.auth.isAdmin()) {
            return { success: false, message: 'Требуются права администратора' };
        }
        const updated = this.dataStore.updateMotorcycle(motorcycleId, { status: 'sold', buyerId: buyerId });
        if (updated) {
            const sale = { motorcycleId, sellerId: updated.sellerId, buyerId, finalPrice, date: new Date().toISOString() };
            this.dataStore.saveSale(sale);
            return { success: true, message: 'Аукцион завершен' };
        }
        return { success: false, message: 'Ошибка при завершении аукциона' };
    }
}

class UI {
    constructor() {
        this.auth = new AuthSystem();
        this.auctionSystem = new AuctionSystem();
        this.dataStore = new DataStore();
    }
    
    updateAuthButtons() {
        const authButtons = document.getElementById('auth-buttons');
        if (!authButtons) return;
        
        if (this.auth.isLoggedIn()) {
            const user = this.auth.currentUser;
            authButtons.innerHTML = `
                <div class="user-menu">
                    <button class="user-menu-btn">
                        <i class="fas fa-user-circle"></i>
                        <span>${user.username}</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="dropdown">
                        <a href="dashboard.html" class="dropdown-item"><i class="fas fa-tachometer-alt"></i> Личный кабинет</a>
                        ${this.auth.isAdmin() ? '<a href="admin.html" class="dropdown-item"><i class="fas fa-shield-alt"></i> Админ-панель</a>' : ''}
                        <a href="create-lot.html" class="dropdown-item"><i class="fas fa-plus-circle"></i> Создать лот</a>
                        <div class="dropdown-divider"></div>
                        <button onclick="ui.logout()" class="dropdown-item logout-item"><i class="fas fa-sign-out-alt"></i> Выйти</button>
                    </div>
                </div>
            `;
        } else {
            authButtons.innerHTML = `
                <a href="login.html" class="btn-auth btn-login"><i class="fas fa-sign-in-alt"></i> Войти</a>
                <a href="register.html" class="btn-auth btn-register"><i class="fas fa-user-plus"></i> Регистрация</a>
            `;
        }
    }
    
    logout() {
        this.auth.logout();
    }
    
    initTheme() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.body.classList.toggle('light-theme', savedTheme === 'light');
        themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            themeToggle.innerHTML = isLight ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        });
    }
    
    placeBidModal(motorcycleId, currentPrice) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-gavel"></i> Сделать ставку</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Текущая цена: <strong class="gold">${currentPrice.toLocaleString()} ₽</strong></p>
                    <div class="form-group">
                        <label for="bidAmount">Ваша ставка (₽)</label>
                        <div class="input-with-addon">
                            <input type="number" id="bidAmount" class="form-input" min="${currentPrice + 100}" value="${currentPrice + 100}" step="100">
                            <span class="input-addon">₽</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal').remove()"><i class="fas fa-times"></i> Отмена</button>
                    <button class="btn btn-gold" onclick="ui.placeBid(${motorcycleId})"><i class="fas fa-check"></i> Подтвердить ставку</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        if (!document.querySelector('#modal-styles')) {
            const style = document.createElement('style');
            style.id = 'modal-styles';
            style.textContent = `
                .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 10000; }
                .modal-content { background-color: var(--bg-card); border-radius: 12px; width: 90%; max-width: 500px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
                .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid var(--border); }
                .modal-header h3 { margin: 0; display: flex; align-items: center; gap: 10px; }
                .modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-primary); }
                .modal-body { padding: 20px; }
                .modal-footer { padding: 20px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 15px; }
                .input-with-addon { position: relative; }
                .input-addon { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); }
            `;
            document.head.appendChild(style);
        }
    }
    
    placeBid(motorcycleId) {
        const bidAmountInput = document.getElementById('bidAmount');
        const amount = parseInt(bidAmountInput.value);
        if (!amount || amount <= 0) {
            alert('Введите корректную сумму');
            return;
        }
        const result = this.auctionSystem.placeBid(motorcycleId, amount);
        if (result.success) {
            alert('✅ Ставка успешно размещена!');
            document.querySelector('.modal')?.remove();
            if (typeof loadAuctions === 'function') loadAuctions();
            if (typeof loadLotDetails === 'function') loadLotDetails();
        } else {
            alert('❌ Ошибка: ' + result.message);
        }
    }
    
    submitComplaint(motorcycleId, reason, details) {
        if (!this.auth.isLoggedIn()) {
            return { success: false, message: 'Необходимо войти в систему' };
        }
        
        const complaints = JSON.parse(localStorage.getItem('complaints')) || [];
        const motorcycles = this.dataStore.getMotorcycles();
        const lot = motorcycles.find(m => m.id === motorcycleId);
        
        const newComplaint = {
            id: Date.now(),
            lotId: motorcycleId,
            lotTitle: lot ? lot.title : 'Неизвестный лот',
            userId: this.auth.currentUser.id,
            username: this.auth.currentUser.username,
            reason: reason,
            details: details,
            date: new Date().toISOString(),
            status: 'pending'
        };
        
        complaints.push(newComplaint);
        localStorage.setItem('complaints', JSON.stringify(complaints));
        
        return { success: true, message: 'Жалоба отправлена администрации' };
    }
}

const ui = new UI();

function registerUser(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value;
    const phone = document.getElementById('phone').value;
    const result = ui.auth.register(email, password, username, phone);
    if (result.success) {
        alert('✅ Регистрация успешна! Теперь вы можете войти.');
        window.location.href = 'login.html';
    } else {
        alert('❌ Ошибка: ' + result.message);
    }
}

function loginUser(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const result = ui.auth.login(email, password);
    if (result.success) {
        alert('✅ Вход выполнен успешно!');
        window.location.href = 'index.html';
    } else {
        alert('❌ Ошибка: ' + result.message);
    }
}

function createLot(event) {
    event.preventDefault();
    const title = document.getElementById('title').value;
    const brand = document.getElementById('brand').value;
    const model = document.getElementById('model').value;
    const year = parseInt(document.getElementById('year').value);
    const startingPrice = parseInt(document.getElementById('price').value);
    const description = document.getElementById('description').value;
    const image = document.getElementById('image')?.value || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';
    const duration = parseInt(document.getElementById('duration')?.value || 7);
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);
    
    const imagesData = document.getElementById('images-data')?.value;
    const images = imagesData ? JSON.parse(imagesData) : [image];
    
    const motorcycleData = { title, brand, model, year, startingPrice, description, image: images[0], images, endDate: endDate.toISOString() };
    const result = ui.auctionSystem.createAuction(motorcycleData);
    if (result.success) {
        alert('✅ Лот создан! Ожидайте подтверждения администратора.');
        window.location.href = 'dashboard.html';
    } else {
        alert('❌ Ошибка: ' + result.message);
    }
}

(function() {
    function initMobileMenu() {
        if (document.querySelector('.hamburger')) return;
        
        const navbar = document.querySelector('.navbar');
        const navLinks = document.querySelector('.nav-links');
        const themeToggle = document.querySelector('.theme-toggle');
        
        if (!navbar || !navLinks) return;
        
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger';
        hamburger.innerHTML = '<i class="fas fa-bars"></i>';
        hamburger.setAttribute('aria-label', 'Меню');
        
        if (themeToggle) {
            navbar.insertBefore(hamburger, themeToggle);
        } else {
            navbar.appendChild(hamburger);
        }
        
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            navLinks.classList.toggle('active');
            const icon = this.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        document.addEventListener('click', function(event) {
            if (!navbar.contains(event.target) && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                const icon = hamburger.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const icon = hamburger.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
    }
    
    function initMobileUserMenu() {
        const userMenuBtn = document.querySelector('.user-menu-btn');
        const userMenu = document.querySelector('.user-menu');
        
        if (!userMenuBtn || !userMenu) return;
        
        if (window.innerWidth <= 768) {
            userMenuBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                userMenu.classList.toggle('active');
            });
            
            document.addEventListener('click', function(event) {
                if (!userMenu.contains(event.target) && userMenu.classList.contains('active')) {
                    userMenu.classList.remove('active');
                }
            });
        }
    }
    
    function fixTables() {
        const tables = document.querySelectorAll('.admin-table');
        tables.forEach(table => {
            const wrapper = table.closest('.admin-table-wrapper');
            if (wrapper && !wrapper.style.overflowX) {
                wrapper.style.overflowX = 'auto';
                wrapper.style.webkitOverflowScrolling = 'touch';
            }
        });
    }
    
    function fixAdminLink() {
        const adminLink = document.querySelector('a[href="admin.html"]');
        if (adminLink) {
            adminLink.addEventListener('click', function(e) {
                return true;
            });
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initMobileMenu();
            initMobileUserMenu();
            fixTables();
            fixAdminLink();
        });
    } else {
        initMobileMenu();
        initMobileUserMenu();
        fixTables();
        fixAdminLink();
    }
    
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            const navLinks = document.querySelector('.nav-links');
            if (navLinks) navLinks.classList.remove('active');
            const userMenu = document.querySelector('.user-menu');
            if (userMenu) userMenu.classList.remove('active');
        } else {
            initMobileUserMenu();
        }
    });
})();

(function() {
    function initMobileMenu() {
        if (document.querySelector('.hamburger')) return;
        
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;
        
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger';
        hamburger.innerHTML = '<i class="fas fa-bars"></i>';
        hamburger.setAttribute('aria-label', 'Меню');
        
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            navbar.insertBefore(hamburger, themeToggle);
        } else {
            navbar.appendChild(hamburger);
        }
        
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            hamburger.addEventListener('click', function(e) {
                e.stopPropagation();
                navLinks.classList.toggle('active');
                const icon = this.querySelector('i');
                if (navLinks.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileMenu);
    } else {
        initMobileMenu();
    }

function initThemeToggleButton() {
    let themeToggle = document.getElementById('theme-toggle');
    let themeToggleBtn = document.getElementById('theme-toggle-btn');
    
    if (themeToggle && !themeToggleBtn) {
        const parent = themeToggle.parentNode;
        const newBtn = document.createElement('button');
        newBtn.id = 'theme-toggle-btn';
        newBtn.className = 'theme-toggle-btn';
        
        const isLight = document.body.classList.contains('light-theme');
        newBtn.innerHTML = `
            <i class="fas ${isLight ? 'fa-sun' : 'fa-moon'} toggle-icon"></i>
            <span class="toggle-text">${isLight ? 'Светлая' : 'Тёмная'}</span>
        `;
        
        parent.replaceChild(newBtn, themeToggle);
        themeToggleBtn = newBtn;
    }
    
    if (!themeToggleBtn) {
        const navAuth = document.querySelector('.nav-auth');
        const navLinks = document.querySelector('.nav-links');
        
        if (navAuth && navLinks) {
            themeToggleBtn = document.createElement('button');
            themeToggleBtn.id = 'theme-toggle-btn';
            themeToggleBtn.className = 'theme-toggle-btn';
            
            const isLight = document.body.classList.contains('light-theme');
            themeToggleBtn.innerHTML = `
                <i class="fas ${isLight ? 'fa-sun' : 'fa-moon'} toggle-icon"></i>
                <span class="toggle-text">${isLight ? 'Светлая' : 'Тёмная'}</span>
            `;
            
            navLinks.insertAdjacentElement('afterend', themeToggleBtn);
        }
    }
    
    if (themeToggleBtn) {
        const newBtn = themeToggleBtn.cloneNode(true);
        themeToggleBtn.parentNode.replaceChild(newBtn, themeToggleBtn);
        
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            
            const icon = this.querySelector('i');
            const textSpan = this.querySelector('.toggle-text');
            
            if (icon) {
                icon.className = `fas ${isLight ? 'fa-sun' : 'fa-moon'} toggle-icon`;
            }
            if (textSpan) {
                textSpan.textContent = isLight ? 'Светлая' : 'Тёмная';
            }
            
            const dashboardToggle = document.getElementById('theme-toggle-dashboard');
            if (dashboardToggle) {
                const dashIcon = dashboardToggle.querySelector('i');
                if (dashIcon) {
                    dashIcon.className = `fas ${isLight ? 'fa-sun' : 'fa-moon'}`;
                }
            }
        });
    }
}

const originalInitTheme = UI.prototype.initTheme;
UI.prototype.initTheme = function() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.classList.toggle('light-theme', savedTheme === 'light');
    initThemeToggleButton();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeToggleButton);
} else {
    initThemeToggleButton();
}
})();