SERVER_ROOT=$1

# Install mini-httpd if missing
if ! hash mini-httpd 2>/dev/null; then
	sudo apt-get install mini-httpd
fi

# Kill previous instances
killall -15 mini-httpd &>/dev/null

# Launch webserver (mini-httpd)
mini-httpd -p 1234 -d $SERVER_ROOT

# Launch game in browser
xdg-open http://localhost:1234