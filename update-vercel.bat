@echo off
echo Pushing updates to GitHub for Vercel deployment...

git add public/index2.html public/script2.js
git commit -m "Update hairstyle options and set men's styles as default"
git push

echo Done! Your changes should now be visible on Vercel after deployment.
echo.
echo If changes still don't appear:
echo 1. Go to your Vercel dashboard: https://vercel.com/dashboard
echo 2. Find and click on your project
echo 3. Go to the "Deployments" tab
echo 4. Click the three dots next to your latest deployment and select "Redeploy"
echo.
pause 