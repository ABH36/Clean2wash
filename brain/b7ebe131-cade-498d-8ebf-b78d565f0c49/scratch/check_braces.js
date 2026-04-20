import fs from 'fs';

const content = fs.readFileSync('c:/Users/FTT/Documents/GitHub/Clean-2-Wash/Frontend/src/modules/consumer/pages/SpareDriverBooking.jsx', 'utf8');

let curly = 0;
let paren = 0;
let bracket = 0;
let tags = 0;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '{') curly++;
    if (char === '}') curly--;
    if (char === '(') paren++;
    if (char === ')') paren--;
    if (char === '[') bracket++;
    if (char === ']') bracket--;
}

console.log(`Curly: ${curly}`);
console.log(`Paren: ${paren}`);
console.log(`Bracket: ${bracket}`);
