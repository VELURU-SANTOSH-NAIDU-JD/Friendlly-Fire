import mongoose, { Schema, Document } from "mongoose";

export interface IRoom extends Document {
  code: string;
  mode: "local" | "party" | "online";
  hostPlayerId?: string;
  status: "lobby" | "in_progress" | "ended";
  settings: {
    allowAnonymous: boolean;
    requireHostApproval: boolean;
    turnTimerSeconds: number;
    dareProofRequired: boolean;
  };
  createdAt: Date;
}

const RoomSchema = new Schema<IRoom>({
  code: { type: String, required: true, unique: true },
  mode: { type: String, enum: ["local", "party", "online"], required: true },
  hostPlayerId: { type: String },
  status: { type: String, enum: ["lobby", "in_progress", "ended"], default: "lobby" },
  settings: {
    allowAnonymous: { type: Boolean, default: true },
    requireHostApproval: { type: Boolean, default: true },
    turnTimerSeconds: { type: Number, default: 60 },
    dareProofRequired: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now, expires: 21600 } // 6 hours TTL
});

export const Room = mongoose.models.Room || mongoose.model<IRoom>("Room", RoomSchema);
