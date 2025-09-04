chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "analyzeVideo") {
    fetch("http://localhost:5000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: message.url }),
    })
      .then((res) => res.json())
      .then((data) => {
        sendResponse({ result: data });
      })
      .catch((err) => {
        sendResponse({ result: { status: "error", message: err.toString() } });
      });
    return true; // keep channel open for async
  }
});
