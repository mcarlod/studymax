import { Schema, model, models, Document } from "mongoose";

export interface IMonthlySessionCounter extends Document {
    clerkId: string;
    billingPeriodStart: Date;
    count: number;
    updatedAt: Date;
    createdAt: Date;
}

const MonthlySessionCounterSchema = new Schema<IMonthlySessionCounter>({
    clerkId: { type: String, required: true, index: true },
    billingPeriodStart: { type: Date, required: true, index: true },
    count: { type: Number, required: true, default: 0 },
}, { timestamps: true });

// Ensure uniqueness per user and billing period
MonthlySessionCounterSchema.index({ clerkId: 1, billingPeriodStart: 1 }, { unique: true });

const MonthlySessionCounter = models.MonthlySessionCounter || model<IMonthlySessionCounter>('MonthlySessionCounter', MonthlySessionCounterSchema);

export default MonthlySessionCounter;
