function getDateString(nDate){
  let nDateDate=nDate.getDate();
  let nDateMonth=nDate.getMonth()+1;
  let nDateYear=nDate.getFullYear();
  if(nDateDate<10){nDateDate="0"+nDateDate;};
  if(nDateMonth<10){nDateMonth="0"+nDateMonth;};
  let presentDate = ""+nDateYear+"-"+nDateMonth+"-"+nDateDate;
  return presentDate;
}
function getDomain(tablink){
    let url =  tablink[0].url;
    return url.split("/")[2];
};

function secondsToString(seconds,compressed=false){
  let hours = parseInt(seconds/3600);
  seconds = seconds%3600;
  let minutes= parseInt(seconds/60);
  seconds = seconds%60;
  let timeString = "";
  if(hours){
    timeString += hours + " hrs ";
  }
  if(minutes){
    timeString += minutes + " min ";
  }
  if(seconds){
    timeString += seconds+ " sec "
  }
  if(!compressed){
    return timeString;
  }
  else{
    if(hours){
      return(`${hours}h`);
    }
    if(minutes){
      return(`${minutes}m`);
    }
    if(seconds){
      return(`${seconds}s`);
    }
  }
};
var allKeys, timeSpent, totalTimeSpent,sortedTimeList,topCount,topDataSet,topLabels,dateChart;
var color = [
  "rgb(84, 105, 255)",   // Blue
  "rgb(135, 85, 255)",   // Lavender/Purple
  "rgb(192, 85, 255)",   // Pinkish Purple
  "rgb(255, 103, 179)",  // Hot Pink
  "rgb(255, 120, 120)",  // Coral Red
  "rgb(255, 153, 102)",  // Orange
  "rgb(255, 187, 85)",   // Light Orange
  "rgb(255, 221, 102)",  // Yellow
  "rgb(204, 255, 102)",  // Light Lime
  "rgb(178, 255, 102)"   // Lime Green
];
totalTimeSpent = 0;
var today = getDateString(new Date())
chrome.storage.local.get(today,function(storedItems){
  allKeys = Object.keys(storedItems[today]);
  timeSpent = [];
  sortedTimeList = [];
  for (let i = 0; i<allKeys.length;i++ ){
    let webURL = allKeys[i];
    timeSpent.push(storedItems[today][webURL]);
    totalTimeSpent+= storedItems[today][webURL];
    sortedTimeList.push([webURL,storedItems[today][webURL]]);
  }
  sortedTimeList.sort((a,b)=>b[1]-a[1]);
  console.log(sortedTimeList);

  topCount = allKeys.length>10 ? 10 : allKeys.length;
  console.log(topCount);

  document.getElementById("totalTimeToday").innerText = secondsToString(totalTimeSpent);
  topDataSet= [];
  topLabels= [];
  for(let j=0;j<topCount;j++){
    topDataSet.push(sortedTimeList[j][1]);
    topLabels.push(sortedTimeList[j][0]);
  }
  

    const webTable = document.getElementById('webList');
    for(let i = 0; i<allKeys.length;i++){
        let webURL = sortedTimeList[i][0];
        let row = document.createElement('tr');
        let serialNumber = document.createElement('td');
        serialNumber.innerText = i+1;
        let siteURL = document.createElement('td');
        siteURL.innerText= webURL;
        let siteTime = document.createElement('td');
        siteTime.innerText = secondsToString(sortedTimeList[i][1]);
        row.appendChild(serialNumber);
        row.appendChild(siteURL);
        row.appendChild(siteTime);
        webTable.appendChild(row);
        console.log(row);
    }

    new Chart(document.getElementById("pie-chart"), {
  type: 'doughnut',
  data: {
    labels: topLabels,
    datasets: [{
      label: "Time Spent",
      backgroundColor: color,
      data: topDataSet
    }]
  },
  options: {
    title: {
      display: true,
      text: "Top Visited Sites Today",
      position: 'top',
      fontSize: 14,
      padding: 10
    },
    legend: {
      display: true,
      position: 'bottom',
      align: 'center',
      labels: {
        boxWidth: 12,
        padding: 10,
        fontStyle: 'bold',
        usePointStyle: true
      }
    },
    circumference: 2*Math.PI,
    rotation: -Math.PI/2,
    layout: {
      padding: {
        bottom: 20 // Extra space for legend
      }
    }
  }
});

});

