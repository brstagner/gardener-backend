"use strict";

/** Express app for Gardener. */

const express = require('express');
const { json } = require('express');
const { NotFoundError } = require("./expressError");

const app = express();

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
    res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

    // Add the Vary header for CORS-related headers
    res.header("Vary", "Origin, Access-Control-Request-Headers, Access-Control-Request-Method, Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers");

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

const usersRoutes = require("./routes/users");
const plantsRoutes = require("./routes/plants");
const gardensRoutes = require("./routes/gardens");
const authRoutes = require("./routes/auth");
const trefleRoutes = require("./routes/trefle");

app.use(json());
const { drop_tables, create_tables } = require('./db');

// app.use(authenticateJWT);

app.use("/users", usersRoutes);
app.use(usersRoutes);

app.use("/plants", plantsRoutes);
app.use(plantsRoutes);

app.use("/gardens", gardensRoutes);
app.use(gardensRoutes);

app.use("/auth", authRoutes);
app.use(authRoutes);

app.use("/trefle", trefleRoutes);
app.use(trefleRoutes);

// Uncomment to create tables or reset database
// drop_tables();
// create_tables();

/** Handle 404 errors -- this matches everything */
app.use(function (req, res, next) {
    return next(new NotFoundError());
});

/** Generic error handler; anything unhandled goes here. */
app.use(function (err, req, res, next) {
    if (process.env.NODE_ENV !== "test") console.error(err.stack);
    const status = err.status || 500;
    const message = err.message;

    return res.status(status).json({
        error: { message, status },
    });
});

module.exports = app;