import dotenv from "dotenv";
dotenv.config();

// now other imports
import app from "./src/app.js";
import connectDB from "./src/config/db.js";

const PORT = process.env.PORT || 5000;

// connect to DB AFTER env loads
connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API Key:", process.env.CLOUDINARY_API_KEY);
console.log("API Secret:", process.env.CLOUDINARY_API_SECRET);