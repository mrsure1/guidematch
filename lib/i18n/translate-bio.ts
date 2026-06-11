import { resolveChatModel } from "@/lib/gemini-model";

export async function translateBioToEnglish(koreanBio: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || !koreanBio) {
    return koreanBio; // Fallback to original
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${resolveChatModel()}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Translate the following Korean guide introduction into natural, professional English suitable for a travel guide profile. Do not include any explanations, JSON formatting, or markdown fences. Just return the translated text.\n\nText:\n${koreanBio}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
          }
        }),
      }
    );

    if (!res.ok) {
      return koreanBio;
    }

    const data = await res.json();
    const translatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (translatedText) {
      return translatedText;
    }

    return koreanBio;
  } catch (error) {
    console.error("[translateBioToEnglish] Translation failed:", error);
    return koreanBio;
  }
}
