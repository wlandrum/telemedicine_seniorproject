const {
  DB_HOST: host,
  DB_USER: user,
  DB_PASSWORD: password,
  DATABASE: database,
  DB_PORT: port,
} = require("./config");
const { createConnection } = require("mysql");
const { promisify } = require("util");
const { hash } = require("bcrypt");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);

// creates the database object
const db = createConnection({ host, port, user, password, database });

// simplifies making queries to the database
const query = promisify(db.query).bind(db);

const checkParams = (...rest) => {
  rest.forEach(([value, type]) => {
    if (value == null || value == undefined)
      throw TypeError("Missing parameter");
    if (
      typeof type === "string"
        ? typeof value !== type
        : !(value instanceof type)
    )
      throw TypeError("Invalid parameter");
  });
};

module.exports = {
  db,
  query,

  // this method connects to the database, or exits the process on an error
  connectDB: () => {
    db.connect((error) => {
      if (error) {
        console.error(error);
        process.exit(1);
      } else {
        console.log("Connected to DB");
      }
    });
  },

  // this allows express-session to store sessions in a different MySQL database
  // sessionStore: new MySQLStore({
  //   host,
  //   user,
  //   database,
  //   password,
  // }),
  sessionStore: new MySQLStore({}, db),

  // fetches a user from the database by email
  // if password is true, password is included in the returned user
  // otherwise password is omitted for security
  findUserByEmail: (email, password = true) =>
    query(`SELECT * FROM users WHERE email = ?`, [email]).then((r) => {
      const obj = r[0];
      if (obj && !password && obj.password) delete obj.password;
      return obj;
    }),

  // fetches a user from the database by user ID
  // if password is true, password is included in the returned user
  // otherwise password is omitted for security
  findUserById: (id, password = true) =>
    query(`SELECT * FROM users WHERE id = '${db.escape(id)}'`).then((r) => {
      const obj = r[0];
      if (obj && !password && obj.password) delete obj.password;
      return obj;
    }),

  // creates and inserts a new user and patient with the given information
  insertPatient: async ({
    email,
    password,
    first_name,
    last_name,
    age,
    insurance = "",
  }) => {
    // verify all parameters are included
    if (!email || !password || !first_name || !last_name || !age)
      throw TypeError("Missing parameters");

    password = await hash(password, 10); // hash the password for security using bcrypt

    await module.exports.createUser({ email, password, type: "patient" }); // create and store the user object in the database
    const user = await module.exports.findUserByEmail(email, false); // fetch the created user

    // create and store a new patient object in the database
    return query(
      `INSERT INTO patients (user_id, first_name, last_name, age, insurance) VALUES (?, ?, ?, ?, ?)`,
      [user.id, first_name, last_name, age, insurance]
    ).then(
      () => user // return the user object
    );
  },
  // creates and inserts a new user and doctor with the given information
  insertDoctor: async ({ email, password, first_name, last_name, dept }) => {
    // verify all parameters are included
    if (!email || !password || !first_name || !last_name || !dept)
      throw TypeError("Missing parameters");

    password = await hash(password, 10); // hash the password for security using bcrypt

    await module.exports.createUser({ email, password, type: "doctor" }); // create and store the user object in the database
    const user = await module.exports.findUserByEmail(email, false); // fetch the created user

    // create and store a new doctor object in the database
    return query(
      `INSERT INTO doctors (user_id, first_name, last_name, doc_dept) VALUES (?, ?, ?, ?)`,
      [user.id, first_name, last_name, dept]
    ).then(
      () => user // return the user object
    );
  },
  // creates and inserts a new user with the given information
  createUser: async ({ email, password, type }) => {
    // verify all parameters are included
    if (!email || !password || !type) throw TypeError("Missing parameters");

    // create and store the user object in the database
    // return query(`INSERT INTO users (email, password, type) VALUES (?, ?, ?)`, [
    //   email,
    //   password,
    //   type,
    // ]);
    const {
      insertId: id,
    } = await query(
      `INSERT INTO users (email, password, type) VALUES (?, ?, ?)`,
      [email, password, type]
    );
    return { id, email, type };
  },
  createAppointment: async ({
    patient,
    doctor,
    datetime,
    duration,
    notes = "",
  }) => {
    // checkParams(
    //   [doctor, "number"],
    //   [patient, "number"],
    //   [datetime, Date],
    //   [duration, "string"],
    //   [notes, "string"]
    // );

    const { id: doctor_event_id } = await module.exports.createEvent({
      user: doctor.id,
      datetime,
      name: "Appointment",
      description: `Appointment with ${patient.first_name} ${patient.last_name}`,
    });

    const { id: patient_event_id } = await module.exports.createEvent({
      user: patient.id,
      datetime,
      name: "Appointment",
      description: `Appointment with ${doctor.first_name} ${doctor.last_name}`,
    });
    const {
      insertId: id,
    } = await query(
      `INSERT INTO appointment (patient_id, doctor_id, datetime, duration, notes, doctor_event_id, patient_event_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        patient.id,
        doctor.id,
        datetime,
        duration,
        notes,
        doctor_event_id,
        patient_event_id,
      ]
    );

    return {
      id,
      doctor_id: doctor.id,
      patient_id: patient.id,
      doctor_event_id,
      patient_event_id,
      datetime,
      duration,
      notes,
    };
  },
  getAppointment: async (appointment) => {
    return query(`SELECT * FROM appointment WHERE id = (?)`, [
      appointment,
    ]).then((i) => i[0]);
  },

  createEvent: async ({ user, datetime, name = "", description = "" }) => {
    // checkParams(
    //   [user, "number"],
    //   [datetime, Date],
    //   [name, "string"],
    //   [description, "string"]
    // );
    const {
      insertId: id,
    } = await query(
      `INSERT INTO events (user_id, datetime, name, description) VALUES (?, ?, ?, ?)`,
      [user, datetime, name, description]
    );
    return { id, user_id: user, datetime, name, description };
  },
  findAppointments: async (user) => {
    // checkParams([user, "number"]);
    return query(`SELECT * FROM appointment WHERE ${user.type}_id = (?)`, [
      user.id,
    ]);
  },
  findEvents: async (user) => {
    return query(`SELECT * FROM events WHERE user_id = (?)`, [user.id]);
  },
  findEventsByDates: async (user, start, end) => {
    return query(
      `SELECT * FROM events WHERE user_id = (?) AND datetime BETWEEN (?) AND (?)`,
      [user.id, start, end]
    );
  },
  getEvent: (event) => {
    return query(`SELECT * FROM events WHERE event_id = (?)`, [event]).then(
      (i) => i[0]
    );
  },
  deleteEvent: async (event) => {
    return query(`DELETE FROM events WHERE event_id = (?)`, [event]);
  },
  deleteAppointment: async (appointment) => {
    // const appointment = await module.exports.getAppointment(apptId);
    [appointment.doctor_event_id, appointment.patient_event_id].forEach(
      async (i) => {
        await module.exports.deleteEvent(i);
      }
    );
    return query(`DELETE FROM appointment WHERE id = (?)`, [appointment.id]);
  },
  createMessage: async (content, date, user, receiver) => {
    return query(
      `INSERT INTO message (mes_content, date_created, sender_id, receiver_id, unread) VALUES (?, ?, ?, ?, 0)`,
      [content, date, user, receiver]
    );
  },
  getMessages: async (id) => {
    return query(
      "SELECT m.*, u.first_name AS sender_first_name, u.last_name AS sender_last_name FROM message m INNER JOIN users u ON m.sender_id = u.id WHERE sender_id = (?) OR receiver_id = (?)",
      [id, id]
    );
  },
  getMessageById: async (id, user = false) => {
    if (user === false)
      return query(`SELECT * FROM message WHERE mes_id = (?)`, [id]).then(
        (i) => i[0]
      );
    else
      return query(
        `SELECT * FROM message WHERE mes_id = (?) AND receiver_id = (?)`,
        [id, user.id]
      ).then((i) => i[0]);
  },
  getMessagesByIds: async (ids, user = false) => {
    if (user === false)
      return query(`SELECT * FROM message WHERE mes_id IN (?)`, [ids]);
    else
      return query(
        "SELECT * FROM message WHERE mes_id IN (?) AND receiver_id = (?)",
        [ids, user.id]
      );
  },
  readMessage: async (id) => {
    if (Array.isArray(id))
      return query(`UPDATE message SET unread = 1 WHERE mes_id IN (?)`, [id]);
    else return query(`UPDATE message SET unread = 1 WHERE mes_id = (?)`, [id]);
  },
  readMessagesByDate: async (date, user) => {
    return query(
      `UPDATE message SET unread = 1 WHERE date_created < (?) AND receiver_id = (?)`,
      [date, user.id]
    );
  },
  readMessagesByDateUser: async (date, user, sender) => {
    return query(
      `UPDATE message SET unread = 1 WHERe date_created < (?) AND receiver_id = (?) AND sender_id = (?)`,
      [date, user.id, sender]
    );
  },
  unreadMessageCount: async (user) => {
    return query(
      "SELECT COUNT(mes_id) AS countUnread FROM message WHERE unread = 0 AND receiver_id = (?)",
      [user.id]
    ).then((i) => i[0]);
  },
  unreadMessagesPerChat: async (user) => {
    return query(
      "SELECT sender_id, COUNT(*) AS countUnread FROM message WHERE unread = 0 AND receiver_id = (?) GROUP BY sender_id",
      [user.id]
    );
  },
  getPatient: async (id) => {
    return query("SELECT * FROM patients WHERE user_id = (?)", [id]).then(
      (i) => i[0]
    );
  },
  getDoctor: async (user) => {
    return query("SELECT * FROM doctors WHERE user_id = (?)", [user.id]).then(
      (i) => i[0]
    );
  },
  updateUser: async ({
    email,
    weight,
    height,
    dob,
    phone,
    first_name,
    last_name,
    id,
  }) => {
    return query(
      `UPDATE users SET email = (?), weight = (?), height = (?), dob = (?), insurance_company = (?), insurance_number = (?), phone = (?), first_name = (?), last_name = (?) WHERE id = (?)`,
      [
        email,
        weight,
        height,
        dob,
        insurance_company,
        insurance_number,
        phone,
        first_name,
        last_name,
        id,
      ]
    );
  },
  updateEvent: async ({ datetime, name, description, event_id }) => {
    return query(
      `UPDATE events SET datetime = (?), name = (?), description = (?) WHERE event_id = (?)`,
      [datetime, name, description, event_id]
    );
  },
  updatePassword: async (user, password) => {
    password = await hash(password, 10); // hash the password for security using bcrypt

    // create and store a new patient object in the database
    return query(`UPDATE users SET password = (?) WHERE id = (?)`, [
      password,
      user.id,
    ]);
  },
  updateAddress: async (user, { street, city, state, zip }) => {
    return query(
      `UPDATE address SET street = (?), city = (?), state = (?), zip = (?) WHERE add_id = (?)`,
      [street, city, state, zip, user.add_id]
    );
  },
  getMessageList: async (user) => {
    // return query(
    //   `SELECT u.first_name, u.last_name, u.id FROM users u INNER JOIN patients p ON u.id = p.pat_id WHERE p.doctor_id = (?)`,
    //   [user.id]
    // );
    return query(
      `SELECT u.first_name, u.last_name, u.id, MAX(m.date_created) as date FROM users u INNER JOIN patients p ON u.id = p.pat_id LEFT JOIN message m ON m.sender_id = u.id OR m.receiver_id = u.id WHERE p.doctor_id = (?) GROUP BY u.id`,
      [user.id]
    );
  },
  getAddress: async (user) => {
    return query(`SELECT * FROM address WHERE add_id = (?)`, [
      user.add_id,
    ]).then((r) => (r.length === 1 ? r[0] : null));
  },
  getAvailability: async (doctor) => {
    return query("SELECT datetime FROM events WHERE user_id = (?)", [
      doctor.id,
    ]).then((i) => i.map((r) => r.datetime));
  },
};
