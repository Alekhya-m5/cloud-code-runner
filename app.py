# =============================================================================
# Cloud Code Runner - Backend Server (app.py)
# =============================================================================
# This is the main backend server built with Flask.
# It handles: running Python code, saving to MongoDB, and returning history.
# =============================================================================

import os
import subprocess
import tempfile
import datetime
from flask import Flask, request, jsonify, render_template
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize the Flask app
app = Flask(__name__)

# =============================================================================
# DATABASE SETUP - Connect to MongoDB Atlas
# =============================================================================
# We read the MongoDB connection string from the environment variable.
# This keeps our password out of the code (a security best practice).

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")

try:
    # Connect to MongoDB (Atlas cloud or local)
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client["cloud_code_runner"]          # Database name
    collection = db["code_history"]           # Collection (like a table)
    # Test the connection
    client.server_info()
    print("✅ Connected to MongoDB successfully!")
except Exception as e:
    print(f"⚠️  MongoDB connection failed: {e}")
    print("    The app will still run, but history won't be saved.")
    collection = None


# =============================================================================
# ROUTES
# =============================================================================

# --- Home Page ---
@app.route("/")
def index():
    """Serve the main HTML page."""
    return render_template("index.html")


# --- Run Code Endpoint ---
@app.route("/run_code", methods=["POST"])
def run_code():
    """
    Receives Python code from the frontend, executes it safely,
    and returns the output (or error) as JSON.

    Safety measures:
    - Code runs in a temporary file (not eval/exec in main process)
    - Execution is time-limited to 10 seconds
    - We use subprocess so a crash doesn't affect our server
    """

    # Get the code from the request body (sent as JSON)
    data = request.get_json()
    code = data.get("code", "").strip()

    # Check that we actually received some code
    if not code:
        return jsonify({"error": "No code provided."}), 400

    # Basic safety check: block dangerous keywords
    BLOCKED_KEYWORDS = [
        "import os", "import sys", "import subprocess",
        "open(", "__import__", "exec(", "eval(",
        "shutil", "socket", "requests"
    ]
    for keyword in BLOCKED_KEYWORDS:
        if keyword in code:
            return jsonify({
                "output": "",
                "error": f"⛔ Blocked: '{keyword}' is not allowed for security reasons."
            }), 200

    try:
        # Write the user's code to a temporary file
        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".py",
            delete=False,
            encoding="utf-8"
        ) as tmp_file:
            tmp_file.write(code)
            tmp_file_path = tmp_file.name

        # Run the temporary Python file using subprocess
        # timeout=10 means it will stop after 10 seconds (prevents infinite loops)
        result = subprocess.run(
            ["python3", tmp_file_path],
            capture_output=True,   # Capture stdout and stderr
            text=True,             # Return output as string (not bytes)
            timeout=10             # Kill process after 10 seconds
        )

        # Clean up the temporary file after execution
        os.unlink(tmp_file_path)

        # Return output and any errors back to the frontend
        return jsonify({
            "output": result.stdout,
            "error": result.stderr
        })

    except subprocess.TimeoutExpired:
        return jsonify({
            "output": "",
            "error": "⏱️ Execution timed out (10 seconds limit). Check for infinite loops!"
        })
    except Exception as e:
        return jsonify({
            "output": "",
            "error": f"Server error: {str(e)}"
        }), 500


# --- Save Code Endpoint ---
@app.route("/save_code", methods=["POST"])
def save_code():
    """
    Saves the user's code snippet and its output to MongoDB Atlas.
    This demonstrates cloud database storage.
    """

    if collection is None:
        return jsonify({"message": "⚠️ Database not connected. Cannot save."}), 503

    data = request.get_json()
    code = data.get("code", "").strip()
    output = data.get("output", "")
    title = data.get("title", "Untitled Snippet")

    if not code:
        return jsonify({"message": "No code to save."}), 400

    # Create a document (record) to store in MongoDB
    document = {
        "title": title,
        "code": code,
        "output": output,
        "timestamp": datetime.datetime.utcnow()
    }

    # Insert the document into the collection
    result = collection.insert_one(document)

    return jsonify({
        "message": "✅ Code saved to MongoDB Atlas!",
        "id": str(result.inserted_id)
    })


# --- History Endpoint ---
@app.route("/history", methods=["GET"])
def history():
    """
    Fetches the last 10 saved code snippets from MongoDB Atlas
    and returns them as JSON for the frontend to display.
    """

    if collection is None:
        return jsonify({"history": [], "message": "Database not connected."}), 200

    # Fetch the 10 most recent documents, sorted by timestamp (newest first)
    records = collection.find().sort("timestamp", -1).limit(10)

    history_list = []
    for record in records:
        history_list.append({
            "id": str(record["_id"]),           # MongoDB ID (convert to string)
            "title": record.get("title", "Untitled"),
            "code": record.get("code", ""),
            "output": record.get("output", ""),
            "timestamp": record["timestamp"].strftime("%Y-%m-%d %H:%M:%S UTC")
        })

    return jsonify({"history": history_list})


# =============================================================================
# START THE SERVER
# =============================================================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
