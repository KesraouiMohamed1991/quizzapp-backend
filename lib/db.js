// lib/db.js
const mongoose = require("mongoose")

let isConnected = false

async function connectDB(uri) {
    if (isConnected) return
    mongoose.set("strictQuery", true)
    await mongoose.connect(uri, { autoIndex: true })
    isConnected = true
    console.log("✅ MongoDB connected")
}

module.exports = { connectDB }
