import Expense from "../models/Expense.js";

export const getFraudAlerts = async (req, res) => {
  try {
    const expenses = await Expense.find({
      fraudFlags: { $exists: true, $not: { $size: 0 } }
    })
      .populate("volunteerId", "name email")
      .populate("requestId");

    res.json(expenses);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
