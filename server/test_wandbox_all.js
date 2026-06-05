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
      timeout: 25_000
    });
    console.log(`[${language}] Result status: ${res.data.status}`);
    console.log(`[${language}] Output:`, res.data.program_output || res.data.program_message || res.data.compiler_message);
  } catch (err) {
    console.error(`Error executing ${language}:`, err.message);
  }
}

async function run() {
  await testWandboxExecute("cpp", "gcc-13.2.0", `#include <iostream>\nint main() { std::cout << "Hello from C++ in Wandbox" << std::endl; return 0; }`);
  await testWandboxExecute("c", "gcc-13.2.0-c", `#include <stdio.h>\nint main() { printf("Hello from C in Wandbox\\n"); return 0; }`);
  await testWandboxExecute("java", "openjdk-jdk-21+35", `public class Main { public static void main(String[] args) { System.out.println("Hello from Java in Wandbox"); } }`);
}

run();
