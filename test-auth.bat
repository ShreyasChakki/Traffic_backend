@echo off
echo ========================================
echo Smart Traffic IoT - Authentication Testing
echo ========================================
echo.

echo Step 1: Starting server...
echo Please run: npm run dev:v2
echo.
echo Press any key when server is running...
pause > nul

echo.
echo ========================================
echo Testing Authentication Endpoints
echo ========================================
echo.

echo Test 1: Health Check
echo ---------------------
curl http://localhost:5000/api/test/health
echo.
echo.

echo Test 2: Register Admin User
echo ---------------------------
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Admin User\",\"email\":\"admin@test.com\",\"password\":\"Admin123\",\"role\":\"admin\"}"
echo.
echo.
echo SAVE THE ACCESS TOKEN AND REFRESH TOKEN!
echo.
pause

echo Test 3: Register Operator User
echo -------------------------------
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Operator User\",\"email\":\"operator@test.com\",\"password\":\"Operator123\",\"role\":\"operator\"}"
echo.
echo.
pause

echo Test 4: Register Viewer User
echo -----------------------------
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Viewer User\",\"email\":\"viewer@test.com\",\"password\":\"Viewer123\",\"role\":\"viewer\"}"
echo.
echo.
pause

echo Test 5: Login with Admin
echo -------------------------
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@test.com\",\"password\":\"Admin123\"}"
echo.
echo.
echo COPY THE ACCESS TOKEN FROM ABOVE
echo.
set /p TOKEN="Enter Access Token: "
echo.

echo Test 6: Get Current User
echo -------------------------
curl -H "Authorization: Bearer %TOKEN%" http://localhost:5000/api/auth/me
echo.
echo.
pause

echo Test 7: Get User Permissions
echo -----------------------------
curl -H "Authorization: Bearer %TOKEN%" http://localhost:5000/api/auth/permissions
echo.
echo.
pause

echo Test 8: Get Dashboard Stats
echo ----------------------------
curl -H "Authorization: Bearer %TOKEN%" http://localhost:5000/api/dashboard/stats
echo.
echo.
pause

echo Test 9: Update Profile
echo -----------------------
curl -X PUT http://localhost:5000/api/auth/profile -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"name\":\"Admin Updated\"}"
echo.
echo.
pause

echo.
echo ========================================
echo All Basic Tests Complete!
echo ========================================
echo.
echo For more tests, see AUTH_V2_TESTING.md
echo.
pause
