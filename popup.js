document.getElementById("summarize").addEventListener("click", ()=> {
    const result = document.getElementById("result");
    const summaryType = document.getElementById("summary-type").value;

    result.innerHTML = '<div class="loader"></div>'

    // 1. Get the user's API key, then continue
    chrome.storage.sync.get(["geminiApiKey"], ({ geminiApiKey }) => {
        if (!geminiApiKey) {
            result.textContent = "No API key set. Click the gear icon to add one.";
            return;
        }

        // 2. Ask content.js for the page text
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            chrome.tabs.sendMessage(
                tab.id,
                { type: "GET_ARTICLE_TEXT" },
                async (response) => {
                    if (chrome.runtime.lastError) {
                        result.textContent = "Error: " + chrome.runtime.lastError.message;
                        return;
                    }
                    
                    const { text } = response || {};
                    if (!text) {
                        result.textContent = "Couldn't extract text from this page.";
                        return;
                    }
                    
                    // 3. Send text to Gemini
                    try {
                        const summary = await getGeminiSummary(text, summaryType, geminiApiKey);
                        result.textContent = summary || "No summary generated.";
                    } catch (error) {
                        console.error(error);
                        result.textContent = "Failed to generate summary: " + error.message;
                    }
                }
            );
        });
    });
});
    
async function getGeminiSummary(rawText,type,apiKey) {
    const max = 20000;
    const text = rawText.length > max ? rawText.slice(0, max)+ "..." : rawText;

    const promptMap = {
        brief: `Summarize in 2-3 sentences:\n\n${text}`,
        detailed: `Give a detailed summary:\n\n${text}`,
        bullets: `Summarize in 5-7 bullet points (start each line with "- "):\n\n${text}`
    };
    const prompt = promptMap[type] || promptMap.brief;

    const res = await fetch (
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2 },
            })
        }
    );
    if (!res.ok){
        const { error } = await res.json();
        throw new Error(error?.message || "Request failed");
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No summary. ";
}
     
document.getElementById("copy-btn").addEventListener('click',()=> {
    const txt = document.getElementById("result").innerText;
    if (!txt) return;

    navigator.clipboard.writeText(txt).then(() => {
    const btn = document.getElementById("copy-btn");
    const old = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = old), 2000);
    });
});