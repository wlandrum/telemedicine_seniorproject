const { Router } = require("express");
const { check } = require("express-validator");
const {
  updateUser,
  updatePassword,
  updateAddress,
  getAddress,
} = require("../config/db");
const router = Router();
const {
  auth,
  authDoctor,
  validationCheck,
} = require("../middleware/middleware");
const { serverError } = require("../utils/errors");
const { authenticate, signOut } = require("../utils/Utils");

router.put("/", [auth], async (req, res) => {
  const { user } = req.session;
  const {
    first_name = user.first_name,
    last_name = user.last_name,
    phone = user.phone,
    dob = user.dob,
    height = user.height,
    weight = user.weight,
    // ssn = user.ssn,
    email = user.email,
  } = req.body;

  try {
    user.first_name = first_name || user.first_name;
    user.last_name = last_name || user.last_name;
    user.phone = phone || user.phone;
    user.dob = dob || user.dob;
    user.height = height || user.height;
    user.weight = weight || user.weight;
    user.email = email || user.email;

    await updateUser(user);
    return res.json(req.session.user);
  } catch (error) {
    return serverError(res, error);
  }
});

router.put(
  "/password",
  [
    auth,
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
    validationCheck,
  ],
  async (req, res) => {
    const { user } = req.session;
    const { password } = req.body;

    try {
      await updatePassword(user, password);
      //   return res.json({msg: "success"});
      return signOut(req, res);
    } catch (error) {
      return serverError(res, error);
    }
  }
);

router.put(
  "/address",
  [
    auth,
    check("street").notEmpty(),
    check("city").notEmpty(),
    check("state").notEmpty(),
    check("zip").notEmpty(),
    validationCheck,
  ],
  async (req, res) => {
    const { street, city, state, zip } = req.body;
    const { user } = req.session;

    try {
      return res.json(await updateAddress(user, { street, city, state, zip }));
    } catch (error) {
      return serverError(res, error);
    }
  }
);

router.get("/address", auth, async (req, res) => {
  const { user } = req.session;

  try {
    const address = await getAddress(user);
    if (address) return res.json(address);
    else
      return res.json({
        errors: [{ msg: "Address not set", param: "address" }],
      });
  } catch (error) {
    return serverError(res, error);
  }
});

router.put("/emergency", [auth], async (req, res) => {});

module.exports = router;
