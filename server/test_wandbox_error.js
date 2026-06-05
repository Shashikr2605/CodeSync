const axios = require("c:/Users/shash/OneDrive/Desktop/work/CodeSync/server/node_modules/axios");

async function testWandboxExecute(language, compiler, sourceCode) {
  try {
    const payload = {
      compiler: compiler,
      code: sourceCode,
      save: false
    };
    console.log(`Executing invalid ${language} via Wandbox with compiler: ${compiler}...`);
    const res = await axios.post("https://wandbox.org/api/compile.json", payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 25_000
    });
    console.log(`[${language}] Result:`, JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(`Error executing ${language}:`, err.message);
  }
}

async function run() {
  await testWandboxExecute("cpp", "gcc-13.2.0", `#include <iostream>\nint main() { std::cout << "Hello" return 0; }`); // missing semicolon
  await testWandboxExecute("python", "cpython-3.12.7", `print("Hello"`); // missing parentheses
}

run();
