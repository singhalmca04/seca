const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const timestamps = require('mongoose-timestamps');

const StudentSchema = new Schema({
    name: {type: String, default: ''},
    aadhar: {type: String, default: ''},
    address: {type: String, default: ''},
    user: {type: mongoose.Schema.ObjectId, ref: 'User', required: true}
});

StudentSchema.pre("save", (next)=>{
    this.updated_at = Date.now();
    next();
});

StudentSchema.plugin(timestamps, {index: true});

module.exports = mongoose.model('Student', StudentSchema);