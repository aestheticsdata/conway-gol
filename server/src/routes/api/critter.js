const router = require('express').Router();
const critterController = require('../controllers/critterController');

router.get('/:name', critterController);

module.exports = router;
