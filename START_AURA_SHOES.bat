@echo off
title AURA Shoes - Starting...
cd /d "D:\bh\shoes"

echo ===================================================
echo             Starting AURA Shoes Store...
echo ===================================================

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$serverRunning = (Get-NetTCPConnection -LocalPort 5050 -State Listen -ErrorAction SilentlyContinue); " ^
    "if (-not $serverRunning) { " ^
    "    Write-Host 'Starting Backend Server (:5050)...' -ForegroundColor Cyan; " ^
    "    Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd /d D:\bh\shoes && npm run dev:server' -WindowStyle Hidden; " ^
    "    Start-Sleep -Seconds 1; " ^
    "} else { " ^
    "    Write-Host 'Backend Server (:5050) is already running.' -ForegroundColor Green; " ^
    "} " ^
    "$clientRunning = (Get-NetTCPConnection -LocalPort 3006 -State Listen -ErrorAction SilentlyContinue); " ^
    "if (-not $clientRunning) { " ^
    "    Write-Host 'Starting Frontend Client (:3006)...' -ForegroundColor Cyan; " ^
    "    Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd /d D:\bh\shoes && npm run dev:client -- --port 3006' -WindowStyle Hidden; " ^
    "    Start-Sleep -Seconds 2; " ^
    "} else { " ^
    "    Write-Host 'Frontend Client (:3006) is already running.' -ForegroundColor Green; " ^
    "} " ^
    "Write-Host 'Waiting for AURA Shoes to be ready...' -ForegroundColor Yellow; " ^
    "for ($i=0; $i -lt 15; $i++) { " ^
    "    try { " ^
    "        $tcp = [System.Net.Sockets.TcpClient]::new(); " ^
    "        $tcp.Connect('127.0.0.1', 3006); " ^
    "        if ($tcp.Connected) { $tcp.Close(); break; } " ^
    "    } catch {} " ^
    "    Start-Sleep -Milliseconds 500; " ^
    "} " ^
    "$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'; " ^
    "$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'; " ^
    "if (Test-Path $chrome) { " ^
    "    Start-Process -FilePath $chrome -ArgumentList '--app=http://localhost:3006 --start-maximized'; " ^
    "} elseif (Test-Path $edge) { " ^
    "    Start-Process -FilePath $edge -ArgumentList '--app=http://localhost:3006 --start-maximized'; " ^
    "} else { " ^
    "    Start-Process 'http://localhost:3006'; " ^
    "}"

exit /b 0
