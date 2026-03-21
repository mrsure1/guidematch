import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set.");
  process.exit(1);
}

async function testTranslation(version, model) {
  console.log(`Testing ${version} with ${model}...`);
  const fields = { title: "서울 야경 투어" };

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=` + apiKey, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Translate to English: " + JSON.stringify(fields) }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0 }
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.warn(`[${version}/${model}] Error:`, detail.substring(0, 100));
      return false;
    }

    const data = await response.json();
    console.log(`[${version}/${model}] Success:`, data?.candidates?.[0]?.content?.parts?.[0]?.text);
    return true;
  } catch (e) {
    console.error(`[${version}/${model}] Exec error:`, e.message);
    return false;
  }
}

async function runAll() {
  await testTranslation("v1", "gemini-1.5-flash");
  await testTranslation("v1beta", "gemini-1.5-flash-latest");
}

runAll();
