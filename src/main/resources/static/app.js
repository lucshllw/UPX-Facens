const token = localStorage.getItem("reuse_token");
const user = JSON.parse(localStorage.getItem("reuse_user") || "null");

if (!token || !user) {
    window.location.href = "/login.html";
}

const state = {
    categories: [],
    items: [],
    activeItem: null,
    activeReceiverId: null
};

const itemsGrid = document.querySelector("#items-grid");
const itemForm = document.querySelector("#item-form");
const filterForm = document.querySelector("#filter-form");
const chatDialog = document.querySelector("#chat-dialog");
const chatMessages = document.querySelector("#chat-messages");
const chatForm = document.querySelector("#chat-form");

document.querySelector("#user-greeting").textContent = user?.neighborhood
    ? `${user.name} · ${user.neighborhood}`
    : user?.name || "ReUse+";

document.querySelector("#logout-button").addEventListener("click", () => {
    localStorage.removeItem("reuse_token");
    localStorage.removeItem("reuse_user");
    window.location.href = "/login.html";
});

async function apiFetch(path, options = {}) {
    const response = await fetch(path, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(options.headers || {})
        }
    });

    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("reuse_token");
        localStorage.removeItem("reuse_user");
        window.location.href = "/login.html";
        return null;
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Operacao nao concluida.");
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

function fillCategorySelects() {
    const publishSelect = itemForm.elements.categoryId;
    const filterSelect = filterForm.elements.categoryId;

    publishSelect.innerHTML = state.categories
        .map((category) => `<option value="${category.id}">${category.name}</option>`)
        .join("");

    filterSelect.innerHTML = `<option value="">Todas</option>` + state.categories
        .map((category) => `<option value="${category.id}">${category.name}</option>`)
        .join("");
}

function typeLabel(type) {
    return type === "DONATION" ? "Doacao" : "Troca";
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function safeImageUrl(value) {
    if (!value) return "";
    try {
        const url = new URL(value, window.location.origin);
        return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
        return "";
    }
}

function renderItems() {
    if (!state.items.length) {
        itemsGrid.innerHTML = `<p class="empty-state">Nenhum item encontrado.</p>`;
        return;
    }

    itemsGrid.innerHTML = state.items.map((item) => {
        const ownerActions = item.owner.id === user.id
            ? `<button class="text-button danger" data-delete="${item.id}" type="button">Remover</button>`
            : "";
        const imageUrl = safeImageUrl(item.imageUrl);
        const title = escapeHtml(item.title);
        const categoryName = escapeHtml(item.category.name);
        const ownerName = escapeHtml(item.owner.name);
        const image = imageUrl
            ? `<img src="${imageUrl}" alt="${title}">`
            : `<div class="image-fallback">${categoryName.slice(0, 1)}</div>`;

        return `
            <article class="item-card">
                <div class="item-media">${image}</div>
                <div class="item-body">
                    <div class="item-meta">
                        <span>${categoryName}</span>
                        <span>${typeLabel(item.type)}</span>
                    </div>
                    <h3>${title}</h3>
                    <p>${escapeHtml(item.description)}</p>
                    <div class="item-footer">
                        <span>${ownerName}</span>
                        <div>
                            <button class="text-button" data-chat="${item.id}" type="button">Chat</button>
                            ${ownerActions}
                        </div>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

async function loadCategories() {
    state.categories = await apiFetch("/api/categories");
    fillCategorySelects();
}

async function loadItems() {
    const params = new URLSearchParams(new FormData(filterForm));
    [...params.entries()].forEach(([key, value]) => {
        if (!value) params.delete(key);
    });
    const query = params.toString();
    state.items = await apiFetch(`/api/items${query ? `?${query}` : ""}`);
    renderItems();
}

itemForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.querySelector("#item-message");
    message.textContent = "";
    const payload = Object.fromEntries(new FormData(itemForm).entries());
    payload.categoryId = Number(payload.categoryId);

    try {
        await apiFetch("/api/items", {
            method: "POST",
            body: JSON.stringify(payload)
        });
        itemForm.reset();
        fillCategorySelects();
        message.textContent = "Item publicado.";
        await loadItems();
    } catch (error) {
        message.textContent = error.message;
    }
});

filterForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await loadItems();
});

itemsGrid.addEventListener("click", async (event) => {
    const chatId = event.target.dataset.chat;
    const deleteId = event.target.dataset.delete;

    if (chatId) {
        await openChat(Number(chatId));
    }

    if (deleteId && confirm("Remover este item?")) {
        await apiFetch(`/api/items/${deleteId}`, {method: "DELETE"});
        await loadItems();
    }
});

async function openChat(itemId) {
    state.activeItem = state.items.find((item) => item.id === itemId);
    document.querySelector("#chat-title").textContent = state.activeItem.title;
    await loadMessages();
    chatDialog.showModal();
}

async function loadMessages() {
    const messages = await apiFetch(`/api/messages/items/${state.activeItem.id}`);
    const lastOtherMessage = [...messages].reverse()
        .find((message) => message.sender.id !== user.id);
    state.activeReceiverId = state.activeItem.owner.id === user.id
        ? lastOtherMessage?.sender.id
        : state.activeItem.owner.id;

    chatMessages.innerHTML = messages.length
        ? messages.map((message) => `
            <div class="chat-bubble ${message.sender.id === user.id ? "mine" : ""}">
                <strong>${escapeHtml(message.sender.name)}</strong>
                <p>${escapeHtml(message.content)}</p>
            </div>
        `).join("")
        : `<p class="empty-state">Sem mensagens ainda.</p>`;
}

chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const content = chatForm.elements.content.value.trim();
    if (!content) return;

    await apiFetch("/api/messages", {
        method: "POST",
        body: JSON.stringify({
            itemId: state.activeItem.id,
            receiverId: state.activeReceiverId,
            content
        })
    });
    chatForm.reset();
    await loadMessages();
});

Promise.all([loadCategories()]).then(loadItems);
