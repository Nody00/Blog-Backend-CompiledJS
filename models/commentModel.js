import mongoose from "mongoose";
const Schema = mongoose.Schema;
const commentSchema = new Schema({
    author: {
        type: String,
        required: true,
    },
    post: {
        type: Schema.Types.ObjectId,
        ref: "Post",
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    likes: {
        type: Number,
        required: true,
    },
    dislikes: {
        type: Number,
        required: true,
    },
});
export default mongoose.model("Comment", commentSchema);
//# sourceMappingURL=commentModel.js.map