import { GoogleGenAI } from "@google/genai";

export default function handler(req: any, res: any) {
  try {
    const hasApiKey = !!process.env.GEMINI_API_KEY;
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      hasApiKey,
      envNode: process.version,
      sdkImported: !!GoogleGenAI
    });
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      message: err.message || "Unknown error"
    });
  }
}
