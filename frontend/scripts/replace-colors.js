const fs = require('fs');
const path = require('path');

const pairs = [
    ['from-indigo-500 to-violet-600', 'from-teal-500 to-cyan-500'],
    ['from-indigo-500 via-violet-600 to-cyan-500', 'from-teal-500 via-cyan-500 to-teal-400'],
    ['from-indigo-400 to-violet-500', 'from-teal-400 to-cyan-500'],
    ['shadow-indigo-500/30', 'shadow-teal-500/30'],
    ['shadow-indigo-500/40', 'shadow-teal-500/40'],
    ['shadow-indigo-500/[0.30]', 'shadow-teal-500/[0.30]'],
    ['bg-indigo-500', 'bg-teal-500'],
    ['bg-indigo-400', 'bg-teal-400'],
    ['text-indigo-400', 'text-teal-400'],
    ['text-indigo-300', 'text-teal-300'],
    ['text-indigo-200', 'text-teal-200'],
    ['border-indigo-500', 'border-teal-500'],
    ['border-indigo-400', 'border-teal-400'],
    ['ring-indigo-400', 'ring-teal-400'],
    ['hover:text-indigo-300', 'hover:text-teal-300'],
    ['hover:border-indigo-500', 'hover:border-teal-500'],
    ['violet-600', 'cyan-600'],
    ['violet-500', 'cyan-500'],
    ['bg-[#1a1a3e]', 'bg-[#071a18]'],
];

function walk(dir) {
    const result = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory() && !['node_modules', '.next'].includes(entry.name)) {
            result.push(...walk(full));
        } else if (entry.isFile() && /\.(tsx|ts|css)$/.test(entry.name)) {
            result.push(full);
        }
    }
    return result;
}

const files = [...walk('app'), ...walk('components')];
let changed = 0;
for (const f of files) {
    let content = fs.readFileSync(f, 'utf8');
    let updated = content;
    for (const [from, to] of pairs) {
        updated = updated.split(from).join(to);
    }
    if (updated !== content) {
        fs.writeFileSync(f, updated, 'utf8');
        console.log('Updated:', path.relative('.', f));
        changed++;
    }
}
console.log(`\nDone. ${changed} file(s) updated.`);
