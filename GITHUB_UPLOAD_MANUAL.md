## GitHub Manual Upload Instructions

Your source files need to be uploaded to: https://github.com/damienmcdade/PCSExpress

### Step 1: Open GitHub
Visit: https://github.com/damienmcdade/PCSExpress

### Step 2: Create `src/main.jsx`
1. Click **Add file** → **Create new file**
2. In the filename field, type: `src/main.jsx`
3. Paste this content:

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

4. Click **Commit changes**

### Step 3: Create `src/App.jsx`
1. Click **Add file** → **Create new file**
2. Filename: `src/App.jsx`
3. **Paste the ENTIRE content from `src/App.jsx`** (very large file - ~2500 lines)
4. Click **Commit changes**

### Step 4: Create `server/index.js`
1. Click **Add file** → **Create new file**
2. Filename: `server/index.js`
3. **Paste the ENTIRE content from `server/index.js`** (the Express server)
4. Click **Commit changes**

### Step 5: Create `.github/workflows/deploy.yml`
1. Click **Add file** → **Create new file**
2. Filename: `.github/workflows/deploy.yml`
3. **Paste the ENTIRE content from `.github/workflows/deploy.yml`** (GitHub Actions)
4. Click **Commit changes**

### After Upload
Once all 4 files are uploaded:
1. Go to Railway dashboard
2. Trigger a redeploy
3. Your app should build successfully

The files are ready to copy—use the content from your local `pcs-express/` directory.
