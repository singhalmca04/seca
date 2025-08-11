// const nodemailer = require('nodemailer');

// let transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: 'srmhallticket@gmail.com',
//         pass: 'bgjw bfan wglo dgjj' // Not your real password!
//     }
// });

// exports.sendMail = (mailOptions) => {
//     transporter.sendMail(mailOptions, function (error, info) {
//         if (error) {
//             console.log(error);
//         } else {
//             console.log('Email sent: ' + info.response);
//         }
//     });
// }

import nodemailer from "nodemailer";

export async function sendMail(mailOptions) {
  const { to, subject, text } = mailOptions;

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      auth: {
        user: process.env.SENDINBLUE_USER,
        pass: process.env.SENDINBLUE_PASS
      }
    });

    const info = await transporter.sendMail({
      from: `"My App" <${process.env.SENDINBLUE_USER}>`,
      to,
      subject,
      text
    });
    console.log("Email sent: " + info.messageId);
  } catch (error) {
    console.log(error.message);
  }
}


// import { Resend } from 'resend';

// const resend = new Resend('re_16u1Zpt9_JLHkFqs7emBo9Wd6qM5dXK72');

// export async function sendMail(mailOptions) {
//   const { to, subject, text } = mailOptions;
//   try {
//     const data = await resend.emails.send({
//       from: 'onboarding@resend.dev', // Use your verified domain or 'resend.dev'
//       to: [to],
//       subject: subject,
//       text: text
//     });
//     console.log('Email sent: ' + data);
    
//   } catch (error) {
//     console.error(error);
//   }
// }