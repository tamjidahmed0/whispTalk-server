import mongoose from "mongoose";



const messageReqAccepted = new mongoose.Schema({

    RequestSenderId: {
        type: mongoose.Types.ObjectId,

    },
    RequestReceiverId: {
        type: mongoose.Types.ObjectId,

    },

    date: {
        type: Date,
        default: Date.now
    }
})

const collection = mongoose.model('messageReqAccept', messageReqAccepted)

export default collection