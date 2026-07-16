document.addEventListener("DOMContentLoaded", () => {

    const toggleBtn =
        document.getElementById(
            "chat-toggle"
        );

    const chatContainer =
        document.getElementById(
            "chat-container"
        );

    const input =
        document.getElementById(
            "user-input"
        );

    const chatBox =
        document.getElementById(
            "chat-box"
        );

    const minimizeBtn =
        document.getElementById(
            "chat-minimize"
        );

    const menuToggle =
        document.getElementById(
            "menu-toggle"
        );

    const menuDropdown =
        document.getElementById(
            "menu-dropdown"
        );

    const historyList =
        document.getElementById(
            "history-list"
        );

    const historySearch =
        document.getElementById(
            "history-search"
        );

    const newChatBtn =
        document.getElementById(
            "new-chat-btn"
        );

    // ================= SESSION DATA =================

    let sessions = [];

    let activeSessionId = null;

    // ================= OPEN CHAT =================

    if (toggleBtn) {

        toggleBtn.addEventListener(
            "click",
            () => {

                chatContainer.classList.add(
                    "active"
                );

                document.body.classList.add(
                    "chat-open"
                );

                toggleBtn.style.display =
                    "none";

            }
        );
    }

    // ================= CLOSE CHAT =================

    if (minimizeBtn) {

        minimizeBtn.addEventListener(
            "click",
            () => {

                chatContainer.classList.remove(
                    "active"
                );

                document.body.classList.remove(
                    "chat-open"
                );

                toggleBtn.style.display =
                    "flex";

            }
        );
    }

    // ================= MENU =================

    if (menuToggle) {

        menuToggle.addEventListener(
            "click",
            (e) => {

                e.stopPropagation();

                menuDropdown.classList.toggle(
                    "show"
                );

            }
        );
    }

    document.addEventListener(
        "click",
        () => {

            if (menuDropdown) {

                menuDropdown.classList.remove(
                    "show"
                );
            }
        }
    );

    // ================= AUTO SCROLL =================

    function scrollToBottom() {

        if (!chatBox)
            return;

        chatBox.scrollTop =
            chatBox.scrollHeight;
    }

    // ================= LOAD SESSIONS =================

    async function loadSessions() {

        const email =
            localStorage.getItem(
                "email"
            );

        if (
            !email ||
            !historyList
        ) return;

        try {

            const response =
                await fetch(
                    `http://localhost:5000/api/chat-session/user/${email}`
                );

            const data =
                await response.json();

            sessions =
                data || [];

            renderSessions(
                sessions
            );

        } catch (error) {

            console.error(
                "Session Load Error:",
                error
            );
        }
    }

        // ================= RENDER SESSIONS =================

    function renderSessions(
        sessionData
    ) {

        if (!historyList)
            return;

        historyList.innerHTML = "";

        sessionData.forEach(
            (session) => {

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "history-item";

                if (
                    activeSessionId ===
                    session.id
                ) {

                    item.classList.add(
                        "active-chat"
                    );
                }

                item.innerHTML = `

                    <div class="history-content">

                        <div class="history-title">
                            ${
                                session.title ||
                                "New Chat"
                            }
                        </div>

                        <div class="history-time">
                            ${
                                session.createdAt
                                ?
                                new Date(
                                    session.createdAt
                                ).toLocaleDateString()
                                :
                                ""
                            }
                        </div>

                    </div>

                    <button
                        class="delete-history-btn"
                        data-id="${session.id}"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

                `;

                item.addEventListener(
                    "click",
                    () => {

                        activeSessionId =
                            session.id;

                        renderSessions(
                            sessions
                        );

                        openSession(
                            session.id
                        );

                    }
                );

                historyList.appendChild(
                    item
                );
            }
        );
    }

    // ================= OPEN SESSION =================

    async function openSession(
        sessionId
    ) {

        try {

            const response =
                await fetch(
                    `http://localhost:5000/api/chat-session/${sessionId}`
                );

            const messages =
                await response.json();

            chatBox.innerHTML = "";

            messages.forEach(
                (msg) => {

                    addMessage(
                        msg.message,
                        msg.sender === "user"
                        ? "user"
                        : "bot"
                    );

                }
            );

            scrollToBottom();

        } catch (error) {

            console.error(
                "Open Session Error:",
                error
            );
        }
    }

    // ================= SEARCH SESSION =================

    if (historySearch) {

        historySearch.addEventListener(
            "input",
            (e) => {

                const text =
                    e.target.value
                    .toLowerCase()
                    .trim();

                if (!text) {

                    renderSessions(
                        sessions
                    );

                    return;
                }

                const filtered =
                    sessions.filter(
                        session => {

                            return (
                                session.title ||
                                ""
                            )
                            .toLowerCase()
                            .includes(
                                text
                            );

                        }
                    );

                renderSessions(
                    filtered
                );

            }
        );
    }

        // ================= DELETE SESSION =================

    document.addEventListener(
        "click",
        async (e) => {

            const deleteBtn =
                e.target.closest(
                    ".delete-history-btn"
                );

            if (!deleteBtn)
                return;

            e.preventDefault();

            e.stopPropagation();

            const sessionId =
                deleteBtn.dataset.id;

            const ok =
                confirm(
                    "Delete this chat session?"
                );

            if (!ok)
                return;

            try {

                await fetch(
                    `http://localhost:5000/api/chat-session/${sessionId}`,
                    {
                        method: "DELETE"
                    }
                );

                if (
                    activeSessionId ==
                    sessionId
                ) {

                    activeSessionId =
                        null;

                    newChat();
                }

                await loadSessions();

            } catch (error) {

                console.error(
                    "Delete Session Error:",
                    error
                );
            }

        }
    );

    // ================= CREATE SESSION =================

    async function createSession(
        firstMessage
    ) {

        const email =
            localStorage.getItem(
                "email"
            );

        try {

            const response =
                await fetch(
                    "http://localhost:5000/api/chat-session/create",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                        JSON.stringify({

                            email: email,

                            title:
                                firstMessage.substring(
                                    0,
                                    40
                                )

                        })
                    }
                );

            const session =
                await response.json();

            activeSessionId =
                session.id;

            await loadSessions();

            return session.id;

        } catch (error) {

            console.error(
                "Create Session Error:",
                error
            );

            return null;
        }
    }

    // ================= NEW CHAT =================

    if (newChatBtn) {

        newChatBtn.addEventListener(
            "click",
            () => {

                activeSessionId =
                    null;

                renderSessions(
                    sessions
                );

                newChat();
            }
        );
    }

    // ================= RESET CHAT =================

    window.newChat =
    function () {

        activeSessionId =
            null;

        renderSessions(
            sessions
        );

        chatBox.innerHTML = `

            <div class="bot-msg welcome-msg">

                👋 Hi, I'm <b>ArchiAI</b>

                <br><br>

                Try asking:

                <br>📊 Project Insights
                <br>🔥 Most Important Project
                <br>📅 Nearest Deadline
                <br>🚨 Future Risk Projects
                <br>📁 Show All Projects
                <br>⚠️ Delayed Projects

            </div>

        `;

        scrollToBottom();
    };

    /* ================= SEND MESSAGE ================= */

window.sendMessage =
async function () {

    const msg =
        input.value.trim();

    if (!msg)
        return;

    const token =
        localStorage.getItem(
            "token"
        );

    const email =
        localStorage.getItem(
            "email"
        );

    if (
        !token ||
        !email
    ) {

        addMessage(
            "🔒 Please login to access ArchiAI.",
            "bot"
        );

        return;
    }

    // ================= CREATE SESSION FIRST TIME =================

    if (
        activeSessionId ===
        null
    ) {

        const sessionId =
            await createSession(
                msg
            );

        if (
            sessionId
        ) {

            activeSessionId =
                sessionId;
        }
    }

    // ================= USER MESSAGE =================

    addMessage(
        msg,
        "user"
    );

    input.value = "";

    const loading =
        typingLoader();

    try {

        const response =
            await fetch(
                "http://127.0.0.1:8000/chat",
                {
                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " +
                            token
                    },

                    body:
                    JSON.stringify({

                        message:
                            msg,

                        email:
                            email,

                        sessionId:
                            activeSessionId

                    })
                }
            );

        const data =
            await response.json();

        loading.remove();

        const reply =
            formatResponse(
                data
            );

        const botDiv =
            addMessage(
                "",
                "bot"
            );

        botDiv.innerHTML =
            reply.replace(
                /\n/g,
                "<br>"
            );

        scrollToBottom();

        // ================= REFRESH SIDEBAR =================

        setTimeout(
            async () => {

                await loadSessions();

            },
            300
        );

    } catch (error) {

        loading.innerHTML = `

⚠️ Unable to connect
to ArchiAI server.

Please check:

1. FastAPI running
2. Port 8000 active
3. Backend reachable

`;

        console.error(
            error
        );
    }
};

