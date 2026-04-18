'use server';

import {EndSessionResult, StartSessionResult} from "@/types";
import {connectToDatabase} from "@/database/mongoose";
import VoiceSession from "@/database/models/voice-session.model";
import MonthlySessionCounter from "@/database/models/monthly-session-counter.model";
import {getCurrentBillingPeriodStart, getUserPlan} from "@/lib/subscription.server";
import {PLAN_LIMITS} from "@/lib/subscription-constants";
import {auth} from "@clerk/nextjs/server";

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
        const counter = await MonthlySessionCounter.findOneAndUpdate(
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

        if (!counter) {
            return { 
                success: false, 
                error: `You have reached the maximum number of sessions allowed for your ${plan} plan (${limits.maxSessionsPerMonth}). Please upgrade for more.`,
                isBillingError: true 
            };
        }

        let session;
        try {
            session = await VoiceSession.create({
                clerkId: userId,
                bookId,
                startedAt: new Date(),
                billingPeriodStart,
                durationSeconds: 0,
            });
        } catch (createErr) {
            // Rollback counter increment on session creation failure
            await MonthlySessionCounter.updateOne(
                { clerkId: userId, billingPeriodStart },
                { $inc: { count: -1 } }
            );
            throw createErr;
        }

        return {
            success: true,
            sessionId: session._id.toString(),
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