document.getElementById("checkBtn").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let videoUrl = tab.url;

  document.getElementById("result").textContent = "Analyzing...";

  try {
    let res = await fetch("http://localhost:5000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: videoUrl }),
    });

    if (!res.ok) throw new Error("Backend not responding");

    let data = await res.json();
    document.getElementById("result").textContent =
      "Result: " + (data.status || "Unknown");
  } catch (err) {
    document.getElementById("result").textContent = "Backend not available.";
    document.getElementById("fallback").innerHTML = `
      <a href="https://colab.research.google.com/" target="_blank">
        Run on Colab instead
      </a>`;
  }
});
