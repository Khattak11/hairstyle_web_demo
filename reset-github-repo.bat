@echo off
echo ===================================================
echo  GitHub Repository Reset Tool
echo ===================================================

echo.
echo 1. Removing current GitHub remote connection...
git remote remove origin
echo Done! Current remote connection removed.

echo.
echo 2. Please create a new GitHub repository (without README, license or .gitignore files)
echo    on https://github.com/new
echo.
echo When your new repository is created, enter the URL below.
echo Example format: https://github.com/yourusername/repository-name.git
echo.
set /p REPO_URL="Enter your new GitHub repository URL: "

echo.
echo 3. Adding new remote repository...
git remote add origin %REPO_URL%
echo New remote added: %REPO_URL%

echo.
echo 4. Pushing all code to the new repository...
git push -u origin main

echo.
echo ===================================================
echo Setup complete! Your code is now linked to the new GitHub repository.
echo.
echo If you want to verify the changes on Vercel:
echo 1. Go to Vercel and create a new project
echo 2. Import your new GitHub repository
echo 3. Configure the project settings and deploy
echo ===================================================
echo.
pause 