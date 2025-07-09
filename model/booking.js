//150
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    roomId: { type: String, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    mainUserEmail:{ type: String, required: true },
    hostMail: { type: String, required: true },
    amount:{type:Number,required:true},
    paymentDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);