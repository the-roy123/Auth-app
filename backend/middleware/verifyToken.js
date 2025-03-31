import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    console.log("Cookies received:", req.cookies); // Debugging

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized - no token provided" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRETKEY);
        console.log("Decoded token:", decoded); // Debugging

        req.userId = decoded.userid; 
		console.log("Middleware: verifyToken - After Decoding:", req.userId);
        next();
    } catch (error) {
        console.log("Error in verifyToken:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
