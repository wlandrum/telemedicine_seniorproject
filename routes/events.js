const { Router } = require("express");
const router = Router();
const { check, oneOf } = require("express-validator");
const {
  serverError,
  incorrectEmail,
  incorrectPassword,
  unauthorized,
} = require("../utils/errors");
const { authenticate, signOut } = require("../utils/Utils");
const {
  auth,
  unauth,
  validationCheck,
  authDoctor,
} = require("../middleware/middleware");
const bcrypt = require("bcrypt");
const {
  findUserByEmail,
  findUserById,
  createEvent,
  findEvents,
  getEvent,
  deleteEvent,
  createAppointment,
  getAppointment,
  deleteAppointment,
  getAvailability,
  findEventsByDates,
  updateEvent,
} = require("../config/db");

router.post(
  "/",
  [
    auth,
    check("datetime", "Please select a valid date")
      .exists()
      .custom((value) => {
        const date = new Date(value);
        return (
          !isNaN(date) &&
          date > new Date() &&
          date.getHours() >= 9 &&
          date.getHours() < 17
        );
      }),
    check("name", "Please enter a valid name").exists().isString(),
    validationCheck,
  ],
  async (req, res) => {
    const { datetime, name, description } = req.body;
    const user = req.session.user;
    console.log("hit route for new event");
    try {
      const data = await createEvent({
        user: user.id,
        datetime,
        name,
        description,
      });
      return res.json({ msg: "success", data });
    } catch (error) {
      return serverError(res, error);
    }
  }
);

router.get("/", [auth], async (req, res) => {
  const user = req.session.user;

  try {
    return res.json(await findEvents(user));
  } catch (error) {
    return serverError(res, error);
  }
});

router.delete(
  "/:eventId",
  [
    auth,
    // , check("eventId", "Please select a valid event").exists().isNumeric()
  ],
  async (req, res) => {
    const user = req.session.user;
    // const { eventId } = req.body;
    const { eventId } = req.params;

    try {
      const event = await getEvent(eventId);
      console.log(parseInt(eventId), event.user_id);
      if (event.user_id !== user.id) return unauthorized(res);
      else {
        const data = await deleteEvent(eventId);
        return res.json({ msg: "success", data });
      }
    } catch (error) {
      return serverError(res, error);
    }
  }
);

router.post(
  "/appointment",
  [
    auth,
    check("datetime", "Please select a valid date")
      .exists()
      .custom((value) => {
        const date = new Date(value);
        return (
          !isNaN(date) &&
          date > new Date() &&
          date.getHours() >= 9 &&
          date.getHours() < 17
        );
      }),
    // oneOf([
    //   check("doctor", "Please select a valid doctor")
    //     .exists()
    //     .notEmpty()
    //     .isNumeric()
    //     .custom((_, { req }) => req.session.user.type === "patient"),
    //   check("patient", "Please select a valid patient")
    //     .exists()
    //     .notEmpty()
    //     .isNumeric()
    //     .custom((_, { req }) => req.session.user.type === "doctor"),
    // ]),
  ],
  async (req, res) => {
    // const { doctor, patient, datetime, duration, notes = "" } = req.body;
    const user = req.session.user;
    const { datetime, duration, notes = "" } = req.body;

    try {
      if (user.type !== "patient") return unauthorized(res);
      await createAppointment({
        patient: user,
        doctor: await findUserById(user.data.doctor_id),
        datetime,
        duration,
        notes,
      });
      return res.json({ msg: "success" });
      // const payload = { datetime, duration, notes };
      // if (user.type === "doctor") {
      //   payload.doctor = user;
      //   payload.patient = await findUserById(patient);
      // } else if (user.type === "patient") {
      //   payload.patient = user;
      //   payload.doctor = await findUserById(doctor);
      // }

      // if (
      //   payload.patient.type === "patient" &&
      //   payload.doctor.type === "doctor"
      // ) {
      //   await createAppointment(payload);
      //   return res.json({ msg: "success" });
      // } else throw TypeError();
    } catch (error) {
      return serverError(res, error);
    }
  }
);

router.post("/appointment/:patientId", authDoctor, async (req, res) => {});

router.delete("/appointment/:apptId", [auth], async (req, res) => {
  const user = req.session.user;
  const { apptId } = req.params;

  try {
    const appt = await getAppointment(apptId);
    if (appt[`${user.type}_id`] !== user.id) {
      return unauthorized(res);
    } else {
      const data = await deleteAppointment(appt);
      return res.json({ msg: "success", data });
    }
  } catch (error) {
    return serverError(res, error);
  }
});

router.get("/availability", auth, async (req, res) => {
  const { user } = req.session;
  try {
    if (user.type !== "patient") return unauthorized(res);
    const doctor = await findUserById(user.data.doctor_id);
    return res.json(await getAvailability(doctor));
  } catch (error) {
    return serverError(res, error);
  }
});

router.get("/week", auth, async (req, res) => {
  const { user } = req.session;
  const { date } = req.body;

  try {
    const value = new Date(date);
    const start = new Date(value);
    start.setDate(value.getDate() - value.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return res.json(await findEventsByDates(user, start, end));
  } catch (error) {}
});

router.put("/:eventId", auth, async (req, res) => {
  const { user } = req.session;
  const { eventId } = req.params;
  const { datetime, name, description } = req.body;
  try {
    const event = await getEvent(eventId);
    if (typeof event === "undefined" || event.user_id != user.id)
      return res.status(400).json({ msg: "invalid event" });

    event.datetime = datetime || event.datetime;
    event.name = name || event.name;
    event.description = description || event.description;
    await updateEvent(event);
    return res.json(event);
  } catch (error) {
    return serverError(res, error);
  }
});

module.exports = router;
