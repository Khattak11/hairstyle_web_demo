@echo off
echo Initializing Git repository...
git init

echo Creating .gitignore file (if it doesn't exist)...
if not exist .gitignore (
  echo Creating .gitignore file...
  (
    echo # Dependencies
    echo node_modules/
    echo npm-debug.log
    echo yarn-debug.log
    echo yarn-error.log
    echo # Environment variables
    echo .env
    echo .env.local
    echo .env.development.local
    echo .env.test.local
    echo .env.production.local
    echo # IDE files
    echo .idea/
    echo .vscode/
    echo *.sublime-project
    echo *.sublime-workspace
    echo # OS files
    echo .DS_Store
    echo Thumbs.db
    echo # Build and output directories
    echo /dist
    echo /build
    echo # Vercel
    echo .vercel
  ) > .gitignore
)

echo Adding files to Git...
git add .gitignore
git add package.json
git add package-lock.json
git add README.md
git add index.js
git add public/
git add .env.example
git add vercel.json

echo Committing changes...
git commit -m "Initial commit - AI Hairstyle Generator app with Vercel config"

echo Setting up remote repository...
git remote remove origin
git remote add origin https://github.com/Khattak11/hairstyle_web_demo.git

echo Setting main branch...
git branch -M main

echo Pushing to GitHub...
git push -u origin main

echo Done! Your code has been pushed to GitHub.
echo Repository URL: https://github.com/Khattak11/hairstyle_web_demo
echo.
echo To deploy on Vercel:
echo 1. Go to https://vercel.com and create an account if you don't have one
echo 2. Click "Add New" and select "Project"
echo 3. Import your GitHub repository "hairstyle_dummy_web"
echo 4. Add environment variables (GEMINI_API_KEY) in the Vercel interface
echo 5. Click "Deploy" 