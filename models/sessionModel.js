import mongoose from "mongoose";

const sessionSchema = mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
},{Timestamp:true})

export const Session = new mongoose.model("session", sessionSchema)