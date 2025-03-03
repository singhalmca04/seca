const mongoose = require('mongoose');

mongoose.connect('mongodb://0.0.0.0:27017/seca', {})
.then((res)=> console.log("connected to db"))
.catch((err)=> console.log("Error occoured " + err));