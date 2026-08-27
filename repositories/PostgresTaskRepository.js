const { Pool } = require("pg");
const TaskRepository = require("./TaskRepository");

/**
 * PostgresTaskRepository
 * 
 * Implements the TaskRepository interface for a PostgreSQL database.
 * This class inherits from TaskRepository and uses connection pooling to interact
 * with Postgres asynchronously.
 * 
 * Parameterized queries are written using `$1`, `$2`, etc. (which is Postgres standard),
 * instead of SQLite's `?`.
 */
class PostgresTaskRepository extends TaskRepository {
    constructor() {
        super();
        // The Pool automatically reads the DATABASE_URL connection string from process.env
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });
    }

    /**
     * Get all tasks
     * @returns {Promise<Array>} A list of tasks
     */
    async getAll() {
        // Query tasks sorted by ID
        const res = await this.pool.query("SELECT * FROM tasks ORDER BY id ASC");
        
        // Postgres boolean values map directly to JS booleans (true/false)
        return res.rows.map(r => ({
            id: r.id,
            title: r.title,
            done: r.done === true
        }));
    }

    /**
     * Get a task by ID
     * @param {number} id The task ID
     * @returns {Promise<Object|null>} The task object, or null if not found
     */
    async getById(id) {
        const res = await this.pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
        if (res.rows.length === 0) {
            return null;
        }
        
        const row = res.rows[0];
        return {
            id: row.id,
            title: row.title,
            done: row.done === true
        };
    }

    /**
     * Create a new task
     * @param {string} title The task title
     * @returns {Promise<Object>} The newly created task
     */
    async create(title) {
        // In PostgreSQL, we can use the 'RETURNING *' clause to get the inserted row directly
        const res = await this.pool.query(
            "INSERT INTO tasks (title, done) VALUES ($1, false) RETURNING *",
            [title.trim()]
        );
        
        const row = res.rows[0];
        return {
            id: row.id,
            title: row.title,
            done: row.done === true
        };
    }

    /**
     * Update an existing task
     * @param {number} id The task ID
     * @param {Object} updates An object containing title and/or done status updates
     * @returns {Promise<Object|null>} The updated task, or null if not found
     */
    async update(id, updates) {
        // Fetch current state first
        const currentTask = await this.getById(id);
        if (!currentTask) {
            return null;
        }

        // Use existing fields if not overridden by updates
        const newTitle = updates.title !== undefined ? updates.title.trim() : currentTask.title;
        const newDone = updates.done !== undefined ? updates.done : currentTask.done;

        // Perform update and return the updated row
        const res = await this.pool.query(
            "UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING *",
            [newTitle, newDone, id]
        );

        const row = res.rows[0];
        return {
            id: row.id,
            title: row.title,
            done: row.done === true
        };
    }

    /**
     * Delete a task by ID
     * @param {number} id The task ID
     * @returns {Promise<boolean>} True if deleted, false if not found
     */
    async delete(id) {
        const res = await this.pool.query("DELETE FROM tasks WHERE id = $1", [id]);
        return res.rowCount > 0;
    }
}

module.exports = PostgresTaskRepository;
