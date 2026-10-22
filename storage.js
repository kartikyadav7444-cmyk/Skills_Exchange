/**
 * Student Skill Exchange Platform
 * storage.js - LocalStorage Management & Initial Demo Data
 * Author: College Field Project
 * 
 * Simple, transparent storage wrapper for browser LocalStorage.
 * Handles reading, writing, and seeding demo students, requests, and reviews.
 */

// LocalStorage Keys
const STORAGE_KEYS = {
  USERS: "skillexchange_users",
  CURRENT_USER: "skillexchange_current_user",
  REQUESTS: "skillexchange_requests",
  CONNECTIONS: "skillexchange_connections",
  REVIEWS: "skillexchange_reviews"
};

/**
 * 10 Realistic College Student Profiles for Demo
 * Covers diverse academic years (FY, SY, TY), branches, and skills.
 */
const SAMPLE_STUDENTS = [
  {
    id: "user001",
    name: "Rahul Patil",
    email: "rahul@college.edu",
    password: "password123",
    year: "SY",
    branch: "Computer Engineering",
    bio: "Passionate about Python programming and algorithms. Love helping juniors get past beginner hurdles in coding.",
    avatarBg: "blue",
    skillsTeach: ["Python", "C++", "Git/GitHub"],
    skillsLearn: ["Excel", "SQL"],
    mode: "Both",
    rating: 4.8,
    reviewCount: 5
  },
  {
    id: "user002",
    name: "Priya Sharma",
    email: "priya@college.edu",
    password: "password123",
    year: "TY",
    branch: "Information Technology",
    bio: "UI/UX enthusiast and digital creator. Designed event branding for college tech-fests. Eager to master Python for data science.",
    avatarBg: "purple",
    skillsTeach: ["Graphic Design", "HTML", "CSS"],
    skillsLearn: ["Python", "Machine Learning"],
    mode: "Online",
    rating: 4.9,
    reviewCount: 7
  },
  {
    id: "user003",
    name: "Kunal Verma",
    email: "kunal@college.edu",
    password: "password123",
    year: "FY",
    branch: "Mechanical Engineering",
    bio: "First-year student active in the college debate club. Keen to learn foundational C++ and web design for robotics club projects.",
    avatarBg: "green",
    skillsTeach: ["Public Speaking", "Communication"],
    skillsLearn: ["C++", "HTML", "CSS"],
    mode: "Offline",
    rating: 4.6,
    reviewCount: 3
  },
  {
    id: "user004",
    name: "Ananya Iyer",
    email: "ananya@college.edu",
    password: "password123",
    year: "TY",
    branch: "AI & Data Science",
    bio: "Senior working on predictive analytics. Can guide on SQL database queries, data cleaning, and interview prep.",
    avatarBg: "amber",
    skillsTeach: ["SQL", "Python", "Data Analysis"],
    skillsLearn: ["Video Editing", "Public Speaking"],
    mode: "Both",
    rating: 5.0,
    reviewCount: 9
  },
  {
    id: "user005",
    name: "Aditya Nair",
    email: "aditya@college.edu",
    password: "password123",
    year: "SY",
    branch: "Electronics & Telecomm",
    bio: "Hardware and embedded C++ hobbyist. Need help with MS Excel formulas and financial budgeting for student clubs.",
    avatarBg: "blue",
    skillsTeach: ["C++", "Arduino & IoT"],
    skillsLearn: ["Excel", "JavaScript"],
    mode: "Both",
    rating: 4.7,
    reviewCount: 4
  },
  {
    id: "user006",
    name: "Sneha Kulkarni",
    email: "sneha@college.edu",
    password: "password123",
    year: "SY",
    branch: "Computer Engineering",
    bio: "Frontend web development lover. Building interactive websites with HTML, CSS, and modern JavaScript.",
    avatarBg: "pink",
    skillsTeach: ["HTML", "CSS", "JavaScript"],
    skillsLearn: ["C++", "Git/GitHub"],
    mode: "Online",
    rating: 4.8,
    reviewCount: 6
  },
  {
    id: "user007",
    name: "Rohan Deshmukh",
    email: "rohan@college.edu",
    password: "password123",
    year: "TY",
    branch: "Information Technology",
    bio: "College media club head. Skilled in Adobe Premiere Pro, CapCut, and short-form reel video editing. Seeking Java guidance.",
    avatarBg: "purple",
    skillsTeach: ["Video Editing", "Photography"],
    skillsLearn: ["Java", "SQL"],
    mode: "Offline",
    rating: 4.9,
    reviewCount: 8
  },
  {
    id: "user008",
    name: "Tanvi Mehta",
    email: "tanvi@college.edu",
    password: "password123",
    year: "FY",
    branch: "Computer Science",
    bio: "Freshman with great passion for Excel spreadsheets and charts. Want to learn Python for first-year lab assignments.",
    avatarBg: "green",
    skillsTeach: ["Excel", "Presentation Design"],
    skillsLearn: ["Python", "C++"],
    mode: "Both",
    rating: 4.5,
    reviewCount: 2
  },
  {
    id: "user009",
    name: "Siddharth Joshi",
    email: "siddharth@college.edu",
    password: "password123",
    year: "TY",
    branch: "Computer Engineering",
    bio: "Java developer with strong knowledge of OOP, collections, and backend logic. Looking to improve public presentation confidence.",
    avatarBg: "amber",
    skillsTeach: ["Java", "Git/GitHub", "SQL"],
    skillsLearn: ["Public Speaking", "Graphic Design"],
    mode: "Online",
    rating: 4.7,
    reviewCount: 5
  },
  {
    id: "user010",
    name: "Neha Gupta",
    email: "neha@college.edu",
    password: "password123",
    year: "SY",
    branch: "Civil Engineering",
    bio: "Creative thinker skilled in Canva, poster design, and technical writing. Want to learn basic HTML/CSS to build my portfolio.",
    avatarBg: "pink",
    skillsTeach: ["Graphic Design", "Communication"],
    skillsLearn: ["HTML", "CSS"],
    mode: "Both",
    rating: 4.6,
    reviewCount: 4
  }
];

