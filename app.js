/***********************
 * STATE
 ***********************/
const ROUTES = {
  explanation: "/",
  find: "/find",
  response: "/responses",
  feedback: "/feedback",
};

const ROUTES_REVERSE = Object.fromEntries(
  Object.entries(ROUTES).map(([k, v]) => [v, k])
);

// Restore AppState safely
let AppState;
try {
  const savedState = JSON.parse(localStorage.getItem("goldenbuddy_state"));
  if (savedState && ROUTES[savedState.screen]) {
    AppState = savedState;
  } else {
    AppState = { screen: "explanation", interests: ["walking", "chess"] };
  }
} catch {
  AppState = { screen: "explanation", interests: ["walking", "chess"] };
}

// Restore invites safely
let invites;
try {
  invites = JSON.parse(localStorage.getItem("goldenbuddy_invites") || "{}");
} catch {
  invites = {};
}

/***********************
 * ROUTER
 ***********************/
const screens = {
  explanation: document.getElementById("screen-explanation"),
  find: document.getElementById("screen-find"),
  response: document.getElementById("screen-response"),
  feedback: document.getElementById("screen-feedback"),
};

function navigate(to, push = true) {
  Object.values(screens).forEach(s => s.classList.add("hidden"));
  if (screens[to]) screens[to].classList.remove("hidden");

  AppState.screen = to;
  saveState();

  if (push) {
    history.pushState({ screen: to }, "", ROUTES[to]);
  }

  if (to === "find") renderBuddies();
  if (to === "response") renderResponses();
}

function goToFind() { navigate("find"); }
function goToFeedback() { navigate("feedback"); }
function goBack() {
  if (AppState.screen === "response") navigate("find");
  else if (AppState.screen === "feedback") navigate("response");
}

window.addEventListener("popstate", event => {
  const screen = event.state?.screen || "explanation";
  navigate(screen, false);
});

/***********************
 * DATA
 ***********************/
const buddies = [
  { name: "Tom", age: 68, interests: ["walking", "chess"], distance: "5 min", location: "Arlington VA" },
  { name: "Linda", age: 72, interests: ["walking"], distance: "7 min", location: "Alexandria VA" },
  { name: "Robert", age: 65, interests: ["chess"], distance: "10 min", location: "Richmond VA" },
];

function matchScore(buddy) {
  return buddy.interests.filter(i => AppState.interests.includes(i)).length;
}

/***********************
 * RENDER
 ***********************/
const buddyList = document.getElementById("buddy-list");

function renderBuddies() {
  buddyList.innerHTML = "";

  [...buddies]
    .sort((a, b) => matchScore(b) - matchScore(a))
    .forEach(buddy => {
      const card = document.createElement("div");
      card.className = "buddy-card";

      const invite = invites[buddy.name];
      let inviteText = invite ? `Status: ${invite.status}` : "";

      card.innerHTML = `
        🥾 <strong>${buddy.name}</strong> · ${buddy.age}<br/>
        <span class="muted">${buddy.distance} · ${buddy.location}</span><br/>
        <small>Shared interests: ${buddy.interests.join(", ")}</small><br/>
        ${inviteText ? `<span class="muted">${inviteText}</span><br/>` : ""}
        <button onclick="requestWalk('${buddy.name}')">Invite</button>
      `;
      buddyList.appendChild(card);
    });
}

/***********************
 * INVITES
 ***********************/
function requestWalk(name) {
  const now = Date.now();
  invites[name] = {
    status: "PENDING",
    createdAt: now,
    expiresAt: now + 60 * 60 * 1000,
  };
  saveInvites();
  renderResponses();
  navigate("response");

  setTimeout(() => simulateResponse(name), 3000);
}

function simulateResponse(name) {
  const invite = invites[name];
  if (!invite || invite.status !== "PENDING") return;

  const accepted = Math.random() > 0.4;
  invite.status = accepted ? "ACCEPTED" : "DECLINED";
  saveInvites();
  renderResponses();
}

function renderResponses() {
  const list = document.getElementById("response-list");
  list.innerHTML = "";

  Object.entries(invites).forEach(([name, invite]) => {
    const div = document.createElement("div");
    div.className = "buddy-card";

    let statusText = "";
    if (invite.status === "PENDING") statusText = "⏳ Waiting...";
    else if (invite.status === "ACCEPTED") statusText = "✅ Accepted! Let's go!";
    else if (invite.status === "DECLINED") statusText = "❌ Declined";
    else if (invite.status === "EXPIRED") statusText = "⌛ Expired";

    div.innerHTML = `<strong>${name}</strong><br/><span class="muted">${statusText}</span>`;
    list.appendChild(div);
  });
}

/***********************
 * EXPIRATION
 ***********************/
setInterval(() => {
  const now = Date.now();
  let dirty = false;

  Object.values(invites).forEach(inv => {
    if (inv.status === "PENDING" && now > inv.expiresAt) {
      inv.status = "EXPIRED";
      dirty = true;
    }
  });

  if (dirty) {
    renderResponses();
    saveInvites();
  }
}, 30000);

/***********************
 * STORAGE
 ***********************/
function saveInvites() {
  localStorage.setItem("goldenbuddy_invites", JSON.stringify(invites));
}
function saveState() {
  localStorage.setItem("goldenbuddy_state", JSON.stringify(AppState));
}

/***********************
 * FEEDBACK (OFFLINE-SAFE)
 ***********************/
function submitFeedback() {
  const data = {
    q1: document.getElementById("q1").value,
    q2: document.getElementById("q2").value,
    q3: document.getElementById("q3").value,
  };

  const endpoint = "https://formspree.io/f/mdaebjqn";

  if (!navigator.onLine) {
    localStorage.setItem("pending_feedback", JSON.stringify(data));
    showModal("You're offline. Feedback will be sent automatically when online.");
    return;
  }

  sendFeedback(endpoint, data);
}

function sendFeedback(endpoint, data) {
  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(data),
  })
    .then(res => {
      if (res.ok) {
        showModal("Thank you! Feedback sent ✅");
        localStorage.removeItem("pending_feedback");
      } else {
        showModal("Error sending feedback.");
      }
    })
    .catch(() => showModal("Network error."));
}

window.addEventListener("online", () => {
  const pending = localStorage.getItem("pending_feedback");
  if (pending) sendFeedback("https://formspree.io/f/mdaebjqn", JSON.parse(pending));
});

/***********************
 * MODAL
 ***********************/
const modal = document.getElementById("modal");
const modalText = document.getElementById("modal-text");

function showModal(text) {
  modalText.innerText = text;
  modal.classList.remove("hidden");
  setTimeout(() => modal.classList.add("show"), 10);
}

function closeModal() {
  modal.classList.remove("show");
  setTimeout(() => modal.classList.add("hidden"), 300);
}

/***********************
 * INIT
 ***********************/
(function initFromURL() {
  const screenFromURL = ROUTES_REVERSE[location.pathname];

  // Only allow explanation or find screen on initial load
  const entryScreens = ["explanation", "find"];
  let initialScreen = "explanation";

  if (screenFromURL && entryScreens.includes(screenFromURL)) {
    initialScreen = screenFromURL;
  }

  navigate(initialScreen, false);
})();


