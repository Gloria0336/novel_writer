@echo off
powershell.exe -NoLogo -ExecutionPolicy Bypass -File "%~dp0start-workspace.ps1"
if errorlevel 1 pause
