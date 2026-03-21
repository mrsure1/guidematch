import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const apiKey = process.env.GEMINI_API_KEY;

async function test(version, model) {
  console.log(`Testing ${version} ${model}...`);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hi" }] }]
      })
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`✅ ${model} works on ${version}`);
      return true;
    } else {
      console.log(`❌ ${model} failed on ${version}: ${JSON.stringify(data.error)}`);
      return false;
    }
  } catch (e) {
    console.log(`💥 ${model} error on ${version}: ${e.message}`);
    return false;
  }
}

async function run() {
  await test("v1", "gemini-1.5-flash");
  await test("v1beta", "gemini-1.5-flash");
  await test("v1beta", "gemini-1.5-flash-latest");
}
run();
