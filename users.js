const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const timestamps = require('mongoose-timestamps');

const UserSchema = new Schema({
    regno: {type: String, default: ''},
    name: {type: String, default: ''},
    semester: {type: String, default: ''},
    section: {type: String, default: ''},
    batch: {type: String, default: ''},
    image: {type: String, default: ''},
    subcode: {type: Array, default: []}
});

UserSchema.pre("save", (next)=>{
    this.updated_at = Date.now();
    next();
});

UserSchema.plugin(timestamps, {index: true});

module.exports = mongoose.model('User', UserSchema);