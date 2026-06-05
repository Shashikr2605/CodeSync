const axios = require("c:/Users/shash/OneDrive/Desktop/work/CodeSync/server/node_modules/axios");

async function testCodexExecute(language, codexLang, sourceCode) {
  try {
    const body = new URLSearchParams();
    body.append("code",     sourceCode);
    body.append("language", codexLang);
    body.append("input",    "");

    console.log(`Executing ${language} via Codex with payload:`, body.toString());
    const res = await axios.post("https://api.codex.jaagrav.in", body.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 30_000,
    });
    console.log("Result:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.error(`Error executing ${language}:`, err.response.status, JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(`Error executing ${language}:`, err.message);
    }
  }
}

async function run() {
  await testCodexExecute("javascript", "js", "console.log('Hello from JS');");
  await testCodexExecute("python", "py", "print('Hello from Python')");
}

run();
