import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar
} from "recharts";
import API from "../services/api";

export default function AdminExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({ utilization: 0 });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([fetchExpenses(), fetchStats()]);
  };

  const fetchExpenses = async () => {
    const res = await API.get("/admin/expenses");
    setExpenses(res.data);
  };

  const fetchStats = async () => {
    const res = await API.get("/admin/stats/overall-utilization");
    setStats(res.data);
  };

  // Prepare Bar Chart Data
  const barData = expenses.map((e) => ({
    purpose: e.purpose || "N/A",
    approved: e.approvedAmount,
    spent: e.amountSpent,
  }));

  // Prepare Pie Chart Data
  const pieData = expenses.map((e) => ({
    name: e.purpose,
    value: parseFloat(e.utilization.replace("%", "")) || 0,
  }));

  const COLORS = ["#0088FE", "#00C49F", "#FFD700", "#FF8042", "#FF4444"];

  return (
    <div style={{ padding: "20px" }}>
      <h2>Admin Expense Dashboard</h2>

      {/* TOP CHARTS */}
      <div style={{ display: "flex", gap: "40px", marginBottom: "40px" }}>

        {/* Overall Utilization Gauge */}
        <div style={{ marginBottom: "40px" }}>
          <h3>Overall NGO Utilization</h3>

          <RadialBarChart
            width={300}
            height={300}
            innerRadius="70%"
            outerRadius="100%"
            data={[{ name: "Utilization", value: stats.utilization }]}
            startAngle={0}
            endAngle={(stats.utilization / 100) * 360}
          >
            <RadialBar
              minAngle={15}
              background
              clockWise
              dataKey="value"
              fill={
                stats.utilization >= 80
                  ? "#00C49F"
                  : stats.utilization >= 50
                    ? "#FFD700"
                    : "#FF4444"
              }
            />
          </RadialBarChart>

          <h2 style={{ textAlign: "center" }}>{stats.utilization}%</h2>
        </div>

        {/* Bar Chart */}
        <div>
          <h3>Approved vs Spent</h3>
          <BarChart width={400} height={300} data={barData}>
            <XAxis dataKey="purpose" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="approved" fill="#8884d8" />
            <Bar dataKey="spent" fill="#82ca9d" />
          </BarChart>
        </div>

        {/* Pie Chart */}
        <div>
          <h3>Utilization % per Request</h3>
          <PieChart width={400} height={300}>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>

      </div>

      {/* EXPENSE TABLE */}
      <table border="1" cellPadding="10" style={{ width: "100%", marginTop: "20px" }}>
        <thead>
          <tr>
            <th>Volunteer</th>
            <th>Purpose</th>
            <th>Approved</th>
            <th>Spent</th>
            <th>Utilization</th>
            <th>Trust Score</th>
            <th>Status</th>
            <th>Receipt</th>
            <th>Proof</th>
          </tr>
        </thead>

        <tbody>
          {expenses.map((e) => (
            <tr key={e._id}>
              <td>{e.volunteer}</td>
              <td>{e.purpose}</td>
              <td>₹{e.approvedAmount}</td>
              <td>₹{e.amountSpent}</td>
              <td>{e.utilization}</td>
              <td
                style={{
                  color:
                    (100 - (e.fraudScore || 0)) >= 80 ? "#10b981" :  // HIGH TRUST - Green
                      (100 - (e.fraudScore || 0)) >= 60 ? "#3b82f6" :  // GOOD TRUST - Blue
                        (100 - (e.fraudScore || 0)) >= 40 ? "#f59e0b" :  // MODERATE TRUST - Yellow
                          (100 - (e.fraudScore || 0)) >= 20 ? "#ea580c" :  // LOW TRUST - Orange
                            "#dc2626",                                        // VERY LOW TRUST - Red
                  fontWeight: "bold",
                  fontSize: "16px"
                }}
              >
                {100 - (e.fraudScore || 0)}/100
              </td>
              <td
                style={{
                  color:
                    e.status === "overspent"
                      ? "red"
                      : e.status === "under"
                        ? "green"
                        : "orange",
                  fontWeight: "bold",
                }}
              >
                {e.status}
              </td>
              <td>
                <a href={e.receiptImage} target="_blank" rel="noreferrer">
                  View
                </a>
              </td>
              <td>
                <a href={e.proofImage} target="_blank" rel="noreferrer">
                  View
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
