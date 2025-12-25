chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "processIds") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0 && tabs[0].id) {
        sendResponse({ status: "processing" });
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: processIdsInPage,
          args: [message.ids],
        });
      } else {
        sendResponse({ status: "error", message: "No active tab found." });
      }
    });
    return true; // Indicate async response
  }
});

// This function is injected into the page and executes the entire job.
async function processIdsInPage(ids) {
  // --- Utility: Waits for an element to be available and visible ---
  const waitForElement = (selector, timeout = 5000) => {
    return new Promise((resolve) => {
      const interval = 100;
      const endTime = Date.now() + timeout;
      const check = () => {
        const element = document.querySelector(selector);
        if (element && window.getComputedStyle(element).display !== 'none') {
          resolve(element);
        } else if (Date.now() < endTime) {
          setTimeout(check, interval);
        } else {
          resolve(null);
        }
      };
      check();
    });
  };

  // --- Main Logic ---
  const data = await chrome.storage.local.get("results");
  const allResults = data.results || [];

  const ipoName = document.querySelector("#ddlCompany option:checked")?.textContent.trim() || "Unknown IPO";

  for (const id of ids) {
    let captchaIsValid = false;

    // This loop will continue until a valid CAPTCHA is entered for the CURRENT ID.
    while (!captchaIsValid) {
      // CRITICAL FIX 1: Re-acquire all elements on every attempt.
      const inputField = await waitForElement("#txtapplication");
      const submitButton = await waitForElement("#btn_Search");
      const captchaElement = await waitForElement("#captcha-input");

      if (!inputField || !submitButton || !captchaElement) {
        alert("Could not find required page elements. Please refresh and try again.");
        return; // End the entire script
      }

      inputField.value = id;

      const captchaDiv = await waitForElement(".captcha_sec");
      if (captchaDiv) captchaDiv.style.backgroundColor = "white";
      await new Promise(res => setTimeout(res, 200)); // Short delay to make the highlight visible

      const captchaInput = prompt(`Enter 6-digit CAPTCHA for ID: ${id}`);
      if (captchaInput === null) {
        alert("Process cancelled by user.");
        return; // End the entire script
      }
      if (!/^\d{6}$/.test(captchaInput)) {
        alert("Invalid CAPTCHA. Please try again.");
        continue; // Ask for CAPTCHA again
      }

      captchaElement.value = captchaInput;
      submitButton.click();

      // CRITICAL FIX 2: Race to see what appears first.
      const raceResult = await Promise.race([
        waitForElement("#lblcaptcha").then(el => ({ type: 'error', element: el })),
        waitForElement("#dPrint").then(el => ({ type: 'success', element: el }))
      ]);

      if (raceResult.type === 'error') {
        // FLOW: Incorrect CAPTCHA
        alert("Incorrect CAPTCHA. Please try again for the same ID.");
        // Hide the error so we don't instantly detect it on the next loop.
        raceResult.element.style.display = 'none';
        // 'captchaIsValid' remains false, so the 'while' loop will repeat.
      } else if (raceResult.type === 'success') {
        // FLOW: Correct CAPTCHA
        captchaIsValid = true; // This will break the 'while' loop.

        // Add a small delay to ensure the page content has updated
        await new Promise(res => setTimeout(res, 250));

        const resultHTML = raceResult.element.innerHTML;

        // Save the result
        const companyIndex = allResults.findIndex(r => r.company === ipoName);
        let companyResults;

        if (companyIndex > -1) {
          // Company exists, remove it from its current position to move it to the top later.
          companyResults = allResults.splice(companyIndex, 1)[0];
        } else {
          // This is a new company.
          companyResults = { company: ipoName, results: [] };
        }

        // Add the new result to the beginning of this company's result list, if it's not a duplicate.
        if (!companyResults.results.some(r => r.id === id)) {
          companyResults.results.push({ id, result: resultHTML });
        }

        // Add the company back to the beginning of the main list.
        allResults.unshift(companyResults);

        await chrome.storage.local.set({ results: allResults }); // Save immediately after each success
        // --- AGGRESSIVE SCROLL LOCK ---
        // This will fight the website's own scroll behavior to keep the form centered.
        const formContainer = document.querySelector(".container3");
        const noRecordAlert = document.querySelector(".sweet-alert");

        if (noRecordAlert) noRecordAlert.style.display = 'none';

        if (formContainer) {
          const scrollInterval = setInterval(() => {
            formContainer.scrollIntoView({ block: 'center', inline: 'center' });
          }, 50); // Re-center every 50ms
          // Stop the scroll lock after half a second.
          setTimeout(() => clearInterval(scrollInterval), 500);
        }

        // The form is now scrolled into view at the start of the next loop.
      } else {
        alert("Could not determine result. The script will stop.");
        return;
      }
    } // End of while loop for the current ID
  } // End of for loop for all IDs
}