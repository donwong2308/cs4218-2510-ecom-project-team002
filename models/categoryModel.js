import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
  },
  slug: {
    type: String,
    lowercase: true,
    unique: true,
  },
});

export default mongoose.model("Category", categorySchema);