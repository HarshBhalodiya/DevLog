@echo off
echo =============================================
echo   DevLog - Clean Install + Start
echo =============================================
echo.

cd frontend

echo [1/3] Removing old node_modules...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo [2/3] Installing packages fresh...
npm install

echo [3/3] Starting frontend...
start "DevLog Frontend" cmd /k "npm run dev"

cd ../backend
echo Starting backend...
start "DevLog Backend" cmd /k "uvicorn main:app --reload --port 8000"

echo.
echo =============================================
echo  Open: http://localhost:5173
echo =============================================
pause

@REM cd frontend
@REM npm install