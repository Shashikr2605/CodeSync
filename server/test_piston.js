const axios = require("c:/Users/shash/OneDrive/Desktop/work/CodeSync/server/node_modules/axios");

async function testPistonExecute(language, pistonLang, pistonVersion, sourceCode) {
  try {
    const payload = {
      language: pistonLang,
      version:  pistonVersion,
      files:    [{ name: "main", content: sourceCode }],
      stdin:    "",
    };
    console.log(`Executing ${language} via Piston with payload:`, payload);
    const res = await axios.post("https://emkc.org/api/v2/piston/execute", payload);
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
  // Test Javascript/Node
  await testPistonExecute("javascript (node)", "node", "*", "console.log('Hello from JS');");
  await testPistonExecute("javascript (javascript)", "javascript", "*", "console.log('Hello from JS');");
  // Test Python
  await testPistonExecute("python", "python", "*", "print('Hello from Python')");
}

run();
