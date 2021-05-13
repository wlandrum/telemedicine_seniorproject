const { Router } = require("express");
const router = Router();
const { check } = require("express-validator");
const {
  serverError,
  incorrectEmail,
  incorrectPassword,
} = require("../utils/errors");
const { authenticate, signOut } = require("../utils/Utils");
const { auth, unauth, validationCheck } = require("../middleware/middleware");
const bcrypt = require("bcrypt");
const { findUserByEmail } = require("../config/db");

// ! TEST ROUTE
router.get("/", auth, async (req, res) => {
  try {
    // const user = await findUserById(req.user.id, false);
    // res.json(user);
    console.log(req.session.user);
    res.json(req.session.user);
  } catch (error) {
    return serverError(res, error);
  }
});

// @route   POST api/auth
// @desc    Login
// @access  Public
router.post(
  "/",
  [
    unauth,
    check("email", "Please include a valid email").isEmail(),
    check("password", "Please include a password with at least 6 characters")
      .exists()
      .isLength({ min: 6 }),
    validationCheck,
  ],
  async (req, res) => {
    // extract email and password from body
    const { email, password } = req.body;

    try {
      let user = await findUserByEmail(email); // find user with matching email from database
      if (!user) return incorrectEmail(req, res); // if the user does not exist, return an error

      const isMatch = await bcrypt.compare(password, user.password); // check if the password entered matches the password in the database
      if (!isMatch) return incorrectPassword(req, res);

      delete user.password; // remove the password from the object to be stored in the session for security
      return await authenticate(req, res, user); // authenticate the user
    } catch (error) {
      return serverError(res, error);
    }
  }
);

// @route   POST api/auth/logout
// @desc    Logout
// @access  Private
router.post("/logout", auth, async (req, res) => signOut(req, res));

module.exports = router;
