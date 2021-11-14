const router = require('express').Router();
const listController = require('../controllers/listController');

router.get('/', listController);

module.exports = router;
