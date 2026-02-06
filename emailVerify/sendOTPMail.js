import nodemailer from "nodemailer";
import "dotenv/config";

export const sendOTPEMail = async(otp, email) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailConfigurations = {
    from: process.env.MAIL_USER,
    to: email,
    subject: "Passport Reset OTP",
    html:`<p>Your OTP for passord reset is: <b>${otp}</b></p>`
            
  };

  transporter.sendMail(mailConfigurations, function (error, info) {
    if (error) {
      console.log("email error:", error.message);
      return;
    }
    console.log("otp send successfuly");
  });
}
