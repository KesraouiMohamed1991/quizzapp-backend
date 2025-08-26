// models/User.js
const { Schema, model, models } = require("mongoose")

const UserSchema = new Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 120 },
        email: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 254 },
    },
    { timestamps: true }
)

// Helpful indexes
UserSchema.index({ email: 1 }, { unique: true })

module.exports = models.User || model("User", UserSchema)
