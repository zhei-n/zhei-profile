const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'data', 'projects.json');

try{
  const raw = fs.readFileSync(file, 'utf8');
  const projects = JSON.parse(raw);

  if (!Array.isArray(projects)){
    console.error('projects.json should be an array');
    process.exit(1);
  }
  if (projects.length === 0){
    console.error('projects.json should contain at least one project');
    process.exit(1);
  }

  // basic schema checks for first few entries
  const required = ['title','description'];
  for (let i=0;i<projects.length;i++){
    const p = projects[i];
    for (const key of required){
      if (!p[key] || typeof p[key] !== 'string'){
        console.error(`Project at index ${i} is missing required string property: ${key}`);
        process.exit(1);
      }
    }
  }

  console.log('projects.json validation passed —', projects.length, 'projects found.');
  process.exit(0);
} catch (err){
  console.error('Failed to validate projects.json:', err.message || err);
  process.exit(1);
}
