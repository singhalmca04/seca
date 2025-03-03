const express = require('express');
const app = express();
require('./db');
const User = require('./users');
const Student = require('./students');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(bodyParser.json());

app.get('/show', (req, res)=>{
    res.status(200).send("Hello world");
});

app.put("/save", async (req,res)=>{
    try{
        let user = new User();
        const {regno, name, marks} =  req.body;
        user.regno = regno;
        user.name = name;
        user.marks = marks;
        user = await user.save();
        res.status(200).send({data: user});
    } catch(err) {
        console.log(err);
        res.status(500).send("Some Error");
    }
});

app.put("/save/student", async (req,res)=>{
    try{
        let student = new Student();
        const {name, aadhar, address} =  req.body;
        console.log(name);
        let u = await User.findOne({name}, {_id: 1});
        console.log(u)
        student.user = u._id;
        student.aadhar = aadhar;
        student.name = name;
        student.address = address;
        student = await student.save();
        res.status(200).send({data: student});
    } catch(err) {
        console.log(err);
        res.status(500).send("Some Error");
    }
});

app.get("/finduser", async (req,res)=>{
    try{
        let user = await user.find();
        let sum = 0;
        user.map((u)=>{
            sum += u.marks;
        })
        let average = sum/user.length;
        res.status(200).send({data: user, avg: average});
    } catch(err) {
        console.log(err);
        res.status(500).send("Some Error");
    }
})

app.get("/findstudent", async (req,res)=>{
    try{
        let data = await Student.find().populate('user', {regno: 1, marks: 1});
        let finaldata = {};
        data.map((stu, index)=>{
            finaldata[index] = {regno: stu.user.regno, name: stu.name, aadhar: stu.aadhar, 
                address: stu.address, marks: stu.user.marks};
        })
        res.status(200).send({data: finaldata});
    } catch(err) {
        console.log(err + "error");
        res.status(500).send("Some Error");
    }
})

app.listen(4000, ()=>{
    console.log("server started and again");
})