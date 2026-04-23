import mongoose from "mongoose";

const DropdownBrachureModalSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
        required: true,
    },
    mobile: {
        type: String,
    },
    project: {
        type: String,
    },
});
export const projectDropdownBrachureModal = mongoose.model("projectDropdownBrachureModal", DropdownBrachureModalSchema);

export  default projectDropdownBrachureModal;