const Database = require("better-sqlite3");
const TaskRepository = require("./TaskRepository");

/**
 * SqliteTaskRepository
 * 
 * Implements the TaskRepository interface for a local SQLite database.
 * This class inherits from TaskRepository and implements the actual SQL queries
 * using the `better-sqlite3` library.
 * 
 * Note that all methods are marked as `async` to match the TaskRepository contract,
 * returning a Promise even though SQLite operations are synchronous under the hood.
 */
class SqliteTaskRepository extends TaskRepository {
    constructor(dbPath = "tasks.db") {
        super();
        this.db = new Database(dbPath);
        this.init();
    }

    /**
     * Initialize the database by creating the table and seeding initial tasks.
     */
    init() {
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                done INTEGER NOT NULL DEFAULT 0
            )
        `).run();

        // Seed initial tasks ONLY if the database is empty
        const rowCount = this.db.prepare("SELECT COUNT(*) as count FROM tasks").get().count;
        if (rowCount === 0) {
            const insert = this.db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");
            
            const insertMany = this.db.transaction((tasksToSeed) => {
                for (const task of tasksToSeed) {
                    insert.run(task.title, task.done);
                }
            });

            insertMany([
                { title: "Learn backend basics", done: 1 }, // 1 means true
                { title: "Implement GET endpoints", done: 0 }, // 0 means false
                { title: "Understand HTTP status codes", done: 0 }
            ]);
            console.log("SQLite Database initialized and seeded with 3 example tasks!");
        }
    }

    /**
     * Get all tasks
     * @returns {Promise<Array>} A list of tasks
     */
    async getAll() {
        const rows = this.db.prepare("SELECT * FROM tasks").all();
        
        // Map database done status (0/1) to booleans (false/true)
        return rows.map(r => ({
            id: r.id,
            title: r.title,
            done: r.done === 1
        }));
    }

    /**
     * Get a task by ID
     * @param {number} id The task ID
     * @returns {Promise<Object|null>} The task object, or null if not found
     */
    async getById(id) {
        const row = this.db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
        if (!row) {
            return null;
        }
        return {
            id: row.id,
            title: row.title,
            done: row.done === 1
        };
    }

    /**
     * Create a new task
     * @param {string} title The task title
     * @returns {Promise<Object>} The newly created task
     */
    async create(title) {
        const info = this.db.prepare("INSERT INTO tasks (title, done) VALUES (?, 0)").run(title.trim());
        return {
            id: Number(info.lastInsertRowid),
            title: title.trim(),
            done: false
        };
    }

    /**
     * Update an existing task
     * @param {number} id The task ID
     * @param {Object} updates An object containing title and/or done status updates
     * @returns {Promise<Object|null>} The updated task, or null if not found
     */
    async update(id, updates) {
        // Fetch current database state for this task
        const task = this.db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
        if (!task) {
            return null;
        }

        // Use existing fields if not overridden by updates
        const newTitle = updates.title !== undefined ? updates.title.trim() : task.title;
        const newDone = updates.done !== undefined ? (updates.done ? 1 : 0) : task.done;

        this.db.prepare("UPDATE tasks SET title = ?, done = ? WHERE id = ?").run(newTitle, newDone, id);

        return {
            id: id,
            title: newTitle,
            done: newDone === 1
        };
    }

    /**
     * Delete a task by ID
     * @param {number} id The task ID
     * @returns {Promise<boolean>} True if deleted, false if not found
     */
    async delete(id) {
        const info = this.db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
        return info.changes > 0;
    }
}

module.exports = SqliteTaskRepository;
