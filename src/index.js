import { buildPushPayload } from '@block65/webcrypto-web-push';

// Helper: Safely authenticate requests using the APP_PIN from environment variables
function authorize(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return false;
  const pin = authHeader.replace("Bearer ", "");
  return pin === env.APP_PIN;
}

// Handler to serve the Service Worker JS
function getServiceWorker() {
  return `
    self.addEventListener('push', event => {
      const data = event.data ? event.data.json() : {};
      const title = data.title || "DF Tasks";
      const options = {
        body: data.body || "You have tasks waiting!",
        icon: "/manifest.json",
        badge: "/manifest.json",
        vibrate: [100, 50, 100],
        data: { url: "/" }
      };

      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    });

    self.addEventListener('notificationclick', event => {
      event.notification.close();
      event.waitUntil(
        clients.openWindow('/')
      );
    });
  `;
}

// Handler to serve the PWA manifest
function getManifest() {
  return JSON.stringify({
    name: "DF Tasks",
    short_name: "DF Tasks",
    description: "Private shared list with scheduled push notifications",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf9f9",
    theme_color: "#b71422",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  });
}

// Handler to serve the frontend single-page app (with Embedded HTML/CSS/JS)
function getHTML(env) {
  return `
<!DOCTYPE html>
<html class="dark" lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <title>DF Tasks</title>
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="/icon.png" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1" rel="stylesheet" />
    <script src="https://cdn.tailwindcss.com?plugins=forms"></script>
    <script>
        // Check local storage for theme preference immediately to prevent any unstyled flash
        const savedTheme = localStorage.getItem("df_theme");
        if (savedTheme === "light") {
            document.documentElement.classList.remove("dark");
        } else {
            document.documentElement.classList.add("dark"); // Default to dark mode
        }

        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        primary: "#b71422",
                        "primary-container": "#db3237",
                        "on-primary": "#ffffff",
                        background: "#fbf9f9",
                        "on-background": "#1b1c1c",
                        "surface-container": "#efeded",
                        "surface-container-low": "#f5f3f3",
                        "surface-container-high": "#e9e8e7",
                        "on-surface-variant": "#5b403e",
                        "outline": "#8f6f6d"
                    }
                }
            }
        }
    </script>
    <style>
        * {
            -webkit-tap-highlight-color: transparent;
            user-select: none;
        }
        body {
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
        }
        @keyframes count-pop {
            0%   { transform: scale(1); }
            40%  { transform: scale(1.35); }
            70%  { transform: scale(0.9); }
            100% { transform: scale(1); }
        }
        .count-pop {
            animation: count-pop 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        textarea, input[type="text"] {
            user-select: text;
            -webkit-user-select: text;
        }
    </style>
</head>
<body class="bg-background dark:bg-[#121212] text-on-background dark:text-gray-100 min-h-screen flex flex-col relative transition-colors duration-300 overflow-x-hidden">

    <!-- Auth PIN View -->
    <div id="auth-view" class="fixed inset-0 bg-background dark:bg-[#121212] z-50 flex flex-col items-center justify-center p-6 hidden">
        <div class="flex flex-col items-center mb-8">
            <div class="w-16 h-16 mb-4 rounded-full bg-surface-container dark:bg-gray-800 flex items-center justify-center text-primary">
                <span class="material-symbols-outlined text-3xl">lock</span>
            </div>
            <h1 class="text-2xl font-bold tracking-tight">DF Tasks</h1>
            <p class="text-sm text-gray-500 mt-1">Enter your 4-digit PIN</p>
        </div>
        <div class="flex items-center justify-center gap-6 mb-12" id="pin-dots">
            <div class="w-4 h-4 rounded-full border-2 border-outline bg-transparent transition-all duration-200"></div>
            <div class="w-4 h-4 rounded-full border-2 border-outline bg-transparent transition-all duration-200"></div>
            <div class="w-4 h-4 rounded-full border-2 border-outline bg-transparent transition-all duration-200"></div>
            <div class="w-4 h-4 rounded-full border-2 border-outline bg-transparent transition-all duration-200"></div>
        </div>
        <div class="grid grid-cols-3 gap-x-6 gap-y-4 w-full max-w-[280px]">
            <button class="key-btn w-16 h-16 mx-auto rounded-full bg-surface-container dark:bg-gray-800 flex items-center justify-center text-2xl font-bold active:scale-90 transition-transform shadow-sm" data-val="1">1</button>
            <button class="key-btn w-16 h-16 mx-auto rounded-full bg-surface-container dark:bg-gray-800 flex items-center justify-center text-2xl font-bold active:scale-90 transition-transform shadow-sm" data-val="2">2</button>
            <button class="key-btn w-16 h-16 mx-auto rounded-full bg-surface-container dark:bg-gray-800 flex items-center justify-center text-2xl font-bold active:scale-90 transition-transform shadow-sm" data-val="3">3</button>
            <button class="key-btn w-16 h-16 mx-auto rounded-full bg-surface-container dark:bg-gray-800 flex items-center justify-center text-2xl font-bold active:scale-90 transition-transform shadow-sm" data-val="4">4</button>
            <button class="key-btn w-16 h-16 mx-auto rounded-full bg-surface-container dark:bg-gray-800 flex items-center justify-center text-2xl font-bold active:scale-90 transition-transform shadow-sm" data-val="5">5</button>
            <button class="key-btn w-16 h-16 mx-auto rounded-full bg-surface-container dark:bg-gray-800 flex items-center justify-center text-2xl font-bold active:scale-90 transition-transform shadow-sm" data-val="6">6</button>
            <button class="key-btn w-16 h-16 mx-auto rounded-full bg-surface-container dark:bg-gray-800 flex items-center justify-center text-2xl font-bold active:scale-90 transition-transform shadow-sm" data-val="7">7</button>
            <button class="key-btn w-16 h-16 mx-auto rounded-full bg-surface-container dark:bg-gray-800 flex items-center justify-center text-2xl font-bold active:scale-90 transition-transform shadow-sm" data-val="8">8</button>
            <button class="key-btn w-16 h-16 mx-auto rounded-full bg-surface-container dark:bg-gray-800 flex items-center justify-center text-2xl font-bold active:scale-90 transition-transform shadow-sm" data-val="9">9</button>
            <div class="w-16 h-16"></div>
            <button class="key-btn w-16 h-16 mx-auto rounded-full bg-surface-container dark:bg-gray-800 flex items-center justify-center text-2xl font-bold active:scale-90 transition-transform shadow-sm" data-val="0">0</button>
            <button aria-label="Delete" class="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-gray-500 active:scale-90 transition-transform" id="btn-backspace">
                <span class="material-symbols-outlined text-2xl">backspace</span>
            </button>
        </div>
    </div>

    <!-- App Dashboard View -->
    <div id="app-view" class="flex-grow flex flex-col hidden">
        <!-- Header -->
        <!-- Header (With iOS Safe Area Top Margin Support) -->
        <header class="fixed top-0 w-full z-50 bg-background/80 dark:bg-[#121212]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 pt-[env(safe-area-inset-top)]">
            <div class="h-14 flex items-center justify-between px-4 w-full">
                <!-- Left: Settings Gear -->
                <button id="btn-settings" class="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 active:scale-90 transition-transform rounded-full hover:bg-gray-100 dark:hover:bg-gray-850">
                    <span class="material-symbols-outlined !text-2xl">settings</span>
                </button>
                
                <!-- Center: App Title -->
                <div class="flex flex-col items-center leading-tight">
                    <h1 class="text-xl font-extrabold tracking-tight">DF Tasks</h1>
                    <span id="header-task-count" class="text-[11px] text-gray-400 dark:text-gray-500 font-medium transition-opacity duration-200 hidden"></span>
                </div>
                
                <!-- Right: Action Buttons (Uniform Flex Align) -->
                <div class="flex items-center gap-0.5">
                    <button id="btn-organize" class="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 active:scale-90 transition-transform rounded-full hover:bg-gray-100 dark:hover:bg-gray-850" title="Organize Tasks">
                        <span class="material-symbols-outlined !text-2xl" id="organize-icon">low_priority</span>
                    </button>
                    <button id="btn-nudge" class="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 active:scale-90 transition-transform rounded-full hover:bg-gray-100 dark:hover:bg-gray-850" title="Send Nudge">
                        <span class="material-symbols-outlined !text-2xl">notifications_active</span>
                    </button>
                    <button id="theme-toggle" class="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 active:scale-90 transition-transform rounded-full hover:bg-gray-100 dark:hover:bg-gray-850" title="Toggle Theme">
                        <span class="material-symbols-outlined !text-2xl" id="theme-icon">dark_mode</span>
                    </button>
                </div>
            </div>
        </header>

        <!-- Main Body -->
        <main class="flex-grow pt-[72px] px-4 pb-4 flex flex-col gap-4">
            
            <!-- Install & Notification Push Banner -->
            <div id="notif-banner" class="bg-primary/10 border border-primary/20 dark:bg-primary/20 dark:border-primary/30 text-primary dark:text-red-300 rounded-xl p-4 flex items-center gap-3 cursor-pointer active:scale-95 transition-transform hidden">
                <span class="material-symbols-outlined">notifications</span>
                <span class="text-sm font-medium flex-grow leading-snug">Tap to enable morning notifications</span>
                <span class="material-symbols-outlined opacity-50">chevron_right</span>
            </div>

            <!-- Task Input -->
            <div id="task-input-container" class="bg-white dark:bg-[#1E1E1E] rounded-xl p-3 flex items-center gap-3 shadow-sm border border-gray-100 dark:border-gray-800">
                <button id="input-star" class="w-10 h-10 flex items-center justify-center text-gray-400 active:scale-90 transition-transform">
                    <span class="material-symbols-outlined" id="input-star-icon">star</span>
                </button>
                <input id="task-input" class="flex-grow bg-transparent border-none focus:ring-0 text-lg font-medium p-0 focus:outline-none focus:border-none focus:ring-transparent focus:ring-0" placeholder="Add a new task..." type="text" />
                <button id="add-task-btn" class="bg-primary hover:bg-primary-container text-on-primary rounded-lg px-4 h-9 font-semibold text-sm flex items-center justify-center active:scale-95 transition-transform">
                    Add
                </button>
            </div>

            <!-- Priority Section -->
            <section id="priority-section" class="hidden">
                <h2 class="text-xs font-bold uppercase tracking-wider text-primary dark:text-red-400 px-1 mb-2 flex items-center gap-2">
                    High Priority
                    <span id="priority-count-badge" class="hidden bg-primary/15 dark:bg-red-900/40 text-primary dark:text-red-400 text-[10px] font-extrabold rounded-full px-2 py-0.5 tabular-nums"></span>
                </h2>
                <div class="flex flex-col gap-2" id="priority-list"></div>
            </section>

            <!-- Later Today Section -->
            <section id="later-section">
                <h2 class="text-xs font-bold uppercase tracking-wider text-primary dark:text-red-400 px-1 mb-2 flex items-center gap-2">
                    Tasks
                    <span id="normal-count-badge" class="hidden bg-primary/15 dark:bg-red-900/40 text-primary dark:text-red-400 text-[10px] font-extrabold rounded-full px-2 py-0.5 tabular-nums"></span>
                </h2>
                <div class="flex flex-col gap-2" id="later-list"></div>
            </section>

            <!-- Completed Today Section -->
            <section id="completed-section" class="hidden mt-6">
                <h2 class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1 mb-2">Completed Today</h2>
                <div class="flex flex-col gap-2" id="completed-list"></div>
            </section>
        </main>
    </div>

    <!-- Settings Modal -->
    <div id="settings-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center hidden">
        <div class="bg-white dark:bg-[#1E1E1E] w-full rounded-t-3xl p-6 flex flex-col gap-6 max-w-md shadow-2xl transition-transform duration-300 transform translate-y-full">
            <header class="flex justify-between items-center">
                <h3 class="text-lg font-bold">Preferences</h3>
                <button id="close-settings" class="p-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 active:scale-90 transition-transform">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </header>
            <div class="flex flex-col gap-2">
                <label class="text-sm font-semibold text-gray-500">Alert Schedule</label>
                <div class="flex items-center gap-3 bg-surface-container dark:bg-gray-800 rounded-xl p-3">
                    <span class="material-symbols-outlined text-gray-500">alarm</span>
                    <span class="text-sm font-medium flex-grow">Daily morning summary alert</span>
                    <select id="alert-hour-select" class="bg-transparent border-none focus:ring-0 font-bold p-0 text-right pr-2">
                        <!-- Options generated dynamically below -->
                    </select>
                </div>
            </div>
            <button id="logout-btn" class="w-full bg-gray-100 dark:bg-gray-800 text-red-500 font-semibold py-3 rounded-xl active:scale-95 transition-transform mt-2">
                Lock Application
            </button>
        </div>
    </div>

    <!-- PWA Guide / iOS Install Pop-up -->
    <div id="pwa-guide-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 hidden">
        <div class="bg-white dark:bg-[#1E1E1E] rounded-2xl p-6 max-w-sm flex flex-col items-center text-center gap-4">
            <span class="material-symbols-outlined text-4xl text-primary">install_mobile</span>
            <h3 class="text-lg font-bold">Install DF Tasks First</h3>
            <p class="text-sm text-gray-500 leading-relaxed">
                Notifications require the app to be saved to your home screen.<br><br>
                Tap the <strong class="text-primary"><span class="material-symbols-outlined text-base align-middle">share</span> Share</strong> button below, and select <strong class="text-primary">Add to Home Screen</strong>.
            </p>
            <button id="close-guide" class="w-full bg-primary text-on-primary font-semibold py-2.5 rounded-xl">Got it</button>
        </div>
    </div>

    <!-- Nudge Confirmation Modal -->
    <div id="nudge-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 hidden">
        <div class="bg-white dark:bg-[#1E1E1E] rounded-2xl p-6 max-w-sm w-full flex flex-col items-center text-center gap-4 shadow-2xl">
            <span class="material-symbols-outlined text-4xl text-primary animate-pulse">notifications_active</span>
            <h3 class="text-xl font-bold">Send Nudge Alert?</h3>
            <p class="text-sm text-gray-500 leading-relaxed">
                Would you like to send a quick, friendly notification to check our shared list?
            </p>
            <div class="flex gap-3 w-full mt-2">
                <button id="btn-cancel-nudge" class="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-xl active:scale-95 transition-transform">Cancel</button>
                <button id="btn-confirm-nudge" class="flex-1 bg-primary text-on-primary font-bold py-2.5 rounded-xl active:scale-95 transition-transform">Send</button>
            </div>
        </div>
    </div>

    <!-- Success Toast Pop-up -->
    <div id="toast" class="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white font-semibold py-2.5 px-6 rounded-full shadow-lg z-50 transition-all duration-300 opacity-0 translate-y-4 pointer-events-none">
        Nudge sent!
    </div>

    <script>
        const VAPID_PUBLIC_KEY = "${env.VAPID_PUBLIC_KEY}";
        let pin = localStorage.getItem("df_pin") || "";
        let currentInputStar = false;
        let isOrganizeMode = false;
        let tasks = [];

        // Generate Select options dynamically in vanilla JS to prevent compiling bugs
        const selectHour = document.getElementById("alert-hour-select");
        for (let i = 0; i < 24; i++) {
            let label = "";
            if (i === 0) label = "12 AM";
            else if (i === 12) label = "12 PM";
            else if (i > 12) label = (i - 12) + " PM";
            else label = i + " AM";
            
            const opt = document.createElement("option");
            opt.value = i;
            opt.textContent = label;
            selectHour.appendChild(opt);
        }

        // Set initial theme icon text based on local storage
        document.getElementById("theme-icon").textContent = document.documentElement.classList.contains("dark") ? "light_mode" : "dark_mode";

        // Haptic utility
        const haptic = () => { if (navigator.vibrate) navigator.vibrate(10); };

        // API Fetch Wrapper
        async function api(path, method = "GET", body = null) {
            const headers = { "Authorization": "Bearer " + pin };
            if (body) {
                headers["Content-Type"] = "application/json";
                body = JSON.stringify(body);
            }
            const res = await fetch(path, { method, headers, body });
            if (res.status === 401) {
                localStorage.removeItem("df_pin");
                pin = "";
                showView("auth-view");
                return null;
            }
            return res.json();
        }

        function showView(viewId) {
            document.getElementById("auth-view").classList.add("hidden");
            document.getElementById("app-view").classList.add("hidden");
            document.getElementById(viewId).classList.remove("hidden");
        }

        // Initialize Authentication
        if (!pin) {
            showView("auth-view");
        } else {
            showView("app-view");
            loadDashboard();
        }

        // Keypad Input
        let typingPin = "";
        const dots = document.querySelectorAll("#pin-dots div");
        document.querySelectorAll(".key-btn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                haptic();
                if (typingPin.length < 4) {
                    typingPin += e.currentTarget.dataset.val;
                    updatePinDots();
                    if (typingPin.length === 4) {
                        // Validate PIN
                        const res = await fetch("/api/auth", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ pin: typingPin })
                        });
                        const data = await res.json();
                        if (data.success) {
                            pin = typingPin;
                            localStorage.setItem("df_pin", pin);
                            showView("app-view");
                            loadDashboard();
                        } else {
                            // Shake error feedback
                            document.getElementById("pin-dots").classList.add("animate-bounce");
                            setTimeout(() => {
                                document.getElementById("pin-dots").classList.remove("animate-bounce");
                            }, 500);
                        }
                        typingPin = "";
                        setTimeout(updatePinDots, 200);
                    }
                }
            });
        });

        document.getElementById("btn-backspace").addEventListener("click", () => {
            haptic();
            typingPin = typingPin.slice(0, -1);
            updatePinDots();
        });

        function updatePinDots() {
            dots.forEach((dot, idx) => {
                if (idx < typingPin.length) {
                    dot.classList.remove("bg-transparent");
                    dot.classList.add("bg-primary", "scale-110");
                } else {
                    dot.classList.add("bg-transparent");
                    dot.classList.remove("bg-primary", "scale-110");
                }
            });
        }

        // Star Priority toggle in Input field
        const starBtn = document.getElementById("input-star");
        const starIcon = document.getElementById("input-star-icon");
        starBtn.addEventListener("click", () => {
            haptic();
            currentInputStar = !currentInputStar;
            if (currentInputStar) {
                starIcon.classList.add("text-yellow-500");
                starIcon.style.fontVariationSettings = "'FILL' 1";
            } else {
                starIcon.classList.remove("text-yellow-500");
                starIcon.style.fontVariationSettings = "'FILL' 0";
            }
        });

        // Add Task Action
        const taskInput = document.getElementById("task-input");
        document.getElementById("add-task-btn").addEventListener("click", async () => {
            const text = taskInput.value.trim();
            if (!text) return;
            haptic();
            const res = await api("/api/tasks", "POST", { text, priority: currentInputStar });
            if (res) {
                taskInput.value = "";
                if (currentInputStar) starBtn.click(); // Reset star state
                loadDashboard();
            }
        });

        // Toggle / Delete Actions
        async function toggleTask(taskId) {
            haptic();
            await api("/api/tasks/toggle", "POST", { id: taskId });
            loadDashboard();
        }

        async function deleteTask(taskId) {
            haptic();
            await api("/api/tasks/delete", "POST", { id: taskId });
            loadDashboard();
        }

        async function toggleStar(taskId) {
            haptic();
            await api("/api/tasks/star", "POST", { id: taskId });
            loadDashboard();
        }

        // Pure Vanilla JavaScript Mobile Drag-and-Drop Handler.
        // Active ONLY when isOrganizeMode is enabled. 
        let activeDragCard = null;
        let dragStartY = 0;
        let parentList = null;

        function initTouchDrag(handle, card, listId) {
            handle.addEventListener("touchstart", (e) => {
                if (!isOrganizeMode) return;
                e.preventDefault(); // Stop window scrolling
                haptic();
                activeDragCard = card;
                parentList = document.getElementById(listId);
                card.classList.add("z-50", "opacity-85", "shadow-xl", "ring-2", "ring-primary/20", "scale-[1.02]", "transition-all");
                const touch = e.touches[0];
                dragStartY = touch.clientY;
            }, { passive: false });

            handle.addEventListener("touchmove", (e) => {
                if (!activeDragCard || !isOrganizeMode) return;
                e.preventDefault(); // Stop vertical scroll drift

                const touch = e.touches[0];
                const currentY = touch.clientY;

                // Find card directly vertically below the finger
                const siblings = [...parentList.querySelectorAll(".task-card-wrapper")].filter(sibling => sibling !== activeDragCard);
                const nextSibling = siblings.find(sibling => {
                    const rect = sibling.getBoundingClientRect();
                    return currentY < rect.top + rect.height / 2;
                });

                if (nextSibling) {
                    parentList.insertBefore(activeDragCard, nextSibling);
                } else {
                    parentList.appendChild(activeDragCard);
                }
            }, { passive: false });

            handle.addEventListener("touchend", async (e) => {
                if (!activeDragCard || !isOrganizeMode) return;
                haptic();
                activeDragCard.classList.remove("z-50", "opacity-85", "shadow-xl", "ring-2", "ring-primary/20", "scale-[1.02]", "transition-all");

                // Grab the newly sorted array IDs from the DOM (Active + Completed to preserve database array integrity)
                const priorityCards = [...document.getElementById("priority-list").querySelectorAll(".task-card-wrapper")];
                const normalCards = [...document.getElementById("later-list").querySelectorAll(".task-card-wrapper")];
                const completedCards = [...document.getElementById("completed-list").querySelectorAll(".task-card-wrapper")];
                const masterOrder = [...priorityCards, ...normalCards, ...completedCards].map(c => c.dataset.id);

                // Sort our local model tasks array immediately
                tasks.sort((a, b) => masterOrder.indexOf(a.id) - masterOrder.indexOf(b.id));
                activeDragCard = null;

                // Persist the order to Cloudflare KV
                await api("/api/tasks/reorder", "POST", { orderedIds: masterOrder });
            });
        }

        // iOS Swipe-to-Delete Implementation
        let touchStartX = 0;
        let touchStartY = 0;
        let swipedCard = null;

        function initSwipeToDelete(card, mainContent) {
            mainContent.addEventListener("touchstart", (e) => {
                if (isOrganizeMode) return; // Disallow swiping while organizing
                
                // If another card is already swiped open, close it first
                if (swipedCard && swipedCard !== card) {
                    closeSwipedCard(swipedCard);
                }
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }, { passive: true });

            mainContent.addEventListener("touchmove", (e) => {
                if (isOrganizeMode) return;
                
                const diffX = touchStartX - e.touches[0].clientX;
                const diffY = touchStartY - e.touches[0].clientY;

                // Only handle if horizontal swipe is greater than vertical movement
                if (Math.abs(diffX) > Math.abs(diffY) && diffX > 0) {
                    const slideAmount = Math.min(diffX, 100);
                    mainContent.style.transform = "translateX(-" + slideAmount + "px)";
                    mainContent.style.transition = "none";
                }
            }, { passive: true });

            mainContent.addEventListener("touchend", (e) => {
                if (isOrganizeMode) return;

                const diffX = touchStartX - e.changedTouches[0].clientX;
                mainContent.style.transition = "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)";
                
                if (diffX > 60) {
                    // Snap open to reveal the red delete button
                    mainContent.style.transform = "translateX(-88px)";
                    swipedCard = card;
                } else {
                    // Snap back shut
                    mainContent.style.transform = "translateX(0)";
                    if (swipedCard === card) swipedCard = null;
                }
            }, { passive: true });
        }

        function closeSwipedCard(card) {
            const content = card.querySelector(".swipe-content");
            if (content) {
                content.style.transition = "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)";
                content.style.transform = "translateX(0)";
            }
            if (swipedCard === card) swipedCard = null;
        }

        // Tap to close any open swipe if clicking outside
        document.addEventListener("touchstart", (e) => {
            if (swipedCard && !swipedCard.contains(e.target)) {
                closeSwipedCard(swipedCard);
            }
        }, { passive: true });

        // Inline Edit Mode implementation
        function enterEditMode(card, textSpan, pencilBtn, pencilIcon, task, checkBtn, starBtn, dragHandle) {
            const input = document.createElement("input");
            input.type = "text";
            input.className = "flex-grow text-lg font-semibold bg-transparent border-b-2 border-primary focus:outline-none focus:ring-0 p-0 mr-2 dark:text-gray-100";
            input.value = task.text;

            // Replace standard text block with active text field
            card.replaceChild(input, textSpan);
            input.focus();

            // Temporarily hide other controls to avoid layout shifting and accidental clicks
            checkBtn.classList.add("hidden");
            starBtn.classList.add("hidden");
            if (dragHandle) dragHandle.classList.add("hidden");

            // Change Edit button to green save checkmark
            pencilIcon.textContent = "check";
            pencilIcon.classList.remove("text-gray-400");
            pencilIcon.classList.add("text-green-500", "!text-3xl");

            pencilBtn.onclick = async () => {
                const newText = input.value.trim();
                if (newText && newText !== task.text) {
                    haptic();
                    await api("/api/tasks/edit", "POST", { id: task.id, text: newText });
                    loadDashboard();
                } else {
                    loadDashboard();
                }
            };
        }

        // Render Lists using pure browser DOM elements. Fully optimized for text wrapping and swipe features.
        function renderTasks(items) {
            const priorityList = document.getElementById("priority-list");
            const laterList = document.getElementById("later-list");
            const completedList = document.getElementById("completed-list");
            
            priorityList.innerHTML = "";
            laterList.innerHTML = "";
            completedList.innerHTML = "";

            let hasPriority = false;
            let hasCompleted = false;

            items.forEach(task => {
                const isCompleted = task.completed;
                
                // 1. Create Outer Wrapper (holds absolute red delete button underneath)
                const wrapper = document.createElement("div");
                wrapper.className = "task-card-wrapper relative overflow-hidden bg-white dark:bg-[#1E1E1E] rounded-2xl border-2 border-gray-100 dark:border-gray-800 shadow-sm w-full";
                wrapper.dataset.id = task.id;

                // 2. Create Absolute Swipe Delete Panel (Z-0) — only for active tasks
                if (!isCompleted) {
                    const deletePanel = document.createElement("button");
                    deletePanel.className = "absolute right-0 top-0 bottom-0 w-[88px] bg-red-500 text-white flex flex-col items-center justify-center font-bold text-xs cursor-pointer z-0 active:bg-red-600 active:scale-95 transition-all";
                    
                    const trashIcon = document.createElement("span");
                    trashIcon.className = "material-symbols-outlined !text-2xl mb-0.5";
                    trashIcon.textContent = "delete";
                    
                    const deleteText = document.createElement("span");
                    deleteText.textContent = "Delete";
                    
                    deletePanel.appendChild(trashIcon);
                    deletePanel.appendChild(deleteText);
                    deletePanel.onclick = () => {
                        closeSwipedCard(wrapper);
                        deleteTask(task.id);
                    };
                    
                    wrapper.appendChild(deletePanel);
                }

                // 3. Create Slideable Foreground Row Container (Z-10) — now flex-col to support note accordion
                const mainRow = document.createElement("div");
                mainRow.className = "swipe-content relative z-10 w-full bg-white dark:bg-[#1E1E1E] flex flex-col transition-transform duration-200" + (isCompleted ? " opacity-40" : "");

                // Inner top row holds all controls
                const innerRow = document.createElement("div");
                innerRow.className = "flex items-center gap-2 p-4 min-h-[64px]";

                // A. Grab Handle (Only visible/instantiated in Organize Mode)
                const dragHandle = document.createElement("div");
                dragHandle.className = "drag-handle w-11 h-11 flex items-center justify-center text-gray-300 dark:text-gray-600 active:text-primary cursor-grab flex-shrink-0" + (isOrganizeMode ? "" : " hidden");
                
                const dragIcon = document.createElement("span");
                dragIcon.className = "material-symbols-outlined !text-2xl";
                dragIcon.textContent = "drag_handle";
                dragHandle.appendChild(dragIcon);

                if (isOrganizeMode && !isCompleted) {
                    initTouchDrag(dragHandle, wrapper, task.priority ? "priority-list" : "later-list");
                }

                // B. Check Button
                const checkBtn = document.createElement("button");
                checkBtn.className = "w-11 h-11 flex items-center justify-center text-primary active:scale-95 transition-transform flex-shrink-0" + (isOrganizeMode ? " opacity-30 pointer-events-none" : "");
                checkBtn.onclick = () => toggleTask(task.id);
                
                const checkIcon = document.createElement("span");
                checkIcon.className = "material-symbols-outlined !text-3xl";
                checkIcon.style.fontVariationSettings = isCompleted ? "'FILL' 1" : "'FILL' 0";
                checkIcon.textContent = isCompleted ? "check_circle" : "radio_button_unchecked";
                checkBtn.appendChild(checkIcon);

                // C. Text Container (wraps task text + note preview line)
                const textContainer = document.createElement("div");
                textContainer.className = "flex-grow flex flex-col overflow-hidden";

                const textSpan = document.createElement("span");
                textSpan.className = "text-lg leading-tight font-semibold py-1 break-words text-left cursor-pointer" + (isCompleted ? " line-through" : "");
                textSpan.textContent = task.text;

                // Note preview: always visible below task text when a note exists
                const notePreview = document.createElement("span");
                notePreview.className = "text-xs text-gray-400 dark:text-gray-500 truncate pb-1 cursor-pointer" + (task.note ? "" : " hidden");
                notePreview.textContent = task.note || "";

                textContainer.appendChild(textSpan);
                textContainer.appendChild(notePreview);

                // D. Edit (Pencil) Button (Hidden until text is tapped)
                const pencilBtn = document.createElement("button");
                pencilBtn.className = "w-11 h-11 flex items-center justify-center flex-shrink-0 text-gray-400 hover:text-primary active:scale-95 transition-transform hidden";
                
                const pencilIcon = document.createElement("span");
                pencilIcon.className = "material-symbols-outlined !text-2xl";
                pencilIcon.textContent = "edit";
                pencilBtn.appendChild(pencilIcon);

                // E. Note Button (always visible if note exists; revealed on text-tap if no note)
                const noteBtn = document.createElement("button");
                noteBtn.className = "w-11 h-11 flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform " + (task.note ? "text-primary" : "text-gray-400 dark:text-gray-600 hidden");

                const noteIcon = document.createElement("span");
                noteIcon.className = "material-symbols-outlined !text-2xl";
                noteIcon.style.fontVariationSettings = task.note ? "'FILL' 1" : "'FILL' 0";
                noteIcon.textContent = "sticky_note_2";
                noteBtn.appendChild(noteIcon);

                // Note accordion section (expands below innerRow)
                const noteSection = document.createElement("div");
                noteSection.className = "px-4 pb-3 hidden";

                const noteTextarea = document.createElement("textarea");
                noteTextarea.className = "w-full bg-gray-50 dark:bg-[#2a2a2a] text-sm text-gray-600 dark:text-gray-300 rounded-xl p-3 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-primary resize-none placeholder-gray-300 dark:placeholder-gray-600";
                noteTextarea.placeholder = "Add a note...";
                noteTextarea.rows = 2;
                noteTextarea.value = task.note || "";
                noteSection.appendChild(noteTextarea);

                // Auto-save note on blur
                noteTextarea.addEventListener("blur", async () => {
                    const newNote = noteTextarea.value.trim() || null;
                    if (newNote !== (task.note || null)) {
                        await api("/api/tasks/edit", "POST", { id: task.id, text: task.text, note: newNote });
                        loadDashboard();
                    }
                });

                // Tapping task text reveals pencil + note button
                textSpan.onclick = () => {
                    if (isOrganizeMode || isCompleted) return;
                    haptic();
                    pencilBtn.classList.toggle("hidden");
                    if (!task.note) noteBtn.classList.toggle("hidden");
                };

                // Tapping note preview opens the note section directly
                notePreview.onclick = (e) => {
                    e.stopPropagation();
                    haptic();
                    noteSection.classList.toggle("hidden");
                    if (!noteSection.classList.contains("hidden")) noteTextarea.focus();
                };

                // Note button toggles the note section accordion
                noteBtn.onclick = (e) => {
                    e.stopPropagation();
                    haptic();
                    noteSection.classList.toggle("hidden");
                    if (!noteSection.classList.contains("hidden")) noteTextarea.focus();
                };

                // Initialize Inline edit trigger (pass textContainer so replaceChild targets the right parent)
                pencilBtn.onclick = () => {
                    haptic();
                    enterEditMode(textContainer, textSpan, pencilBtn, pencilIcon, task, checkBtn, starBtn, isCompleted ? null : dragHandle);
                };

                // F. Star Button
                const starBtn = document.createElement("button");
                starBtn.className = "w-11 h-11 flex items-center justify-center flex-shrink-0 " + (task.priority ? "text-yellow-500" : "text-gray-300 dark:text-gray-600") + " active:scale-95 transition-transform" + (isOrganizeMode ? " opacity-30 pointer-events-none" : "");
                starBtn.onclick = () => toggleStar(task.id);

                const starIcon = document.createElement("span");
                starIcon.className = "material-symbols-outlined !text-3xl";
                starIcon.style.fontVariationSettings = task.priority ? "'FILL' 1" : "'FILL' 0";
                starIcon.textContent = "star";
                starBtn.appendChild(starIcon);

                // Assemble inner row, then note section, into mainRow
                innerRow.appendChild(dragHandle);
                innerRow.appendChild(checkBtn);
                innerRow.appendChild(textContainer);
                innerRow.appendChild(pencilBtn);
                innerRow.appendChild(noteBtn);
                innerRow.appendChild(starBtn);

                mainRow.appendChild(innerRow);
                mainRow.appendChild(noteSection);
                wrapper.appendChild(mainRow);

                // Bind Swipe Listener
                if (!isCompleted && !isOrganizeMode) {
                    initSwipeToDelete(wrapper, mainRow);
                }

                // Group wrapper elegantly into the three-tier vertical lists
                if (isCompleted) {
                    completedList.appendChild(wrapper);
                    hasCompleted = true;
                } else if (task.priority) {
                    priorityList.appendChild(wrapper);
                    hasPriority = true;
                } else {
                    laterList.appendChild(wrapper);
                }
            });

            document.getElementById("priority-section").classList.toggle("hidden", !hasPriority);
            document.getElementById("completed-section").classList.toggle("hidden", !hasCompleted);

            // --- Task Count Feature ---
            const priorityActiveCount = items.filter(t => t.priority && !t.completed).length;
            const normalActiveCount   = items.filter(t => !t.priority && !t.completed).length;
            const totalActive         = priorityActiveCount + normalActiveCount;

            // Animate and update a count badge pill
            function updateCountBadge(el, count) {
                if (count > 0) {
                    const changed = el.textContent !== String(count);
                    el.textContent = count;
                    el.classList.remove("hidden");
                    if (changed) {
                        el.classList.remove("count-pop");
                        void el.offsetWidth; // Force reflow to restart animation
                        el.classList.add("count-pop");
                    }
                } else {
                    el.classList.add("hidden");
                }
            }

            updateCountBadge(document.getElementById("priority-count-badge"), priorityActiveCount);
            updateCountBadge(document.getElementById("normal-count-badge"), normalActiveCount);

            // Update header subtitle
            const headerCount = document.getElementById("header-task-count");
            if (totalActive > 0) {
                headerCount.textContent = totalActive + (totalActive === 1 ? " active task" : " active tasks");
                headerCount.classList.remove("hidden");
            } else {
                headerCount.classList.add("hidden");
            }
        }

        async function loadDashboard() {
            const data = await api("/api/tasks");
            if (data) {
                tasks = data.tasks; // Save locally in-memory
                renderTasks(tasks);
            }
            
            // Clear App Badge locally on app launch
            if (navigator.clearAppBadge) {
                navigator.clearAppBadge();
            }

            // Sync Settings UI
            const settings = await api("/api/settings");
            if (settings) {
                document.getElementById("alert-hour-select").value = settings.alertHour;
            }

            // Manage Notifications Banner
            checkPushStatus();
        }

        // Header Organize Button Toggle Logic (low_priority)
        const organizeBtn = document.getElementById("btn-organize");
        const organizeIcon = document.getElementById("organize-icon");
        const inputContainer = document.getElementById("task-input-container");

        organizeBtn.addEventListener("click", () => {
            haptic();
            if (swipedCard) closeSwipedCard(swipedCard); // Close any swiping open cards first
            
            isOrganizeMode = !isOrganizeMode;
            
            if (isOrganizeMode) {
                // Enter Organize Mode: Turn header button into checkmark, hide task input box to focus workspace
                organizeIcon.textContent = "check";
                organizeIcon.classList.remove("text-gray-600", "dark:text-gray-400");
                organizeIcon.classList.add("text-green-500", "dark:text-green-400");
                inputContainer.classList.add("hidden");
            } else {
                // Exit Organize Mode: Return header button to low_priority, restore input box
                organizeIcon.textContent = "low_priority";
                organizeIcon.classList.add("text-gray-600", "dark:text-gray-400");
                organizeIcon.classList.remove("text-green-500", "dark:text-green-400");
                inputContainer.classList.remove("hidden");
            }

            // Force Re-render with active dragging parameters
            renderTasks(tasks);
        });

        // Notification Banner Click Logic
        const banner = document.getElementById("notif-banner");
        banner.addEventListener("click", async () => {
            haptic();
            const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
            if (!isStandalone) {
                // Guide modal if outside PWA context
                document.getElementById("pwa-guide-modal").classList.remove("hidden");
                return;
            }
            registerPush();
        });

        document.getElementById("close-guide").addEventListener("click", () => {
            document.getElementById("pwa-guide-modal").classList.add("hidden");
        });

        // Service Worker registration & Push Registration flow
        async function checkPushStatus() {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                banner.classList.add("hidden");
                return;
            }
            const reg = await navigator.serviceWorker.ready.catch(() => null);
            if (!reg) return;

            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                // Self-Healing registration: Save active endpoint locally to exclude yourself during nudges
                localStorage.setItem("df_push_endpoint", sub.endpoint);
                banner.classList.add("hidden");
            } else {
                banner.classList.remove("hidden");
            }
        }

        async function registerPush() {
            try {
                const reg = await navigator.serviceWorker.ready;
                const sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY)
                });
                const res = await api("/api/subscribe", "POST", sub);
                if (res && res.success) {
                    // Save active endpoint locally so we can exclude ourselves when sending a nudge
                    localStorage.setItem("df_push_endpoint", sub.endpoint);
                    banner.classList.add("hidden");
                    alert("Notifications successfully enabled!");
                }
            } catch (err) {
                console.error("Subscription failed", err);
                alert("Failed to enable alerts. Make sure permissions are allowed.");
            }
        }

        function urlB64ToUint8Array(base64String) {
            const padding = '='.repeat((4 - base64String.length % 4) % 4);
            const base64 = (base64String + padding).replace(/\\-/g, '+').replace(/_/g, '/');
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
        }

        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(checkPushStatus);
        }

        // Modal Preferences Logic
        const settingsModal = document.getElementById("settings-modal");
        const settingsContainer = settingsModal.querySelector("div");
        document.getElementById("btn-settings").addEventListener("click", () => {
            haptic();
            settingsModal.classList.remove("hidden");
            setTimeout(() => {
                settingsContainer.classList.remove("translate-y-full");
            }, 10);
        });

        const closeSettings = () => {
            haptic();
            settingsContainer.classList.add("translate-y-full");
            setTimeout(() => {
                settingsModal.classList.add("hidden");
            }, 300);
        };
        document.getElementById("close-settings").addEventListener("click", closeSettings);

        // Alert Hour settings update logic
        document.getElementById("alert-hour-select").addEventListener("change", async (e) => {
            haptic();
            await api("/api/settings", "POST", { alertHour: parseInt(e.target.value, 10) });
        });

        // Theme Toggle Logic with Centered Icon Swapping
        document.getElementById("theme-toggle").addEventListener("click", () => {
            haptic();
            const isDark = document.documentElement.classList.toggle("dark");
            localStorage.setItem("df_theme", isDark ? "dark" : "light");
            document.getElementById("theme-icon").textContent = isDark ? "light_mode" : "dark_mode";
        });

        // Logout/Lock action
        document.getElementById("logout-btn").addEventListener("click", () => {
            haptic();
            localStorage.removeItem("df_pin");
            pin = "";
            showView("auth-view");
            closeSettings();
        });

        // Nudge Functionality Integration
        const nudgeBtn = document.getElementById("btn-nudge");
        const nudgeModal = document.getElementById("nudge-modal");
        const cancelNudgeBtn = document.getElementById("btn-cancel-nudge");
        const confirmNudgeBtn = document.getElementById("btn-confirm-nudge");
        const toast = document.getElementById("toast");

        nudgeBtn.addEventListener("click", () => {
            haptic();
            nudgeModal.classList.remove("hidden");
        });

        cancelNudgeBtn.addEventListener("click", () => {
            haptic();
            nudgeModal.classList.add("hidden");
        });

        confirmNudgeBtn.addEventListener("click", async () => {
            haptic();
            nudgeModal.classList.add("hidden");
            
            // Get our saved local endpoint to exclude ourselves from the nudge dispatch list
            const senderEndpoint = localStorage.getItem("df_push_endpoint") || "";
            const res = await api("/api/nudge", "POST", { senderEndpoint });
            if (res && res.success) {
                showToast("Nudge sent!");
            } else {
                showToast("Nudge failed to send.");
            }
        });

        function showToast(msg) {
            toast.textContent = msg;
            toast.classList.remove("opacity-0", "translate-y-4", "pointer-events-none");
            toast.classList.add("opacity-100", "translate-y-0");
            setTimeout(() => {
                toast.classList.remove("opacity-100", "translate-y-0");
                toast.classList.add("opacity-0", "translate-y-4", "pointer-events-none");
            }, 2500);
        }

        // Automatic Background Synchronization Behaviors

        // 1. Resuming Sync: Instantly pull database changes when phone unlocks or returns to PWA
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                if (pin) {
                    loadDashboard();
                }
            }
        });

        // 2. Active Polling: Quietly check database every 20 seconds while app is in active use
        setInterval(() => {
            if (pin && document.visibilityState === "visible") {
                loadDashboard();
            }
        }, 20000);

    </script>
</body>
</html>
  `;
}

// REST endpoints & request router implementation
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Route: Standard assets & app layout
    if (url.pathname === "/") {
      return new Response(getHTML(env), { headers: { "Content-Type": "text/html" } });
    }
    if (url.pathname === "/manifest.json") {
      return new Response(getManifest(), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/sw.js") {
      return new Response(getServiceWorker(), { headers: { "Content-Type": "application/javascript" } });
    }

    // Route: PIN Authentication check
    if (url.pathname === "/api/auth" && request.method === "POST") {
      const { pin } = await request.json();
      if (pin === env.APP_PIN) {
        return new Response(JSON.stringify({ success: true }));
      }
      return new Response(JSON.stringify({ success: false }), { status: 401 });
    }

    // API Routes (Require Authorization)
    if (url.pathname.startsWith("/api/")) {
      if (!authorize(request, env)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      }

      // GET List of Tasks
      if (url.pathname === "/api/tasks" && request.method === "GET") {
        const data = await env.DF_TASKS_KV.get("shared_tasks");
        const tasks = data ? JSON.parse(data) : [];
        return new Response(JSON.stringify({ tasks }));
      }

      // POST Create a Task
      if (url.pathname === "/api/tasks" && request.method === "POST") {
        const { text, priority } = await request.json();
        const data = await env.DF_TASKS_KV.get("shared_tasks");
        const tasks = data ? JSON.parse(data) : [];

        const newTask = {
          id: crypto.randomUUID(),
          text,
          note: null,
          priority: !!priority,
          completed: false,
          completedAt: null
        };
        tasks.unshift(newTask);

        await env.DF_TASKS_KV.put("shared_tasks", JSON.stringify(tasks));
        return new Response(JSON.stringify({ success: true }));
      }

      // POST Edit Task Text
      if (url.pathname === "/api/tasks/edit" && request.method === "POST") {
        const { id, text, note } = await request.json();
        const data = await env.DF_TASKS_KV.get("shared_tasks");
        let tasks = data ? JSON.parse(data) : [];

        tasks = tasks.map(task => {
          if (task.id === id) {
            const updated = { ...task, text };
            if (note !== undefined) updated.note = note; // Only update note if explicitly provided
            return updated;
          }
          return task;
        });

        await env.DF_TASKS_KV.put("shared_tasks", JSON.stringify(tasks));
        return new Response(JSON.stringify({ success: true }));
      }

      // POST Reorder/Sort Master List Array
      if (url.pathname === "/api/tasks/reorder" && request.method === "POST") {
        const { orderedIds } = await request.json();
        const data = await env.DF_TASKS_KV.get("shared_tasks");
        let tasks = data ? JSON.parse(data) : [];

        // Re-sort the saved array matching the ordered ID sequence exactly
        tasks.sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));

        await env.DF_TASKS_KV.put("shared_tasks", JSON.stringify(tasks));
        return new Response(JSON.stringify({ success: true }));
      }

      // POST Toggle Complete / Soft Delete
      if (url.pathname === "/api/tasks/toggle" && request.method === "POST") {
        const { id } = await request.json();
        const data = await env.DF_TASKS_KV.get("shared_tasks");
        let tasks = data ? JSON.parse(data) : [];

        tasks = tasks.map(task => {
          if (task.id === id) {
            const nextCompleted = !task.completed;
            return {
              ...task,
              completed: nextCompleted,
              completedAt: nextCompleted ? Date.now() : null
            };
          }
          return task;
        });

        await env.DF_TASKS_KV.put("shared_tasks", JSON.stringify(tasks));
        return new Response(JSON.stringify({ success: true }));
      }

      // POST Toggle Priority Star
      if (url.pathname === "/api/tasks/star" && request.method === "POST") {
        const { id } = await request.json();
        const data = await env.DF_TASKS_KV.get("shared_tasks");
        let tasks = data ? JSON.parse(data) : [];

        tasks = tasks.map(task => {
          if (task.id === id) {
            return { ...task, priority: !task.priority };
          }
          return task;
        });

        await env.DF_TASKS_KV.put("shared_tasks", JSON.stringify(tasks));
        return new Response(JSON.stringify({ success: true }));
      }

      // POST Delete task instantly
      if (url.pathname === "/api/tasks/delete" && request.method === "POST") {
        const { id } = await request.json();
        const data = await env.DF_TASKS_KV.get("shared_tasks");
        let tasks = data ? JSON.parse(data) : [];

        tasks = tasks.filter(task => task.id !== id);

        await env.DF_TASKS_KV.put("shared_tasks", JSON.stringify(tasks));
        return new Response(JSON.stringify({ success: true }));
      }

      // POST Register/Save Push Subscription
      if (url.pathname === "/api/subscribe" && request.method === "POST") {
        const subscription = await request.json();
        const data = await env.DF_TASKS_KV.get("push_subscriptions");
        let subscriptions = data ? JSON.parse(data) : [];

        // Avoid exact duplicate endpoints
        subscriptions = subscriptions.filter(s => s.endpoint !== subscription.endpoint);
        subscriptions.push(subscription);

        await env.DF_TASKS_KV.put("push_subscriptions", JSON.stringify(subscriptions));
        return new Response(JSON.stringify({ success: true }));
      }

      // POST Send On-Demand Nudge Alert to the other spouse
      if (url.pathname === "/api/nudge" && request.method === "POST") {
        const { senderEndpoint } = await request.json();
        const subData = await env.DF_TASKS_KV.get("push_subscriptions");
        const subscriptions = subData ? JSON.parse(subData) : [];

        // Exclude the sender's endpoint so your own clicks don't buzz your own phone
        const targetSubscribers = subscriptions.filter(sub => sub.endpoint !== senderEndpoint);

        // Fetch task count to make sure badge count updates accurately during a nudge
        const taskData = await env.DF_TASKS_KV.get("shared_tasks");
        const tasks = taskData ? JSON.parse(taskData) : [];
        const activeCount = tasks.filter(t => !t.completed).length;

        const vapid = {
          subject: env.VAPID_SUBJECT,
          publicKey: env.VAPID_PUBLIC_KEY,
          privateKey: env.VAPID_PRIVATE_KEY
        };

        for (const sub of targetSubscribers) {
          try {
            const message = {
              data: JSON.stringify({
                title: "DF Tasks Spouse Nudge",
                body: "Hey! Please check our shared to-do list. 📋"
              }),
              options: { ttl: 60 }
            };

            const payload = await buildPushPayload(message, sub, vapid);
            await fetch(sub.endpoint, payload);
          } catch (err) {
            // Expired or revoked endpoints are skipped gracefully
          }
        }

        return new Response(JSON.stringify({ success: true }));
      }

      // GET Settings preferences
      if (url.pathname === "/api/settings" && request.method === "GET") {
        const data = await env.DF_TASKS_KV.get("alert_settings");
        const settings = data ? JSON.parse(data) : { alertHour: 8 }; // Default to 8 AM
        return new Response(JSON.stringify(settings));
      }

      // POST Update alert time setting
      if (url.pathname === "/api/settings" && request.method === "POST") {
        const { alertHour } = await request.json();
        const settings = { alertHour: parseInt(alertHour, 10) };
        await env.DF_TASKS_KV.put("alert_settings", JSON.stringify(settings));
        return new Response(JSON.stringify({ success: true }));
      }
    }

    return new Response("Not Found", { status: 404 });
  },

  // CRON scheduled triggers handler (sweeps completed tasks & fires morning notification)
  async scheduled(event, env, ctx) {
    // 1. Convert current UTC to America/New_York (Eastern Time) cleanly
    const nyTime = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      hour12: false
    }).format(new Date());
    const currentHour = parseInt(nyTime, 10);

    // 2. Fetch configured alert hour (defaults to 8 AM)
    const settingsData = await env.DF_TASKS_KV.get("alert_settings");
    const settings = settingsData ? JSON.parse(settingsData) : { alertHour: 8 };

    // 3. Execute sweep & alert only on the matched hour trigger
    if (currentHour === settings.alertHour) {
      const taskData = await env.DF_TASKS_KV.get("shared_tasks");
      let tasks = taskData ? JSON.parse(taskData) : [];

      // Sweep: permanently delete soft-deleted (completed) tasks
      tasks = tasks.filter(task => !task.completed);
      await env.DF_TASKS_KV.put("shared_tasks", JSON.stringify(tasks));

      const activeTasksCount = tasks.length;

      // Only alert if there are actually active tasks to report
      if (activeTasksCount > 0) {
        // Read saved push registrations
        const subData = await env.DF_TASKS_KV.get("push_subscriptions");
        const subscriptions = subData ? JSON.parse(subData) : [];

        // Prioritized notification content
        const starred = tasks.filter(t => t.priority);
        const normal = tasks.filter(t => !t.priority);
        let alertMessage = `You have ${activeTasksCount} tasks to complete today.`;
        if (starred.length > 0) {
          alertMessage = `⭐ Starred: ${starred.map(t => t.text).join(', ')}. Plus ${normal.length} other tasks.`;
        }

        const vapid = {
          subject: env.VAPID_SUBJECT,
          publicKey: env.VAPID_PUBLIC_KEY,
          privateKey: env.VAPID_PRIVATE_KEY
        };

        // Deliver push to active subscribers
        for (const sub of subscriptions) {
          try {
            const message = {
              data: JSON.stringify({
                title: "DF Tasks Morning Alert",
                body: alertMessage
              }),
              options: { ttl: 60 }
            };

            const payload = await buildPushPayload(message, sub, vapid);
            await fetch(sub.endpoint, payload);
          } catch (err) {
            // Subscription may have expired or been revoked by iOS.
          }
        }
      }
    }
  }
};