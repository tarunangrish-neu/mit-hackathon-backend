import mongoose from "mongoose";

const Schema = mongoose.Schema;

const ArticleSchema = new Schema({
    articleId:{
        type: String,
        required: true,
        unique: true,
    },
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    createdTimestamp: {
        type: Date,
        required: true,
        default: Date.now,
    },
    upvotes: {
        type: Number,
        default: 0,
    },
    downvotes: {
        type: Number,
        default: 0,
    },
    category:{
        type: String,
        enum: ["Technology", "Sports", "Entertainment", "Politics", "Business", "Miscellaneous"],
        required: true
    },
});

const ArticlesModel = mongoose.model("Article", ArticleSchema);
export default ArticlesModel;