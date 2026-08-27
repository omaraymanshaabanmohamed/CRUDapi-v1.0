/**
 * TaskRepository Interface / Base Class
 * 
 * In JavaScript, there are no native interfaces (like in TypeScript or Java). 
 * Instead, we use a base class that throws errors if its methods are not overridden 
 * by a subclass. This acts as a contract.
 * 
 * Why make these methods `async`?
 * SQLite operations (which we currently use) are synchronous in Node.js. 
 * PostgreSQL operations (which we will use in Phase 3) are asynchronous.
 * By making all methods return a Promise (using `async`), we ensure that our API 
 * routes can treat all repositories identically (using `await`), making them 
 * completely interchangeable.
 */
class TaskRepository {
    async getAll() {
        throw new Error("Method 'getAll()' must be implemented.");
    }

    async getById(id) {
        throw new Error("Method 'getById()' must be implemented.");
    }

    async create(title) {
        throw new Error("Method 'create()' must be implemented.");
    }

    async update(id, updates) {
        throw new Error("Method 'update()' must be implemented.");
    }

    async delete(id) {
        throw new Error("Method 'delete()' must be implemented.");
    }
}

module.exports = TaskRepository;