chrome.storage.local.get(null,function(items){
  let datesStored = Object.keys(items);
  datesStored.sort();
  const calendar = document.getElementById("dateValue");
  let minDate = datesStored[0];
  let maxDate = datesStored[datesStored.length-1];
  calendar.min = minDate;
  calendar.max = maxDate;
});


document.getElementById("dateSubmit").addEventListener('click',function(){
  const calendar = document.getElementById("dateValue");
  if(calendar.value===""){
    document.getElementById("tryAgain").innerText = "Invalid date! Please try again.";
    document.getElementById("tryAgain").classList.remove("d-none");
    // Hide daily stats and table
    document.getElementById("dailyStatsContainer").classList.add("d-none");
    document.getElementById("dailyTableContainer").classList.add("d-none");
  }
  else{
    document.getElementById("tryAgain").classList.add("d-none");
    let givenDate = calendar.value;
    chrome.storage.local.get(givenDate,function(thatDay){
      if(thatDay[givenDate] == null){
        document.getElementById("tryAgain").innerText = "No records exist for this day!";
        document.getElementById("tryAgain").classList.remove("d-none");
        // Hide daily stats and table
        document.getElementById("dailyStatsContainer").classList.add("d-none");
        document.getElementById("dailyTableContainer").classList.add("d-none");
      }
      else{
        // Show daily stats and table
        document.getElementById("dailyStatsContainer").classList.remove("d-none");
        document.getElementById("dailyTableContainer").classList.remove("d-none");
        let sites = Object.keys(thatDay[givenDate]);
        let times=[];
        for(let i=0;i<sites.length;i++){
          times.push([sites[i],thatDay[givenDate][sites[i]]]);
        }
        times.sort(function(a,b){return b[1]-a[1]});
        let topTen = times.length>10? 10:times.length;
        let dataSet = [];
        let thatDayTotal = 0;
        let dataSetLabels = [];
        for(let i=0;i<topTen;i++){
          dataSet.push(times[i][1]);
          dataSetLabels.push(times[i][0]);
          thatDayTotal+= times[i][1];
        }
        let chartTitle = "Top Visited Sites on "+givenDate;
        if(dateChart){
          dateChart.destroy()
        }
         dateChart = new Chart(document.getElementById("differentDayChart"), {
  type: 'doughnut',
  data: {
    labels: dataSetLabels,
    datasets: [{
      label: "Time Spent",
      backgroundColor: color,
      data: dataSet
    }]
  },
  options: {
    title: {
      display: true,
      text: chartTitle,
      position: 'top',
      fontSize: 14,
      padding: 10
    },
    legend: {
      display: true,
      position: 'bottom',
      align: 'center',
      labels: {
        boxWidth: 12,
        padding: 10,
        fontStyle: 'bold',
        usePointStyle: true
      }
    },
    circumference: Math.PI,
    rotation: Math.PI,
    layout: {
      padding: {
        bottom: 20 // Extra space for legend
      }
    }
  }
});
      document.getElementById("statsRow").classList.remove("d-none");
      document.getElementById("totalTimeThatDay").innerText = secondsToString(thatDayTotal);
      const webList2 = document.getElementById("webList2");
      while (webList2.firstChild) {
        webList2.removeChild(webList2.lastChild);
      }
      for(let i=0;i<times.length;i++){
        let row = document.createElement('tr');
        let col1 = document.createElement('td');
        col1.innerText = i+1;
        row.appendChild(col1);
        let col2 = document.createElement('td');
        col2.innerText = times[i][0];
        row.appendChild(col2);
        let col3 = document.createElement('td');
        col3.innerText = secondsToString(times[i][1]);
        row.appendChild(col3);
        webList2.appendChild(row);
      }   
      }
     
    });
  }
});

