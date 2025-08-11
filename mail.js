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

import { Resend } from 'resend';
// const Resend = require('resend');

const resend = new Resend('re_16u1Zpt9_JLHkFqs7emBo9Wd6qM5dXK72');

export async function sendMail(mailOptions) {
  const { to, subject, text } = mailOptions;
  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev', // Use your verified domain or 'resend.dev'
      to: [to],
      subject: subject,
      text: text
    });
    console.log('Email sent: ' + data);
    
  } catch (error) {
    console.error(error);
  }
}