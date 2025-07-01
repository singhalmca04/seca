const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const timestamps = require('mongoose-timestamps');

const StudentSchema = new Schema({
    ie: {type: String, default: 'I'},
    month: {type: String, default: ''},
    year: {type: String, default: ''},
    program: {type: String, default: ''},
    specialization: {type: String, default: ''},
    semester: {type: String, default: ''},
    subcode: {type: String, default: ''},
    subject: {type: String, default: ''},
    examdate: {type: String, default: ''},
    session: {type: String, default: ''},
    batch: {type: String, default: ''}
});

StudentSchema.pre("save", (next)=>{
    this.updated_at = Date.now();
    next();
});

StudentSchema.plugin(timestamps, {index: true});

module.exports = mongoose.model('Student', StudentSchema);