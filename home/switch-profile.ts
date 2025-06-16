#!/Users/haolin.wu/.nvm/versions/node/v22.7.0/bin/node

// Required parameters:
// @raycast.schemaVersion 1
// @raycast.title Switch Profile
// @raycast.mode compact

// Optional parameters:
// @raycast.icon /Users/haolin.wu/Desktop/raycast/public/ice.ico
// @raycast.argument1 { "type": "dropdown", "placeholder": "Select Profile", "data": [{"title": "Work Profile", "value": "work"}, {"title": "Home Profile", "value": "home"}] }
// @raycast.packageName Developer Utils

// Documentation:
// @raycast.description Switches between work and home profiles (TypeScript version)
// @raycast.author Haolin Wu
// @raycast.authorURL https://www.haolin.dev

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

type Profile = 'work' | 'home';

interface ConfigPaths {
    source: string;
    target: string;
}

interface Config {
    npmrc: ConfigPaths;
    gitconfig: ConfigPaths;
}

const HOME_DIR: string = os.homedir();
// Simple path resolution - go up one level from dist/ to find switch-profile/
const SCRIPT_DIR: string = path.dirname(__filename);
const CONFIG_DIR: string = path.join(SCRIPT_DIR, '..', 'switch-profile');

const switchProfile = async (profile: Profile): Promise<void> => {
    if (!['work', 'home'].includes(profile)) {
        throw new Error('Profile must be either "work" or "home"');
    }

    const config: Config = {
        npmrc: {
            source: path.join(CONFIG_DIR, 'npmrcs', profile),
            target: path.join(HOME_DIR, '.npmrc')
        },
        gitconfig: {
            source: path.join(CONFIG_DIR, 'gitconfigs', profile),
            target: path.join(HOME_DIR, '.gitconfig')
        }
    };

    for (const [type, paths] of Object.entries(config)) {
        try {
            // Read the source file
            const content: string = await fs.readFile(paths.source, 'utf8');
            
            // Write content to target file
            await fs.writeFile(paths.target, content, 'utf8');
            
            console.log(`✅ Successfully updated ${paths.target} with ${profile} configuration`);
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                console.error(`❌ Error: Could not find ${profile} configuration file at ${paths.source}`);
            } else {
                console.error(`❌ Error updating ${type} configuration:`, error.message);
            }
            throw error;
        }
    }
};

const main = async (): Promise<void> => {
    const profile = process.argv.slice(2)[0] as Profile;

    if (!profile) {
        console.error('❌ No profile specified. Please select a profile.');
        process.exit(1);
    }

    try {
        console.log(`🔄 Switching to ${profile} profile...`);
        await switchProfile(profile);
        console.log(`🎉 Profile switch to ${profile} completed successfully!`);
    } catch (error: any) {
        console.error('💥 Error:', error.message);
        process.exit(1);
    }
};

main();