const db = require('./db');

class TicketsAPI {
    // Создать заявку
    createTicket(userId, title, description) {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO tickets (user_id, title, description) VALUES (?, ?, ?)',
                [userId, title, description],
                function (err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, title, description, status: 'new' });
                }
            );
        });
    }

    // Получить заявки пользователя
    getUserTickets(userId) {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC',
                [userId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    // Получить все заявки (для админов/воркеров)
    getAllTickets() {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT t.*, u.email as user_email, u.name as user_name 
                 FROM tickets t 
                 JOIN users u ON t.user_id = u.id 
                 ORDER BY t.created_at DESC`,
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    // Получить конкретную заявку
    getTicket(ticketId) {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT t.*, u.email as user_email, u.name as user_name 
                 FROM tickets t 
                 JOIN users u ON t.user_id = u.id 
                 WHERE t.id = ?`,
                [ticketId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    // Обновить статус заявки
    updateTicketStatus(ticketId, status) {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE tickets SET status = ? WHERE id = ?',
                [status, ticketId],
                function (err) {
                    if (err) reject(err);
                    else resolve({ success: true });
                }
            );
        });
    }

    // Добавить сообщение к заявке
    addMessage(ticketId, userId, message) {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO ticket_messages (ticket_id, user_id, message) VALUES (?, ?, ?)',
                [ticketId, userId, message],
                function (err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, ticket_id: ticketId, user_id: userId, message });
                }
            );
        });
    }

    // Получить сообщения заявки
    getMessages(ticketId) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT m.*, u.role as user_role, u.name as user_name, u.email as user_email 
                 FROM ticket_messages m 
                 JOIN users u ON m.user_id = u.id 
                 WHERE m.ticket_id = ? 
                 ORDER BY m.created_at ASC`,
                [ticketId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }
}

module.exports = new TicketsAPI();
