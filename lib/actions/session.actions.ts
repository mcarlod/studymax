'use server';

import {EndSessionResult, StartSessionResult, IVoiceSession} from "@/types";
import {connectToDatabase} from "@/database/mongoose";
import VoiceSession from "@/database/models/voice-session.model";
import MonthlySessionCounter from "@/database/models/monthly-session-counter.model";
import {getCurrentBillingPeriodStart, getUserPlan} from "@/lib/subscription.server";
import {PLAN_LIMITS} from "@/lib/subscription-constants";
import {auth} from "@clerk/nextjs/server";
import mongoose from "mongoose";

export const startVoiceSession = async (bookId: string): Promise<StartSessionResult> => {
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

        const mongoSession = await mongoose.startSession();
        let voiceSession: IVoiceSession | undefined;
        try {
            await mongoSession.withTransaction(async () => {
                // Step 1: Ensure the document exists without incrementing
                await MonthlySessionCounter.findOneAndUpdate(
                    { clerkId: userId, billingPeriodStart },
                    { $setOnInsert: { clerkId: userId, billingPeriodStart } },
                    { upsert: true, session: mongoSession, runValidators: true }
                );

                // Step 2: Conditional increment with limit check
                const counter = await MonthlySessionCounter.findOneAndUpdate(
                    {
                        clerkId: userId,
                        billingPeriodStart,
                        count: { $lt: limits.maxSessionsPerMonth }
                    },
                    { $inc: { count: 1 } },
                    { new: true, session: mongoSession, runValidators: true }
                ).lean();

                if (!counter) {
                    throw new Error('LIMIT_EXCEEDED');
                }

                const [newVoiceSession] = await VoiceSession.create([{
                    clerkId: userId,
                    bookId,
                    startedAt: new Date(),
                    billingPeriodStart,
                    durationSeconds: 0,
                }], { session: mongoSession });
                voiceSession = newVoiceSession;
            });
        } catch (err: any) {
            if (err.message === 'LIMIT_EXCEEDED') {
                return { 
                    success: false, 
                    error: `You have reached the maximum number of sessions allowed for your ${plan} plan (${limits.maxSessionsPerMonth}). Please upgrade for more.`,
                    isBillingError: true 
                };
            }
            throw err;
        } finally {
            await mongoSession.endSession();
        }

        if (!voiceSession) {
            throw new Error('Failed to create voice session');
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
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: 'Unauthorized' };
        }

        const plan = await getUserPlan();
        const limits = PLAN_LIMITS[plan];
        const maxDurationSeconds = limits.maxDurationPerSession * 60;

        // Validate durationSeconds
        if (durationSeconds < 0 || durationSeconds > maxDurationSeconds) {
             return { 
                success: false, 
                error: `Invalid session duration. Maximum allowed for your ${plan} plan is ${limits.maxDurationPerSession} minutes.` 
             };
        }

        await connectToDatabase();

        const result = await VoiceSession.findOneAndUpdate(
            { _id: sessionId, clerkId: userId },
            {
                endedAt: new Date(),
                durationSeconds,
            },
            { new: true }
        );

        if (!result) return { success: false, error: 'Voice session was not found or you are not the owner.' };

        return { success: true };
    } catch (e) {
        console.error('Error ending voice session:', e);
        return { success: false, error: 'Failed to end voice session. Please try again.' };
    }
}