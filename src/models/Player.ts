import mongoose, { Schema, Document } from "mongoose";

export interface IPlayer extends Document {
  roomId: string; // Foreign key to Room.code
  name: string;
  avatar: string;
  color: string;
  isHost: boolean;
  connectionStatus: "connected" | "disconnected";
  joinedAt: Date;
}

const PlayerSchema = new Schema<IPlayer>({
  roomId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  avatar: { type: String, required: true },
  color: { type: String, required: true },
  isHost: { type: Boolean, default: false },
  connectionStatus: { type: String, enum: ["connected", "disconnected"], default: "connected" },
  joinedAt: { type: Date, default: Date.now }
});

export const Player = mongoose.models.Player || mongoose.model<IPlayer>("Player", PlayerSchema);
