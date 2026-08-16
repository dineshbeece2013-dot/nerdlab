const CertificateModel = require('../models/certificateModel');
const ResponseHandler = require('../utils/responseHandler');

class CertificateController {
  static async getMyCertificates(req, res, next) {
    try {
      const certificates = await CertificateModel.getUserCertificates(req.user.id);
      return ResponseHandler.success(res, 'Certificates fetched.', certificates);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CertificateController;
