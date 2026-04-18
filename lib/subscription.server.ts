import {auth} from "@clerk/nextjs/server";
import {PLAN_LIMITS, PLANS, PlanType, getPlanFromClerk} from "@/lib/subscription-constants";

export const getCurrentBillingPeriodStart = (): Date => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
};

export const getUserPlan = async (): Promise<PlanType> => {
    const { has, userId } = await auth();

    if (!userId) return PLANS.FREE;

    return getPlanFromClerk(has);
}

export const getPlanLimits = async () => {
    const plan = await getUserPlan();
    return PLAN_LIMITS[plan];
}
