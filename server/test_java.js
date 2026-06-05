const axios = require("c:/Users/shash/OneDrive/Desktop/work/CodeSync/server/node_modules/axios");

async function checkTemplate(templateName) {
  try {
    const res = await axios.get(`https://wandbox.org/api/template/${templateName}.json`);
    console.log(`Template ${templateName}:`, JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(`Error fetching template ${templateName}:`, err.message);
  }
}

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
      timeout: 30_000
    });
    console.log(`[${language}] Result status: ${res.data.status}`);
    console.log(`[${language}] Output:`, res.data.program_output || res.data.program_message || res.data.compiler_message);
  } catch (err) {
    console.error(`Error executing ${language}:`, err.message);
  }
}

async function run() {
  await checkTemplate("openjdk");
  // Test java execution again (maybe with openjdk-jdk-22+36)
  await testWandboxExecute("java", "openjdk-jdk-22+36", `class Main { public static void main(String[] args) { System.out.println("Hello from Java"); } }`);
}

run();
