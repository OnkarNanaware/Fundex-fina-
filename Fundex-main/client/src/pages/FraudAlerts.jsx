import React, { useEffect, useState } from "react";
import API from "../services/api";

export default function FraudAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await API.get("/admin/fraud");
      setAlerts(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching fraud alerts:", err);
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>🚨 Fraud Alerts</h1>
      <p style={{ color: "gray" }}>
        These expenses have been flagged by AI as suspicious.
      </p>

      {/* Loading State */}
      {loading && <p>Loading fraud alerts...</p>}

      {/* Empty State */}
      {!loading && alerts.length === 0 && (
        <p style={{ marginTop: "20px" }}>No fraud detected 🎉</p>
      )}

      {/* Fraud Cards */}
      {alerts.map((a) => (
        <div
          key={a._id}
          style={{
            marginTop: "20px",
            padding: "20px",
            borderRadius: "10px",
            border: "1px solid #ccc",
            background: "#fff7f7",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <h3>
            {a.volunteerId?.name} — Request: {a.requestId?.purpose || "N/A"}
          </h3>

          <p>
            <strong>Claimed Amount:</strong> ₹{a.amountSpent}
          </p>

          <p>
            <strong>OCR Detected Amount:</strong>{" "}
            {a.detectedAmount !== null ? `₹${a.detectedAmount}` : "N/A"}
          </p>

          <p style={{ marginTop: "10px", color: "red", fontWeight: "bold" }}>
            ⚠ Fraud Flags:
          </p>
          <ul>
            {a.fraudFlags.map((f, i) => (
              <li key={i} style={{ color: "red" }}>
                {f}
              </li>
            ))}
          </ul>

          {/* Images Section */}
          <div style={{ display: "flex", gap: "20px", marginTop: "15px" }}>
            <div>
              <p>Receipt:</p>
              <img
                src={a.receiptImage}
                alt="receipt"
                width="200"
                style={{ borderRadius: "8px" }}
              />
            </div>

            <div>
              <p>Proof:</p>
              <img
                src={a.proofImage}
                alt="proof"
                width="200"
                style={{ borderRadius: "8px" }}
              />
            </div>
          </div>

          {/* OCR Extracted Text */}
          <div
            style={{
              marginTop: "15px",
              padding: "10px",
              backgroundColor: "#f7f7f7",
              borderRadius: "8px",
            }}
          >
            <p>
              <strong>OCR Extracted Text:</strong>
            </p>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                background: "#eee",
                padding: "10px",
                borderRadius: "8px",
              }}
            >
              {a.ocrExtracted || "No text extracted"}
            </pre>
          </div>
        </div>
      ))}
    </div>
  );
}
