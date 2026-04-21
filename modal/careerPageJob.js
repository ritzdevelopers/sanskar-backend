import mongoose from "mongoose";

const careerPageJobSchema = new mongoose.Schema(
  {
    profile: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

const careerPageJob = mongoose.model("careerPageJob", careerPageJobSchema);

export default careerPageJob;
