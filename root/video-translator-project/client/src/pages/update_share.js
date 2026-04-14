const fs = require('fs');

const file = '/root/video-translator-project/client/src/pages/home.tsx';
let content = fs.readFileSync(file, 'utf8');

console.log('File length:', content.length);

// Fix 1: Update function signature
const old1 = 'const SHARE_INSTRUCTIONS: Record<string, (roomId: string, appUrl: string) => string> = {';
const new1 = 'const SHARE_INSTRUCTIONS: Record<string, (roomId: string, appUrl: string, contactLanguage: string) => string> = {';
if (content.includes(old1)) {
    content = content.replace(old1, new1);
    console.log('✅ Fixed SHARE_INSTRUCTIONS signature');
} else {
    console.log('❌ SHARE_INSTRUCTIONS signature not found');
}

// Fix 2: Update URL in all language templates
const old_pattern = '${appUrl}/join/${roomId}';
const new_pattern = '${appUrl}/join/${roomId}?lang=${contactLanguage}';
const count = (content.match(new RegExp(old_pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
if (count > 0) {
    content = content.split(old_pattern).join(new_pattern);
    console.log('✅ Fixed', count, 'URL(s) in SHARE_INSTRUCTIONS');
} else {
    console.log('❌ URL pattern not found');
}

// Fix 3: Update the langFn call in shareWithContact to pass contact.language
const old_call = 'const message = langFn(roomId, appUrl);';
const new_call = 'const message = langFn(roomId, appUrl, contact.language);';
if (content.includes(old_call)) {
    content = content.replace(old_call, new_call);
    console.log('✅ Fixed shareWithContact langFn call');
} else {
    console.log('❌ langFn call not found');
}

fs.writeFileSync(file, content);
console.log('Done');