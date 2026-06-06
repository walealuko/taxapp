import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const targetFolders = ['hooks', 'constants', 'components', 'contexts', 'utils', 'lib', 'services'];
const files = glob.sync('app/**/*.tsx');

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let updatedContent = content;
  
  targetFolders.forEach(folder => {
    // Replace ../../../folder/ with @/folder/
    updatedContent = updatedContent.replace(new RegExp('\.\.\.\/\.\.\/'+folder+'\/', 'g'), `@/${folder}/`);
    // Replace ../../folder/ with @/folder/
    updatedContent = updatedContent.replace(new RegExp('\.\.\/'+folder+'\/', 'g'), `@/${folder}/`);
  });
  
  if (content !== updatedContent) {
    fs.writeFileSync(file, updatedContent, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
