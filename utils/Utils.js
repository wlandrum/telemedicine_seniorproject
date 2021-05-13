const { SESSION_NAME: name } = require("../config/config");
const { getPatient, getDoctor } = require("../config/db");
const { serverError } = require("./errors");

module.exports = {
  authenticate: async (req, res, user, respond = true, msg = "signed in") => {
    if (user.password) delete user.password;
    if (user.type === "patient") user.data = await getPatient(user.id);
    else if (user.type === "doctor") user.data = await getDoctor(user);
    req.session.user = user;
    if (respond) return res.json({ msg: "success", op: msg });
  },
  signOut: (req, res, msg = "signed out") => {
    req.session.destroy((err) => {
      if (err) return serverError(res, err);

      res.clearCookie(name).json({ msg: "success", op: msg });
    });
  },
};
