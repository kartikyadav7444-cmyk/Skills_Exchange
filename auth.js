/**
 * Student Skill Exchange Platform
 * auth.js - Authentication & Validation Logic
 * Author: College Field Project
 * 
 * Simple, transparent client-side authentication using LocalStorage.
 * Handles registration, login, logout, session checking, and input validation.
 */

document.addEventListener("DOMContentLoaded", function () {
  // If on login page, attach login handlers
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    initLoginPage();
  }

  // If on register page, attach register handlers
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    initRegisterPage();
  }
});

/**
 * 1. Initialize Login Page Controls
 */
function initLoginPage() {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const errorAlert = document.getElementById("loginErrorAlert");
  const demoAccountSelect = document.getElementById("demoAccountSelect");

  // Check if already logged in -> redirect to dashboard
  const currentUser = getCurrentUser();
  if (currentUser) {
    window.location.href = "dashboard.html";
    return;
  }

  // Handle Demo Account Quick-Fill Dropdown (Great for college viva testing)
  if (demoAccountSelect) {
    demoAccountSelect.addEventListener("change", function () {
      const selectedEmail = this.value;
      if (selectedEmail) {
        emailInput.value = selectedEmail;
        passwordInput.value = "password123";
        hideAlert(errorAlert);
      }
    });
  }

  // Handle Form Submission
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    hideAlert(errorAlert);

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Simple Validation
    if (!email || !password) {
      showAlert(errorAlert, "Please enter both your college email and password.");
      return;
    }

    // Authenticate with LocalStorage users
    const user = getUserByEmail(email);

    if (!user) {
      showAlert(errorAlert, "No student account found with this email. Please check your spelling or register.");
      return;
    }

    if (user.password !== password) {
      showAlert(errorAlert, "Incorrect password. (For demo accounts, use 'password123').");
      return;
    }

    // Login successful
    setCurrentUser(user);

    // Show quick feedback then redirect
    const submitBtn = loginForm.querySelector("button[type='submit']");
    if (submitBtn) {
      submitBtn.textContent = "Logging in...";
      submitBtn.disabled = true;
    }

    setTimeout(function () {
      window.location.href = "dashboard.html";
    }, 400);
  });
}

/**
 * 2. Initialize Registration Page Controls
 */
function initRegisterPage() {
  const registerForm = document.getElementById("registerForm");
  const errorAlert = document.getElementById("registerErrorAlert");

  // Check if already logged in
  const currentUser = getCurrentUser();
  if (currentUser) {
    window.location.href = "dashboard.html";
    return;
  }

  // Skill Tag Selection Arrays
  const teachSkills = new Set();
  const learnSkills = new Set();

  // Setup interactive tag buttons for "Skills I Can Teach"
  setupSkillTagSelector("teachTagsContainer", "customTeachInput", "addTeachBtn", teachSkills, "teachSkillsHidden");

  // Setup interactive tag buttons for "Skills I Want to Learn"
  setupSkillTagSelector("learnTagsContainer", "customLearnInput", "addLearnBtn", learnSkills, "learnSkillsHidden");

  // Handle Form Submission
  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();
    hideAlert(errorAlert);

    const fullName = document.getElementById("regFullName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;
    const year = document.getElementById("regYear").value;
    const branch = document.getElementById("regBranch").value.trim();
    const mode = document.querySelector("input[name='regMode']:checked")?.value || "Both";
    const bio = document.getElementById("regBio").value.trim();
    const avatarBg = document.querySelector("input[name='regAvatar']:checked")?.value || "blue";

    // Client-side Validations
    if (!fullName) {
      showAlert(errorAlert, "Please enter your full name.");
      return;
    }

    if (!email || !isValidEmail(email)) {
      showAlert(errorAlert, "Please enter a valid college or personal email address.");
      return;
    }

    if (password.length < 6) {
      showAlert(errorAlert, "Password must be at least 6 characters long.");
      return;
    }

    if (!year) {
      showAlert(errorAlert, "Please select your academic year (FY, SY, or TY).");
      return;
    }

    if (!branch) {
      showAlert(errorAlert, "Please select or enter your college branch / department.");
      return;
    }

    if (teachSkills.size === 0) {
      showAlert(errorAlert, "Please select or add at least one skill you can teach.");
      return;
    }

    if (learnSkills.size === 0) {
      showAlert(errorAlert, "Please select or add at least one skill you want to learn.");
      return;
    }

    // Check if email already registered
    const existing = getUserByEmail(email);
    if (existing) {
      showAlert(errorAlert, "An account with this email already exists. Please log in instead.");
      return;
    }

    // Create New Student Profile Object
    const newUser = {
      id: "user_" + Date.now(),
      name: fullName,
      email: email,
      password: password,
      year: year,
      branch: branch,
      bio: bio || "Enthusiastic college student ready to learn and share skills.",
      avatarBg: avatarBg,
      skillsTeach: Array.from(teachSkills),
      skillsLearn: Array.from(learnSkills),
      mode: mode,
      rating: 5.0,
      reviewCount: 0
    };

    // Save to LocalStorage
    addUser(newUser);

    // Auto log-in the newly registered user
    setCurrentUser(newUser);

    // Redirect to dashboard
    const submitBtn = registerForm.querySelector("button[type='submit']");
    if (submitBtn) {
      submitBtn.textContent = "Creating profile...";
      submitBtn.disabled = true;
    }

    setTimeout(function () {
      window.location.href = "dashboard.html";
    }, 500);
  });
}

