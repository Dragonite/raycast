#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function flattenDist() {
    const distDir = './dist';
    
    try {
        console.log('🔍 Finding all .js files in dist...');
        const jsFiles = await findAllJSFiles(distDir);
        
        console.log('🗑️  Clearing dist directory...');
        await fs.rm(distDir, { recursive: true, force: true });
        await fs.mkdir(distDir, { recursive: true });
        
        console.log('📦 Copying files to flattened structure...');
        for (const file of jsFiles) {
            const fileName = path.basename(file.path);
            const destPath = path.join(distDir, fileName);
            await fs.writeFile(destPath, file.content);
            console.log(`✅ ${fileName}`);
        }
        
        console.log(`🎉 Successfully flattened ${jsFiles.length} files to dist/`);
    } catch (error) {
        console.error('❌ Error flattening dist:', error.message);
        process.exit(1);
    }
}

async function findAllJSFiles(dir) {
    const jsFiles = [];
    
    async function scanDirectory(currentDir) {
        const items = await fs.readdir(currentDir, { withFileTypes: true });
        
        for (const item of items) {
            const fullPath = path.join(currentDir, item.name);
            
            if (item.isFile() && item.name.endsWith('.js')) {
                const content = await fs.readFile(fullPath, 'utf8');
                jsFiles.push({ path: fullPath, content });
            } else if (item.isDirectory()) {
                await scanDirectory(fullPath);
            }
        }
    }
    
    await scanDirectory(dir);
    return jsFiles;
}

flattenDist();