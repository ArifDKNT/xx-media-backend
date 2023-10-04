import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import {v4 as uuidv4} from 'uuid';
import { hashString } from '.index.js';
import Verification from '../models/emailVerification';
dotenv.config();

const {AUTH_EMAIL , AUTH_PASSWORD , APP_URL} = process.env;

let transporter = nodemailer.createTransport({
    host : "smtp-mail.outlook.com",
    auth :{
        user:AUTH_EMAIL,
        pass: AUTH_PASSWORD,
    }
})

export const sendVerificationEmail = async (user, res) =>{
    const {_id , email , lastName} = user;
    const token = _id + uuidv4();
    const link = APP_URL + "users/verify/" + _id + "/" + token;

    const mailOptions = {
        from: AUTH_EMAIL,
        to:email , 
        subject : "Email Verification",
        html :` <div
        style="font-family:Arial , sans=serif ; font-size: 20px ;  color : #333";>
        <h1> Please Verify Your Email Address</h1>
        <h4>Hi ${lastName} </h4>
        <a href=${link} style=" color:#fff ; padding:14px ; text-decoration:none">Verify Emal Address </a>
        </div> 
        `
    }

    try {
        const hashedToken = await hashString(token);
        const newVerifiedEmail = await Verification.create({
            userId : _id,
            token: hashedToken,
            createdAt:Date.now(),
            expiresAt:Date.now() + 3600000,
        })




    } catch (error) {
        console.log(error);
        res.status(404).json({message : "Something went wrong "})
    }
}

