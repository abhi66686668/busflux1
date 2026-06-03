const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const auth = require("../middleware/auth");

// POST /scan
router.post("/scan", auth, async (req, res) => {
  try {
    if (req.user.role !== "conductor") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { ticketId } = req.body;
    if (!ticketId) return res.status(400).json({ message: "Ticket ID is required" });

    // Finds booking by looking at _id ending with ticketId
    const bookings = await Booking.find()
      .populate("userId", "name email phone userPhoto")
      .populate("busId", "busName from to");
    const booking = bookings.find(b => b._id.toString().toUpperCase().endsWith(ticketId.toUpperCase()));

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status === "scanned") {
      return res.status(400).json({ message: "Ticket already scanned" });
    }

    booking.status = "scanned";
    booking.scannedBy = req.user.id;
    booking.scannedAt = Date.now();
    await booking.save();

    return res.status(200).json({
      message: "Ticket scanned successfully",
      passenger: booking.userId,
      booking: booking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /history
router.get("/history", auth, async (req, res) => {
  try {
    if (req.user.role !== "conductor") {
      return res.status(403).json({ message: "Access denied" });
    }

    const bookings = await Booking.find({ scannedBy: req.user.id })
      .sort({ scannedAt: -1 })
      .populate("userId", "name email phone userPhoto")
      .populate("busId", "busName from to");

    return res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
