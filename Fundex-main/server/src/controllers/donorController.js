import Donation from "../models/Donation.js"; // only if needed later

export const getDonorOverview = async (req, res) => {
  try {
    // Simple default overview for now
    res.json({
      message: "Donor dashboard overview working!",
      donations: [],
      totalDonated: 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
