const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

let lines = code.split('\n');
let newLines = lines.filter(line => {
    let trimmed = line.trim();
    if (trimmed === '}') return false;
    if (trimmed === '} }') return false;
    if (trimmed === '} }}') return false;
    if (trimmed.startsWith(', scale: { duration:')) return false;
    if (trimmed === '<AnimatePresence>') return false;
    if (trimmed === '</AnimatePresence>') return false;
    return true;
});

code = newLines.join('\n');
fs.writeFileSync('src/components/LandingPage.tsx', code);
console.log('Fixed lines');
