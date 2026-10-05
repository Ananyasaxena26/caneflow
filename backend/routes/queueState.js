const express = require("express");

const QueueState =
require("../models/QueueState");

const QueueTicket =
require("../models/QueueTicket");

const auth =
require("../middleware/auth");

const authorize =
require("../middleware/role");
const getToday = require("../utils/date");

const router = express.Router();

/*
Update Current Token Manually
*/
router.patch(
"/current-token",
auth,
authorize("mill"),
async (req, res) => {

try {

  const { currentToken } =
    req.body;

  if (
    currentToken === undefined
  ) {

    return res.status(400).json({
      success: false,
      message:
        "Current token is required",
    });

  }


const today = getToday();

  const state =
    await QueueState.findOneAndUpdate(
      {
        serviceDate: today,
      },
      {
        currentToken,
        lastUpdatedAt:
          new Date(),
      },
      {
        upsert: true,
        new: true,
      }
    );

  const io =
    req.app.get("io");

  io.emit("queueUpdated");

  io.emit("dashboardUpdated");

  res.status(200).json({
    success: true,
    data: state,
  });

}

catch (error) {

  console.error(error);

  res.status(500).json({
    success: false,
    message:
      "Internal Server Error",
  });

}

}
);

/*
Move To Next Vehicle
*/

router.post(
"/next",
auth,
authorize("mill"),
async (req, res) => {

try {

 const today = getToday();

  const totalTokens =
    await QueueTicket.countDocuments({
      serviceDate: today,
    });

  if (
    totalTokens === 0
  ) {

    return res.status(400).json({
      success: false,
      message:
        "No vehicles scheduled for today",
    });

  }

  const session = await QueueState.startSession();
  let state;
  try {
    await session.withTransaction(async () => {
      state = await QueueState.findOne({ serviceDate: today }).session(session);

      if (!state) {
        [state] = await QueueState.create([{
          serviceDate: today,
          currentToken: 1,
          averageProcessingMinutes: 5,
        }], { session });
        return;
      }

      if (state.currentToken >= totalTokens) {
        throw Object.assign(new Error("No more vehicles in queue"), { code: "QUEUE_COMPLETE" });
      }

      state.currentToken += 1;
      state.lastUpdatedAt = new Date();
      await state.save({ session });
    });
  } finally {
    await session.endSession();
  }

  const io =
    req.app.get("io");

  io.emit("queueUpdated");

  io.emit("dashboardUpdated");

  res.status(200).json({
    success: true,
    message:
      "Moved to next vehicle",
    data: {
      currentToken:
        state.currentToken,
    },
  });

}

catch (error) {

  console.error(error);

  if (error.code === "QUEUE_COMPLETE") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  res.status(500).json({
    success: false,
    message:
      "Internal Server Error",
  });

}

}
);

module.exports = router;
