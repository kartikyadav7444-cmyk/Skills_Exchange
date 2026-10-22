/**
 * Student Skill Exchange Platform
 * profile.js - Student Profile Viewing and Editing (Phase 3)
 * Author: College Field Project
 * 
 * Simple, transparent profile controller:
 * - Renders profile information and peer reviews
 * - Allows easy addition and removal of skills in Edit Mode
 * - Updates LocalStorage and synchronizes changes immediately
 */

// Module state for editing skills
let editTeachSkills = [];
let editLearnSkills = [];

document.addEventListener("DOMContentLoaded", function () {
  // Guard protected profile page
  const currentUser = requireAuth();
  if (!currentUser) return;

  // Initialize View & Edit states
  renderProfileView(currentUser);
  initProfileEditForm(currentUser);
  renderUserReviews(currentUser);

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

/**
 * 1. Render Profile Read-Only View
 */
function renderProfileView(user) {
  const nameEl = document.getElementById("profViewName");
  const metaEl = document.getElementById("profViewMeta");
  const emailEl = document.getElementById("profViewEmail");
  const avatarEl = document.getElementById("profViewAvatar");
  const ratingEl = document.getElementById("profViewRating");
  const modeBadgeEl = document.getElementById("profViewMode");
  const bioEl = document.getElementById("profViewBio");
  const teachListEl = document.getElementById("profViewTeachSkills");
  const learnListEl = document.getElementById("profViewLearnSkills");

  if (nameEl) nameEl.textContent = user.name;
  if (metaEl) metaEl.textContent = user.branch + " • " + user.year + " Academic Year";
  if (emailEl) emailEl.textContent = user.email;

  if (avatarEl) {
    avatarEl.className = "profile-avatar-large avatar-circle-swatch " + (user.avatarBg || "blue");
    const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    avatarEl.textContent = initials || "SE";
  }

  if (ratingEl) {
    const rating = user.rating || 5.0;
    const reviewCount = user.reviewCount || 0;
    ratingEl.innerHTML = `★ <strong>${rating.toFixed(1)}</strong> <span style="font-weight:400; color:var(--slate-500);">(${reviewCount} reviews)</span>`;
  }

  if (modeBadgeEl) {
    const modeClass = (user.mode || "Both").toLowerCase();
    modeBadgeEl.className = "badge-mode " + modeClass;
    modeBadgeEl.textContent = "Preferred Mode: " + (user.mode || "Both");
  }

  if (bioEl) {
    bioEl.textContent = user.bio || "No bio added yet. Click 'Edit Profile' to share more about yourself!";
  }

  // Render Teach Skills tags
  if (teachListEl) {
    teachListEl.innerHTML = "";
    if (!user.skillsTeach || user.skillsTeach.length === 0) {
      teachListEl.innerHTML = `<span style="font-size:0.85rem; color:var(--slate-500);">No teaching skills listed.</span>`;
    } else {
      user.skillsTeach.forEach(skill => {
        const tag = document.createElement("span");
        tag.className = "skill-tag teach";
        tag.textContent = skill;
        teachListEl.appendChild(tag);
      });
    }
  }

  // Render Learn Skills tags
  if (learnListEl) {
    learnListEl.innerHTML = "";
    if (!user.skillsLearn || user.skillsLearn.length === 0) {
      learnListEl.innerHTML = `<span style="font-size:0.85rem; color:var(--slate-500);">No learning goals listed.</span>`;
    } else {
      user.skillsLearn.forEach(skill => {
        const tag = document.createElement("span");
        tag.className = "skill-tag learn";
        tag.textContent = skill;
        learnListEl.appendChild(tag);
      });
    }
  }
}

/**
 * 2. Initialize Profile Editing Mode & Handlers
 */
function initProfileEditForm(initialUser) {
  let currentUser = initialUser;
  const editToggleBtn = document.getElementById("editProfileToggleBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const profileViewCard = document.getElementById("profileViewContainer");
  const profileEditCard = document.getElementById("profileEditContainer");
  const editForm = document.getElementById("editProfileForm");
  const successAlert = document.getElementById("profileSuccessAlert");

  if (!editToggleBtn || !profileEditCard) return;

  // Toggle Edit View
  editToggleBtn.addEventListener("click", function () {
    // Refresh user from storage in case it changed
    currentUser = getCurrentUser() || currentUser;
    populateEditFields(currentUser);
    profileViewCard.style.display = "none";
    profileEditCard.style.display = "block";
    profileEditCard.scrollIntoView({ behavior: "smooth" });
  });

  // Cancel Edit View
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", function () {
      profileEditCard.style.display = "none";
      profileViewCard.style.display = "block";
    });
  }

  function populateEditFields(u) {
    document.getElementById("editFullName").value = u.name || "";
    document.getElementById("editYear").value = u.year || "SY";
    document.getElementById("editBranch").value = u.branch || "";
    document.getElementById("editBio").value = u.bio || "";

    // Set Learning Mode Radio
    const modeRadio = document.querySelector(`input[name="editMode"][value="${u.mode || 'Both'}"]`);
    if (modeRadio) modeRadio.checked = true;

    // Set Avatar Radio
    const avatarRadio = document.querySelector(`input[name="editAvatar"][value="${u.avatarBg || 'blue'}"]`);
    if (avatarRadio) avatarRadio.checked = true;

    // Clone skills into local editable arrays
    editTeachSkills = Array.isArray(u.skillsTeach) ? [...u.skillsTeach] : [];
    editLearnSkills = Array.isArray(u.skillsLearn) ? [...u.skillsLearn] : [];

    renderEditableTeachChips();
    renderEditableLearnChips();
  }

  // Bind Add Buttons
  const addTeachBtn = document.getElementById("addEditTeachBtn");
  const teachInput = document.getElementById("customEditTeachInput");
  if (addTeachBtn && teachInput) {
    addTeachBtn.onclick = function (e) {
      e.preventDefault();
      addTeachSkillFromInput();
    };
    teachInput.onkeydown = function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        addTeachSkillFromInput();
      }
    };
  }

  // Bind Quick Teach Suggestions Pool
  const quickTeachPool = document.getElementById("quickTeachPool");
  if (quickTeachPool) {
    quickTeachPool.addEventListener("click", function (e) {
      const btn = e.target.closest("button[data-add-teach]");
      if (!btn) return;
      e.preventDefault();
      const skill = btn.getAttribute("data-add-teach");
      const exists = editTeachSkills.some(s => s.toLowerCase() === skill.toLowerCase());
      if (!exists) {
        editTeachSkills.push(skill);
        renderEditableTeachChips();
      }
    });
  }

  const addLearnBtn = document.getElementById("addEditLearnBtn");
  const learnInput = document.getElementById("customEditLearnInput");
  if (addLearnBtn && learnInput) {
    addLearnBtn.onclick = function (e) {
      e.preventDefault();
      addLearnSkillFromInput();
    };
    learnInput.onkeydown = function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        addLearnSkillFromInput();
      }
    };
  }

  // Bind Quick Learn Suggestions Pool
  const quickLearnPool = document.getElementById("quickLearnPool");
  if (quickLearnPool) {
    quickLearnPool.addEventListener("click", function (e) {
      const btn = e.target.closest("button[data-add-learn]");
      if (!btn) return;
      e.preventDefault();
      const skill = btn.getAttribute("data-add-learn");
      const exists = editLearnSkills.some(s => s.toLowerCase() === skill.toLowerCase());
      if (!exists) {
        editLearnSkills.push(skill);
        renderEditableLearnChips();
      }
    });
  }

  // Handle Form Submission
  editForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const updatedName = document.getElementById("editFullName").value.trim();
    const updatedYear = document.getElementById("editYear").value;
    const updatedBranch = document.getElementById("editBranch").value.trim();
    const updatedBio = document.getElementById("editBio").value.trim();
    const updatedMode = document.querySelector("input[name='editMode']:checked")?.value || "Both";
    const updatedAvatar = document.querySelector("input[name='editAvatar']:checked")?.value || "blue";

    if (!updatedName) {
      alert("Please enter your name.");
      return;
    }

    if (editTeachSkills.length === 0) {
      alert("Please keep at least one skill you can teach.");
      return;
    }

    if (editLearnSkills.length === 0) {
      alert("Please keep at least one skill you want to learn.");
      return;
    }

    // Update current user object
    const updatedUser = {
      ...currentUser,
      name: updatedName,
      year: updatedYear,
      branch: updatedBranch,
      bio: updatedBio,
      mode: updatedMode,
      avatarBg: updatedAvatar,
      skillsTeach: [...editTeachSkills],
      skillsLearn: [...editLearnSkills]
    };

    // Save in LocalStorage
    updateUser(updatedUser);
    currentUser = updatedUser;

    // Update read view
    renderProfileView(updatedUser);

    // Switch view back to card
    profileEditCard.style.display = "none";
    profileViewCard.style.display = "block";

    if (successAlert) {
      successAlert.style.display = "block";
      successAlert.textContent = "Profile updated successfully!";
      setTimeout(() => {
        successAlert.style.display = "none";
      }, 3500);
    }
  });
}

