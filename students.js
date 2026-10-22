/**
 * Student Skill Exchange Platform
 * students.js - Find Students, Search, Filters & Cards (Phase 4)
 * Author: College Field Project
 * 
 * Provides:
 * - Dynamic student directory filtering by name, skill, academic year, and mode
 * - Transparent skill matching highlights (Mutual vs. One-way match)
 * - Safe navigation to individual student profile pages
 */

document.addEventListener("DOMContentLoaded", function () {
  // Guard protected page
  const currentUser = requireAuth();
  if (!currentUser) return;

  initStudentsDirectory(currentUser);

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

function initStudentsDirectory(currentUser) {
  const searchInput = document.getElementById("studentSearchInput");
  const yearFilter = document.getElementById("filterYearSelect");
  const modeFilter = document.getElementById("filterModeSelect");
  const skillFilter = document.getElementById("filterSkillSelect");
  const resetBtn = document.getElementById("resetFiltersBtn");
  const gridContainer = document.getElementById("studentsGridContainer");
  const resultsCounter = document.getElementById("resultsCounter");

  // Get all registered students except current logged-in student
  const allUsers = getUsers();
  const studentPeers = allUsers.filter(u => u.id !== currentUser.id);

  // Populate dynamic skill dropdown from actual skills taught by peers
  populateSkillFilterOptions(studentPeers, skillFilter);

  // Check if a URL query parameter was passed (e.g. ?skill=Python)
  const urlParams = new URLSearchParams(window.location.search);
  const initialSkillParam = urlParams.get("skill");
  if (initialSkillParam && skillFilter) {
    skillFilter.value = initialSkillParam;
  }

  // Initial render
  filterAndRender();

  // Attach event listeners for real-time filtering
  if (searchInput) searchInput.addEventListener("input", filterAndRender);
  if (yearFilter) yearFilter.addEventListener("change", filterAndRender);
  if (modeFilter) modeFilter.addEventListener("change", filterAndRender);
  if (skillFilter) skillFilter.addEventListener("change", filterAndRender);

  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      if (searchInput) searchInput.value = "";
      if (yearFilter) yearFilter.value = "all";
      if (modeFilter) modeFilter.value = "all";
      if (skillFilter) skillFilter.value = "all";
      filterAndRender();
    });
  }

  function filterAndRender() {
    const query = (searchInput?.value || "").trim().toLowerCase();
    const selectedYear = yearFilter?.value || "all";
    const selectedMode = modeFilter?.value || "all";
    const selectedSkill = skillFilter?.value || "all";

    const myLearnSet = new Set((currentUser.skillsLearn || []).map(s => s.toLowerCase()));
    const myTeachSet = new Set((currentUser.skillsTeach || []).map(s => s.toLowerCase()));

    // Filter students
    const filtered = studentPeers.filter(student => {
      // 1. Text Search: matches Name, Branch, or any skill (teach or learn)
      if (query) {
        const nameMatch = (student.name || "").toLowerCase().includes(query);
        const branchMatch = (student.branch || "").toLowerCase().includes(query);
        const teachMatch = (student.skillsTeach || []).some(s => s.toLowerCase().includes(query));
        const learnMatch = (student.skillsLearn || []).some(s => s.toLowerCase().includes(query));

        if (!nameMatch && !branchMatch && !teachMatch && !learnMatch) {
          return false;
        }
      }

      // 2. Year Filter
      if (selectedYear !== "all" && student.year !== selectedYear) {
        return false;
      }

      // 3. Learning Mode Filter
      if (selectedMode !== "all") {
        if (selectedMode === "Online" && student.mode === "Offline") return false;
        if (selectedMode === "Offline" && student.mode === "Online") return false;
        if (selectedMode === "Both" && student.mode !== "Both") return false;
      }

      // 4. Specific Skill Filter (checks skills they can teach)
      if (selectedSkill !== "all") {
        const hasSkill = (student.skillsTeach || []).some(s => s.toLowerCase() === selectedSkill.toLowerCase());
        if (!hasSkill) return false;
      }

      return true;
    });

    // Score for intelligent sorting (Mutual exchange first, then 1-way matches, then rest)
    const enrichedStudents = filtered.map(student => {
      const studentTeaches = student.skillsTeach || [];
      const studentWants = student.skillsLearn || [];

      const teachesMe = studentTeaches.filter(s => myLearnSet.has(s.toLowerCase()));
      const iTeachThem = studentWants.filter(s => myTeachSet.has(s.toLowerCase()));

      const isMutual = teachesMe.length > 0 && iTeachThem.length > 0;
      const isOneWay = teachesMe.length > 0;

      let matchScore = 0;
      if (isMutual) matchScore = 10;
      else if (isOneWay) matchScore = 5;

      return {
        student,
        matchScore,
        isMutual,
        isOneWay,
        teachesMe,
        iTeachThem
      };
    });

    // Sort: highest match score first, then rating
    enrichedStudents.sort((a, b) => b.matchScore - a.matchScore || (b.student.rating || 0) - (a.student.rating || 0));

    // Update Counter
    if (resultsCounter) {
      resultsCounter.textContent = `Showing ${enrichedStudents.length} student ${enrichedStudents.length === 1 ? 'peer' : 'peers'}`;
    }

    // Render Grid
    renderCards(enrichedStudents, gridContainer);
  }
}

/**
 * Render Student Cards Grid
 */
function renderCards(enrichedList, container) {
  if (!container) return;

  if (enrichedList.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box" style="grid-column: 1 / -1; padding: 4rem 1.5rem;">
        <div class="empty-state-icon" style="color:var(--slate-400); display:flex; justify-content:center;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <div class="empty-state-title">No Students Found</div>
        <p class="empty-state-text">
          No student peers matched your search criteria. Try a broader search term or reset the filters.
        </p>
        <button type="button" class="btn btn-outline-primary btn-sm" onclick="document.getElementById('resetFiltersBtn').click()">
          Reset All Filters
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = "";

  enrichedList.forEach(({ student, isMutual, isOneWay, teachesMe }) => {
    const initials = student.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    const modeClass = (student.mode || "Both").toLowerCase();

    const card = document.createElement("div");
    card.className = "student-card";

    // Match Highlight Strip
    let matchStripHtml = "";
    if (isMutual) {
      matchStripHtml = `
        <div class="match-highlight-strip mutual">
          <span>Mutual Skill Exchange Available!</span>
        </div>
      `;
    } else if (isOneWay && teachesMe.length > 0) {
      matchStripHtml = `
        <div class="match-highlight-strip oneway">
          <span>Teaches what you want: <strong>${escapeHtml(teachesMe.join(", "))}</strong></span>
        </div>
      `;
    }

    card.innerHTML = `
      <div>
        <div class="student-card-header">
          <div class="student-card-avatar avatar-circle-swatch ${student.avatarBg || 'blue'}">
            ${initials}
          </div>
          <div class="student-card-identity">
            <h3>${escapeHtml(student.name)}</h3>
            <p><span class="badge-year">${student.year}</span> • ${escapeHtml(student.branch)}</p>
          </div>
        </div>

        ${matchStripHtml}

        <div class="student-card-meta">
          <span class="badge-mode ${modeClass}">${student.mode} Mode</span>
          <span style="font-weight: 700; color: #f59e0b;">
            ★ ${(student.rating || 5.0).toFixed(1)} <span style="font-weight:400; color:var(--slate-500); font-size:0.78rem;">(${student.reviewCount || 0} reviews)</span>
          </span>
        </div>

        <p class="student-card-bio">
          ${escapeHtml(student.bio || 'College student eager to learn and share skills on campus.')}
        </p>

        <div class="student-skills-section">
          <div>
            <span style="font-size: 0.76rem; font-weight: 700; color: var(--slate-500); display: block; margin-bottom: 0.25rem;">CAN TEACH:</span>
            <div style="display: flex; flex-wrap: wrap; gap: 0.35rem;">
              ${(student.skillsTeach || []).map(s => `<span class="skill-tag teach" style="font-size:0.75rem; padding:0.2rem 0.55rem;">${escapeHtml(s)}</span>`).join("")}
            </div>
          </div>

          <div style="margin-top: 0.4rem;">
            <span style="font-size: 0.76rem; font-weight: 700; color: var(--slate-500); display: block; margin-bottom: 0.25rem;">WANTS TO LEARN:</span>
            <div style="display: flex; flex-wrap: wrap; gap: 0.35rem;">
              ${(student.skillsLearn || []).map(s => `<span class="skill-tag learn" style="font-size:0.75rem; padding:0.2rem 0.55rem;">${escapeHtml(s)}</span>`).join("")}
            </div>
          </div>
        </div>
      </div>

      <div class="student-card-footer">
        <a href="student-profile.html?id=${student.id}" class="btn btn-outline btn-sm">View Profile</a>
        <a href="requests.html?new=${student.id}" class="btn btn-primary btn-sm">Send Request</a>
      </div>
    `;

    container.appendChild(card);
  });
}

/**
 * Populate dynamic skills dropdown with all skills offered across students
 */
function populateSkillFilterOptions(students, selectElement) {
  if (!selectElement) return;

  const skillSet = new Set();
  students.forEach(student => {
    (student.skillsTeach || []).forEach(skill => {
      if (skill && skill.trim()) {
        skillSet.add(skill.trim());
      }
    });
  });

  const sortedSkills = Array.from(skillSet).sort();

  // Reset options keeping the first "All Skills"
  selectElement.innerHTML = `<option value="all">All Skills</option>`;
  sortedSkills.forEach(skill => {
    const opt = document.createElement("option");
    opt.value = skill;
    opt.textContent = skill;
    selectElement.appendChild(opt);
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
