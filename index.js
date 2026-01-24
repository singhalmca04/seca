const express = require('express');
const app = express();
require('./db');
const User = require('./users');
const Student = require('./students');
// require('./upload');
const bodyParser = require('body-parser');
const cors = require("cors");
const asyncLoop = require('node-async-loop');
app.use(cors()); // Allows all origins (not recommended for production)
const nodemailer = require('nodemailer');

const fs = require('fs');
const path = require('path');
// const pdf = require('pdf-creator-node');
const ExcelJS = require('exceljs');
const multer = require('multer');
const logger = require('./logger');
const mail = require('./mail');
const xlsx = require('xlsx');
const axios = require('axios');
const pdfgen = require('./pdfgenerator');
const Handlebars = require('handlebars');

app.use('/uploads', express.static(path.join(__dirname + '/uploads/')));
app.use('/students', express.static(path.join(__dirname, 'students')));

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(bodyParser.json({ limit: '40mb' }));

app.get('/deleteall', async (req, res) => {
    try {
        const u = await User.deleteMany({});
        res.status(200).send({ data: u });
    } catch (err) {
        res.status(500).send({ error: err });
    }
});

app.get('/deleteall/:semester/:specialization/:section', async (req, res) => {
    try {
        const u = await User.deleteMany({ specialization: req.params.specialization, semester: req.params.semester, section: req.params.section });
        res.status(200).send({ data: u });
    } catch (err) {
        res.status(500).send({ error: err });
    }
});

app.get('/deleteall/ie', async (req, res) => {
    try {
        const u = await Student.deleteMany({});
        res.status(200).send({ data: u });
    } catch (err) {
        res.status(500).send({ error: err });
    }
});

app.delete("/delete/:id", async (req, res) => {
    try {
        let result = await User.findByIdAndDelete(req.params.id);
        res.status(200).send({ data: result });
    } catch (err) {
        console.log(err);
        res.status(500).send("Some Error");
    }
});

app.delete("/deleteie/:id", async (req, res) => {
    try {
        let result = await Student.findByIdAndDelete(req.params.id);
        res.status(200).send({ data: result });
    } catch (err) {
        console.log(err);
        res.status(500).send("Some Error");
    }
});

app.put("/update/:id", async (req, res) => {
    try {
        const { name, regno, semester, section, batch, subcode } = req.body;
        let result = await User.findOneAndUpdate({ _id: req.params.id }, {
            $set: {
                name, regno, semester, section, batch, subcode: typeof subcode === 'string'
                    ? subcode.split(',').map(code => code.trim())
                    : Array.isArray(subcode)
                        ? subcode.map(code => code.trim())
                        : []
            }
        });
        res.status(200).send({ data: result });
    } catch (err) {
        console.log(err);
        res.status(500).send("Some Error");
    }
});

app.put("/updateie/:id", async (req, res) => {
    try {
        const { ie, month, year, program, specialization,
            semester, subcode, subject, examdate, session, batch } = req.body;
        let result = await Student.findOneAndUpdate({ _id: req.params.id }, {
            $set: {
                ie, month, year, program, specialization,
                semester, subcode, subject, examdate, session, batch
            }
        });
        res.status(200).send({ data: result });
    } catch (err) {
        console.log(err);
        res.status(500).send("Some Error");
    }
});

app.post("/finduser", async (req, res) => {
    try {
        const { branch, specialization, semester, section } = req.body;
        let spec = [], sem = [], sec = [], user = [];
        let query = {};
        query.$and = [];
        if (branch !== "") {
            if (!query.$and) {
                query.$and = [];
            }
            query.$and.push({ branch });
            spec = await User.distinct("specialization", query);
        }
        if (specialization !== "") {
            if (!query.$and) {
                query.$and = [];
            }
            query.$and.push({ specialization });
            sem = await User.distinct("semester", query);
        }
        if (semester !== "") {
            if (!query.$and) {
                query.$and = [];
            }
            query.$and.push({ semester });
            sec = await User.distinct("section", query);
        }
        if (section !== "") {
            if (!query.$and) {
                query.$and = [];
            }
            query.$and.push({ section });
            user = await User.find(query).sort({ regno: 1 });
        }
        // let user = await User.find();
        res.status(200).send({ data: { specialization: spec, semester: sem, section: sec, user } });
    } catch (err) {
        console.log(err);
        res.status(500).send("Some Error");
    }
})

app.get("/findstudents", async (req, res) => {
    try {
        let data = await Student.find().sort({ semester: 1 });
        res.status(200).send({ data: data });
    } catch (err) {
        console.log(err + "error");
        res.status(500).send("Some Error");
    }
})

function getBase64Image(filePath) {
    const imagePath = path.join(__dirname, filePath); // Adjust if needed
    const image = fs.readFileSync(imagePath);
    const ext = path.extname(filePath).substring(1); // e.g., 'jpg'
    return `data:image/${ext};base64,${image.toString('base64')}`;
}

