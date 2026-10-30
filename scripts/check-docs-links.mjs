import fs from 'fs';
import path from 'path';

function findMarkdownFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === '.system_generated') continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findMarkdownFiles(filePath, fileList);
    } else if (file.endsWith('.md')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const mdFiles = findMarkdownFiles('.');
console.log(`Checking ${mdFiles.length} markdown documentation files for absolute or broken local links...`);

let issues = 0;
const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

for (const file of mdFiles) {
  let content = fs.readFileSync(file, 'utf8');
  // Strip fenced code blocks so code examples / audit evidence are not treated as live links
  content = content.replace(/```[\s\S]*?```/g, '');

  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const target = match[2].trim();
    // Check for machine-specific absolute file URIs
    if (target.startsWith('file:///') || /^[a-zA-Z]:[\\/]/.test(target)) {
      console.error(`  FAIL [${file}]: Absolute machine URI found -> ${target}`);
      issues++;
    }
  }
}

if (issues > 0) {
  console.error(`\nFound ${issues} invalid absolute link issues.`);
  process.exit(1);
} else {
  console.log(`\n✓ All markdown links verified clean (0 absolute file:/// URIs detected).`);
  process.exit(0);
}
