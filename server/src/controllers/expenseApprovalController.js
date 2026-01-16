import Expense from "../models/Expense.js";

// Approve expense
export const approveExpense = async (req, res) => {
    console.log("🟢 APPROVE EXPENSE CALLED - ID:", req.params.id);
    console.log("🟢 User:", req.user);

    try {
        if (req.user.role !== "admin" && req.user.role !== "finance") {
            console.log("❌ Access denied - Role:", req.user.role);
            return res.status(403).json({ message: "Access denied" });
        }

        console.log("🔍 Finding expense with ID:", req.params.id);
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            console.log("❌ Expense not found");
            return res.status(404).json({ message: "Expense not found" });
        }

        console.log("✅ Expense found, updating status...");
        expense.verificationStatus = "approved";
        expense.verifiedBy = req.user.id;
        expense.verifiedAt = new Date();
        await expense.save();

        console.log("✅ Expense approved successfully!");
        res.json({
            success: true,
            message: "Expense approved successfully",
            expense
        });
    } catch (err) {
        console.error("❌ ERROR in approveExpense:", err);
        res.status(500).json({ message: err.message });
    }
};

// Flag expense
export const flagExpense = async (req, res) => {
    console.log("🔴 FLAG EXPENSE CALLED - ID:", req.params.id);
    console.log("🔴 User:", req.user);
    console.log("🔴 Body:", req.body);

    try {
        if (req.user.role !== "admin" && req.user.role !== "finance") {
            console.log("❌ Access denied - Role:", req.user.role);
            return res.status(403).json({ message: "Access denied" });
        }

        const { reason } = req.body;
        console.log("🔍 Finding expense with ID:", req.params.id);
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            console.log("❌ Expense not found");
            return res.status(404).json({ message: "Expense not found" });
        }

        console.log("✅ Expense found, flagging...");
        expense.verificationStatus = "flagged";
        expense.flaggedReason = reason || "Flagged for review";
        expense.verifiedBy = req.user.id;
        expense.verifiedAt = new Date();
        await expense.save();

        console.log("✅ Expense flagged successfully!");
        res.json({
            success: true,
            message: "Expense flagged successfully",
            expense
        });
    } catch (err) {
        console.error("❌ ERROR in flagExpense:", err);
        res.status(500).json({ message: err.message });
    }
};
