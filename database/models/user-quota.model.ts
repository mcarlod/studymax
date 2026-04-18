import { Schema, model, models, Document } from "mongoose";

export interface IUserQuota extends Document {
    clerkId: string;
    count: number;
    updatedAt: Date;
    createdAt: Date;
}

const UserQuotaSchema = new Schema<IUserQuota>({
    clerkId: { type: String, required: true, unique: true, index: true },
    count: { type: Number, required: true, default: 0 },
}, { timestamps: true });

const UserQuota = models.UserQuota || model<IUserQuota>('UserQuota', UserQuotaSchema);

export default UserQuota;
