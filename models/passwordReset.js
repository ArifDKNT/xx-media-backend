import mongoose, { Schema } from 'mongoose';


//schema

const passwordResetSchema = new mongoose.Schema(
    {
       userId : {type : Schema.Types.ObjectId , ref: "Users" },
       email : {type:String , unique:true},
       token :String,
       createdAt : Date,
       expiresAt :Date
     
    }
)

const PasswordReset = mongoose.model("PasswordReset" , passwordResetSchema);

export default PasswordReset;