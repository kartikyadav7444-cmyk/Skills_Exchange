/**
 * Student Skill Exchange Platform
 * Phase 1: Homepage & Global Interactions
 * Author: College Field Project
 * 
 * Simple, clean JavaScript functions with clear explanations for viva demonstration.
 */

document.addEventListener("DOMContentLoaded", function () {
  // Initialize all homepage UI behaviors
  initMobileNav();
  initSkillsFilter();
  initHeroConceptDemo();
  checkNavbarAuthState();
});

/**
 * Update navbar buttons if user is already logged in
 */
function checkNavbarAuthState() {
  if (typeof getCurrentUser === "function") {
    const user = getCurrentUser();
    if (user) {
      const loginLinks = document.querySelectorAll("a[href='login.html']");
      loginLinks.forEach(link => {
        link.textContent = "Dashboard";
        link.href = "dashboard.html";
        link.classList.remove("btn-outline");
        link.classList.add("btn-outline-primary");
      });
      const getStartedBtns = document.querySelectorAll("a[href='register.html']");
      getStartedBtns.forEach(btn => {
        btn.textContent = "Go to Dashboard";
        btn.href = "dashboard.html";
      });
    }
  }
}

/**
 * 1. Mobile Navigation Toggle
 * Handles opening and closing of the mobile navigation menu.
 */
function initMobileNav() {
  const toggleBtn = document.getElementById("navToggleBtn");
  const navMenu = document.getElementById("navMenu");

  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener("click", function () {
    const isExpanded = navMenu.classList.toggle("open");
    toggleBtn.setAttribute("aria-expanded", isExpanded);
  });

  // Close mobile menu when any navigation link is clicked
  const navLinks = navMenu.querySelectorAll(".nav-link");
  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      if (navMenu.classList.contains("open")) {
        navMenu.classList.remove("open");
        toggleBtn.setAttribute("aria-expanded", "false");
      }
    });
  });
}

/**
 * 2. Popular Skills Category Filter
 * Filters the displayed skill cards on the homepage by category.
 */
function initSkillsFilter() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const skillCards = document.querySelectorAll(".skill-card");

  if (!filterButtons.length || !skillCards.length) return;

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      // Remove active class from all buttons and add to the clicked one
      filterButtons.forEach(btn => btn.classList.remove("active"));
      this.classList.add("active");

      const selectedCategory = this.getAttribute("data-category");

      // Show or hide skill cards based on selected category
      skillCards.forEach(function (card) {
        const cardCategory = card.getAttribute("data-category");

        if (selectedCategory === "all" || cardCategory === selectedCategory) {
          card.style.display = "flex";
        } else {
          card.style.display = "none";
        }
      });
    });
  });
}

/**
 * 3. Hero Skill Exchange Concept Demo
 * Demonstrates the non-compulsory skill exchange concept right on the hero card.
 * Shows how Student A teaching Python connects with Student B who wants Python.
 */
function initHeroConceptDemo() {
  const demoSkills = [
    {
      teachName: "Rahul Patil",
      teachYear: "SY CSE",
      teachSkill: "Python",
      learnSkill: "Excel",
      partnerName: "Priya Sharma",
      partnerYear: "TY IT",
      partnerTeach: "Graphic Design",
      partnerLearn: "Python",
      matchDesc: "Rahul teaches Python to Priya (Zero barter obligation!)",
      isMutual: true
    },
    {
      teachName: "Ananya Iyer",
      teachYear: "TY AI & DS",
      teachSkill: "Machine Learning",
      learnSkill: "Public Speaking",
      partnerName: "Kunal Verma",
      partnerYear: "FY Mech",
      partnerTeach: "Communication",
      partnerLearn: "Machine Learning",
      matchDesc: "Ananya guides Kunal in ML basics • Kunal helps with Presentation",
      isMutual: true
    },
    {
      teachName: "Aditya Nair",
      teachYear: "SY E&TC",
      teachSkill: "C++ & Arduino",
      learnSkill: "Web Dev",
      partnerName: "Sneha Kulkarni",
      partnerYear: "SY CSE",
      partnerTeach: "HTML & CSS",
      partnerLearn: "C++",
      matchDesc: "Cross-branch peer learning: E&TC meets CSE",
      isMutual: true
    }
  ];

  let currentIndex = 0;
  const switchBtn = document.getElementById("demoSwitchBtn");
  if (!switchBtn) return;

  switchBtn.addEventListener("click", function () {
    currentIndex = (currentIndex + 1) % demoSkills.length;
    const current = demoSkills[currentIndex];

    // Update Student A elements
    const studentAName = document.getElementById("demoStudentAName");
    const studentAYear = document.getElementById("demoStudentAYear");
    const studentATeach = document.getElementById("demoStudentATeach");
    const studentALearn = document.getElementById("demoStudentALearn");

    // Update Student B elements
    const studentBName = document.getElementById("demoStudentBName");
    const studentBYear = document.getElementById("demoStudentBYear");
    const studentBTeach = document.getElementById("demoStudentBTeach");
    const studentBLearn = document.getElementById("demoStudentBLearn");

    const matchText = document.getElementById("demoMatchText");

    if (studentAName) studentAName.textContent = current.teachName;
    if (studentAYear) studentAYear.textContent = current.teachYear;
    if (studentATeach) studentATeach.textContent = current.teachSkill;
    if (studentALearn) studentALearn.textContent = current.learnSkill;

    if (studentBName) studentBName.textContent = current.partnerName;
    if (studentBYear) studentBYear.textContent = current.partnerYear;
    if (studentBTeach) studentBTeach.textContent = current.partnerTeach;
    if (studentBLearn) studentBLearn.textContent = current.partnerLearn;

    if (matchText) matchText.textContent = current.matchDesc;
  });
}
