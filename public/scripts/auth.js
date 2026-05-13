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
        const captchaQuestion = document.getElementById('captcha-question');
        const regCaptcha = document.getElementById('reg-captcha');
        
        // Загрузка капчи
        const loadCaptcha = async () => {
            try {
                const data = await apiRequest('/api/captcha', 'GET');
                if (captchaQuestion) captchaQuestion.textContent = data.question;
            } catch (err) {
                console.error('Ошибка загрузки капчи', err);
            }
        };
        
        loadCaptcha();

        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const captcha = regCaptcha.value;
            const errDiv = document.getElementById('reg-error');
            const btn = regForm.querySelector('button');

            errDiv.textContent = '';
            btn.disabled = true;

            try {
                await apiRequest('/api/register', 'POST', { email, password, captcha });
                // После успешной регистрации пытаемся сразу войти
                await apiRequest('/api/login', 'POST', { email, password });
                window.location.href = '/dashboard.html';
            } catch (err) {
                errDiv.textContent = err.message;
                // Обновляем капчу при ошибке
                loadCaptcha();
                regCaptcha.value = '';
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

                // Заполнение формы профиля
                const profileEmail = document.getElementById('profile-email');
                const profileName = document.getElementById('profile-name');
                const profilePhone = document.getElementById('profile-phone');
                
                if (profileEmail) profileEmail.value = data.user.email;
                if (profileName) profileName.value = data.user.name || '';
                if (profilePhone) profilePhone.value = data.user.phone || '';

                // Обработка сохранения формы
                const profileForm = document.getElementById('profile-form');
                const profileMessage = document.getElementById('profile-message');
                if (profileForm) {
                    profileForm.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        profileMessage.textContent = 'Сохранение...';
                        profileMessage.style.color = 'var(--text-muted)';
                        
                        try {
                            await apiRequest('/api/user', 'PUT', {
                                name: profileName.value,
                                phone: profilePhone.value
                            });
                            profileMessage.textContent = 'Данные успешно сохранены!';
                            profileMessage.style.color = 'green';
                            setTimeout(() => { profileMessage.textContent = ''; }, 3000);
                        } catch (err) {
                            profileMessage.textContent = err.message || 'Ошибка сохранения';
                            profileMessage.style.color = 'red';
                        }
                    });
                }

                // --- ЛОГИКА ЗАЯВОК ---
                const ticketsList = document.getElementById('tickets-list');
                let currentTicketId = null;

                async function loadTickets() {
                    if (!ticketsList) return;
                    try {
                        const tickets = await apiRequest('/api/tickets', 'GET');
                        ticketsList.innerHTML = '';
                        if (tickets.length === 0) {
                            ticketsList.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">У вас пока нет заявок.</p>';
                            return;
                        }

                        const statusColors = {
                            'new': 'orange',
                            'in_progress': 'blue',
                            'completed': 'green',
                            'rejected': 'red'
                        };
                        const statusNames = {
                            'new': 'Новая',
                            'in_progress': 'В работе',
                            'completed': 'Завершена',
                            'rejected': 'Отклонена'
                        };

                        tickets.forEach(t => {
                            const tDiv = document.createElement('div');
                            tDiv.style.background = 'var(--bg-base)';
                            tDiv.style.padding = '10px 15px';
                            tDiv.style.borderRadius = 'var(--radius-sm)';
                            tDiv.style.border = '1px solid var(--border)';
                            tDiv.style.cursor = 'pointer';
                            tDiv.style.display = 'flex';
                            tDiv.style.justifyContent = 'space-between';
                            tDiv.style.alignItems = 'center';

                            tDiv.innerHTML = `
                                <div>
                                    <h4 style="margin: 0; font-size: 1rem; color: var(--text-primary);">${t.title}</h4>
                                    <span style="font-size: 0.8rem; color: var(--text-muted);">${new Date(t.created_at).toLocaleString('ru-RU')}</span>
                                </div>
                                <span style="font-size: 0.8rem; font-weight: bold; color: ${statusColors[t.status] || 'gray'}; background: rgba(255,255,255,0.05); padding: 3px 8px; border-radius: 12px;">${statusNames[t.status] || t.status}</span>
                            `;

                            tDiv.onclick = () => openTicket(t.id);
                            ticketsList.appendChild(tDiv);
                        });
                    } catch (e) {
                        ticketsList.innerHTML = '<p style="color: red;">Ошибка загрузки заявок</p>';
                    }
                }

                async function openTicket(id) {
                    currentTicketId = id;
                    document.getElementById('view-ticket-modal').style.display = 'flex';
                    const titleEl = document.getElementById('vt-title');
                    const statusEl = document.getElementById('vt-status');
                    const msgsEl = document.getElementById('vt-messages');
                    titleEl.textContent = 'Загрузка...';
                    msgsEl.innerHTML = '';

                    try {
                        const [ticket, msgs] = await Promise.all([
                            apiRequest('/api/tickets/' + id, 'GET'),
                            apiRequest('/api/tickets/' + id + '/messages', 'GET')
                        ]);

                        titleEl.textContent = ticket.title;
                        
                        const descEl = document.getElementById('vt-desc');
                        if (descEl) {
                            descEl.textContent = ticket.description || 'Описание не предоставлено.';
                        }

                        const statusNames = { 'new': 'Новая', 'in_progress': 'В работе', 'completed': 'Завершена', 'rejected': 'Отклонена' };
                        statusEl.textContent = 'Статус: ' + (statusNames[ticket.status] || ticket.status);

                        msgs.forEach(m => {
                            const isMe = m.user_id === data.user.id;
                            const mDiv = document.createElement('div');
                            mDiv.style.background = isMe ? 'var(--accent-dim)' : 'rgba(255,255,255,0.05)';
                            mDiv.style.padding = '10px';
                            mDiv.style.borderRadius = 'var(--radius-sm)';
                            mDiv.style.alignSelf = isMe ? 'flex-end' : 'flex-start';
                            mDiv.style.maxWidth = '80%';
                            
                            const senderName = isMe ? 'Вы' : (m.user_role === 'admin' || m.user_role === 'superadmin' ? 'Администратор' : 'Мастер');
                            mDiv.innerHTML = `
                                <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px;">${senderName} <span style="margin-left: 10px; opacity: 0.6;">${new Date(m.created_at).toLocaleString('ru-RU')}</span></div>
                                <div style="font-size: 0.95rem; color: var(--text-primary); white-space: pre-wrap;">${m.message}</div>
                            `;
                            msgsEl.appendChild(mDiv);
                        });
                        msgsEl.scrollTop = msgsEl.scrollHeight;
                    } catch (e) {
                        titleEl.textContent = 'Ошибка загрузки';
                    }
                }

                const newTicketForm = document.getElementById('new-ticket-form');
                if (newTicketForm) {
                    newTicketForm.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const title = document.getElementById('ticket-title').value;
                        const desc = document.getElementById('ticket-desc').value;
                        const btn = newTicketForm.querySelector('button');
                        btn.disabled = true;
                        try {
                            await apiRequest('/api/tickets', 'POST', { title, description: desc });
                            document.getElementById('new-ticket-modal').style.display = 'none';
                            newTicketForm.reset();
                            loadTickets();
                        } catch (err) {
                            alert('Ошибка: ' + err.message);
                        } finally {
                            btn.disabled = false;
                        }
                    });
                }

                const msgForm = document.getElementById('ticket-msg-form');
                if (msgForm) {
                    msgForm.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const input = document.getElementById('ticket-msg-input');
                        const msg = input.value;
                        if (!currentTicketId || !msg) return;
                        
                        const btn = msgForm.querySelector('button');
                        btn.disabled = true;
                        try {
                            await apiRequest('/api/tickets/' + currentTicketId + '/messages', 'POST', { message: msg });
                            input.value = '';
                            openTicket(currentTicketId); // перезагружаем сообщения
                        } catch (err) {
                            alert('Ошибка: ' + err.message);
                        } finally {
                            btn.disabled = false;
                        }
                    });
                }

                loadTickets();

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
                select.className = 'admin-select';

                ['user', 'worker', 'admin', 'superadmin'].forEach(r => {
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
        const lang = localStorage.getItem('app-lang') || 'lt';
        const topbarContact = document.querySelector('.topbar__contact');

        apiRequest('/api/user', 'GET')
            .then(data => {
                const user = data.user;
                const cabinetText = (translations && translations[lang] && translations[lang]['cta_dashboard'])
                    ? translations[lang]['cta_dashboard']
                    : (lang === 'lt' ? 'Kabinetas' : 'Кабинет');

                // ─── 1. Топбар (кнопки удалены по запросу) ────────────────────────────
                
                // ─── 2. Сайдбар: добавляем раздел «Аккаунт» ────────────────────
                const sidebar = document.querySelector('.sidebar__nav');
                if (sidebar && !document.getElementById('sidebar-account-section')) {
                    const section = document.createElement('div');
                    section.id = 'sidebar-account-section';

                    const label = document.createElement('p');
                    label.className = 'sidebar__section-label';
                    label.textContent = lang === 'lt' ? 'Paskyra' : 'Аккаунт';

                    const ul = document.createElement('ul');
                    ul.className = 'sidebar__menu';

                    const liCabinet = document.createElement('li');
                    liCabinet.innerHTML = `
                        <a href="dashboard.html" class="sidebar__link">
                            <span class="sidebar__link-icon">👤</span>
                            <span data-t="cta_dashboard">${cabinetText}</span>
                        </a>`;
                    ul.appendChild(liCabinet);

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
                // ─── 3. Не авторизован: добавляем кнопку входа везде ───────
                const sidebar = document.querySelector('.sidebar__nav');
                const loginText = lang === 'lt' ? 'Prisijungti' : 'Войти';

                // В сайдбар
                if (sidebar && !document.getElementById('sidebar-login-section')) {
                    const section = document.createElement('div');
                    section.id = 'sidebar-login-section';

                    const label = document.createElement('p');
                    label.className = 'sidebar__section-label';
                    label.textContent = lang === 'lt' ? 'Paskyra' : 'Аккаунт';

                    const ul = document.createElement('ul');
                    ul.className = 'sidebar__menu';

                    const liLogin = document.createElement('li');
                    liLogin.innerHTML = `
                        <a href="login.html" class="sidebar__link">
                            <span class="sidebar__link-icon">🔑</span>
                            <span>${loginText}</span>
                        </a>`;
                    ul.appendChild(liLogin);

                    section.appendChild(label);
                    section.appendChild(ul);
                    sidebar.appendChild(section);
                }

                // В топбар (аккуратно в конец)
                if (topbarContact && !document.getElementById('topbar-login-btn')) {
                    const btnLogin = document.createElement('a');
                    btnLogin.id = 'topbar-login-btn';
                    btnLogin.href = 'login.html';
                    btnLogin.className = 'btn btn--ghost';
                    btnLogin.style.marginLeft = '10px';
                    btnLogin.style.padding = '8px 15px';
                    btnLogin.style.fontSize = '13px';
                    btnLogin.textContent = loginText;
                    topbarContact.appendChild(btnLogin);
                }
            });
    }
});

