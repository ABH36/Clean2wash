const path = require('path');
const fs = require('fs');

const base = 'C:\\Users\\FTT\\Documents\\GitHub\\Clean-2-Wash\\Backend\\modules\\consumer\\controllers';
const target = '../../../models/User';
const absolutePath = path.resolve(base, target);

console.log('Base directory:', base);
console.log('Target relative path:', target);
console.log('Resolved absolute path:', absolutePath);
console.log('File exists (.js):', fs.existsSync(absolutePath + '.js'));

try {
    const User = require(absolutePath);
    console.log('Successfully required User model');
} catch (err) {
    console.error('Failed to require User model:');
    console.error(err);
}
