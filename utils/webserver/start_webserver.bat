@echo off
:: Setup
SET HOST=localhost
SET PORT=1234
SET URI=http://%HOST%:%PORT%

:: Kill previous instances
taskkill /im tiny.exe /f /t
CLS

:: Start webserver
cd ..\tools\tiny_webserver
START tiny.exe "%~dp0" %PORT%
ECHO Webserver running @ %URI%

:: Launch in browser
START %URI%

:: Terminate on request
ECHO Press any key to terminate...
PAUSE > nul
taskkill /im tiny.exe /f /t