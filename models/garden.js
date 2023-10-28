"use strict";

require('dotenv').config();
const { db } = require("../db");
const {
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
} = require("../expressError");

/** Class for garden objects */

class Garden {

    /**
     * Get all gardens from the database
     * @ return gardens: {{garden_id, user_id, name, grid}, ...}
     */
    static async getAllGardens () {
        const res = await db.query(
            `SELECT
                garden_id,
                user_id,
                name,
                grid
            FROM gardens`
        );
        return res.rows;
    };

    /**
     * Get one user's gardens from the database
     * @ param {number} user_id - The user's user_id
     * @ return gardens: {{garden_id, user_id, name, grid}, ...}
     */
    static async getUserGardens (user_id) {
        const res = await db.query(
            `SELECT
                garden_id,
                user_id,
                name,
                grid
            FROM gardens
            WHERE user_id = $1`,
            [user_id]
        );
        return res.rows;
    };

    /**
     * Get one garden from the database
     * @ param {number} garden_id - The garden's garden_id
     * @ return garden: {garden_id, user_id, name, grid}
     */
    static async getOneGarden (garden_id) {
        const res = await db.query(
            `SELECT
                garden_id,
                user_id,
                name,
                grid
            FROM gardens
            WHERE garden_id = $1`,
            [garden_id]
        );
        return res.rows[0];
    };

    /**
     * Add one garden to the database
     * @ param {number} user_id - user_id of posting user
     * @ param {string} name - name of the garden
     * @ param {object} grid - grid object for garden
     * @ return garden: {garden_id, user_id, name, grid}
     */
    static async addGarden ({ user_id, name, grid }) {

        const res = await db.query(
            `INSERT INTO gardens (
                user_id,
                name,
                grid
                )
            VALUES
                ($1, $2, $3)
            RETURNING
                garden_id,
                user_id,
                name,
                grid`,
            [user_id, name, grid]
        );
        return res.rows[0];
    };

    /**
     * Update one garden in the database
     * @ param {number} garden_id - garden_id of updated garden
     * @ param {string} name - name of the garden
     * @ param {object} grid - grid object for garden
     * @ return garden: {garden_id, user_id, name, grid}
     */
    static async update (garden_id, { name, grid }) {
        let columns = '';
        let args = [garden_id];
        let counter = 2;
        if (name) {
            columns += `name = $${counter},`;
            args.push(name);
            counter++;
        }
        if (grid) {
            columns += `grid = $${counter},`;
            args.push(grid);
            counter++;
        }
        columns = columns.slice(0, -1);

        const res = await db.query(
            `UPDATE gardens
            SET ${columns}
            WHERE garden_id = $1
            RETURNING
                garden_id,
                user_id,
                name,
                grid`,
            args
        );
        return res.rows[0];
    };

    /**
     * Delete one garden from the database
     * @ param {number} garden_id - garden_id of deleted garden
     * @ return undefined
     */
    static async delete (garden_id) {
        const res = await db.query(
            `DELETE
            FROM gardens
            WHERE garden_id = $1`,
            [garden_id]
        );
        return res.rows;
    };
};

module.exports = Garden;