const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const timestamps = require('mongoose-timestamps');

const UserSchema = new Schema({
    regno: {type: String, default: ''},
    name: {type: String, default: ''},
    marks: {type: Number, default: 0}
});

UserSchema.pre("save", (next)=>{
    this.updated_at = Date.now();
    next();
});

UserSchema.plugin(timestamps, {index: true});

module.exports = mongoose.model('User', UserSchema);