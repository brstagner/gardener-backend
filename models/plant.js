"use strict";

require('dotenv').config();
const { db } = require("../db");
const {
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
} = require("../expressError");

/** Class for plant objects. */

class Plant {

    /**
     * Get all plants from the database
     * @ return plants: 
     *      {{plant_id, user_id,
     *      common_name, scientific_name,
     *      bloom_color, bloom_months}, ...}
     */
    static async getAllPlants () {
        const res = await db.query(
            `SELECT
                plant_id,
                user_id,
                common_name,
                scientific_name,
                bloom_color,
                bloom_months
            FROM plants`
        );
        return res.rows;

    };

    /**
     * Get one user's plants from the database
     * @ param {number} user_id - The user's user_id
     * @ return plants: 
     *      {{plant_id, user_id,
     *      common_name, scientific_name,
     *      bloom_color, bloom_months}, ...}
     */
    static async getUserPlants (user_id) {
        const res = await db.query(
            `SELECT
                plant_id,
                user_id,
                common_name,
                scientific_name,
                bloom_color,
                bloom_months
            FROM plants
            WHERE user_id = $1`,
            [user_id]
        );
        return res.rows;

    };

    /**
     * Get one plant from the database
     * @ param {number} plant_id - The plant's plant_id
     * @ return plant:
     *      {plant_id, user_id,
     *      common_name, scientific_name,
     *      bloom_color, bloom_months}
     */
    static async getOnePlant (plant_id) {
        const res = await db.query(
            `SELECT
                plant_id,
                user_id,
                common_name,
                scientific_name,
                bloom_color,
                bloom_months
            FROM plants
            WHERE plant_id = $1`,
            [plant_id]
        );
        return res.rows[0];
    };

    /**
     * Add one plant to the database
     * @ param {number} user_id - user_id of posting user
     * @ param {string} common_name
     * @ param {string} scientific_name
     * @ param {object} bloom_color ({one: "color", two: "color", three: "color"})
     * @ param {object} bloom_months ({jan: true, ...})
     * @ return plant:
     *      {plant_id, user_id,
     *      common_name, scientific_name,
     *      bloom_color, bloom_months}
     */
    static async addPlant ({ user_id, common_name, scientific_name, bloom_color, bloom_months }) {
        const res = await db.query(
            `INSERT INTO plants (
                user_id,
                common_name,
                scientific_name,
                bloom_color,
                bloom_months
                )
            VALUES
                ($1, $2, $3, $4, $5)
            RETURNING
                plant_id,
                user_id,
                common_name,
                scientific_name,
                bloom_color,
                bloom_months`,
            [user_id, common_name, scientific_name, bloom_color, bloom_months]
        );
        return res.rows[0];
    };

    /**
     * Add one plant to the database
     * @ param {number} plant_id - plant_id of updated plant
     * @ param {string} common_name
     * @ param {string} scientific_name
     * @ param {object} bloom_color ({one: "color", two: "color", three: "color"})
     * @ param {object} bloom_months ({jan: true, ...})
     * @ return plant:
     *      {plant_id, user_id,
     *      common_name, scientific_name,
     *      bloom_color, bloom_months}
     */
    static async update (plant_id, { common_name, scientific_name, bloom_color, bloom_months }) {
        let columns = '';
        let args = [plant_id];
        let counter = 2;
        if (common_name) {
            columns += `common_name = $${counter},`;
            args.push(common_name);
            counter++;
        }
        if (scientific_name) {
            columns += `scientific_name = $${counter},`;
            args.push(scientific_name);
            counter++;
        }
        if (bloom_color) {
            columns += `bloom_color = $${counter},`;
            args.push(bloom_color);
            counter++;
        }
        if (bloom_months) {
            columns += `bloom_months = $${counter},`;
            args.push(bloom_months);
            counter++;
        }
        columns = columns.slice(0, -1);

        const res = await db.query(
            `UPDATE plants
            SET ${columns}
            WHERE plant_id = $1
            RETURNING
                plant_id,
                user_id,
                common_name,
                scientific_name,
                bloom_color,
                bloom_months`,
            args
        );

        return res.rows[0];
    };

    /**
     * Delete one plant from the database
     * @ param {number} plant_id - plant_id of deleted plant
     * @ return undefined
     */
    static async delete (plant_id) {
        const res = await db.query(
            `DELETE
            FROM plants
            WHERE plant_id = $1`,
            [plant_id]
        );
        return res.rows;
    };
};

module.exports = Plant;