function getDateTotalTime(storedObject,date){
  let websiteLinks = Object.keys(storedObject[date]);
  let noOfWebsites = websiteLinks.length;
  let totalTime = 0;
  for(let i = 0 ; i<noOfWebsites;i++){
    totalTime+= storedObject[date][websiteLinks[i]];
  }
  return totalTime;
};
var monthNames = ["","Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
document.getElementById('weekTab').addEventListener('click',function(){
  chrome.storage.local.get(null,function(storedItems){
    let datesList = Object.keys(storedItems);
    let noOfDays = datesList.length>=7 ? 7 : datesList.length;
    let timeEachDay= [];
    let dateLabels = [];
    let weeksTotalTime= 0;
    datesList.sort();
    for(let i = datesList.length-noOfDays;i<datesList.length;i++){
      let month = parseInt(datesList[i][5]+datesList[i][6]);
      let label = datesList[i][8]+datesList[i][9]+" "+monthNames[month];
      //0123-56-89
      dateLabels.push(label);
      let dayTime = getDateTotalTime(storedItems,datesList[i]);
      timeEachDay.push(dayTime / 3600); // convert seconds to hours (float)
      weeksTotalTime += dayTime;
    }
    let weeklyAverage = parseInt(weeksTotalTime/noOfDays);
    weeklyAverage = secondsToString(weeklyAverage);
    let weeklyMax = Math.max.apply(Math,timeEachDay) * 3600; // convert back to seconds for display
    weeklyMax = secondsToString(weeklyMax);
    document.getElementById("weekAvg").innerText = weeklyAverage;
    document.getElementById("weekMax").innerText = weeklyMax;
    const weeklyChart = document.getElementById("pastWeek");
    let weeklyChartDetails = {};
    weeklyChartDetails["type"] = 'bar';
    let dataObj = {};
    dataObj["labels"] = dateLabels;
    dataObj["datasets"] = [{
      label: "Time Spent (hrs)",
      backgroundColor: 'rgba(128, 0, 128, 0.7)', // purple
      borderColor: 'rgba(128, 0, 128, 1)',
      borderWidth: 1,
      data: timeEachDay
    }];
    weeklyChartDetails["data"] = dataObj;
    weeklyChartDetails["options"] = {
      legend: { display: false },
      title: { display: true, text: "Time Spent Online in the Recent Past" },
      scales: {
        yAxes: [{
          scaleLabel: { display: true, labelString: "Time in Hours" },
          ticks: { 
            beginAtZero: true,
            stepSize: 1,
            callback: function(value) {
              if (value === 1) return "1 hr";
              if (value === 0) return "0";
              return value + " hr";
            }
          }
        }]
      }
    };
    new Chart(weeklyChart, weeklyChartDetails);
  });
});

// Show App Limits UI when navbar link is clicked
document.getElementById('appLimitsNav').addEventListener('click', function(e) {
  e.preventDefault();
  document.querySelector('.small').style.display = 'none';
  document.querySelector('.container').style.display = 'none';
  document.getElementById('appLimitsContainer').style.display = 'block';
});

// Back to Dashboard button
document.getElementById('backToDashboardBtn').addEventListener('click', function() {
  document.getElementById('appLimitsContainer').style.display = 'none';
  document.querySelector('.small').style.display = '';
  document.querySelector('.container').style.display = '';
});

// Optionally, handle Dashboard navbar click to always show dashboard
document.getElementById('dashboardNav').addEventListener('click', function(e) {
  e.preventDefault();
  document.getElementById('appLimitsContainer').style.display = 'none';
  document.querySelector('.small').style.display = '';
  document.querySelector('.container').style.display = '';
});

// popup scripts control the behavior of the extension's popup window
window.onload = function () {
  updateBlockedWebsitesSection();
  var blockButton = document.getElementById("blockButton");
  blockButton.onclick = function () {
    getWebsiteInput();
  };
};

function getWebsiteInput() {
  var websiteInput = document.getElementById("websiteInput").value.trim();
  // If user clicks the -Block- button without entering input -> Alert Error
  if (!websiteInput) {
    alert("Error: please enter a website URL");
  } else {
    // Normalize input (add www. if missing and no protocol)
    if (!websiteInput.includes("://") && !websiteInput.startsWith("www.")) {
      websiteInput = "www." + websiteInput;
    }
    
    console.log("Attempting to block:", websiteInput);
    
    // Retrieve the blockedWebsitesArray from Chrome browser, or initialize a new one
    chrome.storage.sync.get("blockedWebsitesArray", function (data) {
      var blockedWebsitesArray = data.blockedWebsitesArray || [];
      console.log("Current blocked sites:", blockedWebsitesArray);
      
      // Check if site is already blocked
      const isInputInArray = blockedWebsitesArray.some(
        (item) => item.toLowerCase() === websiteInput.toLowerCase()
      );
      
      if (isInputInArray) {
        alert("Error: URL is already blocked");
      } else {
        blockedWebsitesArray.push(websiteInput);
        chrome.storage.sync.set(
          { blockedWebsitesArray: blockedWebsitesArray },
          function () {
            console.log("Updated blocked sites:", blockedWebsitesArray);
            // Update the UI after the storage operation is complete
            updateBlockedWebsitesSection();
            document.getElementById("websiteInput").value = "";
            document.getElementById("websiteInput").focus();
          }
        );
      }
    });
  }
}

// Update the Popup's 'Blocked Websites' Section to current state
function updateBlockedWebsitesSection() {
  // Retrieve the blockedWebsitesDiv
  const blockedWebsitesDiv = document.getElementById("blockedWebsitesDiv");
  // Clear the blockedWebsitesDiv by removing all its child elements
  while (blockedWebsitesDiv && blockedWebsitesDiv.firstChild) {
    blockedWebsitesDiv.removeChild(blockedWebsitesDiv.firstChild);
  }
  // Get the stored array of blocked websites
  chrome.storage.sync.get("blockedWebsitesArray", function (data) {
    const blockedWebsitesArray = data.blockedWebsitesArray || [];
    // Check if the array is empty
    if (blockedWebsitesArray && blockedWebsitesArray.length > 0) {
      // If the array is not empty, remove the message that says 'No websites have been blocked' (if it exists)
      const nothingBlockedDiv = document.querySelector(".nothingBlocked");
      if (nothingBlockedDiv != null) {
        blockedWebsitesDiv.removeChild(nothingBlockedDiv);
      }
      // then iterate through each item in the stored array of Blocked Websites
      blockedWebsitesArray.forEach((website, index) => {
        // Create a new div for each URL
        const websiteDiv = document.createElement("div");
        // Add class (for styling) to websiteDiv block
        websiteDiv.classList.add("websiteDiv");
        // Create div for 'website text'
        const websiteDivText = document.createElement("div");
        websiteDivText.classList.add("websiteDivText");
        websiteDivText.textContent = website;
        // Append the websiteDivText to websiteDiv
        websiteDiv.appendChild(websiteDivText);
        // Create the unblock button
        const deleteButton = document.createElement("button");
        deleteButton.classList.add("delete"); // Add CSS class for styling
        // Create an id value for the array item
        deleteButton.setAttribute("id", index);
        // Add text instead of relying on Font Awesome
        deleteButton.textContent = "X";
        // Add onClick function to each delete button
        deleteButton.addEventListener("click", unblockURL);
        // Append the delete button to the websiteDiv
        websiteDiv.appendChild(deleteButton);
        // Append the websiteDiv to the blockedWebsitesDiv
        blockedWebsitesDiv.appendChild(websiteDiv);
      });
    } else {
      // If the array is empty, create the message element
      const nothingBlocked = document.createElement("div");
      nothingBlocked.textContent = "No websites have been blocked";
      nothingBlocked.classList.add("nothingBlocked");
      blockedWebsitesDiv.appendChild(nothingBlocked);
    }
  });
}

function unblockURL(event) {
  // Get the index from the button
  const clickedButtonId = event.target.id;
  console.log("Unblocking website at index:", clickedButtonId);
  
  // Get the blockedWebsitesArray
  chrome.storage.sync.get("blockedWebsitesArray", function (data) {
    let blockedWebsitesArray = data.blockedWebsitesArray || [];
    for (let i = 0; i < blockedWebsitesArray.length; i++) {
      if (clickedButtonId == i) {
        console.log("Removing:", blockedWebsitesArray[i]);
        blockedWebsitesArray.splice(i, 1);
        break; // Exit the loop after removing the element
      }
    }
    // Save the updated array back to Chrome storage
    chrome.storage.sync.set({ blockedWebsitesArray: blockedWebsitesArray }, function() {
      console.log("Updated block list:", blockedWebsitesArray);
      updateBlockedWebsitesSection();
    });
  });
}