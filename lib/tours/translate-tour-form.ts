export type TourTranslationInput = Record<string, string | string[]>;

export type TourTranslationOutput = Record<string, string | string[]>;

export async function translateTourForm(fields: TourTranslationInput): Promise<TourTranslationOutput> {
  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });

    const text = await response.text();
    let data: any = {};
    try {
      if (text) data = JSON.parse(text);
    } catch (e) {
      console.warn("[translateTourForm] Failed to parse translation response as JSON:", text.substring(0, 100));
    }

    if (!response.ok) {
      console.warn("[translateTourForm] translation skipped:", data?.error || response.statusText || "unknown error");
      return {};
    }

    return (data.translations as TourTranslationOutput) || {};
  } catch (error) {
    console.warn("[translateTourForm] translation request failed, continuing without translation:", error);
    return {};
  }
}
