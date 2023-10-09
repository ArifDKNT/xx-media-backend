import mongoose from "mongoose";
import Verification from "../models/emailVerification.js";
import Users from "../models/userModel.js";
import { createJwt , compareString } from "../utils/index.js";
import FriendRequest from "../models/friendRequest.js";
export const verifyEmail = async (req,res) => {
    const {userId , token} = req.params;

    try {
        const result = await Verification.findOne({useId});
        if(result){
            const {expiresAt , token: hashedToken} = result;

            //token has expires
            if(expiresAt < Date.now()){
               Verification.findOneAndDelete({userId}).then(() => {
                Users.findOneAndDelete({_id : userId}).then(() => {
                    const message = "Verification token has expired";
                    res.redirect(`/users/verified?status=error&message=${message}`)
                }).catch((err) =>{
                    res.redirect(`/users/verified?status=error&message=`)
                })
               }).catch((error) => {
                console.log(error);
                res.redirect(`/users/verified?message=`)
               })
            }else{
                //token valid
                compareString(token , hashedToken).then((isMatch) => {
                    if(isMatch){
                        Users.findOneAndUpdate({userId} , {verified:true}).then(() => {
                            Verification.findOneAndDelete({userId}).then(() => {
                                const message = "Email verified successfully";
                                res.redirect(`/users/verified?status=success&message=${message}`
                                )
                            })
                        }).catch((err) => {
                            console.log(err);
                            const message = "Verification failed or link is invalid";
                            res.redirect(`/users/verified?statuss=error&message=${message}`)
                        })

                    }else{
                        //Invalid Token
                        const message = "Verification failed or link is invalid";
                        res.redirect(`/users/verified?statuss=error&message=${message}`)

                    }

                }).catch((err) => {
                    console.log(err);
                    res.redirect(`/users/verified?message=`)
                })

            }


        }
    } catch (error) {
        console.log(error);
        res.status(404).json({message : error.message});
        
    }
}

export const getUser = async(req , res , next) => {

    try {
        const {userId} = req.body.user;
        const {id} = req.params;

        const user = await Users.findById(id ?? userId).populate({
            path:"friends",
            select: "-password"
        })

        if(!user){
            return res.status(200).send({
                message: "User Not Found",
                success : false,
            })
        }

        user.password = undefined;

        res.status(200).json({
            sucess:true,
            user : user,
        })


    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "auth error",
            success:false,
            error : error.message
        })
    }
}

export const updateUser = async (req , res ,next) => {
    try {
     const {firstName , lastName , location , profileUrl , profession} = req.body;

     if(!(firstName || lastName || location || profileUrl || profession )){
        next("Please provide all required fields");
        return;
     }
        const {userId} = req.body.user;

        const updateUser = {
            firstName,
            lastName,
            location,
            profileUrl,
            profession,
            _id: userId,

        };

        const user = await Users.findByIdAndUpdate(userId , updateUser , {
            new:true
        });

        await user.populate({path : "friends" , select:"-password" })
        const token = createJwt(user?._id);

        user.password = undefined;

        res.status(200).json({
            success:true,
            message : "User updated successfully",
            user,
            token,
        })


    } catch (error) {
        console.log(error);
        res.status(404).json({
            message : error.message
        })
    }
}


export const friendRequest = async ( req , res , next) => {
    try {

        const {userId} = req.body.user;
        const {requestTo } = req.body;

        const requestExists = await FriendRequest.findOne({
            requestFrom:userId,
            requestTo,
        })

        if(requestExists){
            next("Friend Request already sent.");
            return;
        }

        const accountExists = await FriendRequest.findOne({
            requestFrom: requestTo,
            requestTo: userId
        })

        if(accountExists){
            next("Friend Request already sent.");
            return;
        }

        const newRes = await FriendRequest.create({
            requestTo,
            requestFrom: userId,
        })

        res.status(201).json({
            success:true,
            message:"Friend Request send successfully"
        });        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "auth error",
            success:false,
            error : error.message
        })

    }
}


export const getFriendRequest = async(req , res , next) => {
    try {
        const { userId } = req.body.user;
        const request = await FriendRequest.find({
            requestTo:userId,
            requestStatus:"Pending",
        }).populate({
            path:"requestFrom",
            select:"firstName lastName profileUrl profession -password"
        }).limit(10).sort({_id:-1});

        res.status(200).json({
            success:true,
            data:request,
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "auth error",
            success:false,
            error : error.message
        })
    }
}


export const acceptRequest = async(req , res , next) => {
    try {
        const id = req.body.user.userId;

        const { rid , status } = req.body;

        const requestExists = await FriendRequest.findById(rid);

        if(!requestExists){
            next("No Friend Request Found.");
            return;
        }

        const newRes = await FriendRequest.findByIdAndUpdate(
            {_id : rid},
            {requestStatus : status}
        
        );
        
        if(status === "Accepted") { 
            const user = await Users.findById(id);

            user.friends.push(newRes?.requestFrom);

            await user.save();

            const friend = await Users.findById(newRes?.requestTo);

            await friend.save();

        }


        res.status(201).json({
            success : true,
            message: "Friend Request " + status
        })


    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "auth error",
            success:false,
            error : error.message
        })
    }

}

export const profileViews = async( req , res , next) => {
    try {
        const { userId } = req.body.user;
        const { id } = req.body;

        const user = await Users.findById(id);

        user.views.push(userId);

        await user.save();
        res.status(200).json({
            success:true,
            message: "Successfully"
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "auth error",
            success:false,
            error : error.message
        })
    }
}

export const suggestedFriends = async(req , res ,next) => {
    try {
        const { userId }  = req.body.user;
        let queryObject = {};

        queryObject._id = {$ne : userId};

        queryObject.friends = { $nin : userId};

        let queryResults = Users.find(queryObject).limit(15).select("firstName lastName profileUrl profession -password"); 

        const suggestedFriends = await queryResults;

        res.status(201).json({
            success:true,
            data: suggestedFriends,
        })


    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "auth error",
            success:false,
            error : error.message
        })
    }
}