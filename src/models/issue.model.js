import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      default: null,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    message: {
      type: String,
      required: [true, "Issue message is required"],
      trim: true,
      minlength: [5, "Message must be at least 5 characters"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Issue", issueSchema);
