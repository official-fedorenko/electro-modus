const http = require('http');
const fs = require('fs');
const path = require('path');
const auth = require('./server/auth');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

// Вспомогательная функция для парсинга тела запроса
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(e);
            }
        });
    });
}

// Вспомогательная функция для парсинга куки
function parseCookies(request) {
    const list = {};
    const rc = request.headers.cookie;
    if (rc) {
        rc.split(';').forEach(cookie => {
            const parts = cookie.split('=');
            list[parts.shift().trim()] = decodeURI(parts.join('='));
        });
    }
    return list;
}

const server = http.createServer(async (req, res) => {
    console.log(`[${req.method}] ${req.url}`);

    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.writeHead(204);
        return res.end();
    }

    // Обработка API
    if (req.url.startsWith('/api/')) {
        res.setHeader('Content-Type', 'application/json');

        try {
            if (req.method === 'POST' && req.url === '/api/register') {
                const { email, password } = await parseBody(req);
                if (!email || !password) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ error: 'Email и пароль обязательны' }));
                }

                await auth.registerUser(email, password);
                res.writeHead(201);
                return res.end(JSON.stringify({ message: 'Регистрация успешна' }));
            }

            if (req.method === 'POST' && req.url === '/api/login') {
                const { email, password } = await parseBody(req);
                const userId = await auth.authenticateUser(email, password);
                const token = await auth.createSession(userId);

                // Устанавливаем cookie (HttpOnly для безопасности)
                res.setHeader('Set-Cookie', `session_token=${token}; HttpOnly; Path=/; Max-Age=604800`); // 7 дней
                res.writeHead(200);
                return res.end(JSON.stringify({ message: 'Вход успешен' }));
            }

            if (req.method === 'POST' && req.url === '/api/logout') {
                const cookies = parseCookies(req);
                if (cookies.session_token) {
                    await auth.deleteSession(cookies.session_token);
                }
                res.setHeader('Set-Cookie', `session_token=; HttpOnly; Path=/; Max-Age=0`);
                res.writeHead(200);
                return res.end(JSON.stringify({ message: 'Выход успешен' }));
            }

            if (req.method === 'GET' && req.url === '/api/user') {
                const cookies = parseCookies(req);
                if (!cookies.session_token) {
                    res.writeHead(401);
                    return res.end(JSON.stringify({ error: 'Не авторизован' }));
                }

                const user = await auth.getUserByToken(cookies.session_token);
                if (!user) {
                    res.setHeader('Set-Cookie', `session_token=; HttpOnly; Path=/; Max-Age=0`);
                    res.writeHead(401);
                    return res.end(JSON.stringify({ error: 'Сессия недействительна' }));
                }

                res.writeHead(200);
                return res.end(JSON.stringify({ user: { email: user.email, role: user.role } }));
            }

            // Обработка формы контактов
            if (req.method === 'POST' && req.url === '/api/contact') {
                const { name, phone, message } = await parseBody(req);
                if (!name || !phone) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ error: 'Name and phone are required' }));
                }

                const db = require('./server/db');
                return new Promise((resolve) => {
                    db.run(
                        `INSERT INTO leads (name, phone, message) VALUES (?, ?, ?)`,
                        [name, phone, message],
                        function(err) {
                            if (err) {
                                res.writeHead(500);
                                res.end(JSON.stringify({ error: 'Database error' }));
                                return resolve();
                            }
                            res.writeHead(201);
                            res.end(JSON.stringify({ message: 'Success', leadId: this.lastID }));
                            resolve();
                        }
                    );
                });
            }

            // --- АДМИНСКИЕ МАРШРУТЫ ---
            if (req.url.startsWith('/api/admin')) {
                const cookies = parseCookies(req);
                if (!cookies.session_token) {
                    res.writeHead(401);
                    return res.end(JSON.stringify({ error: 'Не авторизован' }));
                }

                const user = await auth.getUserByToken(cookies.session_token);
                if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
                    res.writeHead(403);
                    return res.end(JSON.stringify({ error: 'Нет прав доступа' }));
                }

                // Получение всех пользователей
                if (req.method === 'GET' && req.url === '/api/admin/users') {
                    const db = require('./server/db');
                    return new Promise((resolve) => {
                        db.all(`SELECT id, email, role, created_at FROM users`, (err, rows) => {
                            if (err) {
                                res.writeHead(500);
                                res.end(JSON.stringify({ error: 'Ошибка БД' }));
                                return resolve();
                            }
                            res.writeHead(200);
                            res.end(JSON.stringify({ users: rows }));
                            resolve();
                        });
                    });
                }

                // Получение всех заявок
                if (req.method === 'GET' && req.url === '/api/admin/leads') {
                    const db = require('./server/db');
                    return new Promise((resolve) => {
                        db.all(`SELECT * FROM leads ORDER BY created_at DESC`, (err, rows) => {
                            if (err) {
                                res.writeHead(500);
                                res.end(JSON.stringify({ error: 'Ошибка БД' }));
                                return resolve();
                            }
                            res.writeHead(200);
                            res.end(JSON.stringify({ leads: rows }));
                            resolve();
                        });
                    });
                }
                if (req.method === 'POST' && req.url === '/api/admin/users/role') {
                    const { userId, newRole } = await parseBody(req);
                    if (!['user', 'worker', 'admin'].includes(newRole)) {
                        res.writeHead(400);
                        return res.end(JSON.stringify({ error: 'Неверная роль' }));
                    }

                    const db = require('./server/db');
                    return new Promise((resolve) => {
                        db.run(`UPDATE users SET role = ? WHERE id = ?`, [newRole, userId], function(err) {
                            if (err) {
                                res.writeHead(500);
                                res.end(JSON.stringify({ error: 'Ошибка БД' }));
                                return resolve();
                            }
                            res.writeHead(200);
                            res.end(JSON.stringify({ message: 'Роль обновлена' }));
                            resolve();
                        });
                    });
                }
            }

            // --- PRICE API ---
            if (req.url.startsWith('/api/prices')) {
                // Public GET returns all prices
                if (req.method === 'GET') {
                    const db = require('./server/db');
                    return new Promise(resolve => {
                        db.all('SELECT * FROM prices', (err, rows) => {
                            if (err) {
                                res.writeHead(500);
                                res.end(JSON.stringify({ error: 'DB error' }));
                                return resolve();
                            }
                            res.writeHead(200);
                            res.end(JSON.stringify({ prices: rows }));
                            resolve();
                        });
                    });
                }
                // Protected admin CRUD for prices (admin or superadmin)
                const cookies = parseCookies(req);
                if (!cookies.session_token) { res.writeHead(401); return res.end(JSON.stringify({ error: 'Не авторизован' })); }
                const user = await auth.getUserByToken(cookies.session_token);
                if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
                    res.writeHead(403);
                    return res.end(JSON.stringify({ error: 'Нет прав доступа' }));
                }
                const db = require('./server/db');
                if (req.method === 'POST') {
                    // create new price
                    const { category_lt, category_ru, name_lt, name_ru, unit_lt, unit_ru, price } = await parseBody(req);
                    return new Promise(resolve => {
                        db.run(`INSERT INTO prices (category_lt, category_ru, name_lt, name_ru, unit_lt, unit_ru, price) VALUES (?,?,?,?,?,?,?)`,
                            [category_lt, category_ru, name_lt, name_ru, unit_lt, unit_ru, price], function(err) {
                                if (err) { res.writeHead(500); res.end(JSON.stringify({ error: 'DB error' })); }
                                else { res.writeHead(201); res.end(JSON.stringify({ id: this.lastID })); }
                                resolve();
                            });
                    });
                }
                if (req.method === 'PUT') {
                    const { id, category_lt, category_ru, name_lt, name_ru, unit_lt, unit_ru, price } = await parseBody(req);
                    return new Promise(resolve => {
                        db.run(`UPDATE prices SET category_lt=?, category_ru=?, name_lt=?, name_ru=?, unit_lt=?, unit_ru=?, price=? WHERE id=?`,
                            [category_lt, category_ru, name_lt, name_ru, unit_lt, unit_ru, price, id], function(err) {
                                if (err) { res.writeHead(500); res.end(JSON.stringify({ error: 'DB error' })); }
                                else { res.writeHead(200); res.end(JSON.stringify({ changed: this.changes })); }
                                resolve();
                            });
                    });
                }
                if (req.method === 'DELETE') {
                    const { id } = await parseBody(req);
                    return new Promise(resolve => {
                        db.run(`DELETE FROM prices WHERE id=?`, [id], function(err) {
                            if (err) { res.writeHead(500); res.end(JSON.stringify({ error: 'DB error' })); }
                            else { res.writeHead(200); res.end(JSON.stringify({ deleted: this.changes })); }
                            resolve();
                        });
                    });
                }
            }


        } catch (error) {
            console.error(error);
            res.writeHead(500);
            return res.end(JSON.stringify({ error: error.message || 'Внутренняя ошибка сервера' }));
        }

        // Если API роут не найден
        res.writeHead(404);
        return res.end(JSON.stringify({ error: 'API роут не найден' }));
    }

    // Раздача статики
    let reqUrl = req.url.split('?')[0];
    let filePath = path.join(PUBLIC_DIR, reqUrl === '/' ? 'index.html' : reqUrl);
    
    // Поддержка роутинга без .html
    if (!path.extname(filePath)) {
        filePath += '.html';
    }

    const extname = path.extname(filePath);
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 Страница не найдена</h1>');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Initialize default admin and superadmin
auth.ensureDefaultAdmin('admin@mail.com', '1234qwer').catch(console.error);
auth.ensureDefaultSuperadmin('superadmin@mail.com', 'SuperAdmin123!').catch(console.error);

server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});

