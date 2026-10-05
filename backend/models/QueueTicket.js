const mongoose = require("mongoose");

const queueTicketSchema = new mongoose.Schema(
  {
    tokenNumber: {
      type: Number,
      required: true,
    },

    serviceDate: {
      type: String,
      required: true,
    },

    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    requestId: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "waiting",
        "processing",
        "completed",
      ],
      default: "waiting",
    },
  },
  {
    timestamps: true,
  }
);

queueTicketSchema.index({ serviceDate: 1, tokenNumber: 1 }, { unique: true });
queueTicketSchema.index({ requestId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model(
  "QueueTicket",
  queueTicketSchema
);
