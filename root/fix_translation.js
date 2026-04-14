const fs = require('fs');

const filePath = '/root/video-translator-project/client/src/hooks/useTranslation.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log(`File length: ${content.length} chars`);

// 1. Remove the restart loop in the catch block
const old1 = `        console.log("Speech recognition ended:", error);
        // Restart if needed and translation is still active
        if (isTranslationActive && error.message !== 'aborted') {
          setTimeout(() => {
            if (isTranslationActive) {
              console.log("🔄 Restarting speech recognition...");
              startSpeechRecognition();
            }
          }, 1000);
        }`;

const new1 = `        console.log("Speech recognition fatal error:", error?.message || error);
        const fatalErrors = ['not-allowed', 'service-not-allowed', 'network', 'audio-capture'];
        if (fatalErrors.includes(error?.message)) {
          console.error("❌ Fatal speech error — NOT restarting automatically");
        }`;

if (content.includes(old1)) {
    content = content.replace(old1, new1);
    console.log("✅ Replaced restart loop");
} else {
    console.log("❌ Restart loop block not found");
    // Try to find it with a simpler pattern
    const idx = content.indexOf('Speech recognition ended:');
    if (idx !== -1) {
        console.log("Found 'Speech recognition ended' at index:", idx);
        console.log("Context:", content.substring(idx - 50, idx + 200));
    }
}

// 2. Fix the language name reference (use src instead of yourLanguage)
const old2 = `console.log(\`👂 Starting continuous listening for \${yourLanguage.name}...\`);`;
const new2 = `console.log(\`👂 Starting continuous listening for \${src.name}...\`);`;
if (content.includes(old2)) {
    content = content.replace(old2, new2);
    console.log("✅ Fixed language name reference");
} else {
    console.log("❌ Language name reference not found");
}

// 3. Fix useCallback dependencies
const old3 = `  }, [isServiceAvailable, startListening, isTranslationActive, yourLanguage, partnerLanguage]);`;
const new3 = `  }, [startListening]);`;
if (content.includes(old3)) {
    content = content.replace(old3, new3);
    console.log("✅ Fixed useCallback dependencies");
} else {
    console.log("❌ Dependencies not found");
}

fs.writeFileSync(filePath, content);
console.log("Done writing file");
