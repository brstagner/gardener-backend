"use strict";

// Middleware and helper logic for authorization
require("dotenv").config();
const jwt = require("jsonwebtoken");
const Plant = require("./models/plant");
const Garden = require("./models/garden");
const { UnauthorizedError } = require("./expressError");

/** return signed JWT from user data. */

function createToken (user) {
    let payload = {
        userId: user.user_id,
        username: user.username,
        isAdmin: user.is_admin || false,
    };

    return jwt.sign(payload, process.env.SECRET_KEY);
}

/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT (req, res, next) {
    try {
        // const token = req.headers && req.headers.authorization;
        const token = req.headers.authorization;

        if (token) {
            res.locals.user = jwt.verify(token, process.env.SECRET_KEY);
        }
        return next();
    } catch (err) {
        return next();
    }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn (req, res, next) {
    try {
        if (!res.locals.user) throw new UnauthorizedError();
        return next();
    } catch (err) {
        return next(err);
    }
}

/** Middleware to verify plant ownership.
 *
 * If not owned, raises Unauthorized.
 */

async function ownsPlant (req, res, next) {
    try {
        const plant = await Plant.getOnePlant(req.params.plant_id);
        if (
            !res.locals.user ||
            (res.locals.user.userId !== plant.user_id && !res.locals.user.isAdmin)
        )
            throw new UnauthorizedError();
        res.locals.plant = plant;
        return next();
    } catch (err) {
        return next(err);
    }
}

/** Middleware to verify plant ownership.
 *
 * If not owned, raises Unauthorized.
 */

async function ownsGarden (req, res, next) {
    try {
        const garden = await Garden.getOneGarden(req.params.garden_id);
        if (
            !res.locals.user ||
            (res.locals.user.userId !== garden.user_id && !res.locals.user.isAdmin)
        )
            throw new UnauthorizedError();
        res.locals.garden = garden;
        return next();
    } catch (err) {
        return next(err);
    }
}

/** Middleware to use when they must be logged in as admin.
 *
 * If not, raises Unauthorized.
 */

function isAdmin (req, res, next) {
    try {
        if (!res.locals.user || !res.locals.user.isAdmin)
            throw new UnauthorizedError();
        return next();
    } catch (err) {
        return next(err);
    }
}

/** Middleware to use when they must be logged in as relevant user or as admin.
 *
 * If not, raises Unauthorized.
 */

function isUser (req, res, next) {
    try {
        if (
            !res.locals.user ||
            (req.params.user_id != res.locals.user.userId && !res.locals.user.isAdmin)
        )
            throw new UnauthorizedError();
        return next();
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    createToken,
    authenticateJWT,
    ensureLoggedIn,
    isAdmin,
    isUser,
    ownsPlant,
    ownsGarden,
};

// require('dotenv').config();
// const jwt = require("jsonwebtoken");
// const { UnauthorizedError } = require("./expressError");

// /**
//  * If a token was provided, verify it.
//  * If valid, store the token payload {userId, isAdmin} on req.user.
//  *
//  * @ param {object} req - {headers: {authorization: token}, params: {user_id}}
//  */

// // WORKS?
// function authenticateJWT (req, res, next) {
//     try {
//         const token = req.headers && req.headers.authorization;
//         if (token) {
//             res.locals.user = jwt.verify(token, process.env.SECRET_KEY);
//         }
//         return next();
//     } catch (err) {
//         return next();
//     }
// }
// // WORKS?

// // function authenticateJWT (token) {
// //     try {
// //         const payload = jwt.verify(token, process.env.SECRET_KEY);
// //         return payload;
// //     }
// //     catch (error) {
// //         // No error passed for missing or faulty token
// //         return;
// //     }
// // }

// function isAdmin (req, res, next) {
//     try {
//         if (!res.locals.user || !res.locals.user.isAdmin) throw new UnauthorizedError();
//         return next();
//     } catch (err) {
//         return next(err);
//     }
// }

// // function isAdmin (user) {
// //     if (!user.isAdmin) {
// //         throw new UnauthorizedError("Must be administrator to view this page");
// //     }
// //     else {
// //         return true;
// //     }
// // }

// function isUser (req, res, next) {
//     try {
//         if (!res.locals.user || ((req.body.user_id != res.locals.user.user_id) && (!res.locals.user.isAdmin)))
//             throw new UnauthorizedError();
//         return next();
//     } catch (err) {
//         return next(err);
//     }
// }

// // function isUser (currUserId, authUser) {
// //     if (
// //         (!authUser.isAdmin && // Not admin
// //             (+currUserId !== +authUser.userId)) // Requested user_id is not userId from token
// //     ) {
// //         throw new UnauthorizedError(`Must be authorized user to view this page`);
// //     }
// //     else {
// //         return true;
// //     }
// // }

// /**
//  * Returned signed JWT from user_id and is_admin
//  * @ param {object} user - {user_id, is_admin}
//  * @ return { token }
//  */
// function createToken (user) {

//     let payload = {
//         userId: user.user_id,
//         isAdmin: user.is_admin || false,
//     };

//     return jwt.sign(payload, process.env.SECRET_KEY);
// }

// module.exports = {
//     createToken,
//     authenticateJWT,
//     isAdmin,
//     isUser,
// };
