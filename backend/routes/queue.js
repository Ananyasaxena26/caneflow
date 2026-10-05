const express = require("express");

const QueueTicket = require("../models/QueueTicket");
const QueueState = require("../models/QueueState");
const ProcurementSchedule = require("../models/Procurement");

const auth = require("../middleware/auth");
const authorize = require("../middleware/role");

const router = express.Router();

/*
Generate Token
*/
router.post(
  "/",
  auth,
  authorize("mill"),
  async (req, res) => {
    try {

      const { farmerId } = req.body;
      const requestId = String(req.get("x-idempotency-key") || "").trim();

      if (!farmerId) {
        return res.status(400).json({
          success: false,
          message: "Farmer ID is required",
        });
      }

      if (requestId) {
        const existing = await QueueTicket.findOne({ requestId });
        if (existing) {
          return res.status(200).json({
            success: true,
            message: "Existing ticket returned",
            data: {
              tokenNumber: existing.tokenNumber,
              serviceDate: existing.serviceDate,
              status: existing.status,
            },
          });
        }
      }

      const session = await ProcurementSchedule.startSession();
      let ticket;
      try {
        await session.withTransaction(async () => {
          // Incrementing the schedule document inside the transaction
          // serializes concurrent token requests and enforces capacity.
          const schedule = await ProcurementSchedule.findOneAndUpdate(
            { $expr: { $lt: ["$allocated", "$capacity"] } },
            { $inc: { allocated: 1 } },
            { sort: { serviceDate: 1 }, new: true, session }
          );

          if (!schedule) throw Object.assign(new Error("No available schedule found"), { code: "NO_CAPACITY" });

          [ticket] = await QueueTicket.create([{
            // allocated is now the atomically assigned token number.
            tokenNumber: schedule.allocated,
            serviceDate: schedule.serviceDate,
            farmer: farmerId,
            ...(requestId ? { requestId } : {}),
          }], { session });
        });
      } finally {
        await session.endSession();
      }

      // ===== Socket.IO =====
      const io = req.app.get("io");

      io.emit("farmerVerified");
      io.emit("dashboardUpdated");
      // =====================

      res.status(201).json({
        success: true,
        message: "Token generated successfully",
        data: {
          tokenNumber: ticket.tokenNumber,
          serviceDate: ticket.serviceDate,
          status: ticket.status,
        },
      });

    } catch (error) {

      console.error(error);

      if (error.code === "NO_CAPACITY") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });

    }
  }
);

/*
Farmer Queue Status
*/
router.get(
  "/my-status",
  auth,
  authorize("farmer"),
  async (req, res) => {
    try {

      const ticket =
        await QueueTicket.findOne({
          farmer: req.user.id,
        }).sort({
          createdAt: -1,
        });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "No active ticket found",
        });
      }

      const getToday = require("../utils/date");

const today = getToday();

      if (ticket.serviceDate !== today) {

        return res.status(200).json({
          success: true,
          data: {
            tokenNumber: ticket.tokenNumber,
            serviceDate: ticket.serviceDate,
            status: ticket.status,
            message:
              "Your service date has not arrived yet",
          },
        });

      }

      const queueState =
        await QueueState.findOne({
          serviceDate: today,
        });

      const currentToken =
        queueState?.currentToken || 0;

      const avgProcessingMinutes =
        queueState?.averageProcessingMinutes || 5;

      const ahead =
        Math.max(
          ticket.tokenNumber - currentToken - 1,
          0
        );

      const etaMinutes =
        ahead * avgProcessingMinutes;

      const windowStart =
        new Date(
          Date.now() +
          etaMinutes * 60 * 1000
        );

      const windowEnd =
        new Date(
          windowStart.getTime() +
          30 * 60 * 1000
        );

      const arrivalWindow =
        `${windowStart.toLocaleTimeString("en-IN", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })} - ${windowEnd.toLocaleTimeString("en-IN", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })}`;

      let message = "";

      if (currentToken === 0) {
        message = "Queue has not started yet";
      } else if (ahead === 0) {
        message =
          "Your turn has arrived. Please proceed to the mill";
      } else {
        message = `${ahead} vehicle(s) ahead of you`;
      }

      res.status(200).json({
        success: true,
        data: {
          tokenNumber: ticket.tokenNumber,
          serviceDate: ticket.serviceDate,
          currentToken,
          ahead,
          arrivalWindow,
          status: ticket.status,
          message,
        },
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });

    }
  }
);

module.exports = router;
