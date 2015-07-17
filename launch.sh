#!/bin/bash
ENGINEJS_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
INSTALL_FLAG="launcher/installed.flag"

# Colour
setterm -term linux -back blue -fore yellow -clear

# Install chrome (first-run only)
if [ ! -f $INSTALL_FLAG ]; then
	wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add - 
	sudo sh -c 'echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
	sudo apt-get -y update 
	sudo apt-get -y install google-chrome-stable
	touch $INSTALL_FLAG
fi

# Setup symlinks for samples to point back to ../enginejs
printf "* Setting up symlinks for samples\n"
for d in samples/sample_*/ ; do
	src="$ENGINEJS_ROOT/${d}enginejs"
	dst="$ENGINEJS_ROOT"
	if [ ! -L $src ]; then
		ln -s $dst $src
	fi
done

# Add NodeJS to path
export PATH=$PATH:$ENGINEJS_ROOT/utils/nodejs/linux64
export NODE_PATH=$ENGINEJS_ROOT/utils/nodejs/node_modules
printf "* NodeJS added to path\n"

# Open launcher in chromium shell
google-chrome --incognito --app=http://localhost:1234/samples/index.htm --enable-webgl --ignore-gpu-blacklist &> /dev/null &

# Start webserver
printf "* Starting EngineJS development server\n"
clear
node $ENGINEJS_ROOT/tools/server/server.js $ENGINEJS_ROOT