/**
 * Sample Initial Requests for Demo
 */
const SAMPLE_REQUESTS = [
  {
    id: "req001",
    senderId: "user002",      // Priya wants to learn Python from Rahul
    senderName: "Priya Sharma",
    receiverId: "user001",    // Rahul
    receiverName: "Rahul Patil",
    skillRequested: "Python",
    message: "Hi Rahul! I saw you teach Python. Could you help me with Python syntax basics for my data science subject?",
    mode: "Online",
    status: "Pending",
    createdAt: "2026-09-24T10:30:00.000Z"
  },
  {
    id: "req002",
    senderId: "user003",      // Kunal (FY) sent request to Aditya (SY)
    senderName: "Kunal Verma",
    receiverId: "user005",    // Aditya
    receiverName: "Aditya Nair",
    skillRequested: "C++",
    message: "Hello Aditya bhaiya, I am in FY Mech. Need some pointers on C++ loops and arrays for our workshop.",
    mode: "Offline",
    status: "Accepted",
    createdAt: "2026-09-22T14:15:00.000Z"
  }
];

/**
 * Sample Initial Connections
 */
const SAMPLE_CONNECTIONS = [
  {
    id: "conn001",
    requestId: "req002",
    user1Id: "user003",       // Kunal
    user2Id: "user005",       // Aditya
    skillExchanged: "C++",
    mode: "Offline",
    connectedAt: "2026-09-23T11:00:00.000Z"
  }
];

/**
 * Sample Initial Reviews
 */
const SAMPLE_REVIEWS = [
  {
    id: "rev001",
    reviewerId: "user003",
    reviewerName: "Kunal Verma",
    targetUserId: "user005",  // Review for Aditya
    rating: 5,
    comment: "Aditya explained C++ pointers very patiently in the college library. Highly recommended senior!",
    date: "2026-09-23"
  },
  {
    id: "rev002",
    reviewerId: "user001",
    reviewerName: "Rahul Patil",
    targetUserId: "user002",  // Review for Priya
    rating: 5,
    comment: "Priya showed me how to structure Figma designs and posters cleanly. Fantastic peer teacher!",
    date: "2026-09-21"
  }
];

/**
 * Initialize Storage: Check if data exists; if not, seed with sample data.
 */
