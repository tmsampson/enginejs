@echo off
SET SERVER_ROOT=%1

:: Setup
SET HOST=localhost
SET PORT=1234
SET URI=http://%HOST%:%PORT%

:: Kill previous instances
taskkill /im tiny.exe /f /t
CLS

:: Change current directory such that log files don't end up elsewhere
SET MY_ROOT=%~dp0
cd %MY_ROOT%

:: Start webserver
START %MY_ROOT%\tiny.exe %SERVER_ROOT% %PORT% > nul
ECHO Webserver running @ %URI%

:: Launch in browser
START %URI%

:: Terminate on request
ECHO Press any key to terminate...
PAUSE > nul
taskkill /im tiny.exe /f /t