const express = require('express');
const app = express();
require('./db');
const User = require('./users');
const Student = require('./students');
const bodyParser = require('body-parser');
const cors = require("cors");
app.use(cors()); // Allows all origins (not recommended for production)

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-creator-node');
const ExcelJS = require('exceljs');
const multer = require('multer');

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.status(200).send({ title: "Hello world" });
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
        console.log(req.params.id);
        let result = await User.findByIdAndDelete(req.params.id);
        res.status(200).send({ data: result });
    } catch (err) {
        console.log(err);
        res.status(500).send("Some Error");
    }
});

app.put("/update/:id", async (req, res) => {
    try {
        const { name, marks, regno } = req.body;
        let result = await User.findOneAndUpdate({ _id: req.params.id }, { $set: { name, regno, marks } });
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
        console.log(name);
        let u = await User.findOne({ name }, { _id: 1 });
        console.log(u)
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
        let sum = 0;
        user.map((u) => {
            sum += u.marks;
        })
        let average = sum / user.length;
        res.status(200).send({ data: user, avg: average });
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

app.get("/findstudent", async (req, res) => {
    try {
        let data = await Student.find().populate('user', { regno: 1, marks: 1 });
        let finaldata = [];
        data.map((stu, index) => {
            finaldata[index] = {
                regno: stu.user.regno, name: stu.name, aadhar: stu.aadhar,
                address: stu.address, marks: stu.user.marks
            };
        })
        res.status(200).send({ data: finaldata });
    } catch (err) {
        console.log(err + "error");
        res.status(500).send("Some Error");
    }
})

app.get('/downloaduser', async (req, res) => {
    let users = await User.find();
    const usersWithSerial = users.map((s, i) => ({ name: s.name, marks: s.marks, regno: s.regno, sno: i + 1 }));
    // Read HTML template
    const html = fs.readFileSync(path.join(__dirname, '/templates/user.html'), 'utf8');

    const options = {
        format: 'A4',
        orientation: 'portrait',
        border: '10mm',
    };
    let userData = {
        user: JSON.parse(JSON.stringify(usersWithSerial))
    }
    const document = {
        html: html,
        data: {
            bugs: userData
        },
        path: './output.pdf',
        type: '', // can be 'buffer' or 'stream'
    };

    try {
        await pdf.create(document, options);
        res.download('output.pdf');
        //   return res.status(200).send({path: "http://localhost:4000/output.pdf"});
    } catch (error) {
        console.error(error);
        res.status(500).send('PDF generation failed');
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
    
        const data = users.map((user, index)=>{
            return  { sno: index + 1, name: user.name, marks: user.marks, regno: user.regno }
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

app.listen(4000, () => {
    console.log("server started and again");
})