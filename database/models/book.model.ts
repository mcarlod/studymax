import { Document, Schema, model, models } from "mongoose";
import {IBook} from "@/types";

const BookSchema = new Schema<IBook>({
    clerkId: { type: String, required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    author: { type: String, required: true },
    persona: { type: String },
    fileURL: { type: String, required: true },
    fileBlobKey: { type: String, required: true },
    coverURL: { type: String },
    coverBlobKey: { type: String },
    fileSize: { type: Number, required: true },
    totalSegments: { type: Number, required: true, default: 0 },
    createdAt: Date,
    updatedAt: Date,
}, { timestamps: true });

// if there is already a model with the same name, use that one instead of creating a new one
// if not, create a new model
const Book = models.Book || model<IBook>('Book', BookSchema);

export default Book;