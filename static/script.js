// =============================================================================
// Cloud Code Runner - script.js (Python Only)
// =============================================================================

document.addEventListener("DOMContentLoaded", () => {
    setupLineNumbers();
    loadHistory();
    loadExample("hello");
});

// =============================================================================
// EXAMPLES
// =============================================================================
const EXAMPLES = {
    hello:     `# Hello World in Python\nname = "Cloud Coder"\nprint(f"Hello, {name}!")\nprint("Running on Cloud ")`,
    fibonacci: `# Fibonacci in Python\ndef fibonacci(n):\n    a, b = 0, 1\n    for _ in range(n):\n        print(a, end=" ")\n        a, b = b, a + b\n\nfibonacci(10)`,
    loop:      `# Loop example\nfor i in range(1, 6):\n    print(f"Count: {i}")\nprint("Done!")`
};

function loadExample(type) {
    if (!EXAMPLES[type]) return;
    document.getElementById("code-editor").value = EXAMPLES[type];
    document.getElementById("snippet-title").value =
        type === "hello"     ? "Hello World" :
        type === "fibonacci" ? "Fibonacci"   : "Loop Example";
    document.getElementById("code-editor").dispatchEvent(new Event("input"));
}

// =============================================================================
// LINE NUMBERS
// =============================================================================
function setupLineNumbers() {
    const editor = document.getElementById("code-editor");
    const gutter = document.getElementById("line-numbers");

    function update() {
        const lines = editor.value.split("\n").length;
        gutter.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join("<br>");
    }

    editor.addEventListener("input", update);
    editor.addEventListener("scroll", () => { gutter.scrollTop = editor.scrollTop; });
    editor.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const s = editor.selectionStart;
            editor.value = editor.value.substring(0, s) + "    " + editor.value.substring(editor.selectionEnd);
            editor.selectionStart = editor.selectionEnd = s + 4;
            update();
        }
    });
    update();
}

// =============================================================================
// RUN CODE
// =============================================================================
async function runCode() {
    const code      = document.getElementById("code-editor").value.trim();
    const runBtn    = document.getElementById("run-btn");
    const outputBox = document.getElementById("output-box");

    if (!code) { showToast("⚠️ Write some code first!", "error"); return; }

    setStatus("running", "Running...");
    runBtn.disabled = true;
    runBtn.innerHTML = '<span class="btn-icon">⏳</span> Running...';
    outputBox.innerHTML = '<span class="output-placeholder">Executing your code...</span>';
    document.getElementById("loader-bar").classList.add("loading");

    try {
        const res  = await fetch("/run_code", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ code, language: "python" })
        });
        const data = await res.json();

        if (data.error && data.error.trim()) {
            outputBox.innerHTML = `<span class="output-error">⚠️ Error:\n\n${escapeHtml(data.error)}</span>`;
            setStatus("error", "Error");
        } else if (data.output && data.output.trim()) {
            outputBox.innerHTML = `<span class="output-success">${escapeHtml(data.output)}</span>`;
            setStatus("success", "Success");
        } else {
            outputBox.innerHTML = `<span class="output-success">✅ Ran successfully (no output)</span>`;
            setStatus("success", "Success");
        }
    } catch (err) {
        outputBox.innerHTML = `<span class="output-error">❌ Cannot connect to server.</span>`;
        setStatus("error", "Error");
    }

    runBtn.disabled = false;
    runBtn.innerHTML = '<span class="btn-icon">▶</span> Run Code';
    document.getElementById("loader-bar").classList.remove("loading");
}

// =============================================================================
// SAVE CODE
// =============================================================================
async function saveCode() {
    const code    = document.getElementById("code-editor").value.trim();
    const title   = document.getElementById("snippet-title").value.trim() || "Untitled";
    const output  = document.getElementById("output-box").innerText || "";
    const saveBtn = document.getElementById("save-btn");

    if (!code) { showToast("⚠️ Nothing to save!", "error"); return; }

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="btn-icon">⏳</span> Saving...';

    try {
        const res  = await fetch("/save_code", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ code, output, title, language: "python" })
        });
        const data = await res.json();
        showToast(data.message, "success");
        loadHistory();
    } catch (err) {
        showToast("❌ Failed to save.", "error");
    }

    saveBtn.disabled = false;
    saveBtn.innerHTML = '<span class="btn-icon">☁</span> Save to Cloud';
}

// =============================================================================
// LOAD HISTORY
// =============================================================================
async function loadHistory() {
    const historyList = document.getElementById("history-list");
    historyList.innerHTML = '<p class="history-empty">Loading from cloud...</p>';

    try {
        const res  = await fetch("/history");
        const data = await res.json();

        if (!data.history || data.history.length === 0) {
            historyList.innerHTML = '<p class="history-empty">No saved snippets yet. Save your first program!</p>';
            return;
        }

        historyList.innerHTML = "";
        data.history.forEach((item) => {
            const card = document.createElement("div");
            card.className = "history-item";
            card.innerHTML = `
                <div class="history-item-header">
                    <span class="history-item-title">${escapeHtml(item.title)}</span>
                    <span class="history-item-time">${item.timestamp}</span>
                </div>
                <div class="history-item-preview">${escapeHtml(item.code.split("\n")[0])}</div>
                <div class="history-load-hint">Click to load →</div>
            `;
            card.addEventListener("click", () => {
                document.getElementById("code-editor").value = item.code;
                document.getElementById("snippet-title").value = item.title;
                document.getElementById("code-editor").dispatchEvent(new Event("input"));
                showToast(`📂 Loaded: "${item.title}"`, "success");
            });
            historyList.appendChild(card);
        });
    } catch (err) {
        historyList.innerHTML = '<p class="history-empty">⚠️ Could not load history.</p>';
    }
}

// =============================================================================
// UTILITIES
// =============================================================================
function setStatus(state, text) {
    const dot        = document.querySelector(".dot-idle, .dot-running, .dot-success, .dot-error");
    const statusText = document.getElementById("status-text");
    if (dot)        dot.className = `dot dot-${state}`;
    if (statusText) statusText.textContent = text;
}

function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => { toast.className = "toast"; }, 3000);
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function clearEditor() {
    document.getElementById("code-editor").value = "";
    document.getElementById("snippet-title").value = "";
    document.getElementById("output-box").innerHTML =
        '<span class="output-placeholder">Output will appear here after you run your code...</span>';
    document.getElementById("code-editor").dispatchEvent(new Event("input"));
    setStatus("idle", "Ready");
}