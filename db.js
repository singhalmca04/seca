const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://srmreact:srmreact@cluster0.z7gxty8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/seca', {})
.then((res)=> console.log("connected to db"))
.catch((err)=> console.log("Error occoured " + err));