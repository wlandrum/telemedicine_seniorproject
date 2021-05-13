const { redirectLogin, redirectHome } = require("../middleware/middleware");
const { Router } = require("express");
const router = Router();

router.get("/", (req, res) => res.render("home.ejs"));
router.get("/login", redirectHome, (req, res) => res.render("login.ejs"));
router.get("/register", redirectHome, (req, res) =>
  res.render("login.ejs", { selected: "register" })
);
router.get("/calendar", redirectLogin, (req, res) =>
  res.render("calendar.ejs")
);
router.get("/agenda", redirectLogin, (req, res) => res.render("agenda.ejs"));
router.get("/messages", redirectLogin, (req, res) => res.render("messages.ejs"));
router.get("/conference", redirectLogin, (req, res) => res.render("conference.ejs"));
router.get("/account", redirectLogin, (req, res) => res.render("account.ejs"));
router.get(
  "/test",
  // redirectLogin,
  (req, res) => res.render("test.ejs")
);

module.exports = router;
