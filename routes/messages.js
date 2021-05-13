const {
  redirectLogin,
  redirectHome,
  authPatient,
} = require("../middleware/middleware");
const { Router } = require("express");
const router = Router();
const { auth, authDoctor } = require("../middleware/middleware");
const { serverError, unauthorized } = require("../utils/errors");
const {
  createMessage,
  getMessages,
  getPatient,
  getMessageList,
  getMessageById,
  readMessage,
  getMessagesByIds,
  unreadMessageCount,
  unreadMessagesPerChat,
  readMessagesByDate,
  readMessagesByDateUser,
} = require("../config/db");

router.post("/", auth, async (req, res) => {
  const { content } = req.body;
  const { user } = req.session;

  try {
    if (user.type !== "patient") return unauthorized(res);
    const date = new Date();
    const receiver = user.data.doctor_id;
    console.log(receiver);
    console.log(user.id);
    await createMessage(content, date, user.id, receiver);
    return res.json({ msg: "success" });
  } catch (error) {
    return serverError(res, error);
  }
});

router.get("/", auth, async (req, res) => {
  const { user } = req.session;
  try {
    if (user.type === "patient") return res.json(await getMessages(user.id));
    else if (user.type === "doctor") {
      return res.json(await getMessageList(user));
    }
    // else return await getMessages(body.patient);
  } catch (error) {
    return serverError(res, error);
  }
});

router.get("/html", auth, async (req, res) => {
  const { user } = req.session;
  try {
    if (user.type === "patient")
      return res.render("partials/message_list.ejs", {
        messages: await getMessages(user.id),
      });
    else if (user.type === "doctor") {
      return res.render("partials/convo_list.ejs", {
        convos: await getMessageList(user),
      });
    }
  } catch (error) {
    return serverError(res, error);
  }
});

router.get("/html/:patientId", authDoctor, async (req, res) => {
  const { user } = req.session;
  const { patientId } = req.params;
  try {
    const patient = await getPatient(patientId);
    if (patient.doctor_id !== user.id) return unauthorized(res);
    // else return res.json(await getMessages(patientId));
    else
      return res.render("partials/message_list.ejs", {
        messages: await getMessages(patientId),
      });
  } catch (error) {
    return serverError(res, error);
  }
});

router.get("/unread", auth, async (req, res) => {
  const { user } = req.session;
  try {
    return res.json(await unreadMessageCount(user));
  } catch (error) {
    return serverError(res, error);
  }
});

router.get("/unread/doc", authDoctor, async (req, res) => {
  const { user } = req.session;
  try {
    return res.json(await unreadMessagesPerChat(user));
  } catch (error) {
    return serverError(res, error);
  }
});

router.get("/:patientId", authDoctor, async (req, res) => {
  const { user } = req.session;
  const { patientId } = req.params;
  try {
    const patient = await getPatient(patientId);
    if (patient.doctor_id !== user.id) return unauthorized(res);
    else return res.json(await getMessages(patientId));
  } catch (error) {
    return serverError(res, error);
  }
});

router.post("/:patientId", authDoctor, async (req, res) => {
  const { user } = req.session;
  const { patientId } = req.params;
  const { content } = req.body;
  try {
    const patient = await getPatient(patientId);
    if (patient.doctor_id !== user.id) return unauthorized(res);
    const date = new Date();
    const receiver = patientId;
    await createMessage(content, date, user.id, receiver);
    return res.json({ msg: "success" });
  } catch (error) {
    return serverError(res, error);
  }
});

// router.put("/read/list", auth, async (req, res) => {
//   const { user } = req.session;
//   const { messageIds } = req.body;
//   try {
//     const messages = await getMessagesByIds(messageIds, user);
//     if (messages.length === 0)
//       return res.status(400).json({ msg: "invalid messages" });
//     else {
//       const ids = messages.map((i) => i.mes_id);
//       await readMessage(ids);
//       return res.json({ msg: "success", ids });
//     }
//   } catch (error) {
//     return serverError(res, error);
//   }
// });

// router.put("/read/:messageId", auth, async (req, res) => {
//   const { user } = req.session;
//   const { messageId } = req.params;
//   try {
//     const message = await getMessageById(messageId, user);
//     if (typeof message !== "undefined") {
//       await readMessage(messageId);
//       return res.json({ msg: "success" });
//     } else return res.status(400).json({ msg: "invalid message" });
//   } catch (error) {
//     return serverError(res, error);
//   }
// });

router.put("/read", authPatient, async (req, res) => {
  const { user } = req.session;
  const time = new Date();
  try {
    await readMessagesByDate(time, user);
    return res.json({ msg: "success" });
  } catch (error) {
    return serverError(res, error);
  }
});

router.put("/read/user/:patientId", authDoctor, async (req, res) => {
  const { user } = req.session;
  const time = new Date();
  const { patientId } = req.params;
  try {
    return res.json(await readMessagesByDateUser(time, user, patientId));
  } catch (error) {
    return serverError(res, error);
  }
});

module.exports = router;
