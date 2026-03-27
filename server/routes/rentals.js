const express = require("express");
const Item = require("../models/Item");
const Booking = require("../models/Booking");
const Transaction = require("../models/Transaction");
const auth = require("../middleware/auth");
const requireMinTrustScore = require("../middleware/trustCheck");

const router = express.Router();

// CREATE item listing (subject to TrustScore rule)
router.post(
  "/items",
  auth,
  requireMinTrustScore(2.0),
  async (req, res, next) => {
    try {
      const { title, description, photos, category, dailyRate, blockedDates } =
        req.body;

      // Validate max 3 images
      if (photos && photos.length > 3) {
        return res.status(400).json({
          message: "Maximum 3 images allowed",
        });
      }

      const item = await Item.create({
        owner: req.user._id,
        title,
        description,
        photos: photos || [], // optional,
        category,
        dailyRate,
        blockedDates,
      });

      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  },
);

// GET item listings with optional category filter
router.get("/items", async (req, res, next) => {
  try {
    const { category } = req.query;
    const query = { isActive: true };
    if (category) {
      query.category = category;
    }
    const items = await Item.find(query).populate("owner", "name trustScore");
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// GET single item details by ID
router.get("/items/:id", async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate(
      "owner",
      "name trustScore",
    );
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// Update item listing (only by owner, and only if no active future bookings)
router.put("/items/:id", auth, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) return res.status(404).json({ message: "Item not found" });

    if (!item.owner.equals(req.user._id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { photos } = req.body;

    if (photos && photos.length > 3) {
      return res.status(400).json({
        message: "Maximum 3 images allowed",
      });
    }

    const updated = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Get items owned by the authenticated user (for dashboard)
router.get("/my-items", auth, async (req, res, next) => {
  try {
    const items = await Item.find({ owner: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// Strict Business Rule #1:
// Item cannot be deleted if there is an active future booking for it.
router.delete("/items/:id", auth, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (!item.owner.equals(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You can only delete your own items." });
    }

    const now = new Date();
    const activeBooking = await Booking.findOne({
      item: item._id,
      startDate: { $gte: now },
      status: { $in: ["pending", "confirmed"] },
    });

    if (activeBooking) {
      return res.status(400).json({
        message: "Cannot delete item with active future bookings.",
      });
    }

    await item.deleteOne();
    res.json({ message: "Item deleted successfully." });
  } catch (err) {
    next(err);
  }
});

// CREATE booking for an item
router.post("/items/:id/bookings", auth, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.body;

    const item = await Item.findById(req.params.id).populate("owner");
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.owner._id.equals(req.user._id)) {
      return res.status(400).json({
        message: "You cannot book your own item",
      });
    }

    if (!item.isActive) {
      return res.status(400).json({
        message: "Item is not available for booking",
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "Start date and end date are required.",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({
        message: "Invalid booking dates.",
      });
    }

    if (start > end) {
      return res.status(400).json({
        message: "Start date must be before end date.",
      });
    }

    if (start < now) {
      return res.status(400).json({
        message: "Start date cannot be in the past.",
      });
    }

    const existingBooking = await Booking.findOne({
      item: item._id,
      status: { $in: ["pending", "confirmed"] },
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start },
        },
      ],
    });

    if (existingBooking) {
      return res.status(400).json({
        message: "Item already booked for selected dates",
      });
    }

    const booking = await Booking.create({
      item: item._id,
      borrower: req.user._id,
      startDate: start,
      endDate: end,
    });

    const transaction = await Transaction.create({
      type: "rental",
      item: item._id,
      booking: booking._id,
      owner: item.owner._id,
      counterparty: req.user._id,
      status: "Pending",
    });

    res.status(201).json({ booking, transaction });
  } catch (err) {
    next(err);
  }
});

//Return an item (mark booking as returned and transaction as completed)
router.put("/bookings/:id/return", auth, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("item");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!booking.borrower.equals(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (booking.status === "returned") {
      return res.status(400).json({
        message: "Item already returned",
      });
    }

    booking.status = "returned";
    booking.returnedAt = new Date();
    await booking.save();

    const transaction = await Transaction.findOneAndUpdate(
      { booking: booking._id },
      { returnTime: new Date() },
      { new: true },
    );

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    await Item.findByIdAndUpdate(booking.item._id, { status: "available" });

    res.json({ message: "Item returned successfully." });
  } catch (err) {
    next(err);
  }
});

// Get bookings made by the authenticated user
router.get("/my-bookings", auth, async (req, res) => {
  const bookings = await Booking.find({
    borrower: req.user._id,
  }).populate("item");

  res.json(bookings);
});

// Get bookings for items owned by the authenticated user
router.get("/owner-bookings", auth, async (req, res) => {
  const items = await Item.find({ owner: req.user._id });

  const bookings = await Booking.find({
    item: { $in: items.map((i) => i._id) },
  }).populate("borrower item");

  res.json(bookings);
});

// Check availability of an item for a given date range
router.get("/items/:id/availability", async (req, res) => {
  const bookings = await Booking.find({
    item: req.params.id,
    status: { $in: ["pending", "confirmed"] },
  });

  res.json(bookings);
});

module.exports = router;
