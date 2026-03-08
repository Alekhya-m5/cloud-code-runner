# ⚡ Cloud Code Runner — Mini Online Compiler

A beginner-friendly cloud computing project built with **Flask**, **MongoDB Atlas**, and plain HTML/CSS/JS.  
Write Python code in your browser → send it to a cloud server → see the output instantly!

---

## 📁 Project Structure

```
cloud-code-runner/
│
├── app.py                 ← Flask backend (main server)
├── requirements.txt       ← Python dependencies
├── render.yaml            ← Render.com deployment config
├── .env.example           ← Template for your environment variables
├── .gitignore             ← Files to exclude from Git
│
├── templates/
│   └── index.html         ← Frontend HTML page
│
└── static/
    ├── style.css          ← Styling
    └── script.js          ← Frontend JavaScript
```

---

## ☁️ Cloud Concepts Demonstrated

| Concept | How it's used |
|---|---|
| **Cloud Database** | MongoDB Atlas stores code snippets in the cloud |
| **REST API** | Flask exposes `/run_code`, `/save_code`, `/history` endpoints |
| **Backend as a Service** | Flask server runs code remotely, not on the user's machine |
| **Cloud Deployment** | Deployable to Render or AWS with zero server management |
| **Environment Variables** | Secrets (DB password) stored securely, not in code |

---

## 🚀 PART 1: Run Locally (Step by Step)

### Step 1 — Make Sure Python is Installed
```bash
python3 --version   # Should print Python 3.8 or higher
```
If not installed, download from https://python.org

---

### Step 2 — Download / Clone the Project
```bash
# Option A: If you have Git
git clone https://github.com/YOUR_USERNAME/cloud-code-runner.git
cd cloud-code-runner

# Option B: If you downloaded the ZIP
# Unzip it and open a terminal in that folder
```

---

### Step 3 — Create a Virtual Environment
A virtual environment keeps your project's packages separate from your system Python.
```bash
# Create the virtual environment
python3 -m venv venv

# Activate it (Mac/Linux):
source venv/bin/activate

# Activate it (Windows):
venv\Scripts\activate

# You should see (venv) at the start of your terminal prompt
```

---

### Step 4 — Install Dependencies
```bash
pip install -r requirements.txt
```
This installs Flask, PyMongo, python-dotenv, and gunicorn.

---

### Step 5 — Set Up MongoDB Atlas (Free Cloud Database)

**5a. Create a free account**
- Go to https://www.mongodb.com/cloud/atlas
- Click "Try Free" and sign up

**5b. Create a free cluster**
- Click "Build a Database"
- Choose **M0 Free Tier** (512 MB, always free)
- Choose any cloud region (e.g., AWS / us-east-1)
- Click "Create Cluster" (takes 1–3 minutes)

**5c. Create a database user**
- In the left menu, go to **Security → Database Access**
- Click **Add New Database User**
- Set username: `clouduser`
- Set a strong password (save it!)
- Role: **Atlas admin**
- Click **Add User**

**5d. Whitelist your IP address**
- In the left menu, go to **Security → Network Access**
- Click **Add IP Address**
- For development: click **Allow Access from Anywhere** (0.0.0.0/0)
- Click **Confirm**

**5e. Get your connection string**
- Go to **Database → Connect**
- Click **Connect your application**
- Choose **Python** driver, version **3.12 or later**
- Copy the connection string. It looks like:
  ```
  mongodb+srv://clouduser:<password>@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
  ```
- Replace `<password>` with your actual password

---

### Step 6 — Create Your .env File
```bash
# Copy the template
cp .env.example .env
```
Open `.env` in a text editor and paste your MongoDB connection string:
```
MONGO_URI=mongodb+srv://clouduser:YourPassword123@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
PORT=5000
```
⚠️ **Never share this file or upload it to GitHub!** (It's in .gitignore for safety)

---

### Step 7 — Run the Application
```bash
python3 app.py
```
You should see:
```
✅ Connected to MongoDB successfully!
 * Running on http://0.0.0.0:5000
 * Debug mode: on
```

---

### Step 8 — Open in Browser
Visit: **http://localhost:5000**

You should see the Cloud Code Runner dashboard! Try:
1. Write some Python code in the editor
2. Click **Run Code** → see the output
3. Click **Save to Cloud** → saves to MongoDB Atlas
4. Click **↻ Refresh** in the History section → see your saved snippets

---

## 🌐 PART 2: Deploy to Render (Free Cloud Hosting)

Render is a simple cloud platform that can host your Flask app for free.

### Step 1 — Push Code to GitHub
```bash
git init
git add .
git commit -m "Initial commit - Cloud Code Runner"
git remote add origin https://github.com/YOUR_USERNAME/cloud-code-runner.git
git push -u origin main
```
⚠️ Make sure `.env` is in your `.gitignore` before pushing!

### Step 2 — Create a Render Account
- Go to https://render.com
- Sign up with GitHub (easier - gives Render access to your repos)

### Step 3 — Create a New Web Service
- Click **New → Web Service**
- Connect your GitHub repo
- Render will auto-detect the `render.yaml` file

### Step 4 — Set Environment Variable
- In the Render dashboard, go to **Environment**
- Add a new variable:
  - Key: `MONGO_URI`
  - Value: (paste your full MongoDB Atlas connection string)
- Click **Save Changes**

### Step 5 — Deploy!
- Click **Deploy** — Render will install dependencies and start your app
- After 2-3 minutes, you'll get a URL like: `https://cloud-code-runner.onrender.com`
- Share this URL — anyone in the world can use your app! 🌍

---

## 🔌 API Endpoints Reference

| Method | URL | Description |
|---|---|---|
| GET | `/` | Serves the main dashboard page |
| POST | `/run_code` | Executes Python code, returns output |
| POST | `/save_code` | Saves code snippet to MongoDB |
| GET | `/history` | Returns last 10 saved snippets |

### Example API call (using curl):
```bash
curl -X POST http://localhost:5000/run_code \
  -H "Content-Type: application/json" \
  -d '{"code": "print(2 + 2)"}'

# Response:
# {"output": "4\n", "error": ""}
```

---

## 🛡️ Security Features Implemented
- Blocked dangerous imports (`os`, `sys`, `subprocess`, etc.)
- Code runs in a **temporary file** with a **10-second timeout**
- Secrets stored in environment variables (not in code)
- HTML output is escaped to prevent XSS attacks

---

## 🐛 Troubleshooting

| Problem | Solution |
|---|---|
| `ModuleNotFoundError: No module named 'flask'` | Run `pip install -r requirements.txt` |
| `MongoDB connection failed` | Check your MONGO_URI in `.env` and network access settings |
| `Address already in use` | Another app is using port 5000. Change PORT in `.env` |
| Code runs but nothing happens | Your code might have no `print()` statements |
| `Error: execution timed out` | Your code has an infinite loop. Add a break condition |

---

## 📚 Tech Stack Summary

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Python 3 + Flask
- **Database**: MongoDB Atlas (cloud NoSQL database)
- **Deployment**: Render.com (or AWS Elastic Beanstalk)
- **Code Execution**: Python `subprocess` module (sandboxed)
