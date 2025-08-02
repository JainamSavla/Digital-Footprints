console.log("Digital Footprints content script loaded");

// Get current hostname and URL
const currentURL = window.location.href;
const currentHostname = window.location.hostname.toLowerCase();
const normalizedHostname = currentHostname.replace(/^www\./i, "");

console.log("Current URL:", currentURL);
console.log("Current hostname:", currentHostname);
console.log("Normalized hostname:", normalizedHostname);

// Improve blocking check to properly handle time limits
function checkIfBlocked() {
  return new Promise((resolve) => {
    const today = getDateString(new Date());
    
    chrome.storage.sync.get(["blockedWebsitesArray", "websiteTimeLimits"], function (data) {
      const blockedSites = data.blockedWebsitesArray || [];
      const timeLimits = data.websiteTimeLimits || {};
      
      console.log("Checking blocked sites:", blockedSites);
      console.log("Checking time limits:", timeLimits);
      
      // First check if site is in the permanent blocklist
      for (let site of blockedSites) {
        let cleanSite = site
          .toLowerCase()
          .trim()
          .replace(/^https?:\/\//i, "")
          .replace(/^www\./i, "")
          .replace(/\/.*$/, "");
        
        // Check for a match
        if (normalizedHostname === cleanSite || 
            normalizedHostname.endsWith("." + cleanSite) ||
            normalizedHostname.includes(cleanSite)) {
          console.log("Site is in permanent blocklist");
          resolve({ blocked: true, reason: "permanent" });
          return;
        }
      }
      
      // Then check time limits
      chrome.storage.local.get(today, function(todayData) {
        const todayUsage = todayData[today] || {};
        
        // Check each site with time limits
        for (const site in timeLimits) {
          let cleanSite = site
            .toLowerCase()
            .trim()
            .replace(/^https?:\/\//i, "")
            .replace(/^www\./i, "")
            .replace(/\/.*$/, "");
          
          // Check for a match
          if (normalizedHostname === cleanSite || 
              normalizedHostname.endsWith("." + cleanSite) ||
              normalizedHostname.includes(cleanSite)) {
            
            const timeLimit = timeLimits[site];
            const timeUsed = todayUsage[site] || 0;
            
            console.log(`Site has time limit: ${timeLimit}s, used: ${timeUsed}s`);
            
            // Check if time limit reached
            if (timeUsed >= timeLimit) {
              console.log("Time limit reached, blocking site");
              resolve({ 
                blocked: true, 
                reason: "timelimit", 
                timeLimit: timeLimit,
                timeUsed: timeUsed
              });
              return;
            }
          }
        }
        
        // Not blocked
        resolve({ blocked: false });
      });
    });
  });
}

// Helper function to get date string
function getDateString(date) {
  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  
  if (month < 10) month = "0" + month;
  if (day < 10) day = "0" + day;
  
  return `${year}-${month}-${day}`;
}

// Update block page to show reason
function blockPage(blockInfo) {
  console.log("BLOCKING", currentHostname, "Reason:", blockInfo.reason);
  
  // Stop all loading immediately
  window.stop();
  
  // Clear the page content
  document.head.innerHTML = "";
  document.body.innerHTML = "";
  
  let reasonMessage = "This website has been blocked by Digital Footprints";
  
  // Customize message based on block reason
  if (blockInfo.reason === "timelimit") {
    const minutes = Math.floor(blockInfo.limit / 60);
    reasonMessage = `You've reached your time limit of ${minutes} minutes for today`;
  }
  
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
        <p>${reasonMessage}</p>
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
    
    const blockResult = await checkIfBlocked();
    console.log("Block check result:", blockResult);
    
    if (blockResult.blocked) {
      blockPage(blockResult);
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
  if ((changes.blockedWebsitesArray || changes.websiteTimeLimits) && namespace === 'sync') {
    console.log('Block list or time limits updated, rechecking...');
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