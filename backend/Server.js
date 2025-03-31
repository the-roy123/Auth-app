import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './DB/connectDB.js';
import authRoutes from './router/auth.route.js';
import cookieParser from 'cookie-parser';
import path from "path";
import cors from "cors"

dotenv.config(); 

const app = express();
const PORT = process.env.PORT || 3000;

// ** Middleware **
 // Enable CORS for frontend communication
app.use(express.json()); // Parse JSON request body
app.use(cookieParser())
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "connect-src 'self' http://localhost:3000 http://localhost:5173");
    next();
});

app.use(cors({ origin: "http://localhost:5173", credentials: true }));


// ** Routes **
app.get("/", (req, res) => {
    res.json({ message: "Server is Running! Hello World 🌍" });
});

app.use("/api/auth", authRoutes);  // Authentication routes
if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "/frontend/dist")));

	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
	});
}

// ** Start Server After DB Connection **
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error("❌ Database connection failed:", err);
});