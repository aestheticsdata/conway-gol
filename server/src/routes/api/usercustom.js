const router = require('express').Router();
const usercustomController = require('../controllers/usercustomController');

router.post('/:filename', usercustomController);

module.exports = router;