/**
 * Interactive Skill Tag Selector Helper
 * Allows clicking predefined skill chips OR typing a custom skill.
 */
function setupSkillTagSelector(chipsContainerId, customInputId, addBtnId, skillsSet, hiddenInputId) {
  const container = document.getElementById(chipsContainerId);
  const customInput = document.getElementById(customInputId);
  const addBtn = document.getElementById(addBtnId);

  if (!container) return;

  // Toggle predefined skill chips on click
  container.addEventListener("click", function (e) {
    const chip = e.target.closest(".skill-chip-btn");
    if (!chip) return;

    const skillName = chip.getAttribute("data-skill");
    if (skillsSet.has(skillName)) {
      skillsSet.delete(skillName);
      chip.classList.remove("selected");
    } else {
      skillsSet.add(skillName);
      chip.classList.add("selected");
    }
  });

  // Add custom typed skill
  function addCustomSkill() {
    if (!customInput) return;
    const value = customInput.value.trim();
    if (!value) return;

    // Capitalize first letter cleanly
    const formattedSkill = value.charAt(0).toUpperCase() + value.slice(1);

    if (!skillsSet.has(formattedSkill)) {
      skillsSet.add(formattedSkill);

      // Create new chip dynamically
      const newChip = document.createElement("button");
      newChip.type = "button";
      newChip.className = "skill-chip-btn selected custom";
      newChip.setAttribute("data-skill", formattedSkill);
      newChip.textContent = formattedSkill + " ×";

      newChip.addEventListener("click", function () {
        skillsSet.delete(formattedSkill);
        newChip.remove();
      });

      container.appendChild(newChip);
    }
    customInput.value = "";
  }

  if (addBtn) {
    addBtn.addEventListener("click", function (e) {
      e.preventDefault();
      addCustomSkill();
    });
  }

  if (customInput) {
    customInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        addCustomSkill();
      }
    });
  }
}

/**
 * Utility: Email Format Validator
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Utility: Display error alert
 */
function showAlert(alertElement, message) {
  if (!alertElement) return;
  alertElement.textContent = message;
  alertElement.style.display = "block";
  alertElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * Utility: Hide error alert
 */
function hideAlert(alertElement) {
  if (!alertElement) return;
  alertElement.style.display = "none";
}

/**
 * Session Protection Guard
 * Redirects to login page if current user is not logged in.
 * Call this at top of protected pages (Dashboard, Profile, Find Students, etc.)
 */
function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  return user;
}

/**
 * Logout Current User
 */
function logoutUser() {
  clearCurrentUser();
  window.location.href = "login.html";
}
