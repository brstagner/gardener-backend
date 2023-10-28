'use strict';

/** Routes for gardens. */
const jsonschema = require('jsonschema');
const express = require('express');
const { ownsGarden, isAdmin, authenticateJWT } = require('../authorization');
const { BadRequestError, UnauthorizedError } = require('../expressError');
const Garden = require('../models/garden');
const gardenNewSchema = require('../schemas/gardenNew.json');
const gardenUpdateSchema = require('../schemas/gardenUpdate.json');

const router = express.Router();

router.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
    res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS, DELETE");
    res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Origin, Origin, X-Requested-With, Content-Type, Accept, Authorization, header");
    next();
});

router.use(authenticateJWT);

/**Get all gardens */
router.get('/all', isAdmin, async function (req, res, next) {
    try {
        const gardens = await Garden.getAllGardens();
        return res.json({ gardens });
    }
    catch (err) {
        return next(err);
    }
});

/**Get user's gardens */
router.get('/collection', async function (req, res, next) {
    try {
        const gardens = await Garden.getUserGardens(res.locals.user.userId);
        return res.json({ gardens });
    }
    catch (err) {
        return next(err);
    }
});

/**Get one garden */
router.get('/:garden_id', ownsGarden, async function (req, res, next) {
    try {
        // ownsGarden checks requested garden's user_id,
        // passes garden through to avoid re-requests
        return res.status(200).json(res.locals.garden);
    }
    catch (err) {
        return next(err);
    }
});

/**Add one garden */
router.post('/', async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, gardenNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        if (res.locals.user.userId != req.body.user_id) {
            throw new UnauthorizedError("unauthorized");
        }
        const garden = await Garden.addGarden(req.body);
        return res.status(201).json({ garden });
    }
    catch (err) {
        return next(err);
    }
});

/**Update one garden */
router.patch('/:garden_id', ownsGarden, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, gardenUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const data = req.body;
        const garden = await Garden.update(req.params.garden_id, req.body);
        return res.status(200).json({ garden });
    }
    catch (err) {
        return next(err);
    }
});

/** DELETE /gardens/:garden_id - { user_id, garden_id } => { }
 *  Delete one garden
 *  Authorization required: relevant user or isAdmin
 */
router.delete('/:garden_id', async function (req, res, next) {
    try {
        // Delete garden
        await Garden.delete(req.params.garden_id);
        return res.status(200).json({
            message: `Garden #${req.params.garden_id} deleted`
        });
    }
    catch (err) {
        return next(err);
    }
});

module.exports = router;