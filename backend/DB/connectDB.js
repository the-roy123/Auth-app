import mongoose from "mongoose";
 export const connectDB=async()=>
 {
    try {
        const conn=await mongoose.connect(process.env.MONGO_URI);
        console.log('MONGODB CONNECTED: ${conn.coneection.host} ')
        
    } catch (error) {
        console.log("Error connecting to MONGO",error.message);
        
    }
 }