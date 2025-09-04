(function () {
  function addButton() {
    if (document.getElementById("deepfake-check-btn")) return;

    const btn = document.createElement("button");
    btn.id = "deepfake-check-btn";
    btn.innerText = "Check Deepfake";
    btn.style.position = "absolute";
    btn.style.top = "10px";
    btn.style.right = "10px";
    btn.style.zIndex = "9999";
    btn.style.padding = "8px 12px";
    btn.style.background = "#d32f2f";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.borderRadius = "6px";
    btn.style.cursor = "pointer";

    btn.onclick = () => {
      const videoUrl = window.location.href;
      chrome.runtime.sendMessage(
        { action: "analyzeVideo", url: videoUrl },
        (response) => {
          if (response && response.result) {
            alert(
              `Verdict: ${response.result.status.toUpperCase()}\nConfidence: ${response.result.confidence || "?"}`,
            );
          } else {
            alert("Error analyzing video.");
          }
        },
      );
    };

    const target = document.querySelector("#above-the-fold") || document.body;
    target.appendChild(btn);
  }

  const observer = new MutationObserver(() => {
    if (window.location.href.includes("youtube.com/watch")) {
      addButton();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
