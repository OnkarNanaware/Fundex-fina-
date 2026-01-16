import React from "react";
import { Link } from "react-router-dom";

export default function ChooseRole() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#efe5d7",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "2rem"
    }}>
      <div style={{
        background: "#171411",
        width: "100%",

        maxWidth: "600px",
        padding: "2rem",
        borderRadius: "20px",
        color: "#efe5d7",
        textAlign: "center",
        boxShadow: "0px 20px 60px rgba(0,0,0,0.5)"
      }}>
        
        <h1 style={{
          fontSize: "3rem",
          marginBottom: "1rem",
          color: "#efe5d7",
          fontFamily: "Zodiak Variable"
        }}>
          Get Started
        </h1>

        <p style={{
          fontSize: "1.1rem",
          opacity: 0.8,
          marginBottom: "2.5rem",
          color: "#efe5d7"
        }}>
          Choose how you want to join Fundex.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          <Link to="/register/donor" className="choose-btn">
            Register as Donor
          </Link>

          <Link to="/register/volunteer" className="choose-btn">
            Register as Volunteer
          </Link>

          <Link to="/register/admin" className="choose-btn">
            Register as NGO Admin
          </Link>

          <Link to="/login" className="choose-btn" style={{ background: "#dd23bb" }}>
            Login
          </Link>

        </div>
      </div>

      <style>{`
        .choose-btn {
          display: block;
          padding: 14px 20px;
          background: #000;
          color: #efe5d7;
          border-radius: 10px;
          text-decoration: none;
          font-size: 1.05rem;
          font-weight: 600;
          transition: 0.2s;
        }
        .choose-btn:hover {
          background: #222;
          transform: translateY(-3px);
        }
      `}</style>

    </div>
  );
}
