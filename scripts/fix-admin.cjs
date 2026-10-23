const fs = require('fs');
const file = 'frontend/src/services/adminService.ts';
let content = fs.readFileSync(file, 'utf8');
if (!content.includes('memoryStore')) {
  content = "import { memoryStorage } from '../shared/memoryStore';\n" + content;
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully imported memoryStorage in adminService.ts');
}
