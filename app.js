/***********************
 * MOCK BUDDIES (VA)
 ***********************/
const buddies = [
  { name: "Tom", age: 68, distance: "About a 5-minute walk", location: "Arlington County, VA" },
  { name: "Linda", age: 72, distance: "About a 7-minute walk", location: "City of Alexandria, VA" },
  { name: "Robert", age: 65, distance: "About a 10-minute walk", location: "City of Richmond, VA" }
];

/***********************
 * GLOBAL STATE
 ***********************/
const invites = {}; // { name: { status, time } }
let currentScreen = "explanation";

const screens = {
  explanation: document.getElementById("screen-explanation"),
  find: document.getElementById("screen-find"),
  response: document.getElementById("screen-response"),
  feedback: document.getElementById("screen-feedback")
};

const buddyList = document.getElementById("buddy-list");
const responseList = document.getElementById("response-list");
const modal = document.getElementById("modal");
const modalText = document.getElementById("modal-text");

/***********************
 * DARK MODE
 ***********************/
const darkModeBtn = document.getElementById("toggle-dark-mode");
darkModeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  darkModeBtn.innerText = document.body.classList.contains("dark-mode")
    ? "☀️ Light Mode"
    : "🌙 Dark Mode";
});

/***********************
 * SEARCH FILTER
 ***********************/
const buddySearch = document.getElementById("buddy-search");
buddySearch.addEventListener("input", () => {
  const query = buddySearch.value.toLowerCase();
  document.querySelectorAll(".buddy-card").forEach(card => {
    const name = card.querySelector("strong").innerText.toLowerCase();
    card.style.display = name.includes(query) ? "block" : "none";
  });
});

/***********************
 * ROUTER / NAVIGATION
 ***********************/
function showScreen(name) {
  Object.keys(screens).forEach(k => screens[k].classList.add("hidden"));
  screens[name].classList.remove("hidden");
  currentScreen = name;
  window.history.pushState({ screen: name }, "", `#${name}`);
}

window.addEventListener("popstate", e => {
  if (e.state && e.state.screen) {
    showScreen(e.state.screen);
  }
});

/***********************
 * BUDDY LIST RENDER
 ***********************/
function renderBuddies() {
  buddyList.innerHTML = "";
  buddies.forEach(buddy => {
    const card = document.createElement("div");
    card.className = "buddy-card";

    card.innerHTML = `
      <div>
        <span class="icon">🥾</span>
        <strong>${buddy.name}</strong>, age ${buddy.age}<br/>
        <span class="muted">${buddy.distance} · ${buddy.location}</span><br/>

        <label for="time-${buddy.name}">Choose time:</label>
        <select id="time-${buddy.name}">
          <option>Morning</option>
          <option>Afternoon</option>
          <option>Evening</option>
        </select>
      </div>
      <button onclick="requestWalk('${buddy.name}')">Invite to Walk</button>
    `;
    buddyList.appendChild(card);
  });
}

renderBuddies();

/***********************
 * MODAL
 ***********************/
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
 * INVITE FLOW
 ***********************/
function requestWalk(name) {
  const timeSelect = document.getElementById(`time-${name}`);
  const chosenTime = timeSelect ? timeSelect.value : "Later today";

  invites[name] = { status: "PENDING", time: chosenTime };
  saveInvites();

  showModal(`Invitation sent to ${name}.\nWaiting for response…`);
  setTimeout(() => {
    showScreen("response");
    renderPending(name);
  }, 400);
}

function renderPending(name) {
  responseList.innerHTML = "";

  const card = document.createElement("div");
  card.className = "buddy-card";
  card.innerHTML = `
    ⏳ <strong>Waiting for ${name}</strong><br/>
    <span class="muted">${invites[name].time} · Status: Pending</span>
  `;
  responseList.appendChild(card);

  setTimeout(() => simulateResponse(name), 2500);
}

function simulateResponse(name) {
  const accepted = Math.random() > 0.35;
  invites[name].status = accepted ? "ACCEPTED" : "DECLINED";
  saveInvites();

  responseList.innerHTML = "";
  accepted ? acceptWalk(name) : declineWalk(name);
}

/***********************
 * ACCEPT / DECLINE
 ***********************/
function acceptWalk(name) {
  showModal(`${name} accepted your walk!`);

  const summary = document.createElement("div");
  summary.className = "spot-card";
  summary.innerHTML = `
    🌳 <strong>Walk Confirmed</strong><br/>
    With: ${name}<br/>
    Where: ${name === "Linda" ? "Mount Vernon Trail, Alexandria" : "Lakeside Park, Arlington"}<br/>
    Time: ${invites[name].time}
  `;
  responseList.appendChild(summary);
}

function declineWalk(name) {
  showModal(`${name} can't join this time.`);
}

/***********************
 * OFFLINE SUPPORT
 ***********************/
function saveInvites() {
  localStorage.setItem("walkiepal_invites", JSON.stringify(invites));
}

function loadInvites() {
  const saved = localStorage.getItem("walkiepal_invites");
  if (saved) Object.assign(invites, JSON.parse(saved));
}

loadInvites();

/***********************
 * FEEDBACK
 ***********************/
function submitFeedback() {
  const data = {
    q1: document.getElementById("q1").value,
    q2: document.getElementById("q2").value,
    q3: document.getElementById("q3").value
  };

  const endpoint = "https://formspree.io/f/mdaebjqn";

  if (!navigator.onLine) {
    localStorage.setItem("pending_feedback", JSON.stringify(data));
    showModal("You're offline.\nFeedback will be sent when online.");
    return;
  }

  sendFeedback(endpoint, data);
}

function sendFeedback(endpoint, data) {
  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(data)
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
 * PWA / SERVICE WORKER
 ***********************/
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("SW registered"))
      .catch(err => console.error("SW registration failed", err));
  });
}

/***********************
 * SCREEN NAVIGATION BUTTONS
 ***********************/
function goToFind() { showScreen("find"); }
function goToFeedback() { showScreen("feedback"); }
