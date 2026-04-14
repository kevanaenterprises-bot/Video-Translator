import re

with open('/root/video-translator-project/client/src/hooks/useTranslation.tsx', 'r') as f:
    content = f.read()

print(f"File length: {len(content)} chars")
print(f"Has restart: {'restart' in content}")
print(f"Has startSpeechRecognition: {'startSpeechRecognition' in content}")

# 1. Remove the restart loop in the catch block
old1 = '''        console.log("Speech recognition ended:", error);
        // Restart if needed and translation is still active
        if (isTranslationActive && error.message !== 'aborted') {
          setTimeout(() => {
            if (isTranslationActive) {
              console.log("🔄 Restarting speech recognition...");
              startSpeechRecognition();
            }
          }, 1000);
        }'''

new1 = '''        console.log("Speech recognition fatal error:", error?.message || error);
        const fatalErrors = ['not-allowed', 'service-not-allowed', 'network', 'audio-capture'];
        if (fatalErrors.includes(error?.message)) {
          console.error("❌ Fatal speech error — NOT restarting automatically");
        }'''

if old1 in content:
    content = content.replace(old1, new1)
    print("✅ Replaced restart loop")
else:
    print("❌ Restart loop not found")

# 2. Fix the language name reference (use src instead of yourLanguage)
old2 = "console.log(`👂 Starting continuous listening for ${yourLanguage.name}...`);"
new2 = "console.log(`👂 Starting continuous listening for ${src.name}...`);"
if old2 in content:
    content = content.replace(old2, new2)
    print("✅ Fixed language name reference")
else:
    print("❌ Language name not found")

# 3. Remove stale dependencies from useCallback
old3 = "  }, [isServiceAvailable, startListening, isTranslationActive, yourLanguage, partnerLanguage]);"
new3 = "  }, [startListening]);"
if old3 in content:
    content = content.replace(old3, new3)
    print("✅ Fixed useCallback dependencies")
else:
    print("❌ Dependencies not found")

with open('/root/video-translator-project/client/src/hooks/useTranslation.tsx', 'w') as f:
    f.write(content)

print("Done writing file")
