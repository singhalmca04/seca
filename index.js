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

app.get('/deleteall/students', async (req, res) => {
    try {
        const u = await Student.deleteMany({});
        res.status(200).send({ data: u });
    } catch (err) {
        res.status(500).send({ error: err });
    }
});

app.post("/save", async (req, res) => {
    try {
        let user = new User();
        const { regno, name, marks } = req.body;
        user.regno = regno;
        user.name = name;
        user.marks = marks;
        await user.save();
        let userData = await User.find().limit(100);
        res.status(200).send({ data: userData });
    } catch (err) {
        console.log(err);
        res.status(500).send("Some Error");
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

app.put("/update/:id", async (req, res) => {
    try {
        const { name, regno, semester, section, batch, subcode } = req.body;
        let result = await User.findOneAndUpdate({ _id: req.params.id }, { $set: { name, regno, semester, section, batch, subcode: subcode[0].split(',').map(code => code.trim()) } });
        res.status(200).send({ data: result });
    } catch (err) {
        console.log(err);
        res.status(500).send("Some Error");
    }
});

app.put("/save/student", async (req, res) => {
    try {
        let student = new Student();
        const { name, aadhar, address } = req.body;
        let u = await User.findOne({ name }, { _id: 1 });
        student.user = u._id;
        student.aadhar = aadhar;
        student.name = name;
        student.address = address;
        student = await student.save();
        res.status(200).send({ data: student });
    } catch (err) {
        console.log(err);
        res.status(500).send("Some Error");
    }
});

app.get("/finduser", async (req, res) => {
    try {
        let user = await User.find();
        // let sum = 0;
        // user.map((u) => {
        //     sum += u.marks;
        // })
        // let average = sum / user.length;
        res.status(200).send({ data: user });
    } catch (err) {
        console.log(err);
        res.status(500).send("Some Error");
    }
})

app.post("/update/user", async (req, res) => {
    try {
        const { name, marks } = req.body;
        let user = await User.updateOne({ name: name }, { $set: { marks: marks } });
        res.status(200).send({ data: user });
    } catch (err) {
        console.log(err);
        res.status(500).send("Some Error");
    }
})

app.get("/findstudents", async (req, res) => {
    try {
        let data = await Student.find();
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

app.get('/downloaduser/:group', async (req, res) => {
    const srmlogo = getBase64Image('/uploads/srm-logo.png');
    const srm = getBase64Image('/uploads/srm.png');
    const def = getBase64Image('/uploads/srm.png');
    const group = req.params.group;
    let count = await User.countDocuments();
    let users = [];
    if (group == 1) {
        users = await User.find().limit(Math.ceil(count/2));
        // users = await User.find().limit(3);
        console.log(users.length, '1111');
    } else {
        users = await User.find().skip(Math.ceil(count/2));
        console.log(users.length, '2222');
    }
    if (users && users.length) {
        let ieDetails = await Student.find({ semester: users[0].semester, batch: users[0].batch }).sort({ examdate: 1 })
        const userWithSubject = await Promise.all(users.map(async (user) => {
            const img = user.image ? await getBase64FromUrl(user.image) : def;

            // Filter only the subjects this student has
            const personalSubjects = ieDetails.filter(sub =>
                user.subcode.includes(sub.subcode)
            );

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
                ieData: ieDetails[0],  // Optional: general info
                ieDetails: personalSubjects, // 👈 only student's subjects
            };
        }));

        // Read HTML template
        // const html = fs.readFileSync(path.join(__dirname, '/templates/user.html'), 'utf8');
        // const options = {
        //     format: 'A4',
        //     orientation: 'portrait',
        //     border: '10mm',
        // };
        let userData = {
            user: JSON.parse(JSON.stringify(userWithSubject))
        }
        // const document = {
        //     html: html,
        //     data: {
        //         uData: userData,
        //         srmlogo: getBase64Image('/uploads/srm-logo.png'),
        //         srm: getBase64Image('/uploads/srm.png'),
        //         image: getBase64Image('/uploads/test1.jpg')
        //     },
        //     path: './output.pdf',
        //     type: '', // can be 'buffer' or 'stream'
        // };
        // res.status(200).send('No users found');
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
        res.status(200).send('No users found');
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
            subcode.push(x.subcode1);
            subcode.push(x.subcode2);
            subcode.push(x.subcode3);
            subcode.push(x.subcode4);
            subcode.push(x.subcode5);
            if (x.subcode6) {
                subcode.push(x.subcode6);
            }
            await User.insertOne({ name: x.Name, regno: x["Reg No"], semester: x.semester, section: x.section, batch: x.batch, subcode });
            next();
        }, async function (err) {
            if (err) {

            } else {

            }
        });
    }
    return res.json({ success: true, data });
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
            await Student.insertOne({ ie: x.ie, month: x["month"], year: x.year, program: x.program, semester: x.semester, section: x.section, batch: x.batch, subcode: x.subcode, subject: x.subject, examdate: x.examdate, session: x.session });
            next();
        }, async function (err) {
            if (err) {

            } else {

            }
        });
    }
    return res.json({ success: true, data });
});

// API route for uploading
app.post('/uploadpics/:id', upload.single('image'), async (req, res) => {
    try {
        await User.findOneAndUpdate({ _id: req.params.id }, { $set: { image: `/uploads/${req.file.filename}` } })
        res.json({ message: 'Image uploaded successfully!', filePath: `/uploads/${req.file.filename}` });
    } catch (error) {
        logger.error("error in catch " + error);
        console.error(error);
        res.status(200).send(error + ' Image not found');
    }
});

app.post("/send/mail", async (req, res) => {
    try {
        const result = mail.sendMail(req.body);
        res.status(200).send({ data: "Mail Send Sucessfully" });
    } catch (err) {
        console.log(err);
        res.status(500).send("Some Error in mail sending " + err);
    }
})

// const storage2 = multer.memoryStorage();
// const upload2 = multer({ storage2 });
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
            res.send({ message: 'Images uploaded successfully.' });
        } else {
            res.send({ message: 'Error in uploading' });
        }
    } catch (err) {
        console.log(err);
        res.status(500).send("Error in uploading " + err);
    }
});

app.listen(4000, () => {
    console.log("server started and again");
})