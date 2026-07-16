const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

code = code.replace(/points: Number\(data\.points\) \|\| 500,/g, 'stars: Number(data.stars) || 50,');
code = code.replace(/\/\/ Sort descending by points/g, '// Sort descending by stars');
code = code.replace(/b\.points - a\.points/g, 'b.stars - a.stars');

fs.writeFileSync('src/components/LandingPage.tsx', code);
