@echo off
title The Gauntlet
echo Starting The Gauntlet on http://localhost:5178 ...
start "" http://localhost:5178
node "%~dp0serve.js"
