const express = require('express');
const app = express();
require('./db');
const User = require('./users');
const Student = require('./students');
const bodyParser = require('body-parser');
const cors = require("cors");
app.use(cors()); // Allows all origins (not recommended for production)

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(bodyParser.json());

app.get('/', (req, res)=>{
    res.status(200).send({title: "Hello world"});
});

app.post("/save", async (req,res)=>{
    try{
        let user = new User();
        const {regno, name, marks} =  req.body;
        user.regno = regno;
        user.name = name;
        user.marks = marks;
        await user.save();
        let userData = await User.find().limit(10);
        res.status(200).send({data: userData});
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
        let user = await User.find();
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

app.post("/update/user", async (req,res)=>{
    try{
        const {name, marks} = req.body;
        let user = await User.updateOne({name: name}, {$set: {marks: marks}});
        res.status(200).send({data: user});
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