const getBase64FromUrl = async (imageUrl) => {
    const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
    });

    const base64 = Buffer.from(response.data, 'binary').toString('base64');

    // Detect MIME type from URL extension (optional but useful)
    const mimeType = imageUrl.endsWith('.png') ? 'image/png'
        : imageUrl.endsWith('.jpg') || imageUrl.endsWith('.jpeg') ? 'image/jpeg'
            : 'image/*';

    return `data:${mimeType};base64,${base64}`;
};

app.get('/downloaduser/:branch/:specialization/:semester/:section/:group', async (req, res) => {
    const srmlogo = getBase64Image('/uploads/srm-logo.png');
    const srm = getBase64Image('/uploads/srm.png');
    const def = getBase64Image('/uploads/test1.jpg');
    const { branch, specialization, semester, section, group } = req.params;
    // console.log(req.params, 'params');
    let query = { branch, specialization, semester, section }
    let count = await User.countDocuments(query);
    let users = [];
    if (group == 1) {
        users = await User.find(query).limit(Math.ceil(count / 2)).sort({ regno: 1 });
        // users = await User.find().limit(3);
    } else {
        users = await User.find(query).skip(Math.ceil(count / 2)).sort({ regno: 1 });
    }
    if (users && users.length) {
        let ieDetails = await Student.find({ semester, batch: users[0].batch, specialization }).sort({ examdate: 1 });
        if (!ieDetails.length) return res.status(204).send();
        const userWithSubject = await Promise.all(users.map(async (user) => {
            const img = user.image ? await getBase64FromUrl(user.image) : def;

            // Filter only the subjects this student has
            const personalSubjects = ieDetails.filter(sub =>
                user.subcode.includes(sub.subcode)
            );
            ieDetails[0].month = ieDetails[0].month.charAt(0).toUpperCase() + ieDetails[0].month.slice(1).toLowerCase();
            return {
                regno: user.regno,
                name: user.name,
                semester: user.semester,
                section: user.section,
                batch: user.batch,
                image: img,
                subcode: user.subcode,
                sno: user.regno.substring(2),
                srmlogo,
                srm,
                specialization,
                branch,
                isBtech: ieDetails[0].program == 'B.TECH' ? true : false,
                isNotCore: specialization == 'CORE' ? false : true,
                ieData: ieDetails[0],  // Optional: general info
                ieDetails: personalSubjects, // 👈 only student's subjects
            };
        }));

        try {
            const templateSource = fs.readFileSync(path.resolve('./templates/user.html'), 'utf8');
            const template = Handlebars.compile(templateSource);

            const html = template({
                uData: {
                    user: JSON.parse(JSON.stringify(userWithSubject))
                }
            });

            const pdfBuffer = await pdfgen.generatePDF({ html });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');
            res.send(pdfBuffer);
        } catch (error) {
            console.error(error);
            res.status(500).send('PDF generation failed');
        }
    } else {
        res.status(204).send();
    }
});

app.get('/downloaduserx', async (req, res) => {
    try {
        let users = await User.find();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Students');

        worksheet.columns = [
            { header: 'S.No', key: 'sno' },
            { header: 'Name', key: 'name' },
            { header: 'Marks', key: 'marks' },
            { header: 'Reg No', key: 'regno' },
        ];

        const data = users.map((user, index) => {
            return { sno: index + 1, name: user.name, marks: user.marks, regno: user.regno }
        });

        data.forEach(item => {
            worksheet.addRow(item);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).send('PDF generation failed');
    }
});

app.get('/uploads/:name', function (req, res) {
    var filePath = "/uploads/name";
    fs.readFile(__dirname + filePath, function (err, data) {
        res.send(data);
    });
});
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Folder where images will be stored
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

const uploadx = multer({ storage: multer.memoryStorage() });

app.post('/uploadexcel', uploadx.single('file'), (req, res) => {
    const file = req.file;
    if (!file) return res.status(400).send('No file uploaded.');

    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet); // Convert sheet to JSON
    if (data.length) {
        asyncLoop(data, async function (x, next) {
            let subcode = [];
            subcode.push(x.subcode1?.trim());
            subcode.push(x.subcode2?.trim());
            subcode.push(x.subcode3?.trim());
            subcode.push(x.subcode4?.trim());
            subcode.push(x.subcode5?.trim());
            if (x.subcode6) {
                subcode.push(x.subcode6?.trim());
            }
            if (x.subcode7) {
                subcode.push(x.subcode7?.trim());
            }
            if (x.subcode8) {
                subcode.push(x.subcode8?.trim());
            }

            // await User.insertOne({
            //     name: x.Name?.trim().toUpperCase(),
            //     regno: x["Reg No"]?.trim().toUpperCase(),
            //     semester: x.semester?.trim().toUpperCase(),
            //     section: x.section?.trim().toUpperCase(),
            //     branch: x.branch?.trim().toUpperCase(),
            //     specialization: x.specialization?.trim().toUpperCase(),
            //     batch: x.batch?.trim(),
            //     subcode: subcode
            // });
            await User.updateOne(
                { regno: x["Reg No"]?.trim().toUpperCase() },   // condition
                {
                    $set: {
                        subcode: subcode,
                        semester: x.semester?.trim().toUpperCase()
                    },
                    $setOnInsert: {
                        name: x.Name?.trim().toUpperCase(),
                        section: x.section?.trim().toUpperCase(),
                        branch: x.branch?.trim().toUpperCase(),
                        specialization: x.specialization?.trim().toUpperCase(),
                        batch: x.batch?.trim()
                    }
                },
                { upsert: true }
            );
            next();
        }, async function (err) {
            if (err) {
                return res.json({ success: true, data: "Error " + err });
            } else {
                return res.json({ success: true, data });
            }
        });
    } else {
        return res.json({ success: true, data: "No data found" });
    }
});

