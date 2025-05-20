const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'singhalmca04@gmail.com',
        pass: 'tbsl jdwl oyts rihw' // Not your real password!
    }
});

exports.sendMail = (mailOptions) => {
    console.log(mailOptions, 'mailoptions')
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}