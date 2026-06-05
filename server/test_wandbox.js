const axios = require("c:/Users/shash/OneDrive/Desktop/work/CodeSync/server/node_modules/axios");

async function testWandboxExecute(language, compiler, sourceCode) {
  try {
    const payload = {
      compiler: compiler,
      code: sourceCode,
      save: false
    };
    console.log(`Executing ${language} via Wandbox with compiler: ${compiler}...`);
    const res = await axios.post("https://wandbox.org/api/compile.json", payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 20_000
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
  await testWandboxExecute("javascript", "nodejs-20.17.0", "console.log('Hello from JS in Wandbox');");
  await testWandboxExecute("python", "cpython-3.12.7", "print('Hello from Python in Wandbox')");
}

run();
