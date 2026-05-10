document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('users-tbody');
    const msgDiv = document.getElementById('admin-msg');
    const errDiv = document.getElementById('admin-error');
    const btnRefresh = document.getElementById('btn-refresh');
    const searchInput = document.getElementById('user-search');

    let allUsers = [];

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

            tr.innerHTML = `
                <td style="padding: 15px; color: var(--text-muted); font-size: 0.9rem;">${user.id}</td>
                <td style="padding: 15px; font-weight: 600;">${user.email}</td>
                <td style="padding: 15px;">
                    <select class="form-input" style="margin:0; padding: 5px 10px; font-size: 0.85rem; width: auto; background: rgba(255,255,255,0.05);" ${isRestricted ? 'disabled' : ''}>
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>USER</option>
                        <option value="worker" ${user.role === 'worker' ? 'selected' : ''}>WORKER</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>ADMIN</option>
                        <option value="superadmin" ${user.role === 'superadmin' ? 'selected' : ''}>SUPERADMIN</option>
                    </select>
                </td>
                <td style="padding: 15px; font-size: 0.85rem; color: var(--text-muted);">${new Date(user.created_at).toLocaleString()}</td>
                <td style="padding: 15px;">
                    <button class="btn btn--ghost btn-save" style="padding: 5px 15px; font-size: 0.8rem; border-color: var(--accent-33); color: var(--accent);" ${isRestricted ? 'disabled style="opacity:0.3"' : ''}>Сохранить</button>
                </td>
            `;

            const select = tr.querySelector('select');
            const btnSave = tr.querySelector('.btn-save');

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
                    
                    msgDiv.textContent = `Роль ${user.email} обновлена на ${select.value.toUpperCase()}`;
                    user.role = select.value; // Update local state
                } catch (err) {
                    errDiv.textContent = err.message;
                    select.value = user.role;
                } finally {
                    btnSave.disabled = false;
                    btnSave.textContent = 'Сохранить';
                }
            };

            tbody.appendChild(tr);
        });
    }

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
