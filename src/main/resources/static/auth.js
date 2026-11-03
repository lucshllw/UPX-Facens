const authMessage = document.querySelector("#auth-message");

function formDataToObject(form) {
    return Object.fromEntries(new FormData(form).entries());
}

function saveSession(payload) {
    localStorage.setItem("reuse_token", payload.token);
    localStorage.setItem("reuse_user", JSON.stringify(payload.user));
}

async function submitAuth(path, form) {
    authMessage.textContent = "";
    const button = form.querySelector("button[type='submit']");
    button.disabled = true;

    try {
        const response = await fetch(path, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(formDataToObject(form))
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Nao foi possivel continuar.");
        }
        saveSession(data);
        window.location.href = "/";
    } catch (error) {
        authMessage.textContent = error.message;
    } finally {
        button.disabled = false;
    }
}

document.querySelector("#login-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitAuth("/api/auth/login", event.currentTarget);
});

document.querySelector("#register-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitAuth("/api/auth/register", event.currentTarget);
});
