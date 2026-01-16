import { useEffect, useState } from "react";
import API from "../services/api";

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    const res = await API.get("/admin/requests/pending");
    setRequests(res.data);

  };

  const approve = async (id) => {
  const amount = prompt("Enter approved amount:");
  const comments = prompt("Enter approval comments:");
  if (!amount) return;

  await API.post(`/admin/requests/${id}/approve`, {
    approvedAmount: amount,
    comments
  });

  loadRequests();
};


  const reject = async (id) => {
  const comments = prompt("Enter rejection reason:");
  
  await API.post(`/admin/requests/${id}/reject`, {
    comments
  });

  loadRequests();
};


  return (
    <div>
      <h2>Admin Panel — Pending Requests</h2>

      {requests.map((req) => (
        <div
          key={req._id}
          style={{ border: "1px solid black", padding: "10px", margin: "10px" }}
        >
            <p><strong>Purpose:</strong> {req.purpose}</p>
            <p><strong>Amount Requested:</strong> {req.amountRequested}</p>
            <p><strong>Admin Comments:</strong> {req.comments}</p>


          <button onClick={() => approve(req._id)}>Approve</button>
          <button onClick={() => reject(req._id)}>Reject</button>
        </div>
      ))}
    </div>
  );
}
