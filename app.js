/***********************
 * MOCK BUDDIES (VA + Interests)
 ***********************/
const buddies = [
  { name: "Tom", age: 68, distance: "About a 5-minute walk", location: "Arlington County, VA", interests: ["walking", "chess"] },
  { name: "Linda", age: 72, distance: "About a 7-minute walk", location: "City of Alexandria, VA", interests: ["walking", "gardening"] },
  { name: "Robert", age: 65, distance: "About a 10-minute walk", location: "City of Richmond, VA", interests: ["walking", "chess", "reading"] }
];

/***********************
 * GLOBAL STATE
 ***********************/
const invites = {}; // { name: { status, time, expiresAt } }
const historyStack = [];

const buddyList = document.getElementById("buddy-list");
const modal = document.getElementById("modal");
const modalText = document.getElementById("modal-text");

const screenExplanation = document.getElementById("screen-explanation");
const screenFind = document.getElementById("screen-find");
const screenResponse = document.getElementById("screen-response");
const screenFeedback = document.getElementById("screen-feedback");
const responseList = document.getElementById("response-list");

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
buddySearch.addEventListener("input", renderBuddyList);

/***********************
 * RENDER BUDDY LIST WITH MATCHING & PERSISTENT INVITES
 ***********************/
function renderBuddyList() {
  const query = buddySearch.value.toLowerCase();
  buddyList.innerHTML = "";

  buddies.forEach(buddy => {
    // Filter by search query
    if (!buddy.name.toLowerCase().includes(query)) return;

    // Display only matching interests if user selected interests
    const userInterests = JSON.parse(localStorage.getItem("walkiepal_user_interests") || "[]");
    const commonInterests = buddy.interests.filter(i => userInterests.includes(i));
    const matchText = commonInterests.length ? `💡 Matches your interests: ${commonInterests.join(", ")}` : "";

    const card = document.createElement("div");
    card.className = "buddy-card";

    const inviteStatus = invites[buddy.name] ? `⏳ ${invites[buddy.name].status}` : "";

    card.innerHTML = `
      <div>
        <span class="icon">🥾</span>
        <strong>${buddy.name}</strong>, age ${buddy.age}<br/>
        <span class="muted">${buddy.distance} · ${buddy.location}</span><br/>
        <span class="muted">${matchText}</span><br/>
        ${inviteStatus ? `<span class="muted">${inviteStatus}</span><br/>` : ""}

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

/***********************
 * NAVIGATION WITH HISTORY
 ***********************/
function navigateTo(screen) {
  [screenExplanation, screenFind, screenResponse, screenFeedback].forEach(s => s.classList.add("hidden"));
  screen.classList.remove("hidden");
  historyStack.push(screen);
}

function goBack() {
  if (historyStack.length > 1) {
    historyStack.pop();
    const previous = historyStack[historyStack.length - 1];
    [screenExplanation, screenFind, screenResponse, screenFeedback].forEach(s => s.classList.add("hidden"));
    previous.classList.remove("hidden");
  }
}

function goToFind() {
  navigateTo(screenFind);
  renderBuddyList();
}

function goToFeedback() {
  navigateTo(screenFeedback);
}

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
const INVITE_EXPIRE_MS = 5 * 60 * 1000; // 5 minutes

function requestWalk(name) {
  const timeSelect = document.getElementById(`time-${name}`);
  const chosenTime = timeSelect ? timeSelect.value : "Later today";

  const expiresAt = Date.now() + INVITE_EXPIRE_MS;

  invites[name] = {
    status: "PENDING",
    time: chosenTime,
    expiresAt
  };

  saveInvites();

  showModal(`Invitation sent to ${name}.\n\nWaiting for response…`);
  navigateTo(screenResponse);
  renderPending(name);

  // Auto-expire invite
  setTimeout(() => {
    if (invites[name] && invites[name].status === "PENDING") {
      invites[name].status = "EXPIRED";
      saveInvites();
      renderPending(name);
    }
  }, INVITE_EXPIRE_MS);
}

function renderPending(name) {
  responseList.innerHTML = "";

  const card = document.createElement("div");
  card.className = "buddy-card";

  const status = invites[name].status;
  const time = invites[name].time;

  let statusText = "";
  if (status === "PENDING") statusText = "⏳ Pending";
  if (status === "ACCEPTED") statusText = "✅ Accepted";
  if (status === "DECLINED") statusText = "❌ Declined";
  if (status === "EXPIRED") statusText = "⏱️ Expired";

  card.innerHTML = `
    <strong>${name}</strong><br/>
    <span class="muted">${time} · Status: ${statusText}</span>
  `;

  responseList.appendChild(card);

  if (status === "PENDING") {
    setTimeout(() => simulateResponse(name), 2500);
  }
}

function simulateResponse(name) {
  if (!invites[name] || invites[name].status !== "PENDING") return;

  const accepted = Math.random() > 0.35;
  invites[name].status = accepted ? "ACCEPTED" : "DECLINED";
  saveInvites();
  renderPending(name);

  if (accepted) acceptWalk(name);
  else declineWalk(name);
}

/***********************
 * ACCEPT / DECLINE
 ***********************/
function acceptWalk(name) {
  showModal(`Great! ${name} accepted your walk.`);

  const summary = document.createElement("div");
  summary.className = "spot-card";
  summary.innerHTML = `
    🌳 <strong>Walk Confirmed</strong><br/>
    With: ${name}<br/>
    Where: ${
      name === "Linda" ? "Mount Vernon Trail, Alexandria" : "Lakeside Park, Arlington"
    }<br/>
    Time: ${invites[name].time}
  `;

  responseList.appendChild(summary);
}

function declineWalk(name) {
  showModal(`No problem. ${name} can’t join this time.`);
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
    showModal("You're offline.\nFeedback will send automatically when online.");
    return;
  }

  sendFeedback(endpoint, data);
}

function sendFeedback(endpoint, data) {
  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
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
 * PWA SUPPORT
 ***********************/
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("SW registered"))
      .catch(err => console.error("SW failed", err));
  });
}

// Initialize first screen
navigateTo(screenExplanation);