app.post('/uploadexcelie', uploadx.single('file'), (req, res) => {
    const file = req.file;
    if (!file) return res.status(400).send('No file uploaded.');

    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet); // Convert sheet to JSON
    if (data.length) {
        asyncLoop(data, async function (x, next) {
            await Student.insertOne({
                ie: x.ie?.trim().toUpperCase(),
                month: x["month"]?.trim(),
                year: x.year?.toString().trim(),
                program: x.program?.trim().toUpperCase(),
                semester: x.semester?.trim().toUpperCase(),
                specialization: x.specialization?.trim().toUpperCase(),
                batch: x.batch?.trim(),
                subcode: x.subcode?.trim().toUpperCase(),
                subject: x.subject?.trim().toUpperCase(),
                examdate: x.examdate?.trim(),
                session: x.session?.trim().toUpperCase()
            });
            next();
        }, async function (err) {
            if (err) {

            } else {
                return res.json({ success: true, data });
            }
        });
    } else {
        return res.json({ success: true, data: "Not found" });
    }
});

// API route for uploading
app.post('/uploadpics/:id', upload.single('image'), async (req, res) => {
    try {
        await User.findOneAndUpdate({ _id: req.params.id }, { $set: { image: req.body.imageUrl } })
        res.json({ message: 'Image uploaded successfully!', filePath: req.body.imageUrl });
    } catch (error) {
        logger.error("error in catch " + error);
        console.error(error);
        res.status(200).send(error + ' Image not found');
    }
});


app.post("/send/mail", async (req, res) => {
    try {
        const { to, subject, text, attachments } = req.body;
        let mailOptions;
        if (!to || !subject || !text) {
            return res.status(400).send('Missing required fields');
        }
        if (attachments && attachments.length) {
            const html = `<p>${text}</p>
            <ul>
            ${attachments.map(att => `<li><a href="${att.url}">${att.filename}</a></li>`).join('')}
            </ul>
        `;
            mailOptions = {
                to,
                subject,
                text,
                html
            };
        } else {
            mailOptions = {
                to,
                subject,
                text
            };
        }
        await mail.sendMail(mailOptions);
        res.status(200).send({ data: "Mail Send Sucessfully" });
    } catch (err) {
        console.log(err);
        res.status(500).send("Some Error in mail sending " + err);
    }
})

const upload2 = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 40 * 1024 * 1024 } // 40 MB
});

app.use(express.json({ limit: '40mb' }));
app.use(express.urlencoded({ limit: '40mb', extended: true }));

app.post('/upload/bulk/images', upload2.array('images'), async (req, res) => {
    const files = req.files;

    if (!files || files.length === 0) {
        return res.status(400).send('No files uploaded.');
    }
    let count = 0;
    for (const file of files) {
        const user = await User.findOne({ regno: path.parse(file.originalname).name });
        if (user) {
            const savePath = path.join(__dirname, 'students', file.originalname);
            fs.writeFileSync(savePath, file.buffer);
            user.image = `/students/${file.originalname}`;
            count++;
            await user.save();
        }
    }
    res.send({ message: 'Images uploaded successfully.', count });
});

app.post('/upload/image/path', async (req, res) => {
    try {
        const { fileName, imageUrl } = req.body;
        const user = await User.findOne({ regno: fileName });
        if (user) {
            user.image = imageUrl;
            await user.save();
            res.status(200).send({ message: 'Images uploaded successfully.' });
        } else {
            res.status(200).send({ message: 'Error in uploading' });
        }
    } catch (err) {
        console.log(err);
        res.status(500).send("Error in uploading " + err);
    }
});

app.post('/api/test-mail', async (req, res) => {
    const { to, subject, text } = req.body;

    if (!to || !subject || !text) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: 'singhalmca04@gmail.com',
                pass: 'czef vqub zzld rwbd' // Not your real password!
            }
        });

        const info = await transporter.sendMail({
            from: `"SRM Hall Ticket" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text
        });

        res.status(200).json({ success: true, messageId: info.messageId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(4000, () => {
    console.log("server started and again");
})