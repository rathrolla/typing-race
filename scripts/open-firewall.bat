@echo off
:: Run this file as Administrator (right-click -> Run as administrator)
echo Adding Windows Firewall rules for Typing Race...
echo.

netsh advfirewall firewall delete rule name="Typing Race Client" >nul 2>&1
netsh advfirewall firewall delete rule name="Typing Race Server" >nul 2>&1

netsh advfirewall firewall add rule name="Typing Race Client" dir=in action=allow protocol=TCP localport=5173-5180 profile=private,domain
if %errorlevel% neq 0 goto failed

netsh advfirewall firewall add rule name="Typing Race Server" dir=in action=allow protocol=TCP localport=3002 profile=private,domain
if %errorlevel% neq 0 goto failed

echo.
echo Success! Firewall rules added for ports 5173-5180 and 3002.
echo Now run: npm run dev:lan
echo.
pause
exit /b 0

:failed
echo.
echo Failed. Right-click this file and choose "Run as administrator".
echo.
pause
exit /b 1
