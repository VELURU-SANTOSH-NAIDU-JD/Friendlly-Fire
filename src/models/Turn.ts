import mongoose, { Schema, Document } from "mongoose";

export interface ITurn extends Document {
  roomId: string;
  currentPlayerId: string;
  bankEntryId?: string; // Optional if we are in spinning phase and haven't chosen yet
  phase: "spinning" | "revealed" | "answering" | "proof_pending" | "complete";
  answerText?: string;
  answerAudioUrl?: string;
  proofPhotoUrl?: string;
  vetoUsed: boolean;
  startedAt: Date;
}

const TurnSchema = new Schema<ITurn>({
  roomId: { type: String, required: true, index: true },
  currentPlayerId: { type: String, required: true },
  bankEntryId: { type: String },
  phase: { type: String, enum: ["spinning", "revealed", "answering", "proof_pending", "complete"], default: "spinning" },
  answerText: { type: String },
  answerAudioUrl: { type: String },
  proofPhotoUrl: { type: String },
  vetoUsed: { type: Boolean, default: false },
  startedAt: { type: Date, default: Date.now }
});

export const Turn = mongoose.models.Turn || mongoose.model<ITurn>("Turn", TurnSchema);
