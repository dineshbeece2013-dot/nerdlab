const express = require('express');
const router = express.Router();
const CertificateController = require('../controllers/certificateController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

// A student only ever reads their own certificates. Issuing happens as a side
// effect of completing a lab, never through a request a client can make.
router.get('/my', CertificateController.getMyCertificates);

module.exports = router;
