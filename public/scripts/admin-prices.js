document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('prices-tbody');
    const msgDiv = document.getElementById('price-msg');
    const errDiv = document.getElementById('price-error');
    const btnRefresh = document.getElementById('btn-refresh');
    const btnAdd = document.getElementById('btn-add-price');
    
    const langBtns = document.querySelectorAll('#table-lang-toggle button');
    let currentViewLang = 'lt';

    langBtns.forEach(btn => {
        btn.onclick = () => {
            langBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentViewLang = btn.dataset.lang;
            renderPrices();
        };
    });

    let allPrices = [];

    async function apiRequest(url, method = 'GET', body = null) {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) options.body = JSON.stringify(body);
        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Ошибка запроса');
        return data;
    }

    async function loadPrices() {
        errDiv.textContent = '';
        msgDiv.textContent = '';
        try {
            const data = await apiRequest('/api/prices');
            allPrices = data.prices;
            renderPrices();
        } catch (err) {
            errDiv.textContent = err.message;
        }
    }

    function renderPrices() {
        tbody.innerHTML = '';
        if (allPrices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Список пуст</td></tr>';
            return;
        }

        allPrices.forEach(p => {
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>${p.id}</td>
                <td><input type="text" value="${p['category_' + currentViewLang]}" data-id="${p.id}" data-field="category_${currentViewLang}"></td>
                <td><input type="text" value="${p['name_' + currentViewLang]}" data-id="${p.id}" data-field="name_${currentViewLang}"></td>
                <td><input type="text" value="${p['unit_' + currentViewLang]}" data-id="${p.id}" data-field="unit_${currentViewLang}" style="width: 60px;"></td>
                <td><input type="text" value="${p.price}" data-id="${p.id}" data-field="price" style="width: 80px;"></td>
                <td>
                    <button class="btn btn--primary btn-sm btn-save-row" data-id="${p.id}">OK</button>
                    <button class="btn btn--ghost btn-sm btn-del-row" data-id="${p.id}" style="color: red;">X</button>
                </td>
            `;

            tbody.appendChild(tr);
        });

        // Attach events
        document.querySelectorAll('.btn-save-row').forEach(btn => {
            btn.onclick = () => updatePrice(btn.dataset.id, btn);
        });
        document.querySelectorAll('.btn-del-row').forEach(btn => {
            btn.onclick = () => deletePrice(btn.dataset.id);
        });
    }

    async function updatePrice(id, btn) {
        errDiv.textContent = '';
        msgDiv.textContent = '';
        
        // Find the current values from inputs for this ID
        const inputs = document.querySelectorAll(`input[data-id="${id}"]`);
        const p = allPrices.find(x => x.id == id);
        const updatedData = { ...p };
        
        inputs.forEach(input => {
            updatedData[input.dataset.field] = input.value;
        });

        try {
            btn.disabled = true;
            await apiRequest('/api/prices', 'PUT', updatedData);
            msgDiv.textContent = 'Обновлено!';
            loadPrices();
        } catch (err) {
            errDiv.textContent = err.message;
        } finally {
            btn.disabled = false;
        }
    }

    async function deletePrice(id) {
        if (!confirm('Удалить эту позицию?')) return;
        errDiv.textContent = '';
        try {
            await apiRequest('/api/prices', 'DELETE', { id });
            msgDiv.textContent = 'Удалено';
            loadPrices();
        } catch (err) {
            errDiv.textContent = err.message;
        }
    }

    btnAdd.onclick = async () => {
        const category_lt = document.getElementById('f-cat-lt').value;
        const category_ru = document.getElementById('f-cat-ru').value;
        const name_lt = document.getElementById('f-name-lt').value;
        const name_ru = document.getElementById('f-name-ru').value;
        const unit_lt = document.getElementById('f-unit-lt').value;
        const unit_ru = document.getElementById('f-unit-ru').value;
        const price = document.getElementById('f-price').value;

        if (!category_lt || !category_ru || !name_lt || !name_ru || !price) {
            errDiv.textContent = 'Заполните обязательные поля';
            return;
        }

        try {
            btnAdd.disabled = true;
            await apiRequest('/api/prices', 'POST', {
                category_lt, category_ru, name_lt, name_ru, unit_lt, unit_ru, price
            });
            msgDiv.textContent = 'Услуга добавлена!';
            // Clear inputs
            ['f-cat-lt', 'f-cat-ru', 'f-name-lt', 'f-name-ru', 'f-price'].forEach(id => {
                document.getElementById(id).value = '';
            });
            loadPrices();
        } catch (err) {
            errDiv.textContent = err.message;
        } finally {
            btnAdd.disabled = false;
        }
    };

    btnRefresh.onclick = loadPrices;
    loadPrices();
});
