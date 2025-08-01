console.log("Digital Footprints content script loaded");

// Get current hostname and URL
const currentURL = window.location.href;
const currentHostname = window.location.hostname.toLowerCase();
const normalizedHostname = currentHostname.replace(/^www\./i, "");

console.log("Current URL:", currentURL);
console.log("Current hostname:", currentHostname);
console.log("Normalized hostname:", normalizedHostname);

// Function to block the current page
function blockPage() {
  console.log("BLOCKING", currentHostname);

  // Stop all loading immediately
  window.stop();

  // Clear the page content
  document.head.innerHTML = "";
  document.body.innerHTML = "";

  // Create the blocked page content
  const blockedHTML = `
    <head>
      <title>Site Blocked - Digital Footprints</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          background: linear-gradient(135deg, #174b42 0%, #2d7a6b 100%);
          color: white;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          text-align: center;
          overflow: hidden;
        }
        .container {
          max-width: 600px;
          padding: 40px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        h1 {
          font-size: 3.5em;
          margin-bottom: 20px;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        .blocked-icon {
          font-size: 5em;
          margin-bottom: 30px;
          color: #ff6b6b;
        }
        p {
          font-size: 1.3em;
          line-height: 1.6;
          margin-bottom: 15px;
          opacity: 0.9;
        }
        .website-name {
          color: #ffd93d;
          font-weight: bold;
          font-size: 1.1em;
        }
        .footer {
          margin-top: 30px;
          font-size: 0.9em;
          opacity: 0.7;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="blocked-icon">🚫</div>
        <h1>Access Blocked</h1>
        <p>This website has been blocked by <strong>Digital Footprints</strong></p>
        <p>Blocked site: <span class="website-name">${currentHostname}</span></p>
        <div class="footer">
          <p>Manage your blocked sites in the extension popup</p>
        </div>
      </div>
    </body>
  `;

  // Replace the entire document
  document.open();
  document.write(blockedHTML);
  document.close();

  // Prevent any further navigation
  window.addEventListener('beforeunload', function(e) {
    e.preventDefault();
    return '';
  });
}

// Improved function to check if current site should be blocked
function checkIfBlocked() {
  return new Promise((resolve) => {
    chrome.storage.sync.get("blockedWebsitesArray", function (data) {
      const blockedSites = data.blockedWebsitesArray || [];
      console.log("Checking blocked sites:", blockedSites);
      console.log("Against current site:", normalizedHostname);

      if (!blockedSites || blockedSites.length === 0) {
        resolve(false);
        return;
      }

      for (let site of blockedSites) {
        // Clean up the site URL for comparison
        let cleanSite = site
          .toLowerCase()
          .trim()
          .replace(/^https?:\/\//i, "")  // Remove protocol
          .replace(/^www\./i, "")        // Remove www.
          .replace(/\/.*$/, "");         // Remove path

        console.log(`Comparing "${normalizedHostname}" with "${cleanSite}"`);

        // Check for various matching patterns
        const isBlocked = 
          normalizedHostname === cleanSite ||                    // Exact match
          normalizedHostname.endsWith("." + cleanSite) ||        // Subdomain
          cleanSite.includes(normalizedHostname) ||              // Partial match
          normalizedHostname.includes(cleanSite) ||              // Contains blocked domain
          currentHostname === site ||                            // Direct match with www
          currentHostname === "www." + site ||                   // www version
          site === "www." + currentHostname;                     // Reverse www check

        if (isBlocked) {
          console.log(`Site blocked! Matched rule: ${site}`);
          resolve(true);
          return;
        }
      }

      resolve(false);
    });
  });
}

// Function to initialize blocking check
async function initializeBlocking() {
  try {
    // Skip blocking for extension pages and special URLs
    if (currentURL.startsWith('chrome://') || 
        currentURL.startsWith('chrome-extension://') || 
        currentURL.startsWith('moz-extension://') ||
        currentURL.startsWith('about:') ||
        currentURL.startsWith('file://')) {
      console.log("Skipping blocking for special URL:", currentURL);
      return;
    }

    const shouldBlock = await checkIfBlocked();
    if (shouldBlock) {
      blockPage();
    }
  } catch (error) {
    console.error("Error checking blocked sites:", error);
  }
}

// Run blocking check immediately if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeBlocking);
} else {
  initializeBlocking();
}

// Also run on page load as backup
window.addEventListener('load', initializeBlocking);

// Listen for storage changes to update blocking in real-time
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (changes.blockedWebsitesArray && namespace === 'sync') {
    console.log('Block list updated, rechecking...');
    initializeBlocking();
  }
});

// Prevent navigation to blocked sites
window.addEventListener('beforeunload', async function(e) {
  const shouldBlock = await checkIfBlocked();
  if (shouldBlock) {
    e.preventDefault();
    e.returnValue = '';
    return '';
  }
});

console.log("Content script initialization complete");