/** Database setup */

require('dotenv').config();
const { Client } = require('pg');

let DB_URI;

process.env.NODE_ENV === "test" ?
    DB_URI = process.env.TEST_DB_URI :
    DB_URI = process.env.DB_URI || process.env.DEV_DB_URI;

let db = new Client({
    connectionString: DB_URI
});

db.connect();

async function drop_tables () {
    await db.query(`
    DROP TABLE plants;
    DROP TABLE gardens;
    DROP TABLE users;
    `);
}

async function create_tables () {
    await db.query(`
    CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(20) NOT NULL,
        password VARCHAR(60) NOT NULL,
        email VARCHAR(70) NOT NULL
            CHECK(position('@' IN email) > 1),
        location JSON,
        is_admin boolean
        );
    CREATE TABLE IF NOT EXISTS gardens (
        garden_id SERIAL PRIMARY KEY,
        user_id integer
            REFERENCES users
            ON DELETE CASCADE,
        name VARCHAR(20) NOT NULL,
        grid JSON
        );
    CREATE TABLE IF NOT EXISTS plants (
        plant_id SERIAL PRIMARY KEY,
        user_id integer
            REFERENCES users
            ON DELETE CASCADE,
        common_name VARCHAR(100) NOT NULL,
        scientific_name VARCHAR(100),
        bloom_color JSON,
        bloom_months JSON
        );
`);
}

module.exports = { db, drop_tables, create_tables };