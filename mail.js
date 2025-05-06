const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'singhalmca04@gmail.com',
        pass: 'tbsl jdwl oyts rihw' // Not your real password!
    }
});

exports.sendMail = (mailOptions) => {
    let mailOptions1 = {
        from: 'singhalmca04@gmail.com',
        to: mailOptions.to,
        subject: mailOptions.subject,
        text: mailOptions.body
    };
    console.log(mailOptions, 'mailoptions')
    transporter.sendMail(mailOptions1, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}