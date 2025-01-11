import mongoose, { Schema } from "mongoose";

const userLoginLogSchema = new Schema({
    email: {
        type: String,
        required: [true, "Email is Required"],
    },
    ipAddress:{
        type: String,
    },
    status:{
        type: String,
        required: [true, "Status is Required"]
    },
    timeStamp:{
        type: Date, 
        default: Date.now
    },
    reason:{
        type: String,
    },
});
const loginLog = mongoose.model("userLoginLog", userLoginLogSchema);

export default loginLog;
