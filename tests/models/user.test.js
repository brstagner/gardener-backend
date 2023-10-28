// Test User models

// connect to test database
process.env.NODE_ENV = "test";

// npm packages
const request = require('supertest');

// app imports
const app = require('../../app');
const { db } = require('../../db');
const User = require('../../models/user');

let users;
let user;
let admin;

beforeEach(async function () {
    // Add a test user to the database
    let result = await db.query(`
    INSERT INTO users
        (username, password, email, location, is_admin)
    VALUES
        ('u1', 'password', 'user1@email.com', '{"name" : "Utah"}', null),
        ('a1', 'password', 'admin@email.com', '{"name" : "Alabama"}', 'true')
    RETURNING user_id, username, email, location, is_admin
    `);
    users = result.rows;
    user = result.rows[0];
    admin = result.rows[1];
});

afterEach(async function () {
    // delete test data
    await db.query("DELETE FROM users");
});

afterAll(async function () {
    // close db connection
    await db.end();
});

describe("User model", function () {
    test("Gets a list of users", async function () {
        const response = await User.getAllUsers();
        expect(response).toEqual(
            users
        );
    });

    test("Gets one user", async function () {
        const response = await User.getOneUser(user.user_id);
        expect(response).toEqual(
            user
        );
    });

    test("Registers a new user", async function () {
        const user2 = {
            "username": "u2",
            "password": "password",
            "email": "user2@email.com",
            "location": {
                "name": "Alabama"
            }
        };
        const response = await User.register(user2);
        expect(response).toEqual({
            "user_id": expect.any(Number),
            "username": user2.username,
            "email": user2.email,
            "location": user2.location,
            "is_admin": false
        });
    });

    test("Updates a user", async function () {
        const data = {
            "newUsername": "u3",
            "password": "Password",
            "email": "user2@email.com",
            "location": {
                "name": "Uruguay"
            }
        };
        let response = await User.update(user.user_id, data);
        expect(response).toEqual({
            "user_id": expect.any(Number),
            "username": data.newUsername,
            "email": data.email,
            "location": data.location,
            "is_admin": false
        });
    });

    test("Partially updates a user", async function () {
        const data = {
            "newUsername": "u2",
        };
        let response = await User.update(user.user_id, data);
        expect(response).toEqual({
            "user_id": expect.any(Number),
            "username": "u2",
            "email": "user1@email.com",
            "location": { "name": "Utah" },
            "is_admin": false
        });
    });

    test("Deletes a user", async function () {
        await User.delete(user.user_id);
        const response = await User.getOneUser(user.user_id);
        expect(response).toEqual(undefined);
    });

});