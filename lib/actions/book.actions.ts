'use server';

import {CreateBook, TextSegment} from "@/types";
import {connectToDatabase} from "@/database/mongoose";
import {generateSlug, serializeData} from "@/lib/utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import {auth} from "@clerk/nextjs/server";

export const getAllBooks = async () => {
    try {
        await connectToDatabase();

        const books = await Book.find().sort({ createdAt: -1 }).lean();

        return {
            success: true,
            data: serializeData(books)
        }
    } catch (e) {
        console.error('Error connecting to database', e);
        return {
            success: false,
            error: e,
        }
    }
}

export const checkBookExists = async (title: string) => {
    try {
        await connectToDatabase();

        const slug = generateSlug(title);

        const existingBook = await Book.findOne({ slug }).lean();

        if (existingBook) {
            return {
                exists: true,
                book: serializeData(existingBook),
            }
        }

        return {
            exists: false,
        }
    } catch (e) {
        console.error('Error checking book exists', e);
        return {
            exists: false,
            error: e,
        }
    }
};

export const createBook = async (data: CreateBook) => {
    try {
        const { userId } = await auth();

        if (!userId) {
            return {
                success: false,
                error: 'Unauthorized',
            }
        }

        await connectToDatabase();

        const slug = generateSlug(data.title)

        const existingBook = await Book.findOne({ slug }).lean();

        if (existingBook) {
            return {
                success: true,
                data: serializeData(existingBook),
                alreadyExists: true,
            }
        }

        // Todo: Check subscription limits before creating a book

        const book = await Book.create({ ...data, clerkId: userId, slug, totalSegments: 0 });
        return {
            success: true,
            data: serializeData(book),
        }
    } catch (e) {
        console.error('Error creating a book', e);

        return {
            success: false,
            error: e,
        }
    }
}

export const saveBookSegments = async (bookId: string, segments: TextSegment[]) => {
    try {
        const { userId } = await auth();

        if (!userId) {
            return {
                success: false,
                error: 'Unauthorized',
            }
        }

        await connectToDatabase();

        const book = await Book.findById(bookId).lean();

        if (!book) {
            return {
                success: false,
                error: 'Book not found',
            }
        }

        if (book.clerkId !== userId) {
            return {
                success: false,
                error: 'Forbidden',
            }
        }

        console.log('Saving book segments for bookId:', bookId);

        // Map segments to insert into the database using the values extracted under TextSegment
        const segmentsToInsert = segments.map(({text, segmentIndex, pageNumber, wordCount}) => ({
            clerkId: userId, bookId, content: text, segmentIndex, pageNumber, wordCount
        }))

        // Bulk insert the segments into the database
        await BookSegment.insertMany(segmentsToInsert);

        // Update the book with the total segment count
        await Book.findByIdAndUpdate(bookId, {totalSegments: segments.length});

        console.log('Book segments saved successfully');

        return {
            success: true,
            data: {segmentsCreated: segments.length},
        }
    } catch (e) {
        console.error('Error saving book segments', e);

        await BookSegment.deleteMany({ bookId });

        console.log('Segments cleaned up due to failure');

        return {
            success: false,
            error: e,
        }
    }
}