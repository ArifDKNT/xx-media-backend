
import { sendVerificationEmail } from "../utils/sendEmail.js";
import Users from "../models/userModel.js";
import { hashString , compareString } from "../utils/index.js";
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

        const user = await Users.create({
            firstName,
            lastName,
            email,
            password : hashedPassword
        });

        // SEND EMAIL VERIFICATION
        sendVerificationEmail(user,res);


        
    } catch (error) {
        console.log(error);
        res.status(404).json({message : error.message});
    }
}

export const login = async (req ,res ,next) => {
    const {email , password} =  req.body;

    try {
        //Validation
        if(!email || !password) {
            next("Please provide user credentials");
            return;
        }

        //find user by email

        const user = await Users.findOne({email}).select("+password").populate({
            path : "friends",
            select : "firstName lastName location profileUrl -password",
        })

        if(!user){
            next("Invalid email or password");
            return;
        }

        if(!user?.verified){
            next("User email is not verified. Check your email account and verify your email");
            return;
        }

        //Compare Password
        const isMatch = await compareString(password , user?.password);

        if(!isMatch){
            next("Invalid email or password");
            return;
        }

        user.password = undefined;
        const token = createJWT(user?._id);

        res.status(201).json({
            success: true,
            message :"Login successfully",
            user,
            token
        })

    } catch (error) {
        console.log(error);
        res.status(404).json({message : error.message});
    }

}
