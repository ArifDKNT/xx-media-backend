import mongoose from "mongoose";
import Verification from "../models/emailVerification.js";

export const verifyEmail = async (req,res) => {
    const {userId , token} = req.params;

    try {
        const result = await Verification.findOne({useId});
        if(result){
            const {expiresAt , token: hashedToken} = result;

            //token has expires
            if(expiresAt < Date.now()){
                await Verification.findOneAndDelete({userId}).then(() => {
                    const message = "Verification token has expired.";
                    res.redirect(`/users/verified?status=error&message=${message}`)
                });
            }


        }
    } catch (error) {
        console.log(error);
        res.status(404).json({message : error.message});
        
    }
}