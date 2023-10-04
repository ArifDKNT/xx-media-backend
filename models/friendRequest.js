import mongoose, { Schema } from 'mongoose';


//schema

const requestSchema = new mongoose.Schema(
    {
       requestTo : {type : Schema.Types.ObjectI , ref: "Users" },
       requestFrom : {type : Schema.Types.ObjectI , ref: "Users" },
       requestStatus : { type :String , default : "Pending"}
    },
    {timestamps : true}
)

const FriendRequest = mongoose.model("FriendRequest" , requestSchema);

export default FriendRequest;