/**
 * Add a skill to Teaching list from input
 */
function addTeachSkillFromInput() {
  const input = document.getElementById("customEditTeachInput");
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;

  const formatted = val.charAt(0).toUpperCase() + val.slice(1);
  // Avoid duplicate (case-insensitive)
  const exists = editTeachSkills.some(s => s.toLowerCase() === formatted.toLowerCase());
  if (!exists) {
    editTeachSkills.push(formatted);
    renderEditableTeachChips();
  }
  input.value = "";
}

/**
 * Add a skill to Learning list from input
 */
function addLearnSkillFromInput() {
  const input = document.getElementById("customEditLearnInput");
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;

  const formatted = val.charAt(0).toUpperCase() + val.slice(1);
  // Avoid duplicate (case-insensitive)
  const exists = editLearnSkills.some(s => s.toLowerCase() === formatted.toLowerCase());
  if (!exists) {
    editLearnSkills.push(formatted);
    renderEditableLearnChips();
  }
  input.value = "";
}

/**
 * Render editable chips for Skills I Can Teach
 */
function renderEditableTeachChips() {
  const container = document.getElementById("editTeachSkillsList");
  if (!container) return;

  container.innerHTML = "";
  if (editTeachSkills.length === 0) {
    container.innerHTML = `<span style="font-size:0.82rem; color:var(--slate-500);">No skills added. Type above to add one.</span>`;
    return;
  }

  editTeachSkills.forEach((skill, index) => {
    const chip = document.createElement("span");
    chip.className = "skill-tag teach";
    chip.style.display = "inline-flex";
    chip.style.alignItems = "center";
    chip.style.gap = "6px";
    chip.style.cursor = "default";

    chip.innerHTML = `
      <span>${escapeHtml(skill)}</span>
      <button type="button" aria-label="Remove ${escapeHtml(skill)}" style="background:transparent; border:none; color:inherit; font-weight:700; cursor:pointer; font-size:0.95rem; line-height:1; padding:0 2px;">×</button>
    `;

    const removeBtn = chip.querySelector("button");
    removeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      editTeachSkills.splice(index, 1);
      renderEditableTeachChips();
    });

    container.appendChild(chip);
  });
}

/**
 * Render editable chips for Skills I Want to Learn
 */
function renderEditableLearnChips() {
  const container = document.getElementById("editLearnSkillsList");
  if (!container) return;

  container.innerHTML = "";
  if (editLearnSkills.length === 0) {
    container.innerHTML = `<span style="font-size:0.82rem; color:var(--slate-500);">No learning goals added. Type above to add one.</span>`;
    return;
  }

  editLearnSkills.forEach((skill, index) => {
    const chip = document.createElement("span");
    chip.className = "skill-tag learn";
    chip.style.display = "inline-flex";
    chip.style.alignItems = "center";
    chip.style.gap = "6px";
    chip.style.cursor = "default";

    chip.innerHTML = `
      <span>${escapeHtml(skill)}</span>
      <button type="button" aria-label="Remove ${escapeHtml(skill)}" style="background:transparent; border:none; color:inherit; font-weight:700; cursor:pointer; font-size:0.95rem; line-height:1; padding:0 2px;">×</button>
    `;

    const removeBtn = chip.querySelector("button");
    removeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      editLearnSkills.splice(index, 1);
      renderEditableLearnChips();
    });

    container.appendChild(chip);
  });
}

/**
 * 3. Render Reviews Received by this Student
 */
function renderUserReviews(user) {
  const container = document.getElementById("profileReviewsContainer");
  if (!container) return;

  const allReviews = getReviews();
  const myReviews = allReviews.filter(r => r.targetUserId === user.id);

  if (myReviews.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box" style="padding: 2rem 1rem;">
        <div style="margin-bottom: 0.5rem; display: flex; justify-content: center; color: var(--slate-400);">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <div class="empty-state-title">No Reviews Yet</div>
        <p class="empty-state-text">
          Once you complete learning sessions with peer students on campus or online, 
          they can rate your guidance and leave helpful reviews!
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = "";
  myReviews.reverse().forEach(rev => {
    const card = document.createElement("div");
    card.className = "review-item-card";

    // Build star string
    const stars = "★".repeat(rev.rating) + "☆".repeat(5 - rev.rating);

    card.innerHTML = `
      <div class="review-item-header">
        <span class="review-author">From: ${escapeHtml(rev.reviewerName)}</span>
        <span class="review-stars">${stars}</span>
      </div>
      <p class="review-text">"${escapeHtml(rev.comment)}"</p>
      <div class="review-date">Submitted on ${rev.date || 'Recent Session'}</div>
    `;
    container.appendChild(card);
  });
}

/**
 * Helper to escape HTML
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
