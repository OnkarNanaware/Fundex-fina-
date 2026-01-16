import { useState } from "react";
import API from "../services/api";

export default function VolunteerRequest() {
  const [form, setForm] = useState({
    purpose: "",
    amountRequested: "",
  });

  const requestFunds = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/volunteer/request", form);
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to request funds");
    }
  };

  return (
    <div>
      <h2>Volunteer Fund Request</h2>
      <form onSubmit={requestFunds}>
        <input
          placeholder="Purpose"
          onChange={(e) => setForm({ ...form, purpose: e.target.value })}
        />
        <br />

        <input
          placeholder="Amount"
          type="number"
          onChange={(e) => setForm({ ...form, amountRequested: e.target.value })}
        />

        <br />
        <button type="submit">Submit Request</button>
      </form>
    </div>
  );
}