/* ================= ENTER KEY ================= */

if (input) {

    input.addEventListener(
        "keypress",
        (e) => {

            if (
                e.key ===
                "Enter"
            ) {

                sendMessage();
            }
        }
    );
}

/* ================= QUICK ACTIONS ================= */

window.quickMsg =
function (msg) {

    input.value =
        msg;

    sendMessage();
};

/* ================= CLEAR ALL HISTORY ================= */

window.clearChat =
async function () {

    const email =
        localStorage.getItem(
            "email"
        );

    if (!email)
        return;

    const ok =
        confirm(
            "Clear all chat sessions?"
        );

    if (!ok)
        return;

    try {

        const sessionsResponse =
            await fetch(
                `http://localhost:5000/api/chat-session/user/${email}`
            );

        const allSessions =
            await sessionsResponse.json();

        for (
            const session
            of allSessions
        ) {

            await fetch(
                `http://localhost:5000/api/chat-session/${session.id}`,
                {
                    method:
                        "DELETE"
                }
            );
        }

        sessions = [];

        activeSessionId =
            null;

        historyList.innerHTML =
            "";

        newChat();

    } catch (error) {

        console.error(
            "Clear Chat Error:",
            error
        );
    }
};

/* ================= ABOUT AI ================= */

window.aboutAI =
function () {

    addMessage(

`🏗️ ArchiAI

Your AI Project Assistant

Features:

📊 Project Insights
📁 Project Tracking
⚠️ Risk Detection
📅 Deadline Monitoring
🔥 Priority Analysis
🚨 Future Risk Prediction
💡 Smart Suggestions

Version: 4.0

Powered by:
FastAPI + Spring Boot + Groq AI`,

        "bot"
    );
};

