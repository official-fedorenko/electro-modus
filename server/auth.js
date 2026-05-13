const crypto = require('crypto');
const db = require('./db');

// Настройки хеширования
const HASH_BYTES = 64;
const SALT_BYTES = 16;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 };

function hashPassword(password) {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(SALT_BYTES).toString('hex');
        crypto.scrypt(password, salt, HASH_BYTES, SCRYPT_OPTIONS, (err, derivedKey) => {
            if (err) reject(err);
            resolve({
                hash: derivedKey.toString('hex'),
                salt: salt
            });
        });
    });
}

function verifyPassword(password, hash, salt) {
    return new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, HASH_BYTES, SCRYPT_OPTIONS, (err, derivedKey) => {
            if (err) reject(err);
            resolve(derivedKey.toString('hex') === hash);
        });
    });
}

function generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
}

module.exports = {
    async registerUser(email, password, role = 'user') {
        return new Promise(async (resolve, reject) => {
            try {
                const { hash, salt } = await hashPassword(password);
                db.run(
                    `INSERT INTO users (email, password_hash, salt, role) VALUES (?, ?, ?, ?)`,
                    [email, hash, salt, role],
                    function(err) {
                        if (err) {
                            if (err.message.includes('UNIQUE constraint failed')) {
                                return reject(new Error('Пользователь с таким email уже существует.'));
                            }
                            return reject(err);
                        }
                        resolve(this.lastID);
                    }
                );
            } catch (err) {
                reject(err);
            }
        });
    },

    async authenticateUser(email, password) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT id, password_hash, salt FROM users WHERE email = ?`, [email], async (err, row) => {
                if (err) return reject(err);
                if (!row) return reject(new Error('Неверный email или пароль.'));

                const isValid = await verifyPassword(password, row.password_hash, row.salt);
                if (!isValid) return reject(new Error('Неверный email или пароль.'));

                resolve(row.id);
            });
        });
    },

    async createSession(userId) {
        return new Promise((resolve, reject) => {
            const token = generateSessionToken();
            // Сессия на 7 дней
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

            db.run(
                `INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)`,
                [userId, token, expiresAt],
                function(err) {
                    if (err) return reject(err);
                    resolve(token);
                }
            );
        });
    },

    async getUserByToken(token) {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT u.id, u.email, u.role, u.name, u.phone, s.expires_at 
                 FROM sessions s 
                 JOIN users u ON s.user_id = u.id 
                 WHERE s.token = ?`,
                [token],
                (err, row) => {
                    if (err) return reject(err);
                    if (!row) return resolve(null);
                    
                    if (new Date(row.expires_at) < new Date()) {
                        // Токен истек
                        db.run(`DELETE FROM sessions WHERE token = ?`, [token]);
                        return resolve(null);
                    }
                    resolve({ id: row.id, email: row.email, role: row.role, name: row.name, phone: row.phone });
                }
            );
        });
    },

    async deleteSession(token) {
        return new Promise((resolve, reject) => {
            db.run(`DELETE FROM sessions WHERE token = ?`, [token], function(err) {
                if (err) return reject(err);
                resolve();
            });
        });
    },

    async ensureDefaultAdmin(email, password) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT id FROM users WHERE email = ?`, [email], async (err, row) => {
                if (err) return reject(err);
                if (row) {
                    return resolve(row.id); // Админ уже существует
                }
                try {
                    const id = await this.registerUser(email, password, 'admin');
                    console.log(`Базовый администратор ${email} успешно создан.`);
                    resolve(id);
                } catch (e) {
                    reject(e);
                }
            });
        });
    },

    // Ensure default superadmin exists (role: superadmin)
    async ensureDefaultSuperadmin(email, password) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT id FROM users WHERE email = ?`, [email], async (err, row) => {
                if (err) return reject(err);
                if (row) {
                    return resolve(row.id); // Superadmin already exists
                }
                try {
                    const id = await this.registerUser(email, password, 'superadmin');
                    console.log(`Суперадминистратор ${email} успешно создан.`);
                    resolve(id);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }
};
