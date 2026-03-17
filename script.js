// ========== LOGIN SYSTEM ========== 
const loginPage = document.getElementById('login-page');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const toggleSignupLink = document.getElementById('toggle-signup');
const toggleLoginLink = document.getElementById('toggle-login');

// Check if user is already logged in
function checkLoginStatus() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        loginPage.classList.add('hidden');
        appContainer.classList.remove('hidden');
        return true;
    } else {
        loginPage.classList.remove('hidden');
        appContainer.classList.add('hidden');
        return false;
    }
}

// Handle login
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
        showLoginError('Please fill in all fields');
        return;
    }
    
    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users')) || {};
    
    if (users[username] && users[username] === password) {
        localStorage.setItem('currentUser', username);
        checkLoginStatus();
    } else {
        showLoginError('Invalid username or password');
    }
});

// Handle signup
signupForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const confirm = document.getElementById('signup-confirm').value.trim();
    
    if (!username || !password || !confirm) {
        showLoginError('Please fill in all fields');
        return;
    }
    
    if (password !== confirm) {
        showLoginError('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        showLoginError('Password must be at least 6 characters');
        return;
    }
    
    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users')) || {};
    
    if (users[username]) {
        showLoginError('Username already exists');
        return;
    }
    
    users[username] = password;
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', username);
    checkLoginStatus();
});

// Show login error
function showLoginError(message) {
    let errorEl = document.querySelector('.login-error');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'login-error';
        loginForm.parentElement.insertBefore(errorEl, loginForm);
    }
    errorEl.textContent = message;
    setTimeout(() => {
        errorEl.remove();
    }, 4000);
}

// Toggle between login and signup forms
toggleSignupLink.addEventListener('click', function(e) {
    e.preventDefault();
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
});

