// MOCK BUDDIES (VA-specific distances)
const buddies = [
  {
    name: "Tom",
    age: 68,
    distance: "About a 5-minute walk",
    location: "Arlington County, VA"
  },
  {
    name: "Linda",
    age: 72,
    distance: "About a 7-minute walk",
    location: "City of Alexandria, VA"
  },
  {
    name: "Robert",
    age: 65,
    distance: "About a 10-minute walk",
    location: "City of Richmond, VA"
  }
];


const buddyList = document.getElementById("buddy-list");
const modal = document.getElementById("modal");
const modalText = document.getElementById("modal-text");
const screenFind = document.getElementById("screen-find");
const timeSelect = document.querySelector(`select[id^="time-"]`);
const chosenTime = timeSelect ? timeSelect.value : "Later today";
const screenResponse = document.getElementById("screen-response");
const responseList = document.getElementById("response-list");
const screenExplanation = document.getElementById("screen-explanation");
const screenFeedback = document.getElementById("screen-feedback");

const darkModeBtn = document.getElementById("toggle-dark-mode");
darkModeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  darkModeBtn.innerText = document.body.classList.contains("dark-mode") ? "☀️ Light Mode" : "🌙 Dark Mode";
});
// --------------------
// SEARCH FILTER
// --------------------
const buddySearch = document.getElementById("buddy-search");
buddySearch.addEventListener("input", () => {
  const query = buddySearch.value.toLowerCase();
  document.querySelectorAll(".buddy-card").forEach(card => {
    const name = card.querySelector("strong").innerText.toLowerCase();
    card.style.display = name.includes(query) ? "block" : "none";
  });
});
// --------------------
// RENDER BUDDY CARDS
// --------------------
buddies.forEach((buddy) => {
  const card = document.createElement("div");
  card.className = "buddy-card";

  card.innerHTML = `
    <div>
      <span class="icon">🥾</span>
      <strong>${buddy.name}</strong>, age ${buddy.age}<br/>
      <span class="muted">
  ${buddy.distance} · ${buddy.location}
</span><br/>

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

// --------------------
// NAVIGATION FUNCTIONS
// --------------------
function goToFind() {
  screenExplanation.classList.add("hidden");
  screenFind.classList.remove("hidden");
}

function goToFeedback() {
  screenResponse.classList.add("hidden");
  screenFeedback.classList.remove("hidden");
}

// --------------------
// MODAL FUNCTIONS
// --------------------
function showModal(text) {
  modalText.innerText = text;
  modal.classList.remove("hidden");
  setTimeout(() => modal.classList.add("show"), 10);
}

function closeModal() {
  modal.classList.remove("show");
  setTimeout(() => modal.classList.add("hidden"), 300);
}

// --------------------
// INVITE / RESPONSE LOGIC
// --------------------
function requestWalk(name) {
  showModal(`You invited ${name} for a walk.\n\nLet's see how they might respond.`);

  responseList.innerHTML = ""; // clear previous

  // Mock responses for 2 buddies
  const responses = [
    { name, accepted: true },
    { name: "Linda", accepted: false }
  ];

  responses.forEach((res) => {
    const card = document.createElement("div");
    card.className = "buddy-card";

    let inner = `<div>🥾 <strong>${res.name} wants to walk with you</strong><br/>
                 <span class="muted">A ${chosenTime.toLowerCase()} walk later today at ${
                   res.name === "Linda" ? "Mount Vernon Trail, Alexandria" : "Lakeside Park, Arlington"
                 }</span></div>`;

    if (res.accepted) {
      inner += `<div class="actions">
                  <button class="accept" onclick="acceptWalk('${res.name}')">Yes, I’ll walk</button>
                  <button class="decline" onclick="declineWalk('${res.name}')">No, thank you</button>
                </div>`;
    }
    card.innerHTML = inner;
    responseList.appendChild(card);
  });

  setTimeout(() => {
  screenFind.classList.add("hidden");
  screenResponse.classList.remove("hidden");
}, 400);

}

// --------------------
// ACCEPT / DECLINE
// --------------------
function acceptWalk(name) {
  showModal(`Great! ${name} will walk with you.\n\nHere’s the summary:`);

  const summary = document.createElement("div");
  summary.className = "spot-card";
  summary.innerHTML = `
    🌳 <strong>Walk Confirmed</strong><br/>
    With: ${name}<br/>
    Where: ${name === "Linda" ? "Mount Vernon Trail, Alexandria" : "Lakeside Park, Arlington"}<br/>
    Time: Later today
  `;
  responseList.appendChild(summary);
}

function declineWalk(name) {
  showModal(`No problem. ${name} won’t join this time.\n\nYou can try inviting someone else.`);
}

// --------------------
// FEEDBACK SUBMISSION
// --------------------
function submitFeedback() {
  const data = {
    q1: document.getElementById("q1").value,
    q2: document.getElementById("q2").value,
    q3: document.getElementById("q3").value
  };

  // Formspree endpoint
  const formEndpoint = "https://formspree.io/f/mdaebjqn"; // <-- replace with your Formspree URL

  fetch(formEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (response.ok) {
      showModal("Thank you! Your feedback has been sent ✅");
    } else {
      showModal("Oops! There was an error sending feedback.");
    }
  })
  .catch(error => showModal("Oops! There was an error sending feedback."));
}


