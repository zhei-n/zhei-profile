# Simple Portfolio (local preview)

This folder contains a small static portfolio site. If you don't have Python installed, use the included PowerShell server to preview the site locally.

Quick preview (PowerShell)

1. Open PowerShell and change to the project folder (the folder that contains `index.html`). For example:

```powershell
cd C:\path\to\profile
```

2. Run the bundled server script (choose a port if you want):

```powershell
# If your execution policy prevents running scripts, run PowerShell as Administrator or use the next command to bypass the policy for this run
powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Port 8000

# Then open http://localhost:8000 in your browser
```

Alternative options

- If you have Node.js installed you can run (from this folder):

```powershell
npx http-server -p 8000
# or install globally: npm i -g http-server
```

- If you later install Python, you can also use:

```powershell
# for Python 3.x
python -m http.server 8000
```

VS Code users

- Install the Live Server extension and open this folder in VS Code. Click "Go Live" to preview.

Notes
- The PowerShell server provided here is a lightweight helper for local previews. It is not intended for production use.
- If you want the site to be fully self-contained, I can copy the avatar image into this folder (e.g. `assets/image-avatar.png`) and update the HTML — say the word and I'll move it.
 
GitHub Pages (quick deploy)

1. Create a GitHub repository for your project (if you haven't already) and push the nested `your-folder/src` contents to a branch (for example `gh-pages`) or to the repository root.

2. Easiest (deploy from `gh-pages` branch):

```powershell
# from the nested src folder
git init
git remote add origin https://github.com/<your-username>/<your-repo>.git
git checkout -b gh-pages
git add .
git commit -m "Deploy site"
git push -u origin gh-pages
```

3. In your GitHub repo settings > Pages, select the `gh-pages` branch (or `main` / `master` if you pushed there) and save. Your site will be published at https://<your-username>.github.io/<your-repo>/ within a few minutes.

Notes about paths
- If you publish to a repository page (not user page) the site is served from a subpath. Use root-relative paths in `index.html` or host assets relative to the site root. The current setup uses relative paths and should work when the files are placed at the repository root or in the `gh-pages` branch root.

Need help publishing?
- I can create a small script to automate the branch push for you, or help configure GitHub Actions to deploy automatically from `main` to `gh-pages`.

