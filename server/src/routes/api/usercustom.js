const router = require('express').Router();
const usercustomController = require('../controllers/usercustomController');
const listController = require('../controllers/listController');

router.get('/', listController);
router.post('/:filename', usercustomController);

module.exports = router;
