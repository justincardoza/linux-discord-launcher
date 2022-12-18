# Unofficial Discord Launcher for Linux

This is a small script to keep a Discord client installation up to date on a Linux system. If you use a package manager other than `apt`, the official client 
is currently only distributed as a tarball. This script adds a step before running the client to check for and download the newest version. There are unofficial 
packages for other package managers, but it's hit-or-miss whether those are actually up to date. Going directly to the source eliminates that worry.

## How to install

Clone this repository or just download `index.js` to wherever you want to keep the launcher script. This could be where you want to install Discord, or it can 
be a separate location if you prefer. You will also need to install [Node.js](https://nodejs.org/) using your preferred method, whether that's a direct download 
or a [package manager](https://nodejs.org/en/download/package-manager/), which Node supports quite a few of.

## How to use

Run the main script using `node`. It will download the client, extract it into the directory you choose, and run it. You can specify a directory on the command 
line as the first argument to the script, and it will install Discord into that directory. Otherwise, if you don't specify an install directory, it will default 
to the current working directory, i.e. the one you ran the script from. This is how to specify an install directory:

`node path/to/launcher/script/index.js path/to/discord/directory`

## Disclaimer

This project is in no way affiliated with, or endorsed by, Discord Inc. or any of its subsidiaries or related companies.