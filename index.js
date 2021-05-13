const express = require("express");
const cookieParser = require("cookie-parser");
const {
  PORT: defaultPort,
  SESSION_SECRET: secret,
  SESSION_NAME: name,
} = require("./config/config");
const { connectDB, sessionStore } = require("./config/db");
const session = require("express-session");
const moment = require("moment");

const app = express();

connectDB();
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(
  session({
    //   this stores sessions in a second database
    store: sessionStore,

    secret, // secret to encode cookies

    // this prevents empty sessions from being saved
    saveUninitialized: false,

    name, // name of the cookie
    cookie: {
      // these make the cookie secure to prevent attacks
      secure: false,
      sameSite: true,
      httpOnly: true,

      //   this lets the cookie expire after an hour to follow HIPAA guidelines
      maxAge: 60 * 60 * 1000,
    },
    // these prevent the cookie from expiring while the user is active
    // cookie expires after 60 minutes from the user's last request
    resave: true,
    rolling: true,
  })
);

// middleware
// allows requests to read JSON data from body
app.use(express.json({ extended: false }));
// allows requests to read url encoded data from body
app.use(express.urlencoded({ extended: true }));
// allows requests to read cookies
app.use(cookieParser());

app.use((req, res, next) => {
  // if (req.session.user) res.locals.user = req.session.user;
  res.locals.user = req.session.user;
  next();
});

app.locals.moment = moment;

const PORT = process.env.PORT || defaultPort;

// routes
app.use("/", require("./routes/home"));
app.use("/api/users", require("./routes/users"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/events", require("./routes/events"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/profile", require("./routes/profile"));

// Define the static file path
app.use(express.static(__dirname + "/public"));
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

// start the server
app.listen(PORT, () => console.log(`Server is running on ${PORT}`));

require("dotenv").config();
const http = require("http");
const path = require("path");

const AccessToken = require("twilio").jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

const ROOM_NAME = "telemedicineAppointment";

// Max. period that a Participant is allowed to be in a Room
const MAX_ALLOWED_SESSION_DURATION = 7400;

const patientPath = path.join(__dirname, "../views/conference.ejs");
app.use("/patient", express.static(patientPath));

const providerPath = path.join(__dirname, "../views/conference.ejs");
app.use("/provider", express.static(providerPath));

app.get("/token", function (request, response) {
  const identity = request.query.identity;

  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET,
    { ttl: MAX_ALLOWED_SESSION_DURATION }
  );

  token.identity = identity;

  // Grant the access token Twilio Video capabilities.
  const grant = new VideoGrant({ room: ROOM_NAME });
  token.addGrant(grant);

  // Serialize the token to a JWT string and include it in a JSON response.
  response.send({
    identity: identity,
    token: token.toJwt(),
  });
});

http.createServer(app).listen(8000, () => {
  console.log("express server listening on port 8000");
});
