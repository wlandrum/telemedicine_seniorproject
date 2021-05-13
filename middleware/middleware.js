const { validationResult } = require("express-validator");
const { validationErrors } = require("../utils/errors");
const { unauthorized } = require("../utils/errors");

module.exports = {
  auth: (req, res, next) => {
    if (!req.session.user) return unauthorized(res);
    else next();
  },
  unauth: (req, res, next) => {
    if (req.session.user) return unauthorized(res);
    else next();
  },
  authDoctor: (req, res, next) => {
    if (!req.session.user || req.session.user.type !== "doctor")
      return unauthorized(res);
    else next();
  },
  authPatient: (req, res, next) => {
    if (!req.session.user || req.session.user.type !== "patient")
      return unauthorized(res);
    else next();
  },
  validationCheck: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return validationErrors(res, errors);
    else next();
  },
  redirectLogin: (req, res, next) => {
    if (req.session.user) next();
    else res.redirect("/login");
  },
  redirectHome: (req, res, next) => {
    if (req.session.user) res.redirect("/");
    else next();
  },
};