/* ================= EXPORT CHAT ================= */

window.exportChat =
function () {

    const content =
        chatBox.innerText;

    const blob =
        new Blob(
            [content],
            {
                type:
                    "text/plain"
            }
        );

    const link =
        document.createElement(
            "a"
        );

    link.href =
        URL.createObjectURL(
            blob
        );

    link.download =
        "ArchiAI-Chat.txt";

    document.body.appendChild(
        link
    );

    link.click();

    document.body.removeChild(
        link
    );
};


/* ================= ADD MESSAGE ================= */

function addMessage(message, type) {

    if (!chatBox)
        return null;

    const div =
        document.createElement("div");

    div.className =
        type === "user"
            ? "user-msg"
            : "bot-msg";



    div.innerHTML = `

        <div class="msg-text">
            ${(message || "").replace(/\n/g, "<br>")}
        </div>

    `;

    chatBox.appendChild(div);

    scrollToBottom();

    return div;
}

/* ================= TYPING LOADER ================= */

function typingLoader() {

    const div =
        document.createElement("div");

    div.className =
        "bot-msg";

    div.innerHTML = `

        <div class="typing-bubble">

            <span></span>
            <span></span>
            <span></span>

        </div>

    `;

    chatBox.appendChild(div);

    scrollToBottom();

    return div;
}

/* ================= FORMAT RESPONSE ================= */

function formatResponse(data) {

    if (!data)
        return "";

    return data.reply || "";
}


/* ================= INITIAL LOAD ================= */

loadSessions();

/* ================= AUTO WELCOME ================= */

setTimeout(
    () => {

        if (
            chatBox &&
            chatBox.children.length === 0
        ) {

            newChat();
        }

    },
    300
);

/* ================= END FILE ================= */

});