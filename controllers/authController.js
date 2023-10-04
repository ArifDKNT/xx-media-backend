import Users from "../models/userModel";
import { hashString } from "../util/index.js";

export const register = async (req , res ,next) => {

    const {firstName , lastName , email , password} = req.body;

    //Validate Fields

    if(!(firstName || lastName || email || password)){
        next("Provide Required Fields!")
        return;
    }
    try {
        const userExists = await Users.findOne({email});
        if(userExists){
            next("Email Address already exists");
            return;
        }

        const hashedPassword = await hashString(password);
        
    } catch (error) {
        console.log(error);
        res.status(404).json({message : error.message});
    }
}