function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SAMPLE_STUDENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.REQUESTS)) {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(SAMPLE_REQUESTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CONNECTIONS)) {
    localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(SAMPLE_CONNECTIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(SAMPLE_REVIEWS));
  }
}

/**
 * Reset all LocalStorage data back to demo defaults (helpful for viva presentations)
 */
function resetStorageToDefault() {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SAMPLE_STUDENTS));
  localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(SAMPLE_REQUESTS));
  localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(SAMPLE_CONNECTIONS));
  localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(SAMPLE_REVIEWS));
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  console.log("SkillExchange: Data reset to demo defaults.");
}

/**
 * Get all users from LocalStorage
 */
function getUsers() {
  initStorage();
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  try {
    return JSON.parse(data) || [];
  } catch (e) {
    return [];
  }
}

/**
 * Save users array to LocalStorage
 */
function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

/**
 * Find user by ID
 */
function getUserById(id) {
  const users = getUsers();
  return users.find(u => u.id === id) || null;
}

/**
 * Find user by Email
 */
function getUserByEmail(email) {
  const users = getUsers();
  return users.find(u => u.email.toLowerCase() === email.trim().toLowerCase()) || null;
}

/**
 * Add a new user
 */
function addUser(user) {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
  return user;
}

/**
 * Update an existing user's data
 */
function updateUser(updatedUser) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === updatedUser.id);
  if (index !== -1) {
    users[index] = updatedUser;
    saveUsers(users);
    // If the updated user is currently logged in, update currentUser too
    const current = getCurrentUser();
    if (current && current.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    return true;
  }
  return false;
}

/**
 * Current User Authentication State
 */
function getCurrentUser() {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

/**
 * Requests Management
 */
function getRequests() {
  initStorage();
  const data = localStorage.getItem(STORAGE_KEYS.REQUESTS);
  try {
    return JSON.parse(data) || [];
  } catch (e) {
    return [];
  }
}

function saveRequests(requests) {
  localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
}

/**
 * Add a new request
 */
function addRequest(req) {
  const requests = getRequests();
  requests.push(req);
  saveRequests(requests);
  return req;
}

/**
 * Update request status (e.g. "Accepted", "Rejected", "Cancelled")
 */
function updateRequestStatus(requestId, status) {
  const requests = getRequests();
  const req = requests.find(r => r.id === requestId);
  if (req) {
    req.status = status;
    saveRequests(requests);
    return req;
  }
  return null;
}

/**
 * Connections Management
 */
function getConnections() {
  initStorage();
  const data = localStorage.getItem(STORAGE_KEYS.CONNECTIONS);
  try {
    return JSON.parse(data) || [];
  } catch (e) {
    return [];
  }
}

function saveConnections(connections) {
  localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(connections));
}

/**
 * Add a new connection
 */
function addConnection(conn) {
  const connections = getConnections();
  // Prevent duplicate connection
  const exists = connections.some(c => 
    (c.user1Id === conn.user1Id && c.user2Id === conn.user2Id) ||
    (c.user1Id === conn.user2Id && c.user2Id === conn.user1Id)
  );
  if (!exists) {
    connections.push(conn);
    saveConnections(connections);
  }
  return conn;
}

/**
 * Reviews Management
 */
function getReviews() {
  initStorage();
  const data = localStorage.getItem(STORAGE_KEYS.REVIEWS);
  try {
    return JSON.parse(data) || [];
  } catch (e) {
    return [];
  }
}

function saveReviews(reviews) {
  localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
}

/**
 * Add a new review and recalculate target user's average rating
 */
function addReview(newReview) {
  const reviews = getReviews();
  reviews.push(newReview);
  saveReviews(reviews);

  // Recalculate target student's average rating
  const targetUser = getUserById(newReview.targetUserId);
  if (targetUser) {
    const userReviews = reviews.filter(r => r.targetUserId === targetUser.id);
    const sum = userReviews.reduce((acc, r) => acc + Number(r.rating || 5), 0);
    const avg = sum / userReviews.length;
    targetUser.rating = Math.round(avg * 10) / 10;
    targetUser.reviewCount = userReviews.length;
    updateUser(targetUser);
  }

  return newReview;
}

// Auto-run initialization when file is loaded
initStorage();

