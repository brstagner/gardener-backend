// Test Gardens routes

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

let user;
let admin;
let gardens;
let gardenOne;
let gardenTwo;

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

    user = result.rows[0];
    userToken = createToken(user);

    admin = result.rows[1];
    adminToken = createToken(admin);

    result = await db.query(
        `INSERT INTO gardens
        (user_id, name, grid)
    VALUES
        (${user.user_id}, 'Garden One', '{"dimensions":{"height":1,"width":1},"rows":{"1":{"row":1,"cells":{"1":{"row":1,"column":1}}}}}'),
        (${user.user_id}, 'Garden Two', '{"dimensions":{"height":1,"width":1},"rows":{"1":{"row":1,"cells":{"1":{"row":1,"column":1}}}}}')
    RETURNING garden_id, user_id, name, grid
    `);

    gardens = result.rows;
    gardenOne = result.rows[0];
    gardenTwo = result.rows[1];
});

afterEach(async function () {
    // delete test data
    await db.query("DELETE FROM gardens");
    await db.query("DELETE FROM plants");
    await db.query("DELETE FROM users");
});

afterAll(async function () {
    // close db connection
    await db.end();
});

describe("GET /gardens/all", function () {
    test("Gets a list of gardens", async function () {
        const response = await request(app)
            .get(`/gardens/all`)
            .set('Authorization', adminToken);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            gardens: gardens
        });
    });
    test("Unauthorized for non-admin", async function () {
        const response = await request(app)
            .get(`/gardens/all`)
            .set('Authorization', userToken);
        expect(response.statusCode).toEqual(401);
    });
});

describe("GET /gardens/:garden_id", function () {
    test("Gets one garden", async function () {
        const response = await request(app)
            .get(`/gardens/${gardenOne.garden_id}`)
            .set('Authorization', userToken);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            ...gardenOne
        });
    });
    test("Unauthorized for wrong user", async function () {
        const response = await request(app)
            .get(`/gardens/${gardenOne.garden_id}`)
            .set('Authorization', wrongUserToken);
        expect(response.statusCode).toEqual(401);
    });

});

describe("POST /garden", function () {
    const gardenThree = {
        "name": "Garden Three",
        "grid": {}
    };
    test("Adds a new garden", async function () {
        const response = (await request(app)
            .post(`/gardens`)
            .set('Authorization', userToken)
            .send({ "user_id": user.user_id, ...gardenThree }));
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            garden: {
                "garden_id": expect.any(Number),
                "user_id": user.user_id,
                ...gardenThree
            }
        });
    });
    test("Unauthorized for wrong user", async function () {
        const response = (await request(app)
            .post(`/gardens`)
            .set('Authorization', wrongUserToken)
            .send({ "user_id": user.user_id, ...gardenThree }));
        expect(response.statusCode).toEqual(401);
    }
    );
});

describe("PATCH /gardens/:garden_id", function () {
    const data = {
        "name": "Garden Four",
        "grid": {}
    };
    test("Patches a garden", async function () {
        const response = (await request(app)
            .patch(`/gardens/${gardenOne.garden_id}`)
            .set('Authorization', userToken)
            .send({ ...data }));

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            garden: {
                "garden_id": gardenOne.garden_id,
                "user_id": user.user_id,
                ...data
            }
        });
    });
    test("Partially patches a garden", async function () {
        const response = (await request(app)
            .patch(`/gardens/${gardenTwo.garden_id}`)
            .set('Authorization', userToken)
            .send({ "grid": {} }));
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            garden: {
                "garden_id": gardenTwo.garden_id,
                "user_id": user.user_id,
                "name": "Garden Two",
                "grid": {}
            }
        });
    });
    test("Unauthorized for wrong user", async function () {
        const response = await request(app)
            .patch(`/gardens/${gardenTwo.garden_id}`)
            .set('authorization', wrongUserToken).send({ "name": "gardenFour" });
        expect(response.statusCode).toEqual(401);
    });
});

describe("DELETE /gardens/:garden_id", function () {
    test("Deletes a garden", async function () {
        const response = (await request(app)
            .delete(`/gardens/${gardenTwo.garden_id}`)
            .set('authorization', adminToken));
        expect(response.statusCode).toEqual(200);
    });
});