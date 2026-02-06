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

const AppState = {
  screen: "explanation",
  interests: ["walking", "chess"],
};

const invites = JSON.parse(
  localStorage.getItem("walkiepal_invites") || "{}"
);

/***********************
 * ROUTER
 ***********************/
const screens = {
  explanation: document.getElementById("screen-explanation"),
  find: document.getElementById("screen-find"),
  response: document.getElementById("screen-response"),
  feedback: document.getElementById("screen-feedback"),
};

function navigate(to) {
  Object.values(screens).forEach(s => s.classList.add("hidden"));
  screens[to].classList.remove("hidden");
  AppState.screen = to;
  saveState();
}

function goToFind() { navigate("find"); }
function goToFeedback() { navigate("feedback"); }
function goBack() {
  if (AppState.screen === "response") navigate("find");
  else if (AppState.screen === "feedback") navigate("response");
}

/***********************
 * DATA
 ***********************/
const buddies = [
  { name: "Tom", age: 68, interests: ["walking", "chess"], distance: "5 min", location: "Arlington VA" },
  { name: "Linda", age: 72, interests: ["walking"], distance: "7 min", location: "Alexandria VA" },
  { name: "Robert", age: 65, interests: ["chess"], distance: "10 min", location: "Richmond VA" },
];

function matchScore(buddy) {
  return buddy.interests.filter(i =>
    AppState.interests.includes(i)
  ).length;
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
      card.innerHTML = `
        🥾 <strong>${buddy.name}</strong> · ${buddy.age}<br/>
        <span class="muted">${buddy.distance} · ${buddy.location}</span><br/>
        <small>Shared interests: ${buddy.interests.join(", ")}</small><br/>
        <button onclick="requestWalk('${buddy.name}')">Invite</button>
      `;
      buddyList.appendChild(card);
    });
}

/***********************
 * INVITES
 ***********************/
function requestWalk(name) {
  invites[name] = {
    status: "PENDING",
    createdAt: Date.now(),
    expiresAt: Date.now() + 60 * 60 * 1000,
  };
  saveInvites();
  renderResponses();
  navigate("response");
}

function renderResponses() {
  const list = document.getElementById("response-list");
  list.innerHTML = "";

  Object.entries(invites).forEach(([name, invite]) => {
    const div = document.createElement("div");
    div.className = "buddy-card";
    div.innerHTML = `
      <strong>${name}</strong><br/>
      Status: ${invite.status}
    `;
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

  if (dirty) saveInvites();
}, 30000);

/***********************
 * STORAGE
 ***********************/
function saveInvites() {
  localStorage.setItem("walkiepal_invites", JSON.stringify(invites));
}
function saveState() {
  localStorage.setItem("walkiepal_state", JSON.stringify(AppState));
}

/***********************
 * INIT
 ***********************/
renderBuddies();
navigate(AppState.screen);

