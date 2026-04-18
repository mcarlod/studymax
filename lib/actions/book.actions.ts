'use server';

import {CreateBook, TextSegment} from "@/types";
import {connectToDatabase} from "@/database/mongoose";
import {escapeRegex, generateSlug, serializeData} from "@/lib/utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import UserQuota from "@/database/models/user-quota.model";
import {getPlanLimits, getUserPlan} from "@/lib/subscription.server";
import {PLAN_LIMITS} from "@/lib/subscription-constants";
import mongoose from "mongoose";
import {revalidatePath} from "next/cache";
import {auth} from "@clerk/nextjs/server";

export const getBookBySlug = async (slug: string) => {
    try {
        await connectToDatabase();

        const book = await Book.findOne({ slug }).lean();

        if (!book) {
            return {
                success: false,
                error: 'Book not found',
            }
        }

        return {
            success: true,
            data: serializeData(book)
        }
    } catch (e) {
        console.error('Error fetching book by slug', e);
        return {
            success: false,
            error: e,
        }
    }
}

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

export const checkUserQuota = async () => {
    try {
        const { userId } = await auth();
        if (!userId) return { allowed: false, error: 'Unauthorized' };

        await connectToDatabase();
        const plan = await getUserPlan();
        const limits = PLAN_LIMITS[plan];
        
        const quota = await UserQuota.findOne({ clerkId: userId }).lean();
        const bookCount = quota ? quota.count : 0;

        return {
            allowed: bookCount < limits.maxBooks,
            plan,
            limit: limits.maxBooks,
            current: bookCount
        };
    } catch (e) {
        console.error('Error checking user quota:', e);
        return { allowed: false, error: 'Failed to check quota' };
    }
};

export const createBook = async (data: CreateBook) => {
    try {
        const { userId, has } = await auth();

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

        // Check subscription limits before creating a book
        const plan = await getUserPlan();
        const limits = PLAN_LIMITS[plan];

        // Use a transaction for atomic check and create
        const session = await mongoose.startSession();
        let book;
        try {
            session.startTransaction();

            const quota = await UserQuota.findOneAndUpdate(
                {
                    clerkId: userId,
                    $or: [
                        { count: { $lt: limits.maxBooks } },
                        { count: { $exists: false } }
                    ]
                },
                {
                    $inc: { count: 1 },
                    $setOnInsert: { clerkId: userId }
                },
                {
                    session,
                    upsert: true,
                    new: true,
                    runValidators: true
                }
            );

            if (!quota) {
                await session.abortTransaction();
                return {
                    success: false,
                    error: `You have reached the maximum number of books allowed for your ${plan} plan (${limits.maxBooks}). Please upgrade to add more books.`,
                    isBillingError: true,
                };
            }

            [book] = await Book.create([{ ...data, clerkId: userId, slug, totalSegments: 0 }], { session });
            await session.commitTransaction();
        } catch (err: any) {
            await session.abortTransaction();
            // Handle upsert race for UserQuota
            if (err.code === 11000) {
                 // The upsert race happened, retry atomic increment
                 try {
                     const quota = await UserQuota.findOneAndUpdate(
                         { 
                             clerkId: userId, 
                             count: { $lt: limits.maxBooks } 
                         },
                         { $inc: { count: 1 } },
                         { new: true, runValidators: true }
                     );
                     
                     if (quota) {
                         // Proceed to create book if quota was incremented successfully
                         // (Note: we already aborted the previous transaction, 
                         // so we should start a new one or create without transaction if we are sure about cleanup)
                         // For simplicity, we just create the book here.
                         const newBookResult = await Book.create([{ ...data, clerkId: userId, slug, totalSegments: 0 }]);
                         const newBook = newBookResult[0];
                         revalidatePath('/');
                         return {
                             success: true,
                             data: serializeData(newBook),
                         }
                     } else {
                        return {
                            success: false,
                            error: `You have reached the maximum number of books allowed for your ${plan} plan (${limits.maxBooks}). Please upgrade to add more books.`,
                            isBillingError: true,
                        };
                     }
                 } catch (retryErr) {
                     throw retryErr;
                 }
            }
            throw err;
        } finally {
            await session.endSession();
        }

        revalidatePath('/');

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

// Searches book segments using MongoDB text search with regex fallback
export const searchBookSegments = async (bookId: string, query: string, limit: number = 5, skipAuth: boolean = false) => {
    try {
        if (!skipAuth) {
            const { userId } = await auth();
            if (!userId) {
                return { success: false, error: 'Unauthorized', data: [] };
            }
            await connectToDatabase();

            const book = await Book.findById(bookId).select('clerkId').lean();
            if (!book) {
                return { success: false, error: 'Book not found', data: [] };
            }
            if (book.clerkId !== userId) {
                return { success: false, error: 'Forbidden', data: [] };
            }
        } else {
            await connectToDatabase();
        }

        console.log(`Searching for book segments`, {
            bookId,
            queryLength: query.length,
        });

        const bookObjectId = new mongoose.Types.ObjectId(bookId);

        // Try MongoDB text search first (requires text index)
        let segments: Record<string, unknown>[] = [];
        try {
            segments = await BookSegment.find({
                bookId: bookObjectId,
                $text: { $search: query },
            })
                .select('_id bookId content segmentIndex pageNumber wordCount')
                .sort({ score: { $meta: 'textScore' } })
                .limit(limit)
                .lean();
        } catch {
            // Text index may not exist — fall through to regex fallback
            segments = [];
        }

        // Fallback: regex search matching ANY keyword
        if (segments.length === 0) {
            const keywords = query.split(/\s+/).filter((k) => k.length > 2);
            if (keywords.length === 0) {
                return {
                    success: true,
                    data: []
                }
            }
            const pattern = keywords.map(escapeRegex).join('|');

            segments = await BookSegment.find({
                bookId: bookObjectId,
                content: { $regex: pattern, $options: 'i' },
            })
                .select('_id bookId content segmentIndex pageNumber wordCount')
                .sort({ segmentIndex: 1 })
                .limit(limit)
                .lean();
        }

        console.log(`Search complete. Found ${segments.length} results`);

        return {
            success: true,
            data: serializeData(segments),
        };
    } catch (error) {
        console.error('Error searching segments:', error);
        return {
            success: false,
            error: (error as Error).message,
            data: [],
        };
    }
};