const { SESSION_NAME: name } = require("../config/config");

const clearToken = (req, res) => {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) reject(err);
      else resolve(res.clearCookie(name));
    });
  });
};

module.exports = {
  unauthorized: (res) =>
    res
      .status(401)
      .json({ errors: [{ msg: "Unauthorized", param: "notifications" }] }),
  serverError: (res, error) => {
    if (error) console.error(error);
    return res
      .status(500)
      .json({ errors: [{ msg: "Server Error", param: "notifications" }] });
  },
  validationErrors: (res, errors) => {
    return res.status(400).json({ errors: errors.array() });
  },
  incorrectEmail: (req, res) => {
    return clearToken(req, res)
      .then((res) => {
        return res.status(400).json({
          errors: [{ msg: "Email does not exist", param: "email" }],
        });
      })
      .catch((err) => module.exports.serverError(res, err));
  },
  emailExists: (req, res) =>
    clearToken(req, res)
      .then((res) =>
        res
          .status(400)
          .json({ errors: [{ msg: "Email already exists", param: "email" }] })
      )
      .catch((err) => module.exports.serverError(res, err)),
  incorrectPassword: (req, res) =>
    clearToken(req, res)
      .then((res) =>
        res
          .status(400)
          .json({ errors: [{ msg: "Incorrect password", param: "password" }] })
      )
      .catch((err) => module.exports.serverError(res, err)),
};
