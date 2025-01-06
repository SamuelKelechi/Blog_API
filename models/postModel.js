const {Schema, model} = require('mongoose')

const postSchema = new Schema({
    title: {type: String, required: true},
    category: {type: String, enum: ["Education", "Politics", "Business", "Agriculture", "Entertainment", "Art", "Investment",  "Weather", "Uncategorized"], message: "No Category Selected"},
    description: {type: String, required: true},
    creator: {type: Schema.Types.ObjectId, ref: "User"},
    story: {type: String, required: true},
    avatar: {type: String, required: true},

}, {timestamps: true})


module.exports = model("Post", postSchema)