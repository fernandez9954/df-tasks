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
        icon: "/icon.png",
        badge: "/icon.png",
        vibrate: [100, 50, 100],
        data: { url: "/" }
      };

      event.waitUntil(
        Promise.all([
          self.registration.showNotification(title, options),
          self.navigator && self.navigator.setAppBadge ? self.navigator.setAppBadge(data.badge || 0) : Promise.resolve()
        ])
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
    <script>
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
    </style>
</head>
<body class="bg-background dark:bg-[#121212] text-on-background dark:text-gray-100 min-h-screen flex flex-col relative transition-colors duration-300">

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
        <header class="flex items-center justify-between px-4 h-14 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-background/80 dark:bg-[#121212]/80 backdrop-blur-md z-40">
            <button id="btn-settings" class="p-2 text-gray-600 dark:text-gray-400 active:scale-90 transition-transform">
                <span class="material-symbols-outlined">settings</span>
            </button>
            <h1 class="text-lg font-bold">DF Tasks</h1>
            <div class="flex items-center gap-1">
                <button id="theme-toggle" class="p-2 text-gray-600 dark:text-gray-400 active:scale-90 transition-transform">
                    <span class="material-symbols-outlined block dark:hidden">dark_mode</span>
                    <span class="material-symbols-outlined hidden dark:block">light_mode</span>
                </button>
            </div>
        </header>

        <!-- Main Body -->
        <main class="flex-grow px-4 py-4 flex flex-col gap-4">
            
            <!-- Install & Notification Push Banner -->
            <div id="notif-banner" class="bg-primary/10 border border-primary/20 dark:bg-primary/20 dark:border-primary/30 text-primary dark:text-red-300 rounded-xl p-4 flex items-center gap-3 cursor-pointer active:scale-95 transition-transform hidden">
                <span class="material-symbols-outlined">notifications</span>
                <span class="text-sm font-medium flex-grow leading-snug">Tap to enable morning notifications</span>
                <span class="material-symbols-outlined opacity-50">chevron_right</span>
            </div>

            <!-- Task Input -->
            <div class="bg-white dark:bg-[#1E1E1E] rounded-xl p-3 flex items-center gap-3 shadow-sm border border-gray-100 dark:border-gray-800">
                <button id="input-star" class="w-10 h-10 flex items-center justify-center text-gray-400 active:scale-90 transition-transform">
                    <span class="material-symbols-outlined" id="input-star-icon">star</span>
                </button>
                <input id="task-input" class="flex-grow bg-transparent border-none focus:ring-0 text-lg md:text-xl font-medium p-0 focus:outline-none focus:border-none focus:ring-transparent" placeholder="Add a new task..." type="text" />
                <button id="add-task-btn" class="bg-primary hover:bg-primary-container text-on-primary rounded-lg px-4 h-9 font-semibold text-sm flex items-center justify-center active:scale-95 transition-transform">
                    Add
                </button>
            </div>

            <!-- Priority Section -->
            <section id="priority-section" class="hidden">
                <h2 class="text-xs font-bold uppercase tracking-wider text-primary dark:text-red-400 px-1 mb-2">High Priority</h2>
                <div class="flex flex-col gap-2" id="priority-list"></div>
            </section>

            <!-- Later Today Section -->
            <section id="later-section">
                <h2 class="text-xs font-bold uppercase tracking-wider text-gray-400 px-1 mb-2">Tasks</h2>
                <div class="flex flex-col gap-2" id="later-list"></div>
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

    <!-- iOS Install Banner / Pop-up -->
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

    <script>
        const VAPID_PUBLIC_KEY = "${env.VAPID_PUBLIC_KEY}";
        let pin = localStorage.getItem("df_pin") || "";
        let currentInputStar = false;
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

        // Render Lists using pure browser DOM elements. This is 100% syntactically bulletproof
        // and avoids all nested quote-escaping or backtick conflicts completely.
        function renderTasks(items) {
            const priorityList = document.getElementById("priority-list");
            const laterList = document.getElementById("later-list");
            priorityList.innerHTML = "";
            laterList.innerHTML = "";

            let hasPriority = false;

            items.forEach(task => {
                const isCompleted = task.completed;
                
                // Create Card Container (Made border slightly thicker, adjusted padding)
                const card = document.createElement("div");
                card.className = "flex items-center gap-3 p-4 bg-white dark:bg-[#1E1E1E] rounded-2xl border-2 border-gray-100 dark:border-gray-800 shadow-sm min-h-[64px]" + (isCompleted ? " opacity-40 line-through" : "");

                // 1. Check Button (Icon scaled up to text-2xl/3xl)
                const checkBtn = document.createElement("button");
                checkBtn.className = "w-11 h-11 flex items-center justify-center text-primary active:scale-95 transition-transform flex-shrink-0";
                checkBtn.onclick = () => toggleTask(task.id);
                
                const checkIcon = document.createElement("span");
                checkIcon.className = "material-symbols-outlined !text-3xl"; // Larger checkbox icon
                checkIcon.style.fontVariationSettings = isCompleted ? "'FILL' 1" : "'FILL' 0";
                checkIcon.textContent = isCompleted ? "check_circle" : "radio_button_unchecked";
                checkBtn.appendChild(checkIcon);

                // 2. Text Span (Scaled up to text-lg and adjusted weight)
                const textSpan = document.createElement("span");
                textSpan.className = "flex-grow text-lg leading-tight font-semibold overflow-hidden truncate px-1";
                textSpan.textContent = task.text;

                // 3. Star Button
                const starBtn = document.createElement("button");
                starBtn.className = "w-11 h-11 flex items-center justify-center flex-shrink-0 " + (task.priority ? "text-yellow-500" : "text-gray-300 dark:text-gray-600") + " active:scale-95 transition-transform";
                starBtn.onclick = () => toggleStar(task.id);

                const starIcon = document.createElement("span");
                starIcon.className = "material-symbols-outlined !text-3xl"; // Larger star icon
                starIcon.style.fontVariationSettings = task.priority ? "'FILL' 1" : "'FILL' 0";
                starIcon.textContent = "star";
                starBtn.appendChild(starIcon);

                // 4. Delete Button
                const deleteBtn = document.createElement("button");
                deleteBtn.className = "w-11 h-11 flex items-center justify-center flex-shrink-0 text-gray-400 hover:text-red-500 active:scale-95 transition-transform";
                deleteBtn.onclick = () => deleteTask(task.id);

                const deleteIcon = document.createElement("span");
                deleteIcon.className = "material-symbols-outlined !text-2xl"; // Larger delete icon
                deleteIcon.textContent = "close";
                deleteBtn.appendChild(deleteIcon);

                // Assemble Card
                card.appendChild(checkBtn);
                card.appendChild(textSpan);
                card.appendChild(starBtn);
                card.appendChild(deleteBtn);

                // Append to correct list
                if (task.priority && !isCompleted) {
                    priorityList.appendChild(card);
                    hasPriority = true;
                } else {
                    laterList.appendChild(card);
                }
            });

            document.getElementById("priority-section").classList.toggle("hidden", !hasPriority);
        }

        async function loadDashboard() {
            const data = await api("/api/tasks");
            if (data) {
                renderTasks(data.tasks);
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

        // Theme Toggle Logic (Saves preference to local storage)
        document.getElementById("theme-toggle").addEventListener("click", () => {
            haptic();
            const isDark = document.documentElement.classList.toggle("dark");
            localStorage.setItem("df_theme", isDark ? "dark" : "light");
        });

        // Logout/Lock action
        document.getElementById("logout-btn").addEventListener("click", () => {
            haptic();
            localStorage.removeItem("df_pin");
            pin = "";
            showView("auth-view");
            closeSettings();
        });
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
          priority: !!priority,
          completed: false,
          completedAt: null
        };
        tasks.unshift(newTask);

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
                body: alertMessage,
                badge: activeTasksCount
              }),
              options: {
                ttl: 60
              }
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