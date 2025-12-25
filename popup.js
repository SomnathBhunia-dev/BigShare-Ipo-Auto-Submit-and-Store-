function extractBrokerIds(data) {
  const regex = /(GROWW[a-zA-Z0-9]{11})|([a-zA-Z]{2}\d{12})/g;
  const ids = data.match(regex);
  return ids || [];
}

document.addEventListener("DOMContentLoaded", () => {
  const startButton = document.getElementById("start");
  const clearButton = document.getElementById("clear");
  const idsInput = document.getElementById("ids");
  const resultsDiv = document.getElementById("results");
  const statusDiv = document.getElementById("status");
  const resultCountSpan = document.getElementById("result-count");

  // Load and display stored results on popup open
  loadAndDisplayResults();

  startButton.addEventListener("click", () => {
    const rawData = idsInput.value.trim();
    if (!rawData) {
      showStatus("Please enter one or more IDs.", true);
      return;
    }

    const ids = extractBrokerIds(rawData);

    if (ids.length > 0) {
      setProcessingState(true, "Starting job...");
      chrome.runtime.sendMessage({ type: "processIds", ids }, (response) => {
        if (chrome.runtime.lastError) {
          const message = chrome.runtime.lastError.message.includes("Receiving end does not exist")
            ? "Connection Error: Please refresh the IPO status page and try again."
            : `Error: ${chrome.runtime.lastError.message}`;
          setProcessingState(false, message, true);
        } else if (response?.status === "processing") {
          setProcessingState(true, "Processing... Follow the prompts on the page.");
        }
      });
    } else {
      showStatus("No valid IDs found. Please check your input.", true);
    }
  });

  clearButton.addEventListener("click", () => {
    chrome.storage.local.remove("results", () => {
      chrome.storage.session.clear(); // Clear the job queue as well
      loadAndDisplayResults();
      showStatus("Results and job queue cleared.");
      setTimeout(() => {
        statusDiv.classList.add("hidden");
      }, 3000);
    });
  });

  function setProcessingState(isProcessing, message, isError = false) {
    startButton.disabled = isProcessing;
    idsInput.disabled = isProcessing;

    // Update button text/state if needed, or just status div
    const btnText = startButton.querySelector(".btn-text");
    if (btnText) {
      btnText.textContent = isProcessing ? "Processing..." : "Check Status";
    }

    showStatus(message, isError);
  }

  function showStatus(message, isError = false) {
    statusDiv.textContent = message;
    if (message) {
      statusDiv.classList.remove("hidden");
      if (isError) {
        statusDiv.classList.add("error");
      } else {
        statusDiv.classList.remove("error");
      }
    } else {
      statusDiv.classList.add("hidden");
    }
  }

  function loadAndDisplayResults() {
    chrome.storage.local.get("results", (data) => {
      if (data.results && data.results.length > 0) {
        resultsDiv.innerHTML = "";
        // Update count
        if (resultCountSpan) {
          const totalResults = data.results.reduce((acc, curr) => acc + curr.results.length, 0);
          resultCountSpan.textContent = totalResults;
        }

        data.results.forEach(({ company, results }) => {
          const companyContainer = document.createElement("div");
          companyContainer.className = "company-container";

          const companyHeader = document.createElement("h4");
          companyHeader.textContent = company;
          // Color handled by CSS now
          companyContainer.appendChild(companyHeader);

          // --- Pie Chart Logic ---
          let allottedCount = 0;
          let notAllottedCount = 0;

          results.forEach(({ result }) => {
            // 1. Create a temporary element to parse the HTML string
            const parser = new DOMParser();
            const doc = parser.parseFromString(result, 'text/html');

            // 2. Target ONLY the text inside the <td class="alloted">
            const allottedText = doc.querySelector('.alloted label')?.innerText || "";

            // 3. Extract the number from that specific text
            const match = allottedText.match(/\d+/);

            // 4. If the number exists and is > 0, it's Allotted
            if (match && Number(match[0]) > 0) {
              allottedCount++;
            } else {
              notAllottedCount++;
            }
          });

          const total = allottedCount + notAllottedCount;
          const allottedPercent = total > 0 ? (allottedCount / total) * 100 : 0;
          // -----------------------

          // Create Chart Section
          const chartSection = document.createElement("div");
          chartSection.className = "chart-section";

          // Pie Chart Element
          const pieChart = document.createElement("div");
          pieChart.className = "pie-chart";
          // Set gradient: Green for allotted, Red for remaining
          pieChart.style.background = `conic-gradient(var(--success) 0% ${allottedPercent}%, var(--error) ${allottedPercent}% 100%)`;

          // Legend
          const legend = document.createElement("div");
          legend.className = "chart-legend";

          legend.innerHTML = `
            <div class="legend-item">
              <span class="legend-label"><span class="legend-color" style="background: var(--success)"></span>Allotted</span>
              <span class="legend-value">${allottedCount} (${Math.round(allottedPercent)}%)</span>
            </div>
            <div class="legend-item">
              <span class="legend-label"><span class="legend-color" style="background: var(--error)"></span>Not Allotted</span>
              <span class="legend-value">${notAllottedCount} (${Math.round(100 - allottedPercent)}%)</span>
            </div>
          `;

          chartSection.appendChild(pieChart);
          chartSection.appendChild(legend);
          companyContainer.appendChild(chartSection);
          // -----------------------

          results.forEach(({ id, result }) => {
            const resultCard = document.createElement("div");
            resultCard.className = "result-card";

            // Display the full result table directly
            resultCard.innerHTML = result;

            companyContainer.appendChild(resultCard);
          });
          resultsDiv.appendChild(companyContainer);
        });
      } else {
        resultsDiv.innerHTML = '<div class="empty-state"><p>No results yet</p></div>';
        if (resultCountSpan) resultCountSpan.textContent = "0";
      }
    });
  }

  // Listen for storage changes to update the UI in real-time
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local" && changes.results) {
      loadAndDisplayResults();
    }
  });
});
