const { Router } = require("express");
const router = Router();
const { check, oneOf } = require("express-validator");
const { authenticate } = require("../utils/Utils");
const { serverError, emailExists } = require("../utils/errors");
const {
  findUserByEmail,
  insertPatient,
  insertDoctor,
} = require("../config/db");
const { unauth, validationCheck } = require("../middleware/middleware");

// @route   POST api/users
// @desc    Register new user
// @access  Public
router.post(
  "/",
  [
    unauth,
    check("first_name", "First name is required").notEmpty(),
    check("last_name", "Last name is required").notEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password")
      .isLength({ min: 6 })
      .withMessage("Please enter a password with 6 or more characters")
      .matches(/\d/)
      .withMessage("Please include a number in your password")
      .matches(/[a-z]/)
      .withMessage("Please include a lowercase letter in your password")
      .matches(/[A-Z]/)
      .withMessage("Please include an uppercase letter in your password")
      .matches(/[^a-zA-Z0-9]/)
      .withMessage("Please include a special character in your password"),
    check("confirm_password")
      .exists()
      .notEmpty()
      .withMessage("Please enter your password again")
      .custom((value, { req }) => {
        if (value !== req.body.password)
          throw new Error("Passwords do not match");
        return true;
      }),
    oneOf(
      [
        check("doctor").exists().notEmpty(),
        check("patient").exists().notEmpty(),
      ],
      "Please choose user type"
    ),
    check("dept", "Please enter your department").custom((val, { req }) => {
      if (req.body.doctor) return Boolean(val);
      return true;
    }),
    check("age")
      .custom((val, { req }) => {
        if (req.body.patient) {
          return val && val > 0;
        }
        return true;
      })
      .withMessage("Please enter a valid age"),
    validationCheck,
  ],
  async (req, res) => {
    // destructure values from body
    const {
      first_name,
      last_name,
      email,
      doctor,
      patient,
      age,
      insurance,
      dept,
    } = req.body;
    let { password } = req.body;

    try {
      // if the email already exists in the database, return an error
      let user = await findUserByEmail(email, false);
      if (user) return emailExists(req, res);

      // if the doctor field is set, create a doctor and user
      if (doctor)
        user = await insertDoctor({
          email,
          password,
          first_name,
          last_name,
          dept,
        });
      // else if the patient field is set, create a patient and user
      else if (patient)
        user = await insertPatient({
          email,
          password,
          first_name,
          last_name,
          age,
          insurance,
        });
      // else an error occured since either doctor or patient must be selected
      else return serverError(res);

      // authenticate the user with the newly created user
      return await authenticate(req, res, user);
    } catch (error) {
      return serverError(res, error);
    }
  }
);

module.exports = router;
