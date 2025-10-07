function getArticleText() {
    // First try <article>
    const article = document.querySelector("article");
    if (article) return article.innerText;
    
    // Then try <p>
    const paragraphs = Array.from(document.querySelectorAll("p"));
    if (paragraphs.length > 0) {
        return paragraphs.map((p) => p.innerText).join("\n");
    }
    
    // Fallback: find the largest text-heavy <div>
    let largestBlock = "";
    const divs = Array.from(document.querySelectorAll("div"));
    divs.forEach(div => {
        const text = div.innerText.trim();
        if (text.split(/\s+/).length > largestBlock.split(/\s+/).length) {
            largestBlock = text;
        }
    });

    return largestBlock || "No readable text found.";
}

chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
    if((req.type === "GET_ARTICLE_TEXT")) {
        const text = getArticleText();
        sendResponse({ text });
    }
    return true;
});