import mongoose, { Schema, Document } from "mongoose";

export interface IBankEntry extends Document {
  roomId: string;
  type: "truth" | "dare";
  text: string;
  authorPlayerId?: string;
  isAnonymous: boolean;
  visibility: "everyone" | "targeted";
  targetPlayerIds: string[];
  approved: boolean;
  used: boolean;
}

const BankEntrySchema = new Schema<IBankEntry>({
  roomId: { type: String, required: true, index: true },
  type: { type: String, enum: ["truth", "dare"], required: true },
  text: { type: String, required: true },
  authorPlayerId: { type: String },
  isAnonymous: { type: Boolean, default: false },
  visibility: { type: String, enum: ["everyone", "targeted"], default: "everyone" },
  targetPlayerIds: [{ type: String }],
  approved: { type: Boolean, default: false },
  used: { type: Boolean, default: false }
});

export const BankEntry = mongoose.models.BankEntry || mongoose.model<IBankEntry>("BankEntry", BankEntrySchema);
