# How to Update the Website (Deployment Guide)

Since the website is hosted on GitHub Pages, **any changes you make on your computer (or by the AI agent) MUST be "pushed" to GitHub** to appear on the live link.

If you don't push, the changes stay only on your machine.

## The Easy Way (Automatic)

I have created a script that does everything for you.

1.  Look for the file named `deploy.bat` in the `haykal` folder.
2.  Double-click it (or ask the Agent to "run the deployment script").
3.  Wait for it to finish.
4.  The website will update automatically within 1-2 minutes.

## What the script does
It runs these commands automatically:
1.  `git add .` (Collects all modified and new files)
2.  `git commit -m "Auto-deploy..."` (Saves them with a timestamp)
3.  `git push origin main` (Sends them to the internet)
