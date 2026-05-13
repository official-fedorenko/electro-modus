document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('users-tbody');
    const msgDiv = document.getElementById('admin-msg');
    const errDiv = document.getElementById('admin-error');
    const btnRefresh = document.getElementById('btn-refresh');
    const searchInput = document.getElementById('user-search');

    // Modal elements
    const roleModal = document.getElementById('role-modal');
    const roleOptions = document.getElementById('role-options');
    const closeRoleModal = document.getElementById('close-role-modal');
    const roleModalEmail = document.getElementById('role-modal-email');

    let allUsers = [];
    let activeUserId = null;

    async function apiRequest(url, method = 'GET', body = null) {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка запроса');
        }
        return data;
    }

    async function loadUsers() {
        msgDiv.textContent = '';
        errDiv.textContent = '';
        tbody.innerHTML = '<tr><td colspan="5" style="padding:20px;">Загрузка...</td></tr>';

        try {
            const data = await apiRequest('/api/admin/users');
            allUsers = data.users;
            renderUsers(allUsers);
        } catch (err) {
            errDiv.textContent = err.message;
            tbody.innerHTML = `<tr><td colspan="5" style="padding:20px; color:#ef4444;">${err.message}</td></tr>`;
        }
    }

    function renderUsers(users) {
        tbody.innerHTML = '';
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="padding:20px;">Пользователей не найдено</td></tr>';
            return;
        }

        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            
            const isRestricted = user.role === 'superadmin' || user.email === 'admin@mail.com';

            // Role Badge styling
            let badgeClass = 'badge--user';
            if (user.role === 'admin' || user.role === 'superadmin') badgeClass = 'badge--admin';
            if (user.role === 'worker') badgeClass = 'badge--worker';

            tr.innerHTML = `
                <td style="padding: 15px; color: var(--text-muted); font-size: 0.9rem;">${user.id}</td>
                <td style="padding: 15px; font-weight: 600;">${user.email}</td>
                <td style="padding: 15px;">
                    <div class="role-badge ${badgeClass} ${isRestricted ? 'locked' : 'clickable'}" data-userid="${user.id}">
                        ${user.role.toUpperCase()}
                        ${!isRestricted ? '<span style="margin-left:5px; opacity:0.5;">▼</span>' : ''}
                    </div>
                </td>
                <td style="padding: 15px; font-size: 0.85rem; color: var(--text-muted);">${new Date(user.created_at).toLocaleString()}</td>
                <td style="padding: 15px;">
                    <button class="btn btn--ghost" style="padding: 5px 15px; font-size: 0.8rem; border-color: #ef444433; color: #ef4444;" onclick="alert('Функция удаления в разработке')">Удалить</button>
                </td>
            `;

            if (!isRestricted) {
                const badge = tr.querySelector('.role-badge');
                badge.onclick = () => openRoleModal(user);
            }

            tbody.appendChild(tr);
        });
    }

    function openRoleModal(user) {
        activeUserId = user.id;
        roleModalEmail.textContent = `Пользователь: ${user.email}`;
        
        const roles = ['user', 'worker', 'admin', 'superadmin'];
        roleOptions.innerHTML = '';
        
        roles.forEach(role => {
            const btn = document.createElement('button');
            btn.className = `role-option-btn ${user.role === role ? 'active' : ''}`;
            btn.innerHTML = `
                <span>${role.toUpperCase()}</span>
                ${user.role === role ? '<span>✓</span>' : ''}
            `;
            btn.onclick = () => updateRole(role);
            roleOptions.appendChild(btn);
        });
        
        roleModal.style.display = 'flex';
    }

    async function updateRole(newRole) {
        try {
            msgDiv.textContent = '';
            errDiv.textContent = '';
            
            await apiRequest('/api/admin/users/role', 'POST', {
                userId: activeUserId,
                newRole: newRole
            });
            
            roleModal.style.display = 'none';
            msgDiv.textContent = 'Роль успешно обновлена';
            loadUsers(); // Refresh the list
        } catch (err) {
            errDiv.textContent = err.message;
        }
    }

    // Modal Close
    closeRoleModal.onclick = () => roleModal.style.display = 'none';
    window.onclick = (e) => { if (e.target === roleModal) roleModal.style.display = 'none'; };

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allUsers.filter(u => 
            u.email.toLowerCase().includes(query) || 
            u.role.toLowerCase().includes(query)
        );
        renderUsers(filtered);
    });

    btnRefresh.onclick = loadUsers;
    loadUsers();
});

