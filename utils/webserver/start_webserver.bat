@echo off
SET SERVER_ROOT=%1

:: Setup
SET HOST=localhost
SET PORT=1234
SET URI=http://%HOST%:%PORT%

:: Kill previous instances
taskkill /im tiny.exe /f /t > nul

:: Start webserver
SET MY_ROOT=%~dp0
START /D "%MY_ROOT%" tiny.exe %SERVER_ROOT% %PORT% > nul
ECHO * Webserver running @ %URI%

:: Launch in browser
START %URI%