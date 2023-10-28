'use strict';

/** Routes for users. */
const jsonschema = require('jsonschema');
const express = require('express');
const { authenticateJWT, createToken, isAdmin, isUser } = require('../authorization');
const { BadRequestError } = require('../expressError');
const User = require('../models/user');
const userNewSchema = require('../schemas/userNew.json');
const userUpdateSchema = require('../schemas/userUpdate.json');

const router = express.Router();

router.use(authenticateJWT);

router.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
    res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS, DELETE");
    res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Origin, Origin, X-Requested-With, Content-Type, Accept, Authorization, header");
    next();
});

/**Get all users */
router.get('/', isAdmin, async function (req, res, next) {
    try {
        const users = await User.getAllUsers();
        return res.json({ users });
    }
    catch (err) {
        return next(err);
    }
});

/**Get one user */
router.get('/:user_id', isUser, async function (req, res, next) {
    try {
        const user = await User.getOneUser(req.params.user_id);
        return res.json({ user });
    }
    catch (err) {
        return next(err);
    }
});

/**Add one user */
router.post('/', async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, userNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const user = await User.register(req.body);

        const token = createToken(user);
        return res.status(201).json({ user, token });
    }
    catch (err) {
        return next(err);
    }
});

/**Update one user */
router.patch('/:user_id', isUser, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, userUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const user = await User.update(req.params.user_id, req.body);
        return res.status(200).json({ user });
    }
    catch (err) {
        return next(err);
    }
});

/** DELETE /users/:user_id - { user_id } => { }
 *  Delete one garden
 *  Authorization required: relevant user or isAdmin
 */
router.delete('/:user_id', async function (req, res, next) {
    try {
        // Delete user
        await User.delete(req.params.user_id);
        return res.status(200).json({
            message: `User #${req.params.user_id} deleted`
        });
    }
    catch (err) {
        return next(err);
    }
});

module.exports = router;