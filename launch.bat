@ECHO off
SET ENGINEJS_ROOT=%~dp0
set ENGINEJS_ROOT=%ENGINEJS_ROOT:~0,-1%

:: Setup symlinks for samples to point back to ../enginejs
FOR /d %%X in (%ENGINEJS_ROOT%\samples\sample_*) do "%ENGINEJS_ROOT%/utils/junction/junction.exe" "%%X\enginejs" "%ENGINEJS_ROOT%" > nul 2>&1
ECHO * Symlinks configured

:: Add nodeJS to path
SET PATH=%ENGINEJS_ROOT%\utils\nodejs\win64;%PATH%
SET NODE_PATH=%ENGINEJS_ROOT%\utils\nodejs\node_modules
ECHO * NodeJS added to path

:: Start webserver
ECHO * Starting EngineJS development server
START node "%ENGINEJS_ROOT%/tools/server/server.js" "%ENGINEJS_ROOT%"
START http://localhost:1234/samples/index.htm