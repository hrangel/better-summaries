// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });


//example of using a message handler from the inject scripts
chrome.runtime.onConnect.addListener(function(port) {
  console.assert(port.name == "listenScores");
  port.onMessage.addListener(function(msg) {
    if (msg == 'listenScores') {
      chrome.webRequest.onCompleted.addListener(
        function(details) {
          port.postMessage('RE-CALCULATE');
          return {}; 
        },
        {urls: ["<all_urls>"]},
        ["responseHeaders"]);
    }
  });
});