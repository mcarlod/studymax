import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined');

// declare global variable
declare global {
    var mongooseCache: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    }
}

// create a global variable to cache the connection
let cached = global.mongooseCache || (global.mongooseCache = { conn: null, promise: null });

export const connectToDatabase = async () => {
    // if a connection already exists, return it
    if (cached.conn) return cached.conn;

    // if a connection is not established, create a new one and save it for later
    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
    }

    // try to connect to MongoDB
    try {
        cached.conn = await cached.promise;
    } catch (e) {
        // if a connection fails, delete the promise and try again later
        cached.promise = null;
        console.error('MongoDB connection error. Please make sure MongoDB is running.')
        throw e;
    }

    console.info('Connected to MongoDB');
    return cached.conn;
}