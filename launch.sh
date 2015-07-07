ENGINEJS_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

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

# Start webserver
printf "* Starting EngineJS development server\n"
xdg-open http://localhost:1234/index.htm &> /dev/null
node $ENGINEJS_ROOT/tools/server/server.js $ENGINEJS_ROOT