toggleLoginLink.addEventListener('click', function(e) {
    e.preventDefault();
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

// Global function for deleting reminders
function deleteReminder(index) {
    const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
    reminders.splice(index, 1);
    localStorage.setItem('reminders', JSON.stringify(reminders));
    // Re-render reminders if function exists
    if (typeof renderReminders === 'function') {
        renderReminders();
    }
}

// ========== BACKUP & SYNC SYSTEM ==========
function backupData() {
    const currentUser = localStorage.getItem('currentUser');
    const backupKey = `backup_${currentUser}`;
    
    const backup = {
        timestamp: new Date().toISOString(),
        habits: JSON.parse(localStorage.getItem('habits')) || [],
        tasks: JSON.parse(localStorage.getItem('tasks')) || [],
        goals: JSON.parse(localStorage.getItem('goals')) || [],
        reminders: JSON.parse(localStorage.getItem('reminders')) || [],
        badges: JSON.parse(localStorage.getItem('badges')) || [],
    };
    
    localStorage.setItem(backupKey, JSON.stringify(backup));
    showSyncStatus('✅ Data backed up successfully!', 'synced');
    return backup;
}

function getLastBackup() {
    const currentUser = localStorage.getItem('currentUser');
    const backupKey = `backup_${currentUser}`;
    const backup = localStorage.getItem(backupKey);
    return backup ? JSON.parse(backup) : null;
}

function restoreBackup() {
    const backup = getLastBackup();
    if (!backup) {
        showSyncStatus('❌ No backup found!', 'error');
        return;
    }
    
    localStorage.setItem('habits', JSON.stringify(backup.habits));
    localStorage.setItem('tasks', JSON.stringify(backup.tasks));
    localStorage.setItem('goals', JSON.stringify(backup.goals));
    localStorage.setItem('reminders', JSON.stringify(backup.reminders));
    localStorage.setItem('badges', JSON.stringify(backup.badges));
    
    showSyncStatus('✅ Backup restored!', 'synced');
    location.reload();
}

function showSyncStatus(message, status) {
    const statusEl = document.createElement('div');
    statusEl.className = `sync-status ${status}`;
    statusEl.textContent = message;
    document.body.appendChild(statusEl);
    setTimeout(() => statusEl.remove(), 4000);
}

// ========== CALENDAR EXPORT ==========
function exportToCalendar() {
    const habits = JSON.parse(localStorage.getItem('habits')) || [];
    const today = new Date();
    
    // Create ICS format for calendar
    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Habit Tracker//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Habit Tracker
X-WR-TIMEZONE:UTC
BEGIN:VTIMEZONE
TZID:UTC
BEGIN:STANDARD
DTSTART:19700101T000000
TZOFFSETFROM:+0000
TZOFFSETTO:+0000
END:STANDARD
END:VTIMEZONE\n`;

    habits.forEach(habit => {
        const eventDate = new Date(today);
        const uidDate = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0];
        
        icsContent += `BEGIN:VEVENT
UID:${uidDate}-${habit.name}@habittracker
DTSTAMP:${uidDate}Z
DTSTART:${uidDate}
SUMMARY:${habit.name}
DESCRIPTION:Daily habit
STATUS:CONFIRMED
END:VEVENT\n`;
    });
    
    icsContent += `END:VCALENDAR`;
    
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `habits-${today.toISOString().split('T')[0]}.ics`;
    link.click();
    
    showSyncStatus('📆 Calendar exported!', 'synced');
}

// ========== MULTI-USER PROFILES ==========
function createProfile(profileName) {
    let profiles = JSON.parse(localStorage.getItem('user_profiles')) || {};
    
    if (profiles[profileName]) {
        showSyncStatus('❌ Profile already exists!', 'error');
        return;
    }
    
    profiles[profileName] = {
        created: new Date().toISOString(),
        lastAccessed: new Date().toISOString()
    };
    
    localStorage.setItem('user_profiles', JSON.stringify(profiles));
    renderProfileOptions();
    showSyncStatus(`✅ Profile "${profileName}" created!`, 'synced');
}

function loadProfile(profileName) {
    const currentUser = localStorage.getItem('currentUser');
    
    // Save current profile data
    const currentData = {
        habits: JSON.parse(localStorage.getItem('habits')) || [],
        tasks: JSON.parse(localStorage.getItem('tasks')) || [],
        goals: JSON.parse(localStorage.getItem('goals')) || [],
        reminders: JSON.parse(localStorage.getItem('reminders')) || [],
    };
    localStorage.setItem(`profile_${currentUser}_${getCurrentProfile()}`, JSON.stringify(currentData));
    
    // Load selected profile
    const profileData = localStorage.getItem(`profile_${currentUser}_${profileName}`);
    if (profileData) {
        const data = JSON.parse(profileData);
        localStorage.setItem('habits', JSON.stringify(data.habits));
        localStorage.setItem('tasks', JSON.stringify(data.tasks));
        localStorage.setItem('goals', JSON.stringify(data.goals));
        localStorage.setItem('reminders', JSON.stringify(data.reminders));
    } else {
        // New profile - clear data
        localStorage.setItem('habits', JSON.stringify([]));
        localStorage.setItem('tasks', JSON.stringify([]));
        localStorage.setItem('goals', JSON.stringify([]));
        localStorage.setItem('reminders', JSON.stringify([]));
    }
    
    localStorage.setItem('current_profile', profileName);
    showSyncStatus(`✅ Switched to profile "${profileName}"!`, 'synced');
    location.reload();
}

function getCurrentProfile() {
    return localStorage.getItem('current_profile') || 'Default';
}

function renderProfileOptions() {
    const profileSelect = document.getElementById('profile-select');
    if (!profileSelect) return;
    
    let profiles = JSON.parse(localStorage.getItem('user_profiles')) || {};
    profileSelect.innerHTML = '<option value="">Load Profile...</option>';
    
    Object.keys(profiles).forEach(profileName => {
        const option = document.createElement('option');
        option.value = profileName;
        option.textContent = profileName;
        profileSelect.appendChild(option);
    });
}

// Motivational Quotes Database
const quotes = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "Excellence is not a destination; it is a continuous journey that never ends.", author: "Brian Tracy" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Your limitation—it's only your imagination. No boundaries on what you can do.", author: "Unknown" },
    { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
    { text: "Sometimes we're tested not to show our weaknesses, but to discover our strengths.", author: "Unknown" },
    { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
    { text: "A little progress each day is better than no progress at all.", author: "Unknown" },
    { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
    { text: "The future depends on what you do today.", author: "Mahatma Gandhi" }
];

document.addEventListener('DOMContentLoaded', function() {
    // Check login status first
    checkLoginStatus();
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('currentUser');
            location.reload();
        });
    }
    const habitNameInput = document.getElementById('habit-name');
    const addHabitBtn = document.getElementById('add-habit-btn');
    const habitsList = document.getElementById('habits-list');
    
    const taskNameInput = document.getElementById('task-name');
    const addTaskBtn = document.getElementById('add-task-btn');
    const tasksList = document.getElementById('tasks-list');
    
    const calendarNav = document.getElementById('calendar');
    const currentMonthTitle = document.getElementById('current-month');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    
    const streaksList = document.getElementById('streaks-list');
    
    const modal = document.getElementById('date-modal');
    const closeBtn = document.querySelector('.modal-close');
    
    const quoteText = document.getElementById('quote-text');
    const quoteAuthor = document.getElementById('quote-author');
    const newQuoteBtn = document.getElementById('new-quote-btn');
    
    // Tab functionality - REMOVED, using separate sections now
    // Goals functionality
    const goalInput = document.getElementById('goal-input');
    const addGoalBtn = document.getElementById('add-goal-btn');
    const goalsContainer = document.getElementById('goals-container');
    
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    
    let habits = JSON.parse(localStorage.getItem('habits')) || [];
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let goals = JSON.parse(localStorage.getItem('goals')) || [];
    let reminders = JSON.parse(localStorage.getItem('reminders')) || [];
    let badges = JSON.parse(localStorage.getItem('badges')) || [];
    let currentDate = new Date();
    let selectedDate = null;
    
    // ========== THEME TOGGLE ==========
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.body.classList.toggle('light-mode', savedTheme === 'light');
        updateThemeIcon(savedTheme);
    }
    
    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('.theme-icon');
        if (theme === 'light') {
            icon.textContent = '☀️';
        } else {
            icon.textContent = '🌙';
        }
    }
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.classList.toggle('light-mode', newTheme === 'light');
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
    
    // ========== GOALS FUNCTIONALITY ==========
    function saveGoals() {
        localStorage.setItem('goals', JSON.stringify(goals));
    }
    
    function renderGoals() {
        goalsContainer.innerHTML = '';
        
        if (goals.length === 0) {
            goalsContainer.innerHTML = '<div class="empty-message">🎯 Add your first goal to get started!</div>';
            return;
        }
        
        goals.forEach((goal, index) => {
            const goalDiv = document.createElement('div');
            goalDiv.className = 'goal-item';
            
            const icons = ['🎯', '🏆', '🚀', '⭐', '💎', '🔥'];
            const icon = icons[index % icons.length];
            
            const content = document.createElement('div');
            content.innerHTML = `
                <div class="goal-icon">${icon}</div>
                <div class="goal-content">
                    <h4>${goal.name}</h4>
                    <p>Added ${new Date(goal.created).toLocaleDateString()}</p>
                </div>
            `;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'goal-delete-btn';
            deleteBtn.textContent = '✕';
            deleteBtn.addEventListener('click', function() {
                goals.splice(index, 1);
                saveGoals();
                renderGoals();
            });
            
            goalDiv.appendChild(content);
            goalDiv.appendChild(deleteBtn);
            goalsContainer.appendChild(goalDiv);
        });
    }
    
    addGoalBtn.addEventListener('click', function() {
        const goalName = goalInput.value.trim();
        if (goalName) {
            goals.push({
                name: goalName,
                created: new Date().toISOString()
            });
            saveGoals();
            renderGoals();
            goalInput.value = '';
            goalInput.focus();
        }
    });
    
    goalInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addGoalBtn.click();
    });

    // Display current date
    function displayDate() {
        const dateElement = document.getElementById('date-display');
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = '📅 ' + today.toLocaleDateString('en-US', options);
    }

    // Quote Management
    function getQuoteOfDay() {
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
        return quotes[dayOfYear % quotes.length];
    }

    function displayQuote() {
        const quote = getQuoteOfDay();
        quoteText.textContent = `"${quote.text}"`;
        quoteAuthor.textContent = `— ${quote.author}`;
        quoteText.style.animation = 'none';
        quoteAuthor.style.animation = 'none';
        setTimeout(() => {
            quoteText.style.animation = 'fadeIn 0.8s ease-out';
            quoteAuthor.style.animation = 'fadeIn 1s ease-out';
        }, 10);
    }

    newQuoteBtn.addEventListener('click', function() {
        this.style.animation = 'rotate 0.6s ease-out';
        setTimeout(() => {
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            quoteText.textContent = `"${randomQuote.text}"`;
            quoteAuthor.textContent = `— ${randomQuote.author}`;
            quoteText.style.animation = 'fadeIn 0.8s ease-out';
            quoteAuthor.style.animation = 'fadeIn 1s ease-out';
        }, 300);
        this.style.animation = 'none';
    });

    function saveHabits() {
        localStorage.setItem('habits', JSON.stringify(habits));
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function calculateStreak(habit) {
        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < 365; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            if (habit.completions.includes(dateStr)) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    function renderStreaks() {
        streaksList.innerHTML = '';
        
        if (habits.length === 0) {
            streaksList.innerHTML = '<div class="empty-message">📭 No habits yet. Add one to start tracking!</div>';
            return;
        }
        
        habits.forEach(habit => {
            const streak = calculateStreak(habit);
            const streakDiv = document.createElement('div');
            streakDiv.className = 'streak-item';
            streakDiv.innerHTML = `
                <h4>💪 ${habit.name}</h4>
                <div class="streak-info">
                    <span>🔥 Streak: <strong>${streak}</strong> days</span>
                    <span>✓ Total: ${habit.completions.length}</span>
                </div>
            `;
            streaksList.appendChild(streakDiv);
        });
    }

    function renderHabits() {
        habitsList.innerHTML = '';
        const today = new Date().toISOString().split('T')[0];
        
        // Update badge count
        const habitBadge = document.getElementById('habit-count');
        if (habitBadge) {
            habitBadge.textContent = habits.length;
        }
        
        if (habits.length === 0) {
            habitsList.innerHTML = '<div class="empty-message">🎯 Add a habit to get started!</div>';
            return;
        }
        
        habits.forEach((habit, index) => {
            const habitDiv = document.createElement('div');
            habitDiv.className = 'habit';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = habit.completions.includes(today);
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    if (!habit.completions.includes(today)) {
                        habit.completions.push(today);
                    }
                } else {
                    habit.completions = habit.completions.filter(date => date !== today);
                }
                saveHabits();
                renderCalendar();
                renderStreaks();
                drawProgressChart();
            });
            const label = document.createElement('label');
            label.textContent = habit.name;
            
            const streak = calculateStreak(habit);
            const streakBadge = document.createElement('span');
            streakBadge.className = 'streak-badge';
            streakBadge.textContent = `🔥 ${streak}`;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '🗑️ Delete';
            deleteBtn.addEventListener('click', function() {
                habits.splice(index, 1);
                saveHabits();
                renderHabits();
                renderCalendar();
                renderStreaks();
                drawProgressChart();
            });
            habitDiv.appendChild(checkbox);
            habitDiv.appendChild(label);
            habitDiv.appendChild(streakBadge);
            habitDiv.appendChild(deleteBtn);
            habitsList.appendChild(habitDiv);
        });
    }

    function renderTasks() {
        tasksList.innerHTML = '';
        
        // Update badge count
        const taskBadge = document.getElementById('task-count');
        if (taskBadge) {
            taskBadge.textContent = tasks.length;
        }
        
        if (tasks.length === 0) {
            tasksList.innerHTML = '<div class="empty-message">📝 No tasks yet. Add one to get started!</div>';
            return;
        }
        
        tasks.forEach((task, index) => {
            const taskDiv = document.createElement('div');
            taskDiv.className = 'task';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', function() {
                task.completed = this.checked;
                saveTasks();
                renderTasks();
            });
            const label = document.createElement('label');
            label.textContent = task.name;
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '🗑️ Delete';
            deleteBtn.addEventListener('click', function() {
                tasks.splice(index, 1);
                saveTasks();
                renderTasks();
            });
            taskDiv.appendChild(checkbox);
            taskDiv.appendChild(label);
            taskDiv.appendChild(deleteBtn);
            tasksList.appendChild(taskDiv);
        });
    }

    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        currentMonthTitle.textContent = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        calendarNav.innerHTML = '';

        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-header';
            header.textContent = day;
            calendarNav.appendChild(header);
        });

        // Add previous month's days
        for (let i = firstDay - 1; i >= 0; i--) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day other-month';
            dayDiv.textContent = daysInPrevMonth - i;
            calendarNav.appendChild(dayDiv);
        }

        // Add current month's days
        const today = new Date().toISOString().split('T')[0];
        for (let d = 1; d <= daysInMonth; d++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.textContent = d;

            const dateStr = new Date(year, month, d).toISOString().split('T')[0];
            
            // Count completions and check if all completed
            let completedCount = 0;
            habits.forEach(habit => {
                if (habit.completions.includes(dateStr)) {
                    completedCount++;
                }
            });

            // All habits completed = green, some incomplete = red
            if (habits.length > 0) {
                if (completedCount === habits.length) {
                    dayDiv.classList.add('all-completed');
                } else if (completedCount < habits.length && completedCount > 0) {
                    dayDiv.classList.add('has-incomplete');
                } else if (completedCount === 0 && habits.length > 0 && dateStr <= today) {
                    dayDiv.classList.add('has-incomplete');
                }
            }

            if (dateStr === today) {
                dayDiv.classList.add('today');
            }

            dayDiv.addEventListener('click', function() {
                if (!dayDiv.classList.contains('other-month')) {
                    selectedDate = dateStr;
                    showDateModal(dateStr);
                }
            });

            calendarNav.appendChild(dayDiv);
        }

        // Add next month's days
        const totalCells = calendarNav.querySelectorAll('.calendar-day').length - dayHeaders.length;
        const remainingCells = 42 - totalCells;
        for (let d = 1; d <= remainingCells; d++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day other-month';
            dayDiv.textContent = d;
            calendarNav.appendChild(dayDiv);
        }
    }

    function showDateModal(dateStr) {
        const date = new Date(dateStr);
        const dateTitle = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        document.getElementById('modal-date-title').textContent = `📅 ${dateTitle}`;

        // Show habits for this date
        const modalHabits = document.getElementById('modal-habits');
        modalHabits.innerHTML = '';
        habits.forEach(habit => {
            const completed = habit.completions.includes(dateStr);
            const item = document.createElement('div');
            item.className = `modal-item ${completed ? 'completed' : 'incomplete'}`;
            item.innerHTML = `
                <strong>${completed ? '✅' : '❌'}</strong> ${habit.name}
            `;
            modalHabits.appendChild(item);
        });

        // Show remaining incomplete tasks
        const modalTasks = document.getElementById('modal-tasks');
        modalTasks.innerHTML = '';
        const incompleteTasks = tasks.filter(t => !t.completed);
        if (incompleteTasks.length === 0) {
            modalTasks.innerHTML = '<div class="empty-message">✨ All tasks completed!</div>';
        } else {
            incompleteTasks.forEach(task => {
                const item = document.createElement('div');
                item.className = 'modal-item incomplete';
                item.innerHTML = `<strong>📌</strong> ${task.name}`;
                modalTasks.appendChild(item);
            });
        }

        // Show incomplete habits for this date
        const modalIncompleteHabits = document.getElementById('modal-incomplete-habits');
        modalIncompleteHabits.innerHTML = '';
        const incompleteHabits = habits.filter(h => !h.completions.includes(dateStr));
        if (incompleteHabits.length === 0) {
            modalIncompleteHabits.innerHTML = '<div class="empty-message">🎉 All habits completed!</div>';
        } else {
            incompleteHabits.forEach(habit => {
                const item = document.createElement('div');
                item.className = 'modal-item incomplete';
                item.innerHTML = `<strong>⏭️</strong> ${habit.name}`;
                modalIncompleteHabits.appendChild(item);
            });
        }

        modal.style.display = 'block';
    }

    function drawProgressChart() {
        const canvas = document.getElementById('progress-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width - 50;
        canvas.height = 300;

        // Get data for last 7 days
        const today = new Date();
        const labels = [];
        const data = [];
        const maxPerDay = habits.length || 1;

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            
            let count = 0;
            habits.forEach(habit => {
                if (habit.completions.includes(dateStr)) {
                    count++;
                }
            });
            data.push((count / maxPerDay) * 100);
        }

        const width = canvas.width;
        const height = canvas.height;
        const padding = 50;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding - 20;
        const barWidth = chartWidth / 7 - 12;
        const barGap = 6;

        // Draw background gradient
        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, 'rgba(78, 201, 176, 0.05)');
        bgGradient.addColorStop(1, 'rgba(9, 132, 227, 0.03)');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // Draw grid lines
        ctx.strokeStyle = 'rgba(78, 201, 176, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        for (let i = 0; i <= 5; i++) {
            const y = padding + (i / 5) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Y-axis labels
        ctx.fillStyle = 'rgba(212, 212, 212, 0.6)';
        ctx.font = 'bold 12px "Fira Code"';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let i = 0; i <= 5; i++) {
            const y = padding + (i / 5) * chartHeight;
            const value = Math.round((5 - i) * 20);
            ctx.fillText(value + '%', padding - 15, y);
        }

        // Draw bars with gradient
        data.forEach((value, index) => {
            const x = padding + (index * (barWidth + 2 * barGap + 6));
            const barHeight = (value / 100) * chartHeight;
            const y = padding + chartHeight - barHeight;

            // Bar gradient
            const barGradient = ctx.createLinearGradient(x, y, x, padding + chartHeight);
            if (value >= 100) {
                barGradient.addColorStop(0, '#27ae60');
                barGradient.addColorStop(1, '#1e8449');
            } else if (value >= 50) {
                barGradient.addColorStop(0, '#4ec9b0');
                barGradient.addColorStop(1, '#2ba8a0');
            } else if (value > 0) {
                barGradient.addColorStop(0, '#f39c12');
                barGradient.addColorStop(1, '#d68910');
            } else {
                barGradient.addColorStop(0, 'rgba(100, 100, 100, 0.4)');
                barGradient.addColorStop(1, 'rgba(80, 80, 80, 0.3)');
            }
            
            ctx.fillStyle = barGradient;
            ctx.fillRect(x, y, barWidth, barHeight);

            // Bar border
            ctx.strokeStyle = value > 0 ? 'rgba(78, 201, 176, 0.4)' : 'rgba(100, 100, 100, 0.2)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, barWidth, barHeight);

            // Day label
            ctx.fillStyle = 'rgba(212, 212, 212, 0.8)';
            ctx.font = 'bold 12px "Inter"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(labels[index], x + barWidth / 2, padding + chartHeight + 10);

            // Value percentage on bar (if not zero)
            if (value > 0) {
                ctx.fillStyle = value >= 70 ? 'rgba(0, 0, 0, 0.7)' : 'rgba(212, 212, 212, 0.9)';
                ctx.font = 'bold 11px "Fira Code"';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(Math.round(value) + '%', x + barWidth / 2, y + barHeight - 5);
            }
        });

        // Draw axes
        ctx.strokeStyle = 'rgba(212, 212, 212, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, padding + chartHeight);
        ctx.lineTo(width - padding, padding + chartHeight);
        ctx.stroke();
    }

    // ========== STATISTICS DASHBOARD ========== 
    function renderStatisticsDashboard() {
        // Weekly Overview
        const weeklyBlock = document.getElementById('stats-weekly-chart');
        const weeklySummary = document.getElementById('stats-weekly-summary');
        // Monthly Overview
        const monthlyBlock = document.getElementById('stats-monthly-chart');
        const monthlySummary = document.getElementById('stats-monthly-summary');
        // Best Streak
        const bestStreakBlock = document.getElementById('stats-best-streak-value');
        // Averages
        const averagesBlock = document.getElementById('stats-averages-value');

        // Weekly chart: last 7 days
        const today = new Date();
        let weeklyData = [];
        let weeklyLabels = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            weeklyLabels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            let count = 0;
            habits.forEach(habit => {
                if (habit.completions.includes(dateStr)) count++;
            });
            weeklyData.push(count);
        }
        weeklyBlock.innerHTML = weeklyData.map((v, i) => `<span style='display:inline-block;width:32px;text-align:center;'>${weeklyLabels[i]}<br><strong>${v}</strong></span>`).join('');
        weeklySummary.innerHTML = `Total completions: <strong>${weeklyData.reduce((a,b)=>a+b,0)}</strong>`;

        // Monthly chart: last 30 days
        let monthlyData = [];
        let monthlyLabels = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            monthlyLabels.push(date.getDate());
            let count = 0;
            habits.forEach(habit => {
                if (habit.completions.includes(dateStr)) count++;
            });
            monthlyData.push(count);
        }
        monthlyBlock.innerHTML = monthlyData.map((v, i) => `<span style='display:inline-block;width:18px;text-align:center;font-size:0.85em;'>${monthlyLabels[i]}<br><strong>${v}</strong></span>`).join('');
        monthlySummary.innerHTML = `Total completions: <strong>${monthlyData.reduce((a,b)=>a+b,0)}</strong>`;

        // Best streak
        let bestStreak = 0;
        habits.forEach(habit => {
            const streak = calculateStreak(habit);
            if (streak > bestStreak) bestStreak = streak;
        });
        bestStreakBlock.textContent = bestStreak + ' days';

        // Averages
        const avgWeek = (weeklyData.reduce((a,b)=>a+b,0) / 7).toFixed(2);
        const avgMonth = (monthlyData.reduce((a,b)=>a+b,0) / 30).toFixed(2);
        averagesBlock.innerHTML = `Weekly avg: <strong>${avgWeek}</strong><br>Monthly avg: <strong>${avgMonth}</strong>`;
    }

    // Call statistics dashboard render after habits/tasks update
    function updateAllStats() {
        renderHabits();
        renderTasks();
        renderCalendar();
        renderStreaks();
        renderReminders();
        drawProgressChart();
        renderStatisticsDashboard();
        updateBadges();
    }

    // Replace calls to renderHabits/renderTasks/renderStreaks/drawProgressChart with updateAllStats for full update
    addHabitBtn.addEventListener('click', function() {
        const name = habitNameInput.value.trim();
        if (name) {
            this.style.animation = 'pulse 0.4s ease-out';
            const category = document.querySelector('.category-filter input')?.value || 'Personal';
            habits.push({name: name, completions: [], category: category});
            saveHabits();
            updateAllStats();
            updateBadges();
            habitNameInput.value = '';
            this.style.animation = 'none';
        }
    });

    addTaskBtn.addEventListener('click', function() {
        const name = taskNameInput.value.trim();
        if (name) {
            tasks.push({name: name, completed: false});
            saveTasks();
            updateAllStats();
            taskNameInput.value = '';
            this.style.animation = 'none';
        }
    });

    prevMonthBtn.addEventListener('click', function() {
        this.style.animation = 'pulse 0.3s ease-out';
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
        this.style.animation = 'none';
    });

    nextMonthBtn.addEventListener('click', function() {
        this.style.animation = 'pulse 0.3s ease-out';
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
        this.style.animation = 'none';
    });

    habitNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addHabitBtn.click();
    });

    taskNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTaskBtn.click();
    });

    // ========== REMINDERS FUNCTIONALITY ==========
    function saveReminders() {
        localStorage.setItem('reminders', JSON.stringify(reminders));
    }

    function renderReminders() {
        const remindersList = document.getElementById('reminders-list');
        const reminderHabitSelect = document.getElementById('reminder-habit');
        
        // Update habit dropdown
        reminderHabitSelect.innerHTML = '<option value="">Select a habit...</option>';
        habits.forEach((habit, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = habit.name;
            reminderHabitSelect.appendChild(option);
        });
        
        // Render reminders
        remindersList.innerHTML = '';
        if (reminders.length === 0) {
            remindersList.innerHTML = '<div class="empty-message">⏰ No reminders yet. Add one to stay on track!</div>';
            return;
        }
        
        reminders.forEach((reminder, index) => {
            const reminderDiv = document.createElement('div');
            reminderDiv.className = 'reminder-item';
            const habitName = habits[reminder.habitIndex]?.name || 'Unknown';
            reminderDiv.innerHTML = `
                <div class="reminder-info">
                    <strong>${habitName}</strong> at <strong>${reminder.time}</strong>
                </div>
                <button class="reminder-delete" onclick="deleteReminder(${index})">✕</button>
            `;
            remindersList.appendChild(reminderDiv);
        });
        
        // Check for reminders to notify
        checkReminders();
    }

    function deleteReminder(index) {
        reminders.splice(index, 1);
        saveReminders();
        renderReminders();
    }

    function checkReminders() {
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        
        reminders.forEach(reminder => {
            if (reminder.time === currentTime && !reminder.notified) {
                showNotification(`Time for ${habits[reminder.habitIndex]?.name}! 🔔`);
                reminder.notified = true;
                setTimeout(() => reminder.notified = false, 60000);
            }
        });
    }

    function showNotification(message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Habit Tracker', { body: message });
        }
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    const addReminderBtn = document.getElementById('add-reminder-btn');
    if (addReminderBtn) {
        addReminderBtn.addEventListener('click', function() {
            const habitIndex = document.getElementById('reminder-habit').value;
            const time = document.getElementById('reminder-time').value;
            
            if (habitIndex && time) {
                reminders.push({ habitIndex: parseInt(habitIndex), time: time, notified: false });
                saveReminders();
                renderReminders();
                document.getElementById('reminder-habit').value = '';
                document.getElementById('reminder-time').value = '';
            }
        });
    }

    // ========== EXPORT DATA FUNCTIONALITY ==========
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            const data = {
                habits: habits,
                tasks: tasks,
                goals: goals,
                reminders: reminders,
                exportDate: new Date().toISOString()
            };
            
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `habit-tracker-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
        });
    }

    // ========== HABIT CATEGORIES ==========
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            const selectedCategory = this.value;
            const habitItems = document.querySelectorAll('.habit');
            
            habitItems.forEach(item => {
                if (!selectedCategory) {
                    item.style.display = '';
                } else {
                    const category = item.dataset.category;
                    item.style.display = (category === selectedCategory) ? '' : 'none';
                }
            });
        });
    }

    // ========== ACHIEVEMENT BADGES ==========
    function updateBadges() {
        let newBadges = [];
        
        // Habit Starter Badge
        if (habits.length >= 1) newBadges.push('🥇 Habit Starter');
        // Dedicated Badge  
        if (habits.length >= 5) newBadges.push('⭐ Dedicated');
        // Streak Master Badge
        const maxStreak = Math.max(...habits.map(h => calculateStreak(h)), 0);
        if (maxStreak >= 7) newBadges.push('🔥 7-Day Streak');
        if (maxStreak >= 30) newBadges.push('💎 30-Day Streak');
        // Task Warrior Badge
        if (tasks.length >= 10) newBadges.push('⚔️ Task Warrior');
        
        badges = newBadges;
        localStorage.setItem('badges', JSON.stringify(badges));
    }

    // ========== QUOTE ROTATION ==========
    function getQuoteOfDay() {
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
        return quotes[dayOfYear % quotes.length];
    }

    // Display quote daily
    let lastQuoteDate = localStorage.getItem('lastQuoteDate');
    const today = new Date().toISOString().split('T')[0];
    if (lastQuoteDate !== today) {
        displayQuote();
        localStorage.setItem('lastQuoteDate', today);
    }

    // Set reminder check every minute
    setInterval(checkReminders, 60000);

    // Modal controls
    closeBtn.addEventListener('click', function() {
        modal.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            modal.style.display = 'none';
            modal.style.animation = 'fadeIn 0.3s ease';
        }, 300);
    });

    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                modal.style.display = 'none';
                modal.style.animation = 'fadeIn 0.3s ease';
            }, 300);
        }
    });

    // ========== SYNC & BACKUP BUTTON ==========
    const syncBtn = document.getElementById('sync-btn');
    if (syncBtn) {
        syncBtn.addEventListener('click', function() {
            backupData();
        });
    }

    // ========== CALENDAR EXPORT BUTTON ==========
    const calendarSyncBtn = document.getElementById('calendar-sync-btn');
    if (calendarSyncBtn) {
        calendarSyncBtn.addEventListener('click', function() {
            exportToCalendar();
        });
    }

    // ========== PROFILE MANAGEMENT ==========
    const profileSelect = document.getElementById('profile-select');
    if (profileSelect) {
        // Populate profiles on load
        renderProfileOptions();
        
        profileSelect.addEventListener('change', function() {
            if (this.value) {
                loadProfile(this.value);
            }
        });
    }

    const newProfileBtn = document.getElementById('new-profile-btn');
    if (newProfileBtn) {
        newProfileBtn.addEventListener('click', function() {
            const profileName = prompt('Enter profile name:');
            if (profileName && profileName.trim()) {
                createProfile(profileName.trim());
            }
        });
    }

    // Initial render
    initTheme();
    displayDate();
    displayQuote();
    renderHabits();
    renderTasks();
    renderCalendar();
    renderStreaks();
    renderGoals();
    renderReminders();
    renderStatisticsDashboard();
    updateBadges();
    drawProgressChart();
});