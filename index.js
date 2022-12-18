const fs = require('fs/promises');
const https = require('https');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const versionUrl = 'https://discord.com/api/download?platform=linux&format=tar.gz';
const configFilename = 'discord.json';


run().catch(error =>
{
	console.log(error);
	process.stdin.on('data', () => process.exit());
	process.stdin.resume();
});


//Gathers information, downloads the latest client if needed, and then runs the installed version.
async function run()
{
	let directory = getInstallDirectory();
	console.log(`Preparing to launch Discord from ${directory}`);
	
	let config = await getConfig(directory);
	console.log(`Installed version: ${config.version}`);
	
	let currentClient = await getCurrentVersion(versionUrl);
	console.log(`Latest client is version ${currentClient.version}`);
	
	if(config.version !== currentClient.version)
	{
		console.log(`Downloading new version from ${currentClient.url}`);
		await downloadClient(currentClient.url, directory);
		
		config.version = currentClient.version;
		await saveConfig(config, directory);
		
		await writeMenuEntry(directory);
	}
	else
	{
		console.log('Up to date!');
	}
	
	console.log(`Running Discord ${currentClient.version} now. Enjoy!`);
	launchClient(directory);
}


//Returns the install directory for the client. If a directory is specified as an argument, it uses that.
//Otherwise it uses the current working directory.
function getInstallDirectory()
{
	if(process.argv.length > 2) return process.argv[2];
	return process.cwd();
}


//Reads the installed version from the config file saved to the install directory. Currently this JSON file 
//only has a 'version' property, but there's room to expand in the future if more settings are needed.
async function getConfig(directory)
{
	try
	{
		return JSON.parse(await fs.readFile(path.join(directory, configFilename)));
	}
	catch(error)
	{
		return { version: '' };
	}
}


//Saves the config for the currently installed version.
async function saveConfig(config, directory)
{
	await fs.writeFile(path.join(directory, configFilename), JSON.stringify(config));
}


//Gets the current client information from the main download URL, which redirects to the actual .tar.gz file.
//The redirect URL includes the version number, so the client only needs to be downloaded if that doesn't match 
//the installed version.
function getCurrentVersion(url)
{
	return new Promise((resolve, reject) =>
	{
		https.get(url, response =>
		{
			if(response.statusCode >= 300 && response.statusCode <= 399)
			{
				let versionPattern = /discord-([\d\.]+)\.tar\.gz/;
				let versionMatch = versionPattern.exec(response.headers.location);
				
				if(versionMatch?.length > 1)
				{
					resolve({ url: response.headers.location, version: versionMatch[1] });
				}
				else
				{
					reject(`Unable to get version from redirect URL ${response.headers.location}`);
				}
			}
			else
			{
				reject(`Expected a 3XX redirect status code, got ${response.statusCode} instead.`);
			}
		})
	});
}


//Downloads and extracts the latest client into the specified directory, using a pipe in-memory to avoid 
//unnecessary writes to storage (this could just download the .tar.gz to the filesystem and then extract 
//it separately, but doing it this way skips those write operates so only the extracted files need to be 
//written).
function downloadClient(url, directory)
{
	return new Promise((resolve, reject) =>
	{
		https.get(url, response =>
		{
			if(response.statusCode === 200)
			{
				let tar = spawn('tar', ['zxf', '-'], { cwd: directory });
				
				tar.on('spawn', () => response.pipe(tar.stdin));
				tar.on('exit', exitCode => exitCode === 0 ? resolve() : reject(`tar returned exit code ${exitCode}`));
			}
			else
			{
				reject(`Got HTTP status code ${response.statusCode} while trying to download client.`);
			}
		});
	});
}


//Takes the default discord.desktop shortcut file from the installation and modifies it to run this script,
//storing the modified file in ~/.local/share/applications for use in standard application menus.
async function writeMenuEntry(directory)
{
	let content = await fs.readFile(path.join(directory, 'Discord', 'discord.desktop'), { encoding: 'utf-8' });
	let lines = content.split(/[\r\n]+/);
	
	let overrides = 
	{
		'Exec': `node ${__filename} ${directory}`,
		'Icon': path.join(directory, 'Discord', 'discord.png'),
		'Path': path.join(directory, 'Discord'),
	};
	
	for(let i = 0; i < lines.length; i++)
	{
		let parts = lines[i].split('=', 2);
		
		if(parts?.length === 2 && parts[0] in overrides)
		{
			lines[i] = parts[0] + '=' + overrides[parts[0]];
		}
	}
	
	lines.push('Terminal=true');
	
	await fs.writeFile(path.join(os.homedir(), '.local', 'share', 'applications', 'discord.desktop'), lines.join('\n'));
}


//Runs the Discord client. For reference on how to launch an independent process that won't keep the 
//launcher script running: https://nodejs.org/api/child_process.html#optionsdetached
function launchClient(directory)
{
	let client = spawn(path.join(directory, 'Discord', 'Discord'), { detached: true, stdio: 'ignore' });
	client.unref();
}
