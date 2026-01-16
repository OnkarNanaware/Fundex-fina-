import express from "express";
import cors from "cors";

// ROUTES
import authRoutes from "./routes/authRoutes.js";
import volunteerRoutes from "./routes/volunteerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import adminExpenseRoutes from "./routes/adminExpenseRoutes.js";
import adminStatsRoutes from "./routes/adminStatsRoutes.js";
import donorRoutes from "./routes/donorRoutes.js";
import adminReportRoutes from "./routes/adminReportRoutes.js";
import campaignRoutes from "./routes/campaignRoutes.js";

console.log("✅ All routes imported successfully");
console.log("✅ adminExpenseRoutes:", typeof adminExpenseRoutes);

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("FUNDEX Backend Running ✔");
});

// ----------- AUTH ------------
app.use("/api/auth", authRoutes);

// ----------- VOLUNTEER ------------
app.use("/api/volunteer", volunteerRoutes);

// ----------- ADMIN ------------ (Order matters! More specific routes first)
app.use("/api/admin/expenses", adminExpenseRoutes);  // ⚠️ Must come BEFORE /api/admin
app.use("/api/admin/stats", adminStatsRoutes);       // ⚠️ Must come BEFORE /api/admin
app.use("/api/admin/reports", adminReportRoutes);    // ⚠️ Must come BEFORE /api/admin
app.use("/api/admin", adminRoutes);

// ----------- EXPENSE SUBMISSION ------------
app.use("/api/expense", expenseRoutes);

// ----------- DONOR ------------
app.use("/api/donor", donorRoutes);

// ----------- CAMPAIGNS ------------
app.use("/api/campaigns", campaignRoutes);

export default app;
