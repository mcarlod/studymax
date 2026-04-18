'use server';

import {EndSessionResult, StartSessionResult} from "@/types";
import {connectToDatabase} from "@/database/mongoose";
import VoiceSession from "@/database/models/voice-session.model";
import MonthlySessionCounter from "@/database/models/monthly-session-counter.model";
import {getCurrentBillingPeriodStart, getUserPlan} from "@/lib/subscription.server";
import {PLAN_LIMITS} from "@/lib/subscription-constants";
import {auth} from "@clerk/nextjs/server";
import mongoose from "mongoose";

export const startVoiceSession = async (providedClerkId: string, bookId: string): Promise<StartSessionResult> => {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: 'Unauthorized' };
        }

        await connectToDatabase();

        const billingPeriodStart = getCurrentBillingPeriodStart();
        
        // Check session limits
        const plan = await getUserPlan();
        const limits = PLAN_LIMITS[plan];

        // Atomic session reservation
        let counter;
        try {
            counter = await MonthlySessionCounter.findOneAndUpdate(
                {
                    clerkId: userId,
                    billingPeriodStart,
                    $or: [
                        { count: { $lt: limits.maxSessionsPerMonth } },
                        { count: { $exists: false } }
                    ]
                },
                {
                    $inc: { count: 1 },
                    $setOnInsert: { clerkId: userId, billingPeriodStart }
                },
                {
                    upsert: true,
                    new: true,
                    runValidators: true
                }
            ).lean();
        } catch (err: any) {
            // Handle E11000 duplicate key error on upsert race
            if (err.code === 11000) {
                counter = await MonthlySessionCounter.findOneAndUpdate(
                    {
                        clerkId: userId,
                        billingPeriodStart,
                        count: { $lt: limits.maxSessionsPerMonth }
                    },
                    { $inc: { count: 1 } },
                    { new: true, runValidators: true }
                ).lean();
            } else {
                throw err;
            }
        }

        if (!counter) {
            return { 
                success: false, 
                error: `You have reached the maximum number of sessions allowed for your ${plan} plan (${limits.maxSessionsPerMonth}). Please upgrade for more.`,
                isBillingError: true 
            };
        }

        const mongoSession = await mongoose.startSession();
        let voiceSession;
        try {
            mongoSession.startTransaction();
            [voiceSession] = await VoiceSession.create([{
                clerkId: userId,
                bookId,
                startedAt: new Date(),
                billingPeriodStart,
                durationSeconds: 0,
            }], { session: mongoSession });
            await mongoSession.commitTransaction();
        } catch (createErr) {
            await mongoSession.abortTransaction();
            // Rollback counter increment on session creation failure
            await MonthlySessionCounter.updateOne(
                { clerkId: userId, billingPeriodStart },
                { $inc: { count: -1 } }
            );
            throw createErr;
        } finally {
            await mongoSession.endSession();
        }

        return {
            success: true,
            sessionId: voiceSession._id.toString(),
            maxDurationMinutes: limits.maxDurationPerSession,
        }

    } catch (e) {
        console.error('Error starting voice session:', e);
        return { success: false, error: 'Failed to start voice session. Please try again.' };
    }
}

export const endVoiceSession = async (sessionId: string, durationSeconds: number): Promise<EndSessionResult> => {
    try {
        await connectToDatabase();

        const result = await VoiceSession.findByIdAndUpdate(sessionId, {
            endedAt: new Date(),
            durationSeconds,
        });

        if (!result) return { success: false, error: 'Voice session was not found.' };

        return { success: true };
    } catch (e) {
        console.error('Error starting voice session:', e);
        return { success: false, error: 'Failed to end voice session. Please try again.' };
    }
}