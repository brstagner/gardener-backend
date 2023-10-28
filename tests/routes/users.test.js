// Test User routes

// connect to test database
process.env.NODE_ENV = "test";

// npm packages
const request = require('supertest');

// app imports
const app = require('../../app');
const { db } = require('../../db');
const { authenticateJWT, createToken, isAdmin } = require('../../authorization');

const express = require('express');
const router = express.Router();

router.use(authenticateJWT);

let users;
let user;
let admin;
// const adminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImExIiwiaXNBZG1pbiI6dHJ1ZSwiaWF0IjoxNjgzMzc4MzI1fQ.TCLE-SD_0ZN9DFzj_AbdIs4kRET2EMStYnwL5Mrxcp0";
// const userToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InUxIiwiaXNBZG1pbiI6ZmFsc2UsImlhdCI6MTY4MzM3ODMyNX0.jwPf7AaIbrHbXq1djzQnAmrTFJFX58qW8vLeBi8dME4";
// const wrongUserToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InUyIiwiaXNBZG1pbiI6ZmFsc2UsImlhdCI6MTY4MzM3ODMyNX0.NzFdUO2NBDFfQng0K2b3ZmAczU4kCsvdKIxeQC7Tbzs";

let userToken = "";
let adminToken = "";
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
});

afterEach(async function () {
    // delete test data

    await db.query("DELETE FROM users");
});

afterAll(async function () {
    // close db connection

    await db.end();
});

describe("GET /users", function () {
    test("Gets a list of users", async function () {
        const response = await request(app)
            .get(`/users`)
            .set('Authorization', adminToken);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            users: users
        });
    });
    test("Unauthorized for non-admin", async function () {
        const response = await request(app).get(`/users`).set('authorization', userToken);
        expect(response.statusCode).toEqual(401);
    });
});

describe("GET /users/:user_id", function () {
    test("Gets one user", async function () {
        const response = await request(app)
            .get(`/users/${user.user_id}`)
            .set('Authorization', userToken);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            user: {
                "user_id": expect.any(Number),
                "username": user.username,
                "email": user.email,
                "location": user.location,
                "is_admin": null
            }
        });
    });
    test("Unauthorized for wrong user", async function () {
        const response = await request(app)
            .get(`/users/${user.user_id}`)
            .set('Authorization', wrongUserToken);
        expect(response.statusCode).toEqual(401);
    });
});

describe("POST /users", function () {
    const user2 = {
        "username": "u2",
        "password": "password",
        "email": "user2@email.com",
        "location": {
            "name": "Arkansas"
        }
    };
    test("Registers a new user", async function () {
        const response = (await request(app)
            .post(`/users`)
            .send(user2));
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            user: {
                "user_id": expect.any(Number),
                "username": user2.username,
                "email": user2.email,
                "location": user2.location,
                "is_admin": false
            },
            token: expect.any(String)
        });
    });
});

describe("PATCH /users/:user_id", function () {
    const data = {
        "newUsername": "u2",
        "password": "Password",
        "email": "user2@email.com",
        "location": {
            "name": "Alabama"
        }
    };
    test("Patches a user", async function () {
        const response = (await request(app)
            .patch(`/users/${user.user_id}`)
            .set('Authorization', userToken)
            .send(data));
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            user: {
                "user_id": expect.any(Number),
                "username": data.newUsername,
                "email": data.email,
                "location": data.location,
                "is_admin": false
            }
        });
    });
    test("Partially patches a user", async function () {
        const response = (await request(app)
            .patch(`/users/${user.user_id}`)
            .set('authorization', userToken)
            .send({ "newUsername": "u3" }));
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            user: {
                "user_id": expect.any(Number),
                "username": "u3",
                "email": user.email,
                "location": user.location,
                "is_admin": false
            }
        });
    });
    test("Unauthorized for wrong user", async function () {
        const response = await request(app)
            .patch(`/users/${user.user_id}`)
            .set('authorization', wrongUserToken)
            .send({ "newUsername": "u3" });
        expect(response.statusCode).toEqual(401);
    });
});

describe("DELETE /users/:user_id", function () {
    test("Deletes a user", async function () {
        const response = (await request(app)
            .delete(`/users/${user.user_id}`)
            .set('authorization', adminToken));
        expect(response.statusCode).toEqual(200);
    });
});

