export async function translateText(text: string, targetLang = "ja"): Promise<string> {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          target: targetLang,
          format: "text",
        }),
      }
    );
  
    const data = await res.json();
  
    if (data.error) {
      console.error("Translation API error:", data.error);
      return text; // Fallback to original text
    }
  
    return data.data.translations[0].translatedText;
  }
  