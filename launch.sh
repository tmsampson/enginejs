ENGINEJS_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Colour
printf '\033[0;33m'

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

# Prepare chromium
# http://askubuntu.com/questions/79280/how-to-install-chrome-browser-properly-via-command-line
sudo apt-get install chromium-browser

# Open launcher in chromium shell
google-chrome --incognito --app=http://localhost:1234/samples/index.htm --window-size=200x200 --enable-webgl --ignore-gpu-blacklist &> /dev/null &

# Start webserver
printf "* Starting EngineJS development server\n"
clear
node $ENGINEJS_ROOT/tools/server/server.js $ENGINEJS_ROOT