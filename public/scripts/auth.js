document.addEventListener('DOMContentLoaded', () => {

    // Вспомогательная функция для API запросов
    async function apiRequest(url, method, body) {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка запроса');
        }
        return data;
    }

    // Регистрация
    const regForm = document.getElementById('register-form');
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const errDiv = document.getElementById('reg-error');
            const btn = regForm.querySelector('button');

            errDiv.textContent = '';
            btn.disabled = true;

            try {
                await apiRequest('/api/register', 'POST', { email, password });
                // После успешной регистрации пытаемся сразу войти
                await apiRequest('/api/login', 'POST', { email, password });
                window.location.href = '/dashboard.html';
            } catch (err) {
                errDiv.textContent = err.message;
            } finally {
                btn.disabled = false;
            }
        });
    }

    // Вход
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const errDiv = document.getElementById('login-error');
            const btn = loginForm.querySelector('button');

            errDiv.textContent = '';
            btn.disabled = true;

            try {
                await apiRequest('/api/login', 'POST', { email, password });
                window.location.href = '/dashboard.html';
            } catch (err) {
                errDiv.textContent = err.message;
            } finally {
                btn.disabled = false;
            }
        });
    }

    // Выход
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            try {
                await apiRequest('/api/logout', 'POST');
                window.location.href = '/index.html';
            } catch (err) {
                console.error('Ошибка выхода', err);
            }
        });
    }

    // Проверка сессии (для Личного кабинета)
    const dashboardEmail = document.getElementById('dashboard-email');
    if (dashboardEmail) {
        apiRequest('/api/user', 'GET')
            .then(data => {
                dashboardEmail.textContent = `Пользователь: ${data.user.email} (${data.user.role.toUpperCase()})`;
                
                // Если админ или суперадмин, показываем кнопку "Админ панель"
                if (data.user.role === 'admin' || data.user.role === 'superadmin') {
                    const btnAdminPanel = document.getElementById('btn-admin-panel');
                    if (btnAdminPanel) {
                        btnAdminPanel.style.display = 'inline-block';
                        
                        // Логика модалки
                        const modal = document.getElementById('admin-modal');
                        const closeBtn = document.getElementById('close-admin-modal');
                        
                        btnAdminPanel.onclick = () => {
                            modal.style.display = 'flex';
                        };
                        
                        closeBtn.onclick = () => {
                            modal.style.display = 'none';
                        };
                        
                        window.onclick = (event) => {
                            if (event.target == modal) {
                                modal.style.display = 'none';
                            }
                        };
                    }
                }
            })
            .catch(() => {
                // Если не авторизован, кидаем на страницу входа
                window.location.href = '/login.html';
            });
    }

    // Вспомогательная функция для загрузки списка пользователей в дашборде
    async function loadDashboardAdminUsers() {
        const tbody = document.getElementById('dash-users-tbody');
        const errDiv = document.getElementById('dash-admin-error');
        const msgDiv = document.getElementById('dash-admin-msg');
        
        if (!tbody) return;

        try {
            const data = await apiRequest('/api/admin/users', 'GET');
            tbody.innerHTML = '';
            
            if (!data.users || data.users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="padding: 10px;">Пользователей нет</td></tr>';
                return;
            }

            data.users.forEach(user => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #eee';

                const tdId = document.createElement('td');
                tdId.style.padding = '10px';
                tdId.textContent = user.id;

                const tdEmail = document.createElement('td');
                tdEmail.style.padding = '10px';
                tdEmail.textContent = user.email;

                const tdRole = document.createElement('td');
                tdRole.style.padding = '10px';
                const select = document.createElement('select');
                select.style.padding = '5px';
                select.style.borderRadius = '4px';
                select.style.border = '1px solid #ccc';
                
                ['user', 'worker', 'admin'].forEach(r => {
                    const option = document.createElement('option');
                    option.value = r;
                    option.textContent = r.toUpperCase();
                    if (user.role === r) option.selected = true;
                    select.appendChild(option);
                });
                
                if (user.email === 'admin@mail.com') select.disabled = true;
                tdRole.appendChild(select);

                const tdAction = document.createElement('td');
                tdAction.style.padding = '10px';
                const btnSave = document.createElement('button');
                btnSave.textContent = 'Сохранить';
                btnSave.className = 'btn btn--primary';
                btnSave.style.padding = '5px 10px';
                btnSave.style.fontSize = '12px';
                
                if (user.email === 'admin@mail.com') {
                    btnSave.disabled = true;
                    btnSave.style.opacity = '0.5';
                }

                btnSave.onclick = async () => {
                    try {
                        errDiv.textContent = '';
                        msgDiv.textContent = '';
                        btnSave.disabled = true;
                        btnSave.textContent = '...';
                        
                        await apiRequest('/api/admin/users/role', 'POST', {
                            userId: user.id,
                            newRole: select.value
                        });
                        msgDiv.textContent = `Роль ${user.email} обновлена!`;
                    } catch (e) {
                        errDiv.textContent = e.message;
                        select.value = user.role; // Возврат при ошибке
                    } finally {
                        btnSave.disabled = false;
                        btnSave.textContent = 'Сохранить';
                    }
                };
                
                tdAction.appendChild(btnSave);
                tr.appendChild(tdId);
                tr.appendChild(tdEmail);
                tr.appendChild(tdRole);
                tr.appendChild(tdAction);
                tbody.appendChild(tr);
            });
        } catch (e) {
            errDiv.textContent = e.message;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Универсальная инъекция кнопки "Кабинет" на всех страницах
    // ═══════════════════════════════════════════════════════════════
    if (!regForm && !loginForm && !dashboardEmail) {
        apiRequest('/api/user', 'GET')
            .then(data => {
                const user = data.user;
                const lang = localStorage.getItem('app-lang') || 'lt';
                const cabinetText = (translations && translations[lang] && translations[lang]['cta_dashboard'])
                    ? translations[lang]['cta_dashboard']
                    : (lang === 'lt' ? 'Kabinetas' : 'Кабинет');

                // ─── 1. Топбар: заменяем «Войти»/«Регистрация» на «Кабинет» ────
                document.querySelectorAll('a[href="login.html"], a[href="register.html"]').forEach(el => {
                    el.href = 'dashboard.html';
                    el.textContent = cabinetText;
                    el.setAttribute('data-t', 'cta_dashboard');
                });

                // ─── 2. Топбар: добавляем кнопку если её вообще нет ─────────────
                if (!document.getElementById('topbar-cabinet-btn')) {
                    const topbarContact = document.querySelector('.topbar__contact');
                    if (topbarContact) {
                        const btn = document.createElement('a');
                        btn.id = 'topbar-cabinet-btn';
                        btn.href = 'dashboard.html';
                        btn.className = 'topbar__cta';
                        btn.setAttribute('data-t', 'cta_dashboard');
                        btn.textContent = cabinetText;
                        btn.style.marginLeft = '8px';
                        topbarContact.appendChild(btn);
                    }
                }

                // ─── 3. Сайдбар: добавляем раздел «Аккаунт» ────────────────────
                const sidebar = document.querySelector('.sidebar__nav');
                if (sidebar && !document.getElementById('sidebar-account-section')) {
                    const section = document.createElement('div');
                    section.id = 'sidebar-account-section';

                    const label = document.createElement('p');
                    label.className = 'sidebar__section-label';
                    label.textContent = lang === 'lt' ? 'Paskyra' : 'Аккаунт';

                    const ul = document.createElement('ul');
                    ul.className = 'sidebar__menu';

                    // Кабинет
                    const liCabinet = document.createElement('li');
                    liCabinet.innerHTML = `
                        <a href="dashboard.html" class="sidebar__link">
                            <span class="sidebar__link-icon">👤</span>
                            <span data-t="cta_dashboard">${cabinetText}</span>
                        </a>`;
                    ul.appendChild(liCabinet);

                    // Для админов/суперадминов — ссылка на Управление ценами
                    if (user.role === 'admin' || user.role === 'superadmin') {
                        const liPrices = document.createElement('li');
                        liPrices.innerHTML = `
                            <a href="admin-prices.html" class="sidebar__link">
                                <span class="sidebar__link-icon">💰</span>
                                <span>${lang === 'lt' ? 'Kainos (admin)' : 'Цены (admin)'}</span>
                            </a>`;
                        ul.appendChild(liPrices);

                        const liUsers = document.createElement('li');
                        liUsers.innerHTML = `
                            <a href="admin.html" class="sidebar__link">
                                <span class="sidebar__link-icon">👥</span>
                                <span>${lang === 'lt' ? 'Naudotojai' : 'Пользователи'}</span>
                            </a>`;
                        ul.appendChild(liUsers);
                    }

                    section.appendChild(label);
                    section.appendChild(ul);
                    sidebar.appendChild(section);
                }
            })
            .catch(() => {
                // Не авторизован — оставляем ссылки как есть (login / register)
            });
    }
});

