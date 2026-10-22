/**
 * Student Skill Exchange Platform
 * dashboard.js - Student Dashboard Management (Phase 3)
 * Author: College Field Project
 * 
 * Manages the logged-in dashboard view:
 * 1. Populates user identity, academic year, and branch.
 * 2. Calculates dynamic metrics (Teaching, Learning, Connections, Pending Requests).
 * 3. Finds and renders suggested student peers based on skills matching.
 * 4. Displays recent requests and active connections preview.
 */

document.addEventListener("DOMContentLoaded", function () {
  // Guard page: must be logged in
  const currentUser = requireAuth();
  if (!currentUser) return;

  // Render all dashboard sections
  renderDashboardHeader(currentUser);
  renderDashboardMetrics(currentUser);
  renderSuggestedStudents(currentUser);
  renderMySkillsOverview(currentUser);
  renderRecentRequests(currentUser);
  renderConnectionsPreview(currentUser);

  // Attach logout handler
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      if (confirm("Are you sure you want to log out?")) {
        logoutUser();
      }
    });
  }
});

/**
 * 1. Render Dashboard Welcome Banner & Header
 */
function renderDashboardHeader(user) {
  const nameEl = document.getElementById("dashUserName");
  const metaEl = document.getElementById("dashUserMeta");
  const avatarEl = document.getElementById("dashUserAvatar");
  const ratingBadgeEl = document.getElementById("dashUserRatingBadge");
  const modeBadgeEl = document.getElementById("dashUserModeBadge");

  if (nameEl) nameEl.textContent = "Welcome back, " + user.name + "!";
  if (metaEl) metaEl.textContent = user.branch + " • " + user.year + " Student";
  
  if (avatarEl) {
    avatarEl.className = "welcome-avatar avatar-circle-swatch " + (user.avatarBg || "blue");
    // Show user initials
    const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    avatarEl.textContent = initials || "SE";
  }

  if (ratingBadgeEl) {
    const rating = user.rating || 5.0;
    const reviewCount = user.reviewCount || 0;
    ratingBadgeEl.innerHTML = `★ <strong>${rating.toFixed(1)}</strong> <span style="font-weight:400; color:var(--slate-600);">(${reviewCount} reviews)</span>`;
  }

  if (modeBadgeEl) {
    const modeClass = (user.mode || "Both").toLowerCase();
    modeBadgeEl.className = "badge-mode " + modeClass;
    modeBadgeEl.textContent = "Mode: " + (user.mode || "Both");
  }
}

/**
 * 2. Calculate and Render Dashboard Metrics
 */
function renderDashboardMetrics(user) {
  const teachCountEl = document.getElementById("metricTeachCount");
  const learnCountEl = document.getElementById("metricLearnCount");
  const connCountEl = document.getElementById("metricConnCount");
  const reqCountEl = document.getElementById("metricReqCount");

  // Teach & Learn counts
  const teachCount = (user.skillsTeach || []).length;
  const learnCount = (user.skillsLearn || []).length;

  if (teachCountEl) teachCountEl.textContent = teachCount;
  if (learnCountEl) learnCountEl.textContent = learnCount;

  // Active Connections count
  const allConnections = getConnections();
  const myConnections = allConnections.filter(c => c.user1Id === user.id || c.user2Id === user.id);
  if (connCountEl) connCountEl.textContent = myConnections.length;

  // Pending Incoming Requests count
  const allRequests = getRequests();
  const pendingIncoming = allRequests.filter(r => r.receiverId === user.id && r.status === "Pending");
  if (reqCountEl) reqCountEl.textContent = pendingIncoming.length;

  // Update navbar requests badge if it exists
  const navReqBadge = document.getElementById("navReqBadge");
  if (navReqBadge) {
    if (pendingIncoming.length > 0) {
      navReqBadge.textContent = pendingIncoming.length;
      navReqBadge.style.display = "inline-flex";
    } else {
      navReqBadge.style.display = "none";
    }
  }
}

/**
 * 3. Simple Skill Matching Algorithm for Suggested Students
 * Logic:
 * - Match A: Student teaches what I want to learn.
 * - Match B (Mutual): Student also wants what I can teach!
 * - Displays matching badges transparently for viva presentation.
 */
function renderSuggestedStudents(currentUser) {
  const container = document.getElementById("suggestedStudentsContainer");
  if (!container) return;

  const allUsers = getUsers();
  const otherUsers = allUsers.filter(u => u.id !== currentUser.id);

  const myLearnSet = new Set((currentUser.skillsLearn || []).map(s => s.toLowerCase()));
  const myTeachSet = new Set((currentUser.skillsTeach || []).map(s => s.toLowerCase()));

  // Score each student based on skill alignment
  const scoredStudents = otherUsers.map(student => {
    const studentTeaches = student.skillsTeach || [];
    const studentWants = student.skillsLearn || [];

    // Find which skills this student can teach ME
    const matchingTeachSkills = studentTeaches.filter(s => myLearnSet.has(s.toLowerCase()));

    // Find which skills I can teach THIS STUDENT (Mutual)
    const matchingLearnSkills = studentWants.filter(s => myTeachSet.has(s.toLowerCase()));

    const isMutual = matchingTeachSkills.length > 0 && matchingLearnSkills.length > 0;
    const isOneWay = matchingTeachSkills.length > 0;

    // Score: Mutual = 10, OneWay = 5, Others = 1
    let score = 1;
    if (isMutual) score = 10;
    else if (isOneWay) score = 5;

    return {
      student,
      score,
      isMutual,
      matchingTeachSkills,
      matchingLearnSkills
    };
  });

  // Sort highest match score first, then by rating
  scoredStudents.sort((a, b) => b.score - a.score || (b.student.rating || 0) - (a.student.rating || 0));

  // Take top 3-4 suggestions
  const topSuggestions = scoredStudents.slice(0, 4);

  if (topSuggestions.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box">
        <div class="empty-state-icon" style="color:var(--slate-400); display:flex; justify-content:center;">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <div class="empty-state-title">No other students found</div>
        <p class="empty-state-text">Once more peers join, you'll see suggested study partners here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = "";

  topSuggestions.forEach(({ student, isMutual, matchingTeachSkills }) => {
    const initials = student.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    const modeClass = (student.mode || "Both").toLowerCase();

    const card = document.createElement("div");
    card.className = "suggested-student-item";

    let matchHighlightHtml = "";
    if (isMutual) {
      matchHighlightHtml = `
        <span class="mutual-exchange-badge">
          <span>Mutual Skill Exchange Match</span>
        </span>
      `;
    } else if (matchingTeachSkills.length > 0) {
      matchHighlightHtml = `
        <span class="skill-tag teach" style="font-size:0.75rem;">
          Teaches what you want: <strong>${matchingTeachSkills.join(", ")}</strong>
        </span>
      `;
    }

    card.innerHTML = `
      <div class="suggested-top-row">
        <div class="suggested-user-identity">
          <div class="suggested-avatar avatar-circle-swatch ${student.avatarBg || 'blue'}">
            ${initials}
          </div>
          <div class="suggested-user-name">
            <h4>${escapeHtml(student.name)}</h4>
            <p><span class="badge-year">${student.year}</span> • ${escapeHtml(student.branch)}</p>
          </div>
        </div>
        <div style="text-align: right;">
          <span class="badge-mode ${modeClass}">${student.mode}</span>
          <div style="font-size: 0.8rem; font-weight: 700; color: #f59e0b; margin-top: 0.25rem;">
            ★ ${(student.rating || 5.0).toFixed(1)} <span style="font-weight:400; color:var(--slate-500);">(${student.reviewCount || 0})</span>
          </div>
        </div>
      </div>

      ${matchHighlightHtml ? `<div style="margin: 0.2rem 0;">${matchHighlightHtml}</div>` : ""}

      <div class="suggested-skills-info">
        <div>
          <span style="font-size: 0.78rem; font-weight: 700; color: var(--slate-500);">Can Teach: </span>
          ${(student.skillsTeach || []).map(s => `<span class="skill-tag teach" style="font-size:0.75rem; padding:0.2rem 0.55rem;">${escapeHtml(s)}</span>`).join(" ")}
        </div>
        <div>
          <span style="font-size: 0.78rem; font-weight: 700; color: var(--slate-500);">Wants to Learn: </span>
          ${(student.skillsLearn || []).map(s => `<span class="skill-tag learn" style="font-size:0.75rem; padding:0.2rem 0.55rem;">${escapeHtml(s)}</span>`).join(" ")}
        </div>
      </div>

      <div class="suggested-actions">
        <a href="student-profile.html?id=${student.id}" class="btn btn-outline btn-sm">View Profile</a>
        <a href="requests.html?new=${student.id}" class="btn btn-primary btn-sm">Send Request</a>
      </div>
    `;

    container.appendChild(card);
  });
}

/**
 * 4. Render Current User's Skills Overview
 */
function renderMySkillsOverview(user) {
  const teachContainer = document.getElementById("dashMyTeachSkills");
  const learnContainer = document.getElementById("dashMyLearnSkills");

  if (teachContainer) {
    teachContainer.innerHTML = "";
    const teachSkills = user.skillsTeach || [];
    if (teachSkills.length === 0) {
      teachContainer.innerHTML = `<span style="font-size:0.85rem; color:var(--slate-500);">No teaching skills added yet.</span>`;
    } else {
      teachSkills.forEach(skill => {
        const tag = document.createElement("span");
        tag.className = "skill-tag teach";
        tag.textContent = skill;
        teachContainer.appendChild(tag);
      });
    }
  }

  if (learnContainer) {
    learnContainer.innerHTML = "";
    const learnSkills = user.skillsLearn || [];
    if (learnSkills.length === 0) {
      learnContainer.innerHTML = `<span style="font-size:0.85rem; color:var(--slate-500);">No learning goals added yet.</span>`;
    } else {
      learnSkills.forEach(skill => {
        const tag = document.createElement("span");
        tag.className = "skill-tag learn";
        tag.textContent = skill;
        learnContainer.appendChild(tag);
      });
    }
  }
}

/**
 * 5. Render Recent Requests in Sidebar
 */
function renderRecentRequests(user) {
  const container = document.getElementById("dashRecentRequestsList");
  if (!container) return;

  const allRequests = getRequests();
  // Requests related to this user
  const myRequests = allRequests.filter(r => r.senderId === user.id || r.receiverId === user.id);

  if (myRequests.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box" style="padding: 1.5rem 1rem;">
        <div style="margin-bottom: 0.35rem; display: flex; justify-content: center; color: var(--slate-400);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        </div>
        <p style="font-size: 0.82rem; color: var(--slate-500);">No requests yet. Search students to request a learning session!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = "";
  // Show most recent 3
  const recent = myRequests.slice(-3).reverse();

  recent.forEach(req => {
    const isIncoming = req.receiverId === user.id;
    const otherPartyName = isIncoming ? req.senderName : req.receiverName;
    const directionLabel = isIncoming ? "From" : "To";

    let statusBadgeColor = "var(--primary-light); color: var(--primary);";
    if (req.status === "Accepted") statusBadgeColor = "var(--accent-light); color: #065f46;";
    if (req.status === "Rejected") statusBadgeColor = "#fef2f2; color: #991b1b;";

    const item = document.createElement("div");
    item.className = "mini-activity-item";
    item.innerHTML = `
      <div class="mini-activity-header">
        <span>${directionLabel}: ${escapeHtml(otherPartyName)}</span>
        <span style="font-size: 0.74rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: var(--radius-full); background: ${statusBadgeColor}">
          ${req.status}
        </span>
      </div>
      <div class="mini-activity-desc">
        Topic: <strong>${escapeHtml(req.skillRequested)}</strong> • ${req.mode || 'Online'}
      </div>
    `;
    container.appendChild(item);
  });
}

/**
 * 6. Render Active Connections Preview in Sidebar
 */
function renderConnectionsPreview(user) {
  const container = document.getElementById("dashConnectionsList");
  if (!container) return;

  const allConnections = getConnections();
  const allUsers = getUsers();
  const myConnections = allConnections.filter(c => c.user1Id === user.id || c.user2Id === user.id);

  if (myConnections.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box" style="padding: 1.5rem 1rem;">
        <div style="margin-bottom: 0.35rem; display: flex; justify-content: center; color: var(--slate-400);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
          </svg>
        </div>
        <p style="font-size: 0.82rem; color: var(--slate-500);">No connections formed yet. Accept a request or reach out to a peer.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = "";
  myConnections.slice(-3).reverse().forEach(conn => {
    const partnerId = conn.user1Id === user.id ? conn.user2Id : conn.user1Id;
    const partner = allUsers.find(u => u.id === partnerId);
    const partnerName = partner ? partner.name : "Student Peer";
    const partnerYear = partner ? partner.year : "Student";

    const item = document.createElement("div");
    item.className = "mini-activity-item";
    item.innerHTML = `
      <div class="mini-activity-header">
        <span>${escapeHtml(partnerName)} (${partnerYear})</span>
        <span class="badge-mode ${conn.mode === 'Offline' ? 'offline' : 'online'}" style="font-size: 0.72rem; padding: 0.1rem 0.45rem;">
          ${conn.mode}
        </span>
      </div>
      <div class="mini-activity-desc">
        Skill: <strong>${escapeHtml(conn.skillExchanged || 'Skill Exchange')}</strong>
      </div>
    `;
    container.appendChild(item);
  });
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
