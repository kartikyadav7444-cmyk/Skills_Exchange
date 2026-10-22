/**
 * Student Skill Exchange Platform
 * connections.js - Active Student Connections & Sessions (Phase 6 & 7)
 * Author: College Field Project
 * 
 * Manages:
 * 1. Rendering all active accepted student connections for the logged-in student.
 * 2. Providing session interaction guidelines for both Online and On-Campus Offline meetings.
 * 3. Connecting with reviews.js to allow rating and reviewing connected peers.
 */

document.addEventListener("DOMContentLoaded", function () {
  // Guard protected page
  const currentUser = requireAuth();
  if (!currentUser) return;

  initConnectionsPage(currentUser);

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

function initConnectionsPage(currentUser) {
  const container = document.getElementById("connectionsListContainer");
  const countEl = document.getElementById("connectionsCounter");
  const successAlert = document.getElementById("connectionSuccessAlert");

  // Initialize Review Modal from reviews.js
  initReviewModal(currentUser, function (targetStudent, rating) {
    if (successAlert) {
      successAlert.style.display = "block";
      successAlert.textContent = `Review submitted for ${targetStudent.name}! Thank you for your feedback.`;
      setTimeout(() => { successAlert.style.display = "none"; }, 4000);
    }
    renderConnections();
  });

  renderConnections();

  function renderConnections() {
    const allConnections = getConnections();
    const allUsers = getUsers();
    const allReviews = getReviews();

    // Filter connections belonging to current user
    const myConnections = allConnections.filter(c => c.user1Id === currentUser.id || c.user2Id === currentUser.id);

    if (countEl) {
      countEl.textContent = `You have ${myConnections.length} active ${myConnections.length === 1 ? 'connection' : 'connections'}`;
    }

    if (!container) return;

    if (myConnections.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box" style="padding: 4rem 1.5rem; background: var(--white); border-radius: var(--radius-lg); border: 1px solid var(--slate-200);">
          <div class="empty-state-icon" style="color:var(--slate-400); display:flex; justify-content:center;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div class="empty-state-title">No Active Connections Yet</div>
          <p class="empty-state-text">
            When you accept a learning request or another student accepts yours, 
            they will appear here as your learning partner.
          </p>
          <div style="display:flex; justify-content:center; gap:0.75rem; margin-top:1rem;">
            <a href="students.html" class="btn btn-primary btn-sm">Find Students to Connect</a>
            <a href="requests.html" class="btn btn-outline btn-sm">Check Requests</a>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = "";

    myConnections.forEach(conn => {
      // Find partner ID
      const partnerId = conn.user1Id === currentUser.id ? conn.user2Id : conn.user1Id;
      const partner = allUsers.find(u => u.id === partnerId);

      if (!partner) return;

      const initials = partner.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
      const modeClass = (conn.mode || partner.mode || "Both").toLowerCase();

      // Check if current user has already reviewed this partner
      const existingReview = allReviews.find(r => r.reviewerId === currentUser.id && r.targetUserId === partner.id);

      // Session Guidance Message
      let sessionGuidance = "";
      if (conn.mode === "Offline" || partner.mode === "Offline") {
        sessionGuidance = `
          <div class="connection-interaction-box">
            <div class="connection-interaction-title" style="color: #92400e;">
              <span>On-Campus Meeting Arrangement</span>
            </div>
            <p class="connection-interaction-text">
              You are connected for on-campus learning. You can coordinate to meet in the college library, study cubicles, or canteen during break hours. No GPS or tracking is needed.
            </p>
          </div>
        `;
      } else if (conn.mode === "Online" || partner.mode === "Online") {
        sessionGuidance = `
          <div class="connection-interaction-box">
            <div class="connection-interaction-title" style="color: var(--primary);">
              <span>Online Remote Session</span>
            </div>
            <p class="connection-interaction-text">
              You can exchange code snippets, notes, or conduct a screen-share session via Google Meet, Zoom, or Discord at a mutually convenient time.
            </p>
          </div>
        `;
      } else {
        sessionGuidance = `
          <div class="connection-interaction-box">
            <div class="connection-interaction-title" style="color: #065f46;">
              <span>Hybrid Learning (Online & On-Campus)</span>
            </div>
            <p class="connection-interaction-text">
              Feel free to meet on campus for hands-on doubts or connect remotely online for late evening study sessions!
            </p>
          </div>
        `;
      }

      const card = document.createElement("div");
      card.className = "student-card";
      card.style.marginBottom = "1.5rem";

      let reviewBtnHtml = "";
      if (existingReview) {
        reviewBtnHtml = `
          <div style="font-size: 0.84rem; color: #f59e0b; font-weight: 700; display:flex; align-items:center; gap:4px;">
            <span>Your rating: ${"★".repeat(existingReview.rating)}</span>
            <button type="button" class="rate-peer-btn btn btn-outline btn-sm" style="margin-left:0.5rem; font-size:0.75rem; padding:0.25rem 0.6rem;">Edit Review</button>
          </div>
        `;
      } else {
        reviewBtnHtml = `
          <button type="button" class="rate-peer-btn btn btn-outline-primary btn-sm">
            ★ Rate & Leave Review
          </button>
        `;
      }

      card.innerHTML = `
        <div>
          <!-- Header -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem; flex-wrap:wrap; gap:0.75rem;">
            <div style="display:flex; align-items:center; gap:1rem;">
              <div class="student-card-avatar avatar-circle-swatch ${partner.avatarBg || 'blue'}" style="width:52px; height:52px; font-size:1.2rem;">
                ${initials}
              </div>
              <div>
                <h3 style="font-size:1.15rem; margin-bottom:0.15rem; color:var(--slate-900);">${escapeHtml(partner.name)}</h3>
                <p style="font-size:0.82rem; color:var(--slate-500);">
                  <span class="badge-year">${partner.year}</span> • ${escapeHtml(partner.branch)} • ★ ${(partner.rating || 5.0).toFixed(1)}
                </p>
              </div>
            </div>

            <div style="text-align:right;">
              <span class="badge-mode ${modeClass}">${conn.mode || partner.mode}</span>
              <div style="font-size:0.75rem; color:var(--slate-400); margin-top:0.35rem;">
                Connected: ${formatDate(conn.connectedAt)}
              </div>
            </div>
          </div>

          <!-- Skill Exchanged Pill -->
          <div style="margin-bottom:0.75rem; font-size:0.86rem;">
            <strong>Learning Focus:</strong>
            <span class="skill-tag teach" style="font-size:0.8rem; padding:0.2rem 0.65rem; margin-left:0.35rem;">
              ${escapeHtml(conn.skillExchanged || 'Skill Exchange')}
            </span>
          </div>

          <!-- Session Guidance -->
          ${sessionGuidance}
        </div>

        <!-- Footer Actions -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--slate-100); padding-top:1rem; margin-top:1.25rem; flex-wrap:wrap; gap:0.75rem;">
          <a href="student-profile.html?id=${partner.id}" class="btn btn-outline btn-sm">
            View Partner Profile
          </a>
          <div>
            ${reviewBtnHtml}
          </div>
        </div>
      `;

      // Attach Rate/Review button click
      const rateBtn = card.querySelector(".rate-peer-btn");
      if (rateBtn) {
        rateBtn.addEventListener("click", function () {
          openStudentReviewModal(partner, conn.skillExchanged);
        });
      }

      container.appendChild(card);
    });
  }
}

function formatDate(isoString) {
  if (!isoString) return "Recent";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch (e) {
    return "Recent";
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
