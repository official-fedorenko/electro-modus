document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('users-tbody');
    const msgDiv = document.getElementById('admin-msg');
    const errDiv = document.getElementById('admin-error');
    const btnRefresh = document.getElementById('btn-refresh');

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
        tbody.innerHTML = '<tr><td colspan="5">Загрузка...</td></tr>';

        try {
            const data = await apiRequest('/api/admin/users');
            tbody.innerHTML = '';
            
            if (data.users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5">Пользователей нет</td></tr>';
                return;
            }

            data.users.forEach(user => {
                const tr = document.createElement('tr');
                
                // ID
                const tdId = document.createElement('td');
                tdId.textContent = user.id;
                
                // Email
                const tdEmail = document.createElement('td');
                tdEmail.textContent = user.email;

                // Role Select
                const tdRole = document.createElement('td');
                const select = document.createElement('select');
                select.className = 'role-select';
                
                ['user', 'worker', 'admin', 'superadmin'].forEach(role => {
                    const option = document.createElement('option');
                    option.value = role;
                    option.textContent = role.toUpperCase();
                    if (user.role === role) option.selected = true;
                    select.appendChild(option);
                });
                
                // Не даем понижать суперадмина или самого себя (если мы не супер)
                if (user.role === 'superadmin' || user.email === 'admin@mail.com') {
                    select.disabled = true;
                }
                
                tdRole.appendChild(select);

                // Date
                const tdDate = document.createElement('td');
                tdDate.textContent = new Date(user.created_at).toLocaleString();

                // Action
                const tdAction = document.createElement('td');
                const btnSave = document.createElement('button');
                btnSave.textContent = 'Сохранить';
                btnSave.className = 'btn-save';
                
                if (user.role === 'superadmin' || user.email === 'admin@mail.com') {
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
                        
                        msgDiv.textContent = `Роль пользователя ${user.email} обновлена на ${select.value.toUpperCase()}`;
                    } catch (err) {
                        errDiv.textContent = err.message;
                        // Возвращаем старое значение в селекте при ошибке
                        select.value = user.role;
                    } finally {
                        btnSave.disabled = false;
                        btnSave.textContent = 'Сохранить';
                    }
                };
                tdAction.appendChild(btnSave);

                tr.appendChild(tdId);
                tr.appendChild(tdEmail);
                tr.appendChild(tdRole);
                tr.appendChild(tdDate);
                tr.appendChild(tdAction);
                
                tbody.appendChild(tr);
            });
        } catch (err) {
            errDiv.textContent = err.message;
            if (err.message === 'Нет прав доступа' || err.message === 'Не авторизован') {
                window.location.href = '/login.html';
            }
        }
    }

    btnRefresh.addEventListener('click', loadUsers);

    // Initial load
    loadUsers();
});
