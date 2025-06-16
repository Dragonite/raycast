#!/Users/haolin.wu/.nvm/versions/node/v22.7.0/bin/node

// Required parameters:
// @raycast.schemaVersion 1
// @raycast.title Search AEM Repository
// @raycast.mode compact

// Optional parameters:
// @raycast.icon /Users/haolin.wu/Desktop/raycast/public/aem.png
// @raycast.argument1 { "type": "text", "placeholder": "Repository name", "optional": false }
// @raycast.packageName AEM Renovators

// Documentation:
// @raycast.description Search and open AEM repositories in VS Code
// @raycast.author Haolin Wu
// @raycast.authorURL https://www.haolin.dev

import { promises as fs } from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

const REPOSITORIES_DIR = '/Users/haolin.wu/Public/AEM/repositories';

const searchRepositories = async (searchTerm: string): Promise<string[]> => {
    try {
        const entries = await fs.readdir(REPOSITORIES_DIR, { withFileTypes: true });
        
        // Filter for directories only and match search term
        const repositories = entries
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name)
            .filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort();
        
        return repositories;
    } catch (error: any) {
        console.error(`❌ Error reading repositories directory: ${error.message}`);
        return [];
    }
};

const openInVSCode = (repositoryPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        // Try different VS Code commands in order of preference
        const vscodeCommands = [
            '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code',  // Your VS Code path
            'code',                                    // Standard VS Code CLI
            '/usr/local/bin/code',                     // Homebrew install
            'code-insiders',                           // VS Code Insiders
            '/opt/homebrew/bin/code'                   // Apple Silicon Homebrew
        ];
        
        tryVSCodeCommand(vscodeCommands, repositoryPath, 0, resolve, reject);
    });
};

const tryVSCodeCommand = (commands: string[], repositoryPath: string, index: number, resolve: Function, reject: Function) => {
    if (index >= commands.length) {
        // All VS Code commands failed, try opening in Finder as fallback
        console.log('⚠️  VS Code not found, opening in Finder instead...');
        const finder = spawn('open', [repositoryPath], {
            stdio: 'inherit',
            detached: true
        });
        
        finder.on('error', (error) => {
            reject(new Error(`Could not open VS Code or Finder: ${error.message}`));
        });
        
        finder.on('close', (code) => {
            if (code === 0) {
                console.log('📁 Opened repository in Finder');
                resolve();
            } else {
                reject(new Error(`Finder exited with code ${code}`));
            }
        });
        
        finder.unref();
        return;
    }
    
    const command = commands[index];
    const vscode = spawn(command, [repositoryPath], {
        stdio: 'inherit',
        detached: true
    });
    
    vscode.on('error', (error) => {
        // Try next command
        tryVSCodeCommand(commands, repositoryPath, index + 1, resolve, reject);
    });
    
    vscode.on('close', (code) => {
        if (code === 0) {
            console.log(`✅ Opened in VS Code using: ${command}`);
            resolve();
        } else {
            // Try next command
            tryVSCodeCommand(commands, repositoryPath, index + 1, resolve, reject);
        }
    });
    
    vscode.unref();
};

const main = async (): Promise<void> => {
    const searchTerm = process.argv.slice(2)[0];
    
    if (!searchTerm) {
        console.error('❌ Please provide a repository name to search for.');
        process.exit(1);
    }
    
    try {
        console.log(`🔍 Searching for repositories matching "${searchTerm}"...`);
        
        const repositories = await searchRepositories(searchTerm);
        
        if (repositories.length === 0) {
            console.log(`❌ No repositories found matching "${searchTerm}"`);
            process.exit(1);
        }
        
        // If exact match found, use it
        const exactMatch = repositories.find(repo => 
            repo.toLowerCase() === searchTerm.toLowerCase()
        );
        
        let selectedRepo: string;
        
        if (exactMatch) {
            selectedRepo = exactMatch;
        } else if (repositories.length === 1) {
            // If only one match, use it
            selectedRepo = repositories[0];
        } else {
            // Multiple matches, use the first one or best match
            selectedRepo = repositories[0];
            console.log(`📁 Multiple matches found. Opening: ${selectedRepo}`);
            console.log(`Other matches: ${repositories.slice(1).join(', ')}`);
        }
        
        const repositoryPath = path.join(REPOSITORIES_DIR, selectedRepo);
        
        // Verify the directory exists
        try {
            const stat = await fs.stat(repositoryPath);
            if (!stat.isDirectory()) {
                console.error(`❌ ${repositoryPath} is not a directory`);
                process.exit(1);
            }
        } catch (error) {
            console.error(`❌ Repository directory not found: ${repositoryPath}`);
            process.exit(1);
        }
        
        console.log(`📂 Opening ${selectedRepo} in VS Code...`);
        await openInVSCode(repositoryPath);
        
    } catch (error: any) {
        console.error(`💥 Error: ${error.message}`);
        process.exit(1);
    }
};

main();