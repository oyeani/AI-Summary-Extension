chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get([GeminiAPIKey], (result) => {
        if(!result[GeminiAPIKey])
             {chrom.tabs.create({url: "options.html"});}
        });
});
