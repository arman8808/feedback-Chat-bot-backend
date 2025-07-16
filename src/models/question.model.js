import { Schema, model, Document } from "mongoose";



const questionSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 500,
    },
    order: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
    },
  },
  { timestamps: true }
);

questionSchema.index({ order: 1 });

export default model("Question", questionSchema);
