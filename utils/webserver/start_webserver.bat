@echo off
SET SERVER_ROOT=%1

:: Setup
SET HOST=localhost
SET PORT=1234
SET URI=http://%HOST%:%PORT%

:: Kill previous instances
taskkill /im tiny.exe /f /t
CLS

:: Start webserver
START /D "%MY_ROOT%" tiny.exe %SERVER_ROOT% %PORT% > nul
ECHO Webserver running @ %URI%

:: Launch in browser
START %URI%

:: Terminate on request
ECHO Press any key to terminate...
PAUSE > nul
taskkill /im tiny.exe /f /t
popd
CLS