import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DB_PATH || join(__dirname, '../Database/my_records.db');

// Initialize database connection
function getDb() {
    return new Database(DB_PATH, { readonly: true });
}

/**
 * Search for food banks and pantries by location
 */
export function searchByLocation(city, state) {
    const db = getDb();
    try {
        const query = `
            SELECT * FROM records
            WHERE location LIKE ? OR location LIKE ?
            ORDER BY name
        `;
        const cityPattern = `%${city}%`;
        const statePattern = `%${state}%`;
        const results = db.prepare(query).all(cityPattern, statePattern);
        return results;
    } finally {
        db.close();
    }
}

/**
 * Search for specific types of resources (food banks, soup kitchens, etc.)
 */
export function searchByType(type, location = null) {
    const db = getDb();
    try {
        let query = `
            SELECT * FROM records
            WHERE (name LIKE ? OR description LIKE ?)
        `;
        const params = [`%${type}%`, `%${type}%`];

        if (location) {
            query += ` AND location LIKE ?`;
            params.push(`%${location}%`);
        }

        query += ` ORDER BY name`;

        const results = db.prepare(query).all(...params);
        return results;
    } finally {
        db.close();
    }
}

/**
 * Search for stores that accept SNAP/EBT
 */
export function searchSnapAccepting(location = null) {
    const db = getDb();
    try {
        let query = `
            SELECT * FROM records
            WHERE (description LIKE '%SNAP%' OR description LIKE '%EBT%' OR description LIKE '%food stamps%')
        `;
        const params = [];

        if (location) {
            query += ` AND location LIKE ?`;
            params.push(`%${location}%`);
        }

        query += ` ORDER BY name`;

        const results = db.prepare(query).all(...params);
        return results;
    } finally {
        db.close();
    }
}

/**
 * Search for specific dietary requirements (Halal, Kosher, etc.)
 */
export function searchByDietaryRequirement(requirement, location = null) {
    const db = getDb();
    try {
        let query = `
            SELECT * FROM records
            WHERE (name LIKE ? OR description LIKE ?)
        `;
        const params = [`%${requirement}%`, `%${requirement}%`];

        if (location) {
            query += ` AND location LIKE ?`;
            params.push(`%${location}%`);
        }

        query += ` ORDER BY name`;

        const results = db.prepare(query).all(...params);
        return results;
    } finally {
        db.close();
    }
}

/**
 * Get all records for a specific location
 */
export function getAllByLocation(location) {
    const db = getDb();
    try {
        const query = `
            SELECT * FROM records
            WHERE location LIKE ?
            ORDER BY name
        `;
        const results = db.prepare(query).all(`%${location}%`);
        return results;
    } finally {
        db.close();
    }
}

/**
 * Search records by keyword
 */
export function searchByKeyword(keyword) {
    const db = getDb();
    try {
        const query = `
            SELECT * FROM records
            WHERE name LIKE ? OR description LIKE ? OR location LIKE ?
            ORDER BY name
        `;
        const pattern = `%${keyword}%`;
        const results = db.prepare(query).all(pattern, pattern, pattern);
        return results;
    } finally {
        db.close();
    }
}
