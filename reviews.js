/**
 * Student Skill Exchange Platform
 * reviews.js - Student Ratings & Reviews Management (Phase 7)
 * Author: College Field Project
 * 
 * Handles:
 * 1. Interactive 1-to-5 star rating selector.
 * 2. Review submission modal for connected peers.
 * 3. Saving reviews to LocalStorage and automatic target student average recalculation.
 */

let selectedStarRating = 5;
let activeTargetStudent = null;
let activeSkillExchanged = "";

function initReviewModal(currentUser, onReviewSubmittedCallback) {
  const modalBackdrop = document.getElementById("reviewModal");
  const closeModalBtn = document.getElementById("closeReviewModalBtn");
  const cancelBtn = document.getElementById("cancelReviewBtn");
  const form = document.getElementById("reviewForm");
  const starContainer = document.getElementById("starRatingPicker");
  const errorAlert = document.getElementById("reviewModalAlert");

  if (!modalBackdrop || !form) return;

  // Star Rating Click & Hover Events
  if (starContainer) {
    const starButtons = starContainer.querySelectorAll(".star-input-btn");
    starButtons.forEach(btn => {
      btn.addEventListener("click", function () {
        const rating = parseInt(this.getAttribute("data-rating"), 10);
        selectedStarRating = rating;
        updateStarDisplay(starButtons, selectedStarRating);
      });

      btn.addEventListener("mouseenter", function () {
        const rating = parseInt(this.getAttribute("data-rating"), 10);
        updateStarDisplay(starButtons, rating);
      });
    });

    starContainer.addEventListener("mouseleave", function () {
      updateStarDisplay(starButtons, selectedStarRating);
    });
  }

  function updateStarDisplay(buttons, rating) {
    buttons.forEach(btn => {
      const starValue = parseInt(btn.getAttribute("data-rating"), 10);
      if (starValue <= rating) {
        btn.classList.add("filled");
        btn.textContent = "★";
      } else {
        btn.classList.remove("filled");
        btn.textContent = "☆";
      }
    });
  }

  // Close Modal Handlers
  function closeReviewModal() {
    modalBackdrop.style.display = "none";
    form.reset();
    selectedStarRating = 5;
    if (starContainer) {
      const starButtons = starContainer.querySelectorAll(".star-input-btn");
      updateStarDisplay(starButtons, 5);
    }
  }

  if (closeModalBtn) closeModalBtn.addEventListener("click", closeReviewModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeReviewModal);

  modalBackdrop.addEventListener("click", function (e) {
    if (e.target === modalBackdrop) closeReviewModal();
  });

  // Handle Form Submission
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!activeTargetStudent) return;

    const comment = document.getElementById("reviewComment").value.trim();

    if (!comment) {
      if (errorAlert) {
        errorAlert.textContent = "Please write a brief comment describing your learning session.";
        errorAlert.style.display = "block";
      }
      return;
    }

    // Create Review Object
    const newReview = {
      id: "rev_" + Date.now(),
      reviewerId: currentUser.id,
      reviewerName: currentUser.name,
      targetUserId: activeTargetStudent.id,
      rating: selectedStarRating,
      comment: comment,
      skill: activeSkillExchanged || "Skill Session",
      date: new Date().toISOString().split("T")[0]
    };

    // Save in LocalStorage & Recalculate Average (handled by storage.js addReview)
    addReview(newReview);

    closeReviewModal();

    if (typeof onReviewSubmittedCallback === "function") {
      onReviewSubmittedCallback(activeTargetStudent, selectedStarRating);
    }
  });
}

/**
 * Open Review Modal for a specific connected student
 */
function openStudentReviewModal(targetStudent, skill) {
  activeTargetStudent = targetStudent;
  activeSkillExchanged = skill;
  selectedStarRating = 5;

  const modalBackdrop = document.getElementById("reviewModal");
  const studentNameEl = document.getElementById("reviewTargetStudentName");
  const targetMetaEl = document.getElementById("reviewTargetMeta");
  const avatarEl = document.getElementById("reviewTargetAvatar");
  const errorAlert = document.getElementById("reviewModalAlert");
  const starContainer = document.getElementById("starRatingPicker");

  if (!modalBackdrop) return;

  if (errorAlert) errorAlert.style.display = "none";

  if (studentNameEl) studentNameEl.textContent = targetStudent.name;
  if (targetMetaEl) targetMetaEl.textContent = `${targetStudent.branch} • ${targetStudent.year} Student`;

  if (avatarEl) {
    avatarEl.className = "avatar-circle-swatch " + (targetStudent.avatarBg || "blue");
    const initials = targetStudent.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    avatarEl.textContent = initials || "SE";
  }

  if (starContainer) {
    const starButtons = starContainer.querySelectorAll(".star-input-btn");
    starButtons.forEach(btn => {
      btn.classList.add("filled");
      btn.textContent = "★";
    });
  }

  modalBackdrop.style.display = "flex";
}
