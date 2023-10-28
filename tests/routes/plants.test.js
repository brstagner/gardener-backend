// Test Plants routes

// connect to test database
process.env.NODE_ENV = "test";

// npm packages
const request = require('supertest');

// app imports
const app = require('../../app');
const { db } = require('../../db');
const { authenticateJWT, createToken } = require('../../authorization');

const express = require('express');
const router = express.Router();

router.use(authenticateJWT);

let users;
let user;
let admin;
let plants;
let plantOne;
let plantTwo;

let adminToken = "";
let userToken = "";
const wrongUserToken = createToken({ "user_id": 0, "is_admin": false });

beforeEach(async function () {
    // Add a test user to the database
    let result = await db.query(`
    INSERT INTO users
        (username, password, email, location, is_admin)
    VALUES
        ('u1', 'password', 'user1@email.com', '{"name" : "Utah"}', null),
        ('a1', 'password', 'admin@email.com', '{"name" : "Alabama"}', true)
    RETURNING user_id, username, email, location, is_admin
    `);
    users = result.rows;
    user = result.rows[0];
    userToken = createToken(user);

    admin = result.rows[1];
    adminToken = createToken(admin);

    result = await db.query(
        `INSERT INTO plants
        (user_id, common_name, scientific_name, bloom_color, bloom_months)
    VALUES
        (${user.user_id}, 'Plant One', 'Primum planta', '{"one":"red", "two":"blue"}', '{"jun":"t", "jul":"t", "aug":"t"}'),
        (${user.user_id}, 'Plant Two', 'Secundo planta', '{"one":"green", "two":"white"}', '{"jan":"t", "nov":"t", "dec":"t"}')
    RETURNING plant_id, user_id, common_name, scientific_name, bloom_color, bloom_months
    `);

    plants = result.rows;
    plantOne = result.rows[0];
    plantTwo = result.rows[1];
});

afterEach(async function () {
    // delete test data
    await db.query("DELETE FROM plants");
    await db.query("DELETE FROM users");
});

afterAll(async function () {
    // close db connection
    await db.end();
});

describe("GET /plants/all", function () {
    test("Gets a list of plants", async function () {
        const response = await request(app)
            .get(`/plants/all`)
            .set('Authorization', adminToken);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            plants: plants
        });
    });
    test("Unauthorized for non-admin", async function () {
        const response = await request(app)
            .get(`/plants/all`)
            .set('Authorization', userToken);
        expect(response.statusCode).toEqual(401);
    });
});

describe("GET /plants/:plant_id", function () {
    test("Gets one plant", async function () {
        const response = await request(app)
            .get(`/plants/${plantOne.plant_id}`)
            .set('authorization', userToken);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            ...plantOne
        });
    });
    test("Unauthorized for wrong user", async function () {
        const response = await request(app)
            .get(`/plants/${plantTwo.plant_id}`)
            .set('authorization', wrongUserToken);
        expect(response.statusCode).toEqual(401);
    });
});

describe("POST /plant", function () {
    const plantThree = {
        "common_name": "Plant Three",
        "scientific_name": "Tertia planta",
        "bloom_color": { "one": "yellow", "two": "purple" },
        "bloom_months": { "feb": "t", "mar": "t", "apr": "t" }
    };
    test("Adds a new plant", async function () {
        const response = (await request(app)
            .post(`/plants`)
            .set('Authorization', userToken)
            .send({ "user_id": user.user_id, ...plantThree }
            ));
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            plant: {
                "plant_id": expect.any(Number),
                "user_id": user.user_id,
                ...plantThree
            }
        });
    }
    );
    test("Unauthorized for wrong user", async function () {
        const response = (await request(app)
            .post(`/plants`)
            .set('Authorization', wrongUserToken)
            .send({ "user_id": user.user_id, ...plantThree }
            ));
        expect(response.statusCode).toEqual(401);
    }
    );
});

describe("PATCH /plants/:plant_id", function () {
    const data = {
        "common_name": "Plant Four",
        "scientific_name": "Quartus planta",
        "bloom_color": { "one": "silver", "two": "gold" },
        "bloom_months": { "may": "t" }
    };
    test("Patches a plant", async function () {
        const response = (await request(app)
            .patch(`/plants/${plantOne.plant_id}`)
            .set('Authorization', userToken)
            .send({ ...data }));
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            plant: {
                "plant_id": plantOne.plant_id,
                "user_id": user.user_id,
                ...data
            }
        });
    });
    test("Partially patches a plant", async function () {
        const response = (await request(app)
            .patch(`/plants/${plantTwo.plant_id}`)
            .set('Authorization', userToken)
            .send({ "common_name": "Plant Five" }));
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            plant: {
                ...plantTwo,
                "common_name": "Plant Five",
            }
        });
    });
    test("Unauthorized for wrong user", async function () {
        const response = await request(app)
            .patch(`/plants/${plantTwo.plant_id}`)
            .set('Authorization', wrongUserToken)
            .send({ "userId": user.user_id, "common_name": "Plant Five" });
        expect(response.statusCode).toEqual(401);
    });
});

describe("DELETE /plants/:plant_id", function () {
    test("Deletes a plant", async function () {
        const response = (await request(app)
            .delete(`/plants/${plantTwo.plant_id}`)
            .set('Authorization', adminToken));
        expect(response.statusCode).toEqual(200);
    });
});