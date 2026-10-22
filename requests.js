/**
 * Student Skill Exchange Platform
 * requests.js - Learning & Connection Requests Management (Phase 5)
 * Author: College Field Project
 * 
 * Handles:
 * 1. Viewing incoming requests with Accept and Reject actions.
 * 2. Creating an active Connection upon acceptance.
 * 3. Viewing sent requests with Cancel action.
 * 4. Sending a new learning request via an accessible modal with validation.
 */

document.addEventListener("DOMContentLoaded", function () {
  // Guard protected page
  const currentUser = requireAuth();
  if (!currentUser) return;

  initRequestsPage(currentUser);

  // Logout handler
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      if (confirm("Are you sure you want to log out?")) {
        logoutUser();
      }
    });
  }
});

function initRequestsPage(currentUser) {
  // Tabs
  const tabIncomingBtn = document.getElementById("tabIncomingBtn");
  const tabSentBtn = document.getElementById("tabSentBtn");
  const incomingContainer = document.getElementById("incomingRequestsList");
  const sentContainer = document.getElementById("sentRequestsList");
  const incomingBadge = document.getElementById("incomingTabBadge");

  // New Request Modal elements
  const openModalBtn = document.getElementById("openNewRequestModalBtn");
  const modalBackdrop = document.getElementById("newRequestModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelModalBtn = document.getElementById("cancelModalBtn");
  const newRequestForm = document.getElementById("newRequestForm");
  const targetStudentSelect = document.getElementById("reqTargetStudent");
  const reqSkillSelect = document.getElementById("reqSkillSelect");
  const modalAlert = document.getElementById("modalAlert");
  const pageSuccessAlert = document.getElementById("pageSuccessAlert");

  // Check URL params for ?new=user00X
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedTargetId = urlParams.get("new");

  // Tab switching logic
  let activeTab = "incoming";

  if (tabIncomingBtn && tabSentBtn) {
    tabIncomingBtn.addEventListener("click", function () {
      activeTab = "incoming";
      tabIncomingBtn.classList.add("active");
      tabSentBtn.classList.remove("active");
      incomingContainer.style.display = "flex";
      sentContainer.style.display = "none";
    });

    tabSentBtn.addEventListener("click", function () {
      activeTab = "sent";
      tabSentBtn.classList.add("active");
      tabIncomingBtn.classList.remove("active");
      incomingContainer.style.display = "none";
      sentContainer.style.display = "flex";
    });
  }

  // Populate Target Student dropdown in Modal
  const allUsers = getUsers();
  const peers = allUsers.filter(u => u.id !== currentUser.id);

  if (targetStudentSelect) {
    targetStudentSelect.innerHTML = `<option value="">-- Choose a Student Mentor --</option>`;
    peers.forEach(peer => {
      const opt = document.createElement("option");
      opt.value = peer.id;
      opt.textContent = `${peer.name} (${peer.year} - ${peer.branch})`;
      targetStudentSelect.appendChild(opt);
    });

    // When student is selected, update skills dropdown with that student's offered skills
    targetStudentSelect.addEventListener("change", function () {
      updateSkillsDropdownForStudent(this.value, reqSkillSelect);
    });
  }

  // Auto-open modal if ?new=user00X is in URL
  if (preselectedTargetId && targetStudentSelect) {
    targetStudentSelect.value = preselectedTargetId;
    updateSkillsDropdownForStudent(preselectedTargetId, reqSkillSelect);
    openModal();
  }

  // Modal Open & Close Event Listeners
  if (openModalBtn) openModalBtn.addEventListener("click", openModal);
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);

  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", function (e) {
      if (e.target === modalBackdrop) closeModal();
    });
  }

  function openModal() {
    if (modalAlert) modalAlert.style.display = "none";
    if (modalBackdrop) modalBackdrop.style.display = "flex";
  }

  function closeModal() {
    if (modalBackdrop) modalBackdrop.style.display = "none";
    if (newRequestForm) newRequestForm.reset();
  }

  // Handle New Request Submission
  if (newRequestForm) {
    newRequestForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (modalAlert) modalAlert.style.display = "none";

      const targetId = targetStudentSelect.value;
      const skill = reqSkillSelect.value;
      const mode = document.querySelector("input[name='modalReqMode']:checked")?.value || "Online";
      const message = document.getElementById("reqMessage").value.trim();

      // Client-side validations
      if (!targetId) {
        showModalError("Please select the student you want to learn from.");
        return;
      }

      if (targetId === currentUser.id) {
        showModalError("You cannot send a learning request to yourself.");
        return;
      }

      if (!skill || skill === "none") {
        showModalError("Please select a skill to learn from this mentor.");
        return;
      }

      // Check for duplicate pending request
      const allRequests = getRequests();
      const duplicate = allRequests.find(r => 
        r.senderId === currentUser.id && 
        r.receiverId === targetId && 
        r.skillRequested.toLowerCase() === skill.toLowerCase() &&
        r.status === "Pending"
      );

      if (duplicate) {
        showModalError("You already have an active pending request for this skill with this student.");
        return;
      }

      const targetUser = getUserById(targetId);

      // Create new request object
      const newReq = {
        id: "req_" + Date.now(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        receiverId: targetId,
        receiverName: targetUser ? targetUser.name : "Peer",
        skillRequested: skill,
        message: message || `Hi! I would love to learn ${skill} from you. Looking forward to connecting!`,
        mode: mode,
        status: "Pending",
        createdAt: new Date().toISOString()
      };

      // Save to LocalStorage
      addRequest(newReq);

      // Close modal
      closeModal();

      // Show success alert on page
      if (pageSuccessAlert) {
        pageSuccessAlert.style.display = "block";
        pageSuccessAlert.textContent = `Request sent to ${newReq.receiverName} for ${skill}!`;
        setTimeout(() => { pageSuccessAlert.style.display = "none"; }, 4000);
      }

      // Switch to Sent tab and refresh
      if (tabSentBtn) tabSentBtn.click();
      renderAllRequests();
    });
  }

  function showModalError(msg) {
    if (!modalAlert) return;
    modalAlert.textContent = msg;
    modalAlert.style.display = "block";
  }

  function updateSkillsDropdownForStudent(studentId, selectEl) {
    if (!selectEl) return;
    if (!studentId) {
      selectEl.innerHTML = `<option value="">-- First choose a student --</option>`;
      return;
    }
    const student = getUserById(studentId);
    if (!student || !student.skillsTeach || student.skillsTeach.length === 0) {
      selectEl.innerHTML = `<option value="General Learning">General Learning</option>`;
      return;
    }
    selectEl.innerHTML = `<option value="">-- Select a skill they teach --</option>`;
    student.skillsTeach.forEach(skill => {
      const opt = document.createElement("option");
      opt.value = skill;
      opt.textContent = skill;
      selectEl.appendChild(opt);
    });
  }

  // Initial render of all requests
  renderAllRequests();

  function renderAllRequests() {
    const allRequests = getRequests();
    const allUsers = getUsers();

    // 1. Incoming Requests
    const incoming = allRequests.filter(r => r.receiverId === currentUser.id);
    // Sort pending first, then by date descending
    incoming.sort((a, b) => {
      if (a.status === "Pending" && b.status !== "Pending") return -1;
      if (a.status !== "Pending" && b.status === "Pending") return 1;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    const pendingCount = incoming.filter(r => r.status === "Pending").length;
    if (incomingBadge) {
      if (pendingCount > 0) {
        incomingBadge.textContent = pendingCount;
        incomingBadge.style.display = "inline-flex";
      } else {
        incomingBadge.style.display = "none";
      }
    }

    renderIncomingList(incoming, incomingContainer, allUsers);

    // 2. Sent Requests
    const sent = allRequests.filter(r => r.senderId === currentUser.id);
    sent.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    renderSentList(sent, sentContainer, allUsers);
  }

  function renderIncomingList(list, container, users) {
    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box" style="padding: 3.5rem 1.5rem;">
          <div class="empty-state-icon" style="color:var(--slate-400); display:flex; justify-content:center;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          </div>
          <div class="empty-state-title">No Incoming Requests</div>
          <p class="empty-state-text">
            When other students want to learn a skill you teach, their requests will appear here.
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = "";
    list.forEach(req => {
      const sender = users.find(u => u.id === req.senderId);
      const senderName = sender ? sender.name : req.senderName;
      const senderYear = sender ? sender.year : "Student";
      const senderBranch = sender ? sender.branch : "";
      const senderRating = sender ? (sender.rating || 5.0).toFixed(1) : "5.0";
      const senderAvatarBg = sender ? (sender.avatarBg || "blue") : "blue";
      const initials = senderName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

      const card = document.createElement("div");
      card.className = "student-card";
      card.style.marginBottom = "1rem";

      let statusBadgeColor = "var(--primary-light); color: var(--primary);";
      if (req.status === "Accepted") statusBadgeColor = "var(--accent-light); color: #065f46;";
      if (req.status === "Rejected") statusBadgeColor = "#fef2f2; color: #991b1b;";

      let actionsHtml = "";
      if (req.status === "Pending") {
        actionsHtml = `
          <div style="display:flex; gap:0.65rem; margin-top:1.15rem; border-top:1px solid var(--slate-100); padding-top:1rem;">
            <button type="button" class="btn btn-primary btn-sm accept-btn" data-req-id="${req.id}">
              Accept Request
            </button>
            <button type="button" class="btn btn-outline btn-sm reject-btn" data-req-id="${req.id}" style="color:#ef4444; border-color:#fca5a5;">
              Decline
            </button>
          </div>
        `;
      } else if (req.status === "Accepted") {
        actionsHtml = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; border-top:1px solid var(--slate-100); padding-top:0.85rem; font-size:0.86rem;">
            <span style="color:#065f46; font-weight:600;">Connected! Session can be arranged.</span>
            <a href="connections.html" class="dash-card-header-link">Go to Connections →</a>
          </div>
        `;
      } else {
        actionsHtml = `
          <div style="margin-top:0.85rem; border-top:1px solid var(--slate-100); padding-top:0.65rem; font-size:0.82rem; color:var(--slate-500);">
            This request was declined.
          </div>
        `;
      }

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
          <div style="display:flex; align-items:center; gap:0.85rem;">
            <div class="avatar-circle-swatch ${senderAvatarBg}" style="width:48px; height:48px; font-size:1.1rem; flex-shrink:0;">
              ${initials}
            </div>
            <div>
              <h4 style="font-size:1.05rem; margin-bottom:0.15rem; color:var(--slate-900);">${escapeHtml(senderName)}</h4>
              <p style="font-size:0.8rem; color:var(--slate-500);">
                <span class="badge-year">${senderYear}</span> • ${escapeHtml(senderBranch)} • ★ ${senderRating}
              </p>
            </div>
          </div>
          <span style="font-size:0.78rem; font-weight:700; padding:0.25rem 0.65rem; border-radius:var(--radius-full); background:${statusBadgeColor}">
            ${req.status}
          </span>
        </div>

        <div style="background-color:var(--slate-50); border:1px solid var(--slate-200); border-radius:var(--radius-md); padding:0.85rem 1rem; margin-bottom:0.65rem;">
          <div style="font-size:0.84rem; margin-bottom:0.35rem;">
            <strong>Topic Requested:</strong> <span class="skill-tag teach" style="font-size:0.78rem; padding:0.2rem 0.5rem;">${escapeHtml(req.skillRequested)}</span>
            <span class="badge-mode ${req.mode === 'Offline' ? 'offline' : 'online'}" style="margin-left:0.5rem; font-size:0.75rem;">${req.mode}</span>
          </div>
          <p style="font-size:0.86rem; color:var(--slate-700); font-style:italic; line-height:1.5;">
            "${escapeHtml(req.message)}"
          </p>
        </div>

        ${actionsHtml}
      `;

      // Attach Accept / Reject handlers
      const acceptBtn = card.querySelector(".accept-btn");
      if (acceptBtn) {
        acceptBtn.addEventListener("click", function () {
          acceptRequestAction(req, currentUser);
        });
      }

      const rejectBtn = card.querySelector(".reject-btn");
      if (rejectBtn) {
        rejectBtn.addEventListener("click", function () {
          rejectRequestAction(req);
        });
      }

      container.appendChild(card);
    });
  }

  function renderSentList(list, container, users) {
    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box" style="padding: 3.5rem 1.5rem;">
          <div class="empty-state-icon" style="color:var(--slate-400); display:flex; justify-content:center;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </div>
          <div class="empty-state-title">No Sent Requests</div>
          <p class="empty-state-text">
            You haven't sent any learning requests yet. Search students in the directory to connect!
          </p>
          <a href="students.html" class="btn btn-primary btn-sm" style="margin-top:0.5rem;">Find Students</a>
        </div>
      `;
      return;
    }

    container.innerHTML = "";
    list.forEach(req => {
      const receiver = users.find(u => u.id === req.receiverId);
      const receiverName = receiver ? receiver.name : req.receiverName;
      const receiverYear = receiver ? receiver.year : "Student";
      const receiverBranch = receiver ? receiver.branch : "";
      const receiverAvatarBg = receiver ? (receiver.avatarBg || "blue") : "blue";
      const initials = receiverName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

      const card = document.createElement("div");
      card.className = "student-card";
      card.style.marginBottom = "1rem";

      let statusBadgeColor = "var(--primary-light); color: var(--primary);";
      if (req.status === "Accepted") statusBadgeColor = "var(--accent-light); color: #065f46;";
      if (req.status === "Rejected") statusBadgeColor = "#fef2f2; color: #991b1b;";

      let actionsHtml = "";
      if (req.status === "Pending") {
        actionsHtml = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; border-top:1px solid var(--slate-100); padding-top:0.75rem;">
            <span style="font-size:0.8rem; color:var(--slate-500);">Awaiting response from ${escapeHtml(receiverName)}</span>
            <button type="button" class="btn btn-outline btn-sm cancel-btn" data-req-id="${req.id}" style="color:#ef4444; border-color:#fca5a5;">
              Cancel Request
            </button>
          </div>
        `;
      } else if (req.status === "Accepted") {
        actionsHtml = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; border-top:1px solid var(--slate-100); padding-top:0.75rem;">
            <span style="font-size:0.84rem; color:#065f46; font-weight:600;">Request Accepted!</span>
            <a href="connections.html" class="dash-card-header-link">View in My Connections →</a>
          </div>
        `;
      } else {
        actionsHtml = `
          <div style="margin-top:0.75rem; border-top:1px solid var(--slate-100); padding-top:0.65rem; font-size:0.8rem; color:var(--slate-500);">
            This request was declined. You can try reaching out to other peers in the directory.
          </div>
        `;
      }

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
          <div style="display:flex; align-items:center; gap:0.85rem;">
            <div class="avatar-circle-swatch ${receiverAvatarBg}" style="width:48px; height:48px; font-size:1.1rem; flex-shrink:0;">
              ${initials}
            </div>
            <div>
              <h4 style="font-size:1.05rem; margin-bottom:0.15rem; color:var(--slate-900);">${escapeHtml(receiverName)}</h4>
              <p style="font-size:0.8rem; color:var(--slate-500);">
                <span class="badge-year">${receiverYear}</span> • ${escapeHtml(receiverBranch)}
              </p>
            </div>
          </div>
          <span style="font-size:0.78rem; font-weight:700; padding:0.25rem 0.65rem; border-radius:var(--radius-full); background:${statusBadgeColor}">
            ${req.status}
          </span>
        </div>

        <div style="background-color:var(--slate-50); border:1px solid var(--slate-200); border-radius:var(--radius-md); padding:0.85rem 1rem;">
          <div style="font-size:0.84rem; margin-bottom:0.35rem;">
            <strong>Topic Requested:</strong> <span class="skill-tag teach" style="font-size:0.78rem; padding:0.2rem 0.5rem;">${escapeHtml(req.skillRequested)}</span>
            <span class="badge-mode ${req.mode === 'Offline' ? 'offline' : 'online'}" style="margin-left:0.5rem; font-size:0.75rem;">${req.mode}</span>
          </div>
          <p style="font-size:0.86rem; color:var(--slate-700); font-style:italic;">
            "${escapeHtml(req.message)}"
          </p>
        </div>

        ${actionsHtml}
      `;

      // Cancel handler
      const cancelBtn = card.querySelector(".cancel-btn");
      if (cancelBtn) {
        cancelBtn.addEventListener("click", function () {
          if (confirm("Cancel this pending learning request?")) {
            cancelRequestAction(req.id);
          }
        });
      }

      container.appendChild(card);
    });
  }

  /**
   * Action: Accept an incoming request
   */
  function acceptRequestAction(req, currentUser) {
    // 1. Update request status to Accepted
    updateRequestStatus(req.id, "Accepted");

    // 2. Create new active Connection in LocalStorage
    const newConnection = {
      id: "conn_" + Date.now(),
      requestId: req.id,
      user1Id: req.senderId,
      user2Id: req.receiverId,
      skillExchanged: req.skillRequested,
      mode: req.mode || "Both",
      connectedAt: new Date().toISOString()
    };
    addConnection(newConnection);

    // 3. Show feedback & re-render
    if (pageSuccessAlert) {
      pageSuccessAlert.style.display = "block";
      pageSuccessAlert.innerHTML = `
        <strong>Request Accepted!</strong> You are now connected with <strong>${escapeHtml(req.senderName)}</strong> for <strong>${escapeHtml(req.skillRequested)}</strong>. 
        <a href="connections.html" style="color:inherit; font-weight:700; text-decoration:underline; margin-left:8px;">View in Connections →</a>
      `;
    }

    renderAllRequests();
  }

  /**
   * Action: Reject an incoming request
   */
  function rejectRequestAction(req) {
    if (confirm("Decline this learning request?")) {
      updateRequestStatus(req.id, "Rejected");
      renderAllRequests();
    }
  }

  /**
   * Action: Cancel a sent request
   */
  function cancelRequestAction(reqId) {
    const allRequests = getRequests();
    const updated = allRequests.filter(r => r.id !== reqId);
    saveRequests(updated);
    renderAllRequests();
  }
}

/**
 * Helper to escape HTML characters
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
