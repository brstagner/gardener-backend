
"use strict";

require('dotenv').config();
const { db } = require("../db");
const bcrypt = require("bcrypt");
const {
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
} = require("../expressError");
const BCRYPT_WORK_FACTOR = +(process.env.BCRYPT_WORK_FACTOR);

// override parser to return numeric types as floats
const types = require('pg').types;
types.setTypeParser(1700, function (val) {
    return parseFloat(val);
});

/** Class for user objects. */

class User {

    /**
     * Authenticate user, else throw UnauthorizedError.
     * @ param {string} username - The user's username
     * @ param {string} password - The user's password
     * @ return { username, first_name, last_name, email, is_admin }
     */
    static async authenticate (username, password) {
        // try to find user
        const result = await db.query(
            `SELECT username,
                    user_id,
                    password,
                    is_admin
           FROM users
           WHERE username = $1`,
            [username],
        );

        const user = result.rows[0];

        if (user) {
            // compare hashed password to a new hash from password
            const isValid = await bcrypt.compare(password, user.password);
            if (isValid === true) {
                delete user.password;
                return user;
            };
        };
        throw new UnauthorizedError("Invalid username/password");
    };

    /**
     * Get all users from the database
     * @ return users: 
     *      { { user_id, username,
     *      email, location, is_admin }, ... }
     */
    static async getAllUsers () {
        const res = await db.query(
            `SELECT user_id, username, email, location, is_admin
            FROM users`
        );
        return res.rows;
    };

    /**
     * Get one user from the database
     * @ param {number} user_id - The user's user_id
     * @ return user: { user_id, username,
     *      email, location, is_admin }
     */
    static async getOneUser (user_id) {
        const res = await db.query(
            `SELECT user_id, username, email, location, is_admin
            FROM users
            WHERE user_id = $1`,
            [user_id]
        );
        return res.rows[0];
    };

    /**
     * Add a new user to the database
     * @ param {string} username
     * @ param {string} password
     * @ param {string} email
     * @ param {object} location
     * @ param {boolean} is_admin
     * @ return user: { user_id, username,
     *      email, location, is_admin }
     */
    static async register ({ username, password, email, location, is_admin = false }) {

        // check for duplicate username
        const duplicate = await db.query(
            `SELECT username
           FROM users
           WHERE username = $1`,
            [username],
        );

        if (duplicate.rows[0]) {
            throw new BadRequestError(`Username "${username}" is taken`);
        }

        // hash password
        const hash = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

        // add user data + hashed password to database
        const res = await db.query(
            `INSERT INTO users
                (username, password, email, location, is_admin)
            VALUES
                ($1, $2, $3, $4, $5)
            RETURNING
                user_id, username, email, location, is_admin`,
            [username, hash, email, location, is_admin]
        );

        return res.rows[0];
    };

    /**
     * Updates a user in the database
     * @ param {number} user_id
     * @ param {string} username
     * @ param {string} password
     * @ param {string} email
     * @ param {object} location
     * @ param {boolean} is_admin
     * @ return user: { user_id, username,
     *      email, location, is_admin }
     */
    static async update (user_id, { newUsername, password, email, location, is_admin = false }) {

        // get current username from user_id
        const oldUsername = await db.query(
            `SELECT username
            FROM users
            WHERE user_id = $1`,
            [user_id]
        );

        // if username is being changed, check for duplicate
        if (oldUsername.rows[0].username != newUsername) {
            const duplicate = await db.query(
                `SELECT username
                FROM users
                WHERE username = $1`,
                [newUsername]);

            if (duplicate.rows[0]) {
                throw new BadRequestError(`Username "${newUsername}" is taken`);
            }
        }

        // string that contains column names for changed data
        let columns = '';
        // array that contains changed data
        let args = [user_id];
        // keeps track of aliases
        let counter = 2;
        if (newUsername) {
            columns += `username = $${counter},`;
            args.push(newUsername);
            counter++;
        }
        if (password) {
            columns += `password = $${counter},`;

            // hash password
            const hash = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

            args.push(hash);
            counter++;
        }
        if (email) {
            columns += `email = $${counter},`;
            args.push(email);
            counter++;
        }
        if (location) {
            columns += `location = $${counter},`;
            args.push(location);
            counter++;
        }
        columns += `is_admin = $${counter},`;
        args.push(is_admin);
        counter++;
        columns = columns.slice(0, -1);

        const res = await db.query(
            `UPDATE users
            SET ${columns}
            WHERE user_id = $1
            RETURNING user_id, username, email, location, is_admin`,
            args
        );

        return res.rows[0];
    };

    /**
     * Delete one user from the database
     * @ param {number} user_id - user_id of deleted user
     * @ return undefined
     */
    static async delete (user_id) {
        const res = await db.query(
            `DELETE
            FROM users
            WHERE user_id = $1`,
            [user_id]
        );
        return 'deleted';
    };
};

module.exports = User;