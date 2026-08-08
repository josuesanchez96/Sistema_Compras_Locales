const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getDashboardData);

module.exports = router;
