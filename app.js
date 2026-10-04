(() => {
    "use strict";

    const root = document.documentElement;
    const themeToggle = document.querySelector(".theme-toggle");
    const themeOrder = ["dark", "light", "purple", "red"];

    function readStorage(key, fallback = "") {
        try {
            return localStorage.getItem(key) ?? fallback;
        } catch {
            return fallback;
        }
    }

    function writeStorage(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch {
            return false;
        }
    }

    function readJSON(key, fallback) {
        try {
            const value = readStorage(key);
            return value ? JSON.parse(value) : fallback;
        } catch {
            return fallback;
        }
    }

    const savedTheme = readStorage("wooclap-theme");
    if (themeOrder.includes(savedTheme)) {
        root.dataset.theme = savedTheme;
    }

    function syncThemeToggle() {
        const currentTheme = root.dataset.theme;
        const currentIndex = themeOrder.indexOf(currentTheme);
        const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
        const labels = { dark: "Light", light: "Purple", purple: "Red", red: "Dark" };
        const icons = { dark: "☼", light: "✦", purple: "◐", red: "◈" };
        const themeNames = { dark: "dark green", light: "light green", purple: "purple", red: "red and black" };

        themeToggle.setAttribute("aria-pressed", String(currentTheme === "purple"));
        themeToggle.setAttribute("aria-label", `Switch to ${themeNames[nextTheme]} theme`);
        themeToggle.querySelector(".theme-label").textContent = labels[currentTheme];
        themeToggle.querySelector(".theme-icon").textContent = icons[currentTheme];

        const themeColors = { dark: "#10130f", light: "#edf3e8", purple: "#120f18", red: "#110d0e" };
        const themeColor = themeColors[currentTheme] || themeColors.dark;
        document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor);
    }

    syncThemeToggle();
    themeToggle.addEventListener("click", () => {
        const currentIndex = themeOrder.indexOf(root.dataset.theme);
        const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
        root.dataset.theme = nextTheme;
        writeStorage("wooclap-theme", nextTheme);
        syncThemeToggle();
    });

    let progressFrame = 0;
    function updateReadingProgress() {
        if (progressFrame) return;

        progressFrame = requestAnimationFrame(() => {
            progressFrame = 0;
            const scrollableHeight = root.scrollHeight - window.innerHeight;
            const progress = scrollableHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollableHeight)) : 0;
            root.style.setProperty("--page-progress", progress.toFixed(4));
        });
    }

    window.addEventListener("scroll", updateReadingProgress, { passive: true });
    window.addEventListener("resize", updateReadingProgress, { passive: true });
    updateReadingProgress();

    const sectionLinks = [...document.querySelectorAll('.main-nav a[href^="#"]')];
    const observedSections = sectionLinks
        .map(link => ({ link, section: document.querySelector(link.getAttribute("href")) }))
        .filter(item => item.section);

    if ("IntersectionObserver" in window && observedSections.length) {
        const sectionObserver = new IntersectionObserver(entries => {
            const activeEntry = entries
                .filter(entry => entry.isIntersecting)
                .sort((first, second) => Math.abs(first.boundingClientRect.top - window.innerHeight * 0.3) - Math.abs(second.boundingClientRect.top - window.innerHeight * 0.3))[0];
            if (!activeEntry) return;

            observedSections.forEach(({ link, section }) => {
                if (section === activeEntry.target) link.setAttribute("aria-current", "location");
                else link.removeAttribute("aria-current");
            });
        }, { rootMargin: "-20% 0px -62% 0px", threshold: [0, 0.25, 0.5] });

        observedSections.forEach(({ section }) => sectionObserver.observe(section));
    }

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (finePointer.matches && !reducedMotion.matches) {
        document.querySelectorAll(".hero-visual, .feature-card, .price-card").forEach(surface => {
            let frameId = 0;
            let pointerX = 0;
            let pointerY = 0;
            const maxTilt = surface.matches(".hero-visual") ? 4 : 6;

            function resetTilt() {
                if (frameId) cancelAnimationFrame(frameId);
                frameId = 0;
                surface.classList.remove("is-tilting");
                surface.style.setProperty("--tilt-x", "0deg");
                surface.style.setProperty("--tilt-y", "0deg");
                surface.style.setProperty("--pointer-x", "50%");
                surface.style.setProperty("--pointer-y", "50%");
            }

            surface.addEventListener("pointermove", event => {
                pointerX = event.clientX;
                pointerY = event.clientY;
                if (frameId) return;

                frameId = requestAnimationFrame(() => {
                    frameId = 0;
                    const bounds = surface.getBoundingClientRect();
                    if (!bounds.width || !bounds.height) return;

                    const x = Math.max(-0.5, Math.min(0.5, (pointerX - bounds.left) / bounds.width - 0.5));
                    const y = Math.max(-0.5, Math.min(0.5, (pointerY - bounds.top) / bounds.height - 0.5));
                    surface.style.setProperty("--tilt-x", `${(-y * maxTilt * 2).toFixed(2)}deg`);
                    surface.style.setProperty("--tilt-y", `${(x * maxTilt * 2).toFixed(2)}deg`);
                    surface.style.setProperty("--pointer-x", `${((x + 0.5) * 100).toFixed(1)}%`);
                    surface.style.setProperty("--pointer-y", `${((y + 0.5) * 100).toFixed(1)}%`);
                    surface.classList.add("is-tilting");
                });
            }, { passive: true });

            surface.addEventListener("pointerleave", resetTilt, { passive: true });
            surface.addEventListener("pointercancel", resetTilt, { passive: true });
        });
    }

    const sampleAnswers = [...document.querySelectorAll(".sample-answer")];
    const sampleFeedback = document.querySelector("#sample-feedback");
    const sampleScore = document.querySelector("#sample-score");
    const sampleReset = document.querySelector("#sample-reset");
    const savedSampleStats = readJSON("wooclap-sample-stats", { correct: 0, attempts: 0 });
    const sampleStats = {
        correct: Number.isFinite(savedSampleStats.correct) ? savedSampleStats.correct : 0,
        attempts: Number.isFinite(savedSampleStats.attempts) ? savedSampleStats.attempts : 0
    };
    let sampleAnswered = false;

    function renderSampleScore() {
        sampleScore.textContent = `${sampleStats.correct} / ${sampleStats.attempts}`;
    }

    sampleAnswers.forEach(answer => {
        answer.addEventListener("click", () => {
            if (sampleAnswered) return;

            sampleAnswered = true;
            const isCorrect = answer.dataset.correct === "true";
            sampleStats.attempts += 1;
            if (isCorrect) sampleStats.correct += 1;

            sampleAnswers.forEach(option => {
                option.disabled = true;
                const listItem = option.closest("li");
                if (option.dataset.correct === "true") listItem.classList.add("is-correct");
                if (option === answer && !isCorrect) listItem.classList.add("is-wrong");
            });

            sampleFeedback.textContent = isCorrect
                ? "Correct. Mitochondria produce most of the cell's usable energy."
                : "Not quite. Mitochondria produce most of the cell's usable energy.";
            sampleFeedback.className = `sample-feedback ${isCorrect ? "is-correct" : "is-wrong"}`;
            sampleReset.hidden = false;
            writeStorage("wooclap-sample-stats", JSON.stringify(sampleStats));
            renderSampleScore();
        });
    });

    renderSampleScore();
    sampleReset.addEventListener("click", () => {
        sampleAnswered = false;
        sampleAnswers.forEach(answer => {
            answer.disabled = false;
            answer.closest("li").classList.remove("is-correct", "is-wrong");
        });
        sampleFeedback.textContent = "Choose an answer to check your understanding.";
        sampleFeedback.className = "sample-feedback";
        sampleReset.hidden = true;
    });

    const studyDialog = document.querySelector("#study-studio");
    const studyForm = document.querySelector("#study-form");
    const topicInput = document.querySelector("#study-topic");
    const materialInput = document.querySelector("#study-material");
    const languageInput = document.querySelector("#study-language");
    const difficultyInput = document.querySelector("#study-difficulty");
    const studyOutput = document.querySelector("#study-output");
    const buildLabel = document.querySelector("#build-label");
    const modeButtons = [...document.querySelectorAll(".mode-button")];
    const modeSwitch = document.querySelector(".mode-switch");
    const closeStudyButton = document.querySelector(".studio-close");
    const openStudyLinks = [...document.querySelectorAll("[data-open-study]")];
    const localHosts = new Set(["localhost", "127.0.0.1"]);
    const generateEndpoint = localHosts.has(window.location.hostname) && window.location.port !== "3000"
        ? `${window.location.protocol}//${window.location.hostname}:3000/api/generate`
        : "/api/generate";
    let activeMode = "quiz";
    let quizState = null;
    let flashcardState = null;
    let lastOpener = null;
    let activeBuildController = null;
    let buildRunId = 0;
    let localQuizState = null;
    let localQuizTimer = null;
    let localCardState = { index: 0, flipped: false };
    let currentStudioView = "local-quiz";
    let refreshLocalNotebooks = () => {};

    function cancelBuild() {
        activeBuildController?.abort();
        activeBuildController = null;
        buildRunId += 1;
        studyForm.querySelector(".studio-build").disabled = false;
        studyForm.querySelector('[type="reset"]').disabled = false;
        modeButtons.forEach(button => { button.disabled = false; });
        buildLabel.textContent = `Build ${activeMode === "flashcards" ? "flashcards" : activeMode}`;
    }

    topicInput.value = readStorage("wooclap-study-topic");
    materialInput.value = readStorage("wooclap-study-material");
    const savedLanguage = readStorage("wooclap-study-language", "English");
    languageInput.value = [...languageInput.options].some(option => option.value === savedLanguage) ? savedLanguage : "English";
    const savedDifficulty = readStorage("wooclap-study-difficulty", "easy");
    difficultyInput.value = ["easy", "medium", "hard"].includes(savedDifficulty) ? savedDifficulty : "easy";

    function makeElement(tagName, className, text) {
        const element = document.createElement(tagName);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    function makeButton(label, className, onClick) {
        const button = makeElement("button", className, label);
        button.type = "button";
        button.addEventListener("click", onClick);
        return button;
    }

    // ---------- Local question-bank study platform ----------
    const localQuestionBank = Array.isArray(window.WOOPCLAP_QUESTION_BANK)
        ? window.WOOPCLAP_QUESTION_BANK
        : [];
    const localSubject = document.querySelector("#local-subject");
    const localTopic = document.querySelector("#local-topic");
    const localDifficulty = document.querySelector("#local-difficulty");
    const localTimerChoice = document.querySelector("#local-timer");
    const localCountChoice = document.querySelector("#local-count");
    const localQuizContainer = document.querySelector("#local-quiz-container");
    const localQuizStatus = document.querySelector("#local-quiz-status");
    const localResumeButton = document.querySelector("#local-resume-quiz");
    const localStudioTabs = [...document.querySelectorAll("[data-studio-view]")];
    const localStudioPanels = [...document.querySelectorAll("[data-studio-panel]")];
    const localStorageKeys = {
        active: "wooclap-local-quiz-active",
        stats: "wooclap-local-quiz-stats",
        mistakes: "wooclap-local-mistakes",
        bookmarks: "wooclap-local-bookmarks",
        streak: "wooclap-local-streak",
        cards: "wooclap-local-cards",
        mastered: "wooclap-local-card-mastered",
        notes: "wooclap-local-notes",
        notesLibrary: "wooclap-local-notes-library",
        selectedNotebook: "wooclap-local-notebook",
        cardIndex: "wooclap-local-card-index",
        lastResult: "wooclap-local-last-result",
        settings: "wooclap-local-settings",
        subscription: "wooclap-subscription",
        clock: "wooclap-clock-settings",
        planner: "wooclap-study-planner",
        goals: "wooclap-study-goals",
        exams: "wooclap-study-exams",
        reminders: "wooclap-study-reminders",
        focusSessions: "wooclap-focus-sessions",
        materialBookmarks: "wooclap-material-bookmarks",
        revision: "wooclap-revision-cards",
        studyTime: "wooclap-study-time-log",
        roomSettings: "wooclap-room-settings"
    };
    const planOrder = ["free", "premium", "premium-plus", "premium-pro", "premium-pro-max"];
    const planNames = {
        free: "Free",
        premium: "Premium",
        "premium-plus": "Premium Plus",
        "premium-pro": "Premium Pro",
        "premium-pro-max": "Premium Pro Max"
    };
    const planLevels = Object.fromEntries(planOrder.map((name, index) => [name, index]));
    const viewRequirements = {
        "premium-dashboard": "premium",
        planner: "premium-plus"
    };

    function activePlan() {
        const subscription = readJSON(localStorageKeys.subscription, { plan: "free", status: "free" });
        return planOrder.includes(subscription.plan) ? subscription.plan : "free";
    }

    function hasPlan(requiredPlan) {
        return planLevels[activePlan()] >= planLevels[requiredPlan];
    }

    function setStudioView(viewName) {
        currentStudioView = viewName;
        const requirement = viewRequirements[viewName];
        const locked = requirement && !hasPlan(requirement);
        localStudioTabs.forEach(tab => {
            const selected = tab.dataset.studioView === viewName;
            tab.classList.toggle("is-active", selected);
            tab.setAttribute("aria-selected", String(selected));
            tab.tabIndex = selected ? 0 : -1;
        });
        localStudioPanels.forEach(panel => {
            panel.hidden = locked || panel.dataset.studioPanel !== viewName;
        });
        const lockScreen = document.querySelector("#premium-lock-screen");
        lockScreen.hidden = !locked;
        if (locked) {
            const planName = planNames[requirement];
            document.querySelector("#premium-lock-title").textContent = `${planName} feature`;
            document.querySelector("#premium-lock-description").textContent =
                `${viewName === "planner" ? "The weekly planner, exam countdowns, and study reminders" : "The detailed study dashboard, mastery analytics, and performance reports"} are included with ${planName}. Your free quizzes, materials, notes, clock, and basic progress remain available. You can preview demo access from Plans; no payment is processed.`;
        }
        if (viewName === "mistakes") renderMistakeBook();
        if (viewName === "progress") renderProgressDashboard();
        if (viewName === "flashcards") renderLocalFlashcard();
        if (viewName === "tools") {
            renderBookmarks();
            renderQuestionSearch();
        }
        if (viewName === "materials") renderStudyMaterials();
        if (viewName === "study-room") {
            renderStudyRoomClock();
            updateTodayStudyTime();
        }
        if (viewName === "premium-dashboard" && !locked) renderPremiumDashboard();
        if (viewName === "planner" && !locked) renderStudyPlanner();
        if (viewName === "plans") renderSubscriptionPlans();
    }

    document.querySelector("#show-plans-from-lock").addEventListener("click", () => setStudioView("plans"));

    function localQuestionsFor(subject, topic, difficulty = "all") {
        return localQuestionBank.filter(question =>
            (!subject || question.subject === subject) &&
            (!topic || topic === "all" || question.topic === topic) &&
            (difficulty === "all" || question.difficulty === difficulty)
        );
    }

    localStudioTabs.forEach((tab, index) => {
        tab.addEventListener("click", () => setStudioView(tab.dataset.studioView));
        tab.addEventListener("keydown", event => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            event.preventDefault();
            const direction = event.key === "ArrowRight" ? 1 : -1;
            const nextTab = localStudioTabs[(index + direction + localStudioTabs.length) % localStudioTabs.length];
            nextTab.focus();
            setStudioView(nextTab.dataset.studioView);
        });
    });

    function updateLocalTopicOptions() {
        const subject = localSubject.value;
        const saved = readJSON(localStorageKeys.settings, {});
        const topics = [...new Set(localQuestionBank
            .filter(question => question.subject === subject)
            .map(question => question.topic))].sort();
        localTopic.replaceChildren();
        localTopic.append(new Option("All topics", "all"));
        topics.forEach(topic => localTopic.append(new Option(topic, topic)));
        if ((saved.topic === "all" || topics.includes(saved.topic)) && saved.subject === subject) localTopic.value = saved.topic;
        updateLocalQuestionAvailability();
    }

    function saveLocalSettings() {
        writeStorage(localStorageKeys.settings, JSON.stringify({
            subject: localSubject.value,
            topic: localTopic.value,
            difficulty: localDifficulty.value,
            timer: localTimerChoice.value,
            count: localCountChoice.value
        }));
        updateLocalQuestionAvailability();
    }

    function updateLocalQuestionAvailability() {
        const matches = localQuestionsFor(localSubject.value, localTopic.value, localDifficulty.value);
        const status = document.querySelector("#local-question-availability");
        status.textContent = matches.length
            ? `${matches.length} local question${matches.length === 1 ? "" : "s"} available for this selection.`
            : "No questions match this selection. Choose another difficulty or topic.";
        [...localCountChoice.options].forEach(option => {
            option.disabled = option.value !== "all" && Number(option.value) > matches.length;
        });
        if (localCountChoice.value !== "all" && Number(localCountChoice.value) > matches.length) {
            localCountChoice.value = "all";
            const saved = readJSON(localStorageKeys.settings, {});
            saved.count = "all";
            writeStorage(localStorageKeys.settings, JSON.stringify(saved));
        }
        document.querySelector("#local-start-quiz").disabled = matches.length === 0;
    }

    function initializeLocalPlatform() {
        const subjects = [...new Set(localQuestionBank.map(question => question.subject))].sort();
        subjects.forEach(subject => localSubject.append(new Option(subject, subject)));
        const saved = readJSON(localStorageKeys.settings, {});
        if (subjects.includes(saved.subject)) localSubject.value = saved.subject;
        localDifficulty.value = ["all", "Easy", "Medium", "Hard"].includes(saved.difficulty) ? saved.difficulty : "all";
        localTimerChoice.value = ["0", "300", "600", "900", "1800"].includes(String(saved.timer)) ? String(saved.timer) : "600";
        localCountChoice.value = ["5", "10", "20", "all"].includes(String(saved.count)) ? String(saved.count) : "10";
        updateLocalTopicOptions();
        localSubject.addEventListener("change", () => {
            updateLocalTopicOptions();
            saveLocalSettings();
        });
        [localTopic, localDifficulty, localTimerChoice, localCountChoice].forEach(select =>
            select.addEventListener("change", saveLocalSettings));
        document.querySelector("#local-start-quiz").addEventListener("click", startLocalQuiz);
        localResumeButton.addEventListener("click", resumeLocalQuiz);
        document.querySelector("#practice-mistakes").addEventListener("click", startMistakePractice);
        document.querySelector("#local-card-previous").addEventListener("click", () => moveLocalCard(-1));
        document.querySelector("#local-card-next").addEventListener("click", () => moveLocalCard(1));
        document.querySelector("#local-card-flip").addEventListener("click", () => {
            localCardState.flipped = !localCardState.flipped;
            renderLocalFlashcard();
        });
        document.querySelector("#local-flashcard").addEventListener("click", () => {
            localCardState.flipped = !localCardState.flipped;
            renderLocalFlashcard();
        });
        document.querySelector("#local-card-master").addEventListener("click", markLocalCardMastered);
        document.querySelector("#local-card-form").addEventListener("submit", addLocalFlashcard);
        document.querySelector("#flashcard-deck").addEventListener("change", () => {
            localCardState.index = 0;
            localCardState.flipped = false;
            renderLocalFlashcard();
        });
        document.querySelector("#question-search").addEventListener("input", renderQuestionSearch);
        document.querySelector("#calculator-form").addEventListener("submit", calculateExpression);
        initializeLocalNotebooks();
        document.querySelector("#reset-study-progress").addEventListener("click", resetLocalProgress);
        restoreActiveQuiz();
        updateLocalQuestionAvailability();
    }

    function recordStudyDay() {
        const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const today = dateKey(new Date());
        const streak = readJSON(localStorageKeys.streak, { lastStudyDate: "", days: 0 });
        if (streak.lastStudyDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayKey = dateKey(yesterday);
            streak.days = streak.lastStudyDate === yesterdayKey ? (Number(streak.days) || 0) + 1 : 1;
            streak.lastStudyDate = today;
            return writeStorage(localStorageKeys.streak, JSON.stringify(streak));
        }
        return true;
    }

    function startLocalQuiz() {
        if (!canStartFreeQuiz()) return;
        if (localQuizState && !localQuizState.submitted &&
            !window.confirm("Start a new quiz? Your current answers are saved, but starting a new quiz will replace them. Continue?")) return;
        const available = localQuestionsFor(localSubject.value, localTopic.value, localDifficulty.value);
        if (!available.length) {
            localQuizStatus.textContent = "There are no questions for this selection yet.";
            return;
        }
        const requestedCount = localCountChoice.value === "all" ? available.length : Number(localCountChoice.value);
        const selected = shuffled(available).slice(0, Math.min(requestedCount, available.length));
        const timeLimit = Number(localTimerChoice.value);
        localQuizState = {
            questionIds: selected.map(question => question.id),
            answers: selected.map(() => null),
            index: 0,
            subject: localSubject.value,
            topic: localTopic.value,
            difficulty: localDifficulty.value,
            startedAt: Date.now(),
            timeLimit,
            deadline: timeLimit ? Date.now() + timeLimit * 1000 : null,
            submitted: false,
            isMistakePractice: false
        };
        recordStudyDay();
        localQuizStatus.textContent = "";
        localQuizContainer.hidden = false;
        persistActiveQuiz();
        localResumeButton.hidden = true;
        setStudioView("local-quiz");
        renderLocalQuiz();
        startLocalQuizTimer();
    }

    function startMistakePractice() {
        if (!canStartFreeQuiz()) return;
        if (localQuizState && !localQuizState.submitted &&
            !window.confirm("Start mistake practice? Your current answers are saved, but starting practice will replace them. Continue?")) return;
        const savedMistakes = readJSON(localStorageKeys.mistakes, []);
        const mistakeIds = (Array.isArray(savedMistakes) ? savedMistakes : []).map(mistake => mistake.id);
        const questions = shuffled(mistakeIds
            .map(id => localQuestionBank.find(question => question.id === id))
            .filter(Boolean));
        if (!questions.length) {
            document.querySelector("#mistake-list").replaceChildren(makeElement("p", "study-hint", "Your Mistake Book is empty. Answer a local quiz incorrectly to add a question."));
            return;
        }

        const timeLimit = Number(localTimerChoice.value);
        localQuizState = {
            questionIds: questions.map(question => question.id),
            answers: questions.map(() => null),
            index: 0,
            subject: "Mistake Book",
            topic: "Previously missed questions",
            difficulty: "all",
            startedAt: Date.now(),
            timeLimit,
            deadline: timeLimit ? Date.now() + timeLimit * 1000 : null,
            submitted: false,
            isMistakePractice: true
        };
        recordStudyDay();
        localQuizStatus.textContent = "";
        localQuizContainer.hidden = false;
        persistActiveQuiz();
        localResumeButton.hidden = true;
        setStudioView("local-quiz");
        renderLocalQuiz();
        startLocalQuizTimer();
    }

    function canStartFreeQuiz() {
        if (hasPlan("premium")) return true;
        const stats = readJSON(localStorageKeys.stats, {});
        const history = Array.isArray(stats.quizHistory) ? stats.quizHistory : [];
        const completedToday = history.filter(quiz =>
            quiz.completedAt && localDayKey(new Date(quiz.completedAt)) === localDayKey()
        ).length;
        if (completedToday < 10) return true;
        showPlanGate("premium", "Unlimited daily quizzes");
        localQuizStatus.textContent = "The Free plan includes 10 completed quizzes per day. Your saved progress is unchanged.";
        return false;
    }

    function initializeLocalNotebooks() {
        const notebookSelect = document.querySelector("#notes-notebook");
        const notesInput = document.querySelector("#local-notes");
        const notebooks = readJSON(localStorageKeys.notesLibrary, null);
        const validLibrary = notebooks && typeof notebooks === "object" && !Array.isArray(notebooks);
        const library = validLibrary
            ? notebooks
            : { "My Notes": readStorage(localStorageKeys.notes) };
        const needsDefaultNotebook = !Object.prototype.hasOwnProperty.call(library, "My Notes");
        if (!Object.prototype.hasOwnProperty.call(library, "My Notes")) library["My Notes"] = "";
        if (!validLibrary || needsDefaultNotebook) {
            writeStorage(localStorageKeys.notesLibrary, JSON.stringify(library));
        }
        function renderNotebooks(selected = readStorage(localStorageKeys.selectedNotebook)) {
            const savedLibrary = readJSON(localStorageKeys.notesLibrary, { "My Notes": "" });
            const names = hasPlan("premium") ? Object.keys(savedLibrary) : ["My Notes"];
            notebookSelect.replaceChildren(...names.map(name => new Option(name, name)));
            const current = names.includes(selected) ? selected : names[0];
            notebookSelect.value = current;
            notesInput.value = savedLibrary[current] || "";
            notesInput.maxLength = hasPlan("premium") ? 100000 : 20000;
            writeStorage(localStorageKeys.selectedNotebook, current);
        }
        refreshLocalNotebooks = renderNotebooks;
        notebookSelect.addEventListener("change", () => renderNotebooks(notebookSelect.value));
        notesInput.addEventListener("input", () => {
            const savedLibrary = readJSON(localStorageKeys.notesLibrary, { "My Notes": "" });
            const current = notebookSelect.value;
            savedLibrary[current] = notesInput.value;
            const saved = writeStorage(localStorageKeys.notesLibrary, JSON.stringify(savedLibrary)) &&
                writeStorage(localStorageKeys.notes, notesInput.value);
            document.querySelector("#local-notes-status").textContent = saved
                ? "Notes saved automatically in this browser."
                : "Browser storage is full or unavailable; copy your notes before closing this page.";
        });
        document.querySelector("#create-notebook").addEventListener("click", () => {
            if (!hasPlan("premium")) {
                showPlanGate("premium", "Unlimited personal notebooks");
                return;
            }
            const titleInput = document.querySelector("#new-notebook-title");
            const title = titleInput.value.trim();
            if (!title) {
                document.querySelector("#local-notes-status").textContent = "Enter a title for the new notebook.";
                titleInput.focus();
                return;
            }
            const savedLibrary = readJSON(localStorageKeys.notesLibrary, { "My Notes": "" });
            if (Object.prototype.hasOwnProperty.call(savedLibrary, title)) {
                document.querySelector("#local-notes-status").textContent = "A notebook with that title already exists.";
                return;
            }
            savedLibrary[title] = "";
            if (!writeStorage(localStorageKeys.notesLibrary, JSON.stringify(savedLibrary))) {
                document.querySelector("#local-notes-status").textContent = "Could not create a notebook; browser storage may be full.";
                return;
            }
            titleInput.value = "";
            renderNotebooks(title);
            document.querySelector("#local-notes-status").textContent = "New notebook created in this browser.";
        });
        renderNotebooks();
    }

    function persistActiveQuiz() {
        if (localQuizState && !localQuizState.submitted) {
            const saved = writeStorage(localStorageKeys.active, JSON.stringify(localQuizState));
            localResumeButton.hidden = !localQuizContainer.hidden;
            if (!saved) localQuizStatus.textContent = "Browser storage is unavailable; this quiz may not be recoverable after closing the page.";
            return saved;
        } else {
            const cleared = writeStorage(localStorageKeys.active, "");
            localResumeButton.hidden = true;
            return cleared;
        }
    }

    function restoreActiveQuiz() {
        const saved = readJSON(localStorageKeys.active, null);
        if (!saved) {
            restoreLastLocalResult();
            return;
        }
        if (!Array.isArray(saved.questionIds) || !Array.isArray(saved.answers) ||
            saved.questionIds.length !== saved.answers.length) {
            restoreLastLocalResult();
            return;
        }
        const knownIds = new Set(localQuestionBank.map(question => question.id));
        if (!saved.questionIds.every(id => knownIds.has(id))) {
            writeStorage(localStorageKeys.active, "");
            localQuizStatus.textContent = "A saved quiz used questions that are no longer in the question bank. Start a new quiz to continue.";
            restoreLastLocalResult();
            return;
        }
        localQuizState = saved;
        localResumeButton.hidden = false;
        localQuizStatus.textContent = "A quiz in progress is saved on this device.";
    }

    function resumeLocalQuiz() {
        if (!localQuizState) restoreActiveQuiz();
        if (!localQuizState) return;
        setStudioView("local-quiz");
        localQuizContainer.hidden = false;
        localResumeButton.hidden = true;
        renderLocalQuiz();
        startLocalQuizTimer();
    }

    function startLocalQuizTimer() {
        if (localQuizTimer) window.clearInterval(localQuizTimer);
        if (!localQuizState?.deadline) return;
        localQuizTimer = window.setInterval(updateLocalTimer, 250);
        updateLocalTimer();
    }

    function updateLocalTimer() {
        const state = localQuizState;
        if (!state || state.submitted || !state.deadline) return;
        const remaining = Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000));
        const timer = document.querySelector("#local-quiz-timer");
        if (timer) {
            timer.textContent = `Time left ${formatDuration(remaining)}`;
            timer.classList.toggle("is-warning", remaining <= 60);
        }
        const alert = document.querySelector("#local-quiz-timer-warning");
        if (alert) alert.textContent = remaining <= 60 && remaining > 0 ? "One minute or less remaining." : "";
        if (remaining === 0) submitLocalQuiz(true);
    }

    function formatDuration(totalSeconds) {
        const seconds = Math.max(0, Math.floor(totalSeconds));
        const minutes = Math.floor(seconds / 60);
        return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    }

    function renderLocalQuiz() {
        const state = localQuizState;
        if (!state || state.submitted) return;
        const questions = state.questionIds.map(id => localQuestionBank.find(question => question.id === id));
        if (!questions.length || !questions[state.index]) return;
        const question = questions[state.index];
        localQuizContainer.replaceChildren();
        const header = makeElement("div", "quiz-run-top");
        header.append(
            makeElement("span", "", `${state.isMistakePractice ? "Mistake practice" : `${state.subject} · ${state.topic}`} · Question ${state.index + 1}/${questions.length}`),
            makeElement("span", state.deadline ? "local-quiz-timer" : "", state.deadline ? "" : "No timer")
        );
        if (state.deadline) header.lastElementChild.id = "local-quiz-timer";
        const progress = makeElement("div", "quiz-run-progress");
        progress.setAttribute("role", "progressbar");
        progress.setAttribute("aria-valuemin", "0");
        progress.setAttribute("aria-valuemax", String(questions.length));
        progress.setAttribute("aria-valuenow", String(state.index + 1));
        const fill = makeElement("span");
        fill.style.width = `${((state.index + 1) / questions.length) * 100}%`;
        progress.append(fill);
        const prompt = makeElement("h4", "quiz-prompt", question.question);
        const meta = makeElement("p", "study-hint local-question-meta", `${question.subject} · ${question.topic} · ${question.difficulty}`);
        const options = makeElement("div", "quiz-options");
        const savedAnswer = state.answers[state.index];
        question.options.forEach((text, optionIndex) => {
            const option = makeButton(text, `quiz-option${savedAnswer === optionIndex ? " is-selected" : ""}`, () => {
                state.answers[state.index] = optionIndex;
                persistActiveQuiz();
                renderLocalQuiz();
            });
            option.setAttribute("aria-pressed", String(savedAnswer === optionIndex));
            options.append(option);
        });
        const feedback = makeElement("p", "study-hint", savedAnswer === null ? "Choose an answer. You can change it before submitting." : `Selected answer: ${question.options[savedAnswer]}`);
        const timerWarning = makeElement("p", "local-timer-warning");
        timerWarning.id = "local-quiz-timer-warning";
        const bookmarkButton = makeButton(
            isQuestionBookmarked(question.id) ? "★ Bookmarked" : "☆ Bookmark question",
            "flashcard-action is-muted",
            () => {
                toggleQuestionBookmark(question.id);
                renderLocalQuiz();
            }
        );
        const navigation = makeElement("div", "local-quiz-navigation");
        const previous = makeButton("← Previous", "study-secondary", () => {
            state.index -= 1;
            persistActiveQuiz();
            renderLocalQuiz();
        });
        previous.disabled = state.index === 0;
        const next = makeButton(state.index === questions.length - 1 ? "Last question" : "Next →", "study-secondary", () => {
            if (state.index < questions.length - 1) {
                state.index += 1;
                persistActiveQuiz();
                renderLocalQuiz();
            }
        });
        next.disabled = state.index === questions.length - 1;
        const submit = makeButton("Submit quiz", "quiz-next", () => {
            const unanswered = state.answers.filter(answer => answer === null).length;
            if (unanswered && !window.confirm(`You have ${unanswered} unanswered question${unanswered === 1 ? "" : "s"}. Submit anyway?`)) return;
            submitLocalQuiz(false);
        });
        navigation.append(previous, next, submit);
        if (state.isExamSimulation) {
            navigation.append(makeButton("Exit full screen", "study-secondary", () => {
                fullscreenIntent = "";
                if (document.fullscreenElement === studyDialog) document.exitFullscreen();
                studyDialog.classList.remove("quiz-focus-mode");
            }));
        }
        localQuizContainer.append(header, progress, prompt, meta, options, feedback, timerWarning, bookmarkButton, navigation);
        updateLocalTimer();
    }

    function submitLocalQuiz(fromTimer) {
        const state = localQuizState;
        if (!state || state.submitted) return;
        state.submitted = true;
        if (localQuizTimer) window.clearInterval(localQuizTimer);
        localQuizTimer = null;
        const questions = state.questionIds.map(id => localQuestionBank.find(question => question.id === id));
        const correct = questions.reduce((total, question, index) => total + Number(state.answers[index] !== null && question.answer === question.options[state.answers[index]]), 0);
        const attempted = state.answers.filter(answer => answer !== null).length;
        const wrong = attempted - correct;
        const unanswered = questions.length - attempted;
        const now = Date.now();
        const timeUsed = state.timeLimit
            ? Math.min(state.timeLimit, Math.max(0, Math.round((Math.min(now, state.deadline) - state.startedAt) / 1000)))
            : Math.max(0, Math.round((now - state.startedAt) / 1000));
        const result = {
            subject: state.subject,
            topic: state.topic,
            total: questions.length,
            attempted,
            correct,
            wrong,
            unanswered,
            percentage: questions.length ? Math.round(correct / questions.length * 100) : 0,
            timeUsed,
            completedAt: now,
            timedOut: fromTimer,
            questions: questions.map((question, index) => ({
                id: question.id,
                question: question.question,
                options: question.options,
                answer: question.answer,
                selected: state.answers[index] === null ? null : question.options[state.answers[index]],
                explanation: question.explanation,
                subject: question.subject,
                topic: question.topic,
                difficulty: question.difficulty
            }))
        };
        const stats = readJSON(localStorageKeys.stats, { quizzes: 0, attempted: 0, correct: 0, wrong: 0, subjects: {}, recent: [] });
        stats.quizzes = (Number(stats.quizzes) || 0) + 1;
        stats.attempted = (Number(stats.attempted) || 0) + attempted;
        stats.correct = (Number(stats.correct) || 0) + correct;
        stats.wrong = (Number(stats.wrong) || 0) + wrong;
        stats.subjects ||= {};
        if (!Array.isArray(stats.history)) stats.history = [];
        if (!Array.isArray(stats.quizHistory)) stats.quizHistory = [];
        result.questions.forEach(question => stats.history.push({
            id: question.id,
            subject: question.subject,
            topic: question.topic,
            correct: question.selected === question.answer,
            at: now
        }));
        stats.quizHistory.unshift({
            subject: result.subject,
            topic: result.topic,
            total: result.total,
            correct,
            wrong,
            unanswered,
            percentage: result.percentage,
            timeUsed,
            completedAt: now,
            isExamSimulation: Boolean(state.isExamSimulation)
        });
        stats.quizHistory = stats.quizHistory.slice(0, 1000);
        if (!state.isMistakePractice) {
            stats.subjects[state.subject] ||= { attempted: 0, correct: 0, wrong: 0 };
            stats.subjects[state.subject].attempted += attempted;
            stats.subjects[state.subject].correct += correct;
            stats.subjects[state.subject].wrong += wrong;
        }
        stats.recent = [result, ...(Array.isArray(stats.recent) ? stats.recent : [])].slice(0, 10);
        const statsSaved = writeStorage(localStorageKeys.stats, JSON.stringify(stats));
        const mistakesSaved = updateMistakes(result.questions);
        const streakSaved = recordStudyDay();
        const timeSaved = recordStudySeconds(timeUsed, "quiz");
        const resultSaved = writeStorage(localStorageKeys.lastResult, JSON.stringify(result));
        localQuizState = null;
        const activeCleared = persistActiveQuiz();
        localQuizContainer.hidden = false;
        localResumeButton.hidden = true;
        renderLocalQuizResults(result, statsSaved && mistakesSaved && streakSaved && timeSaved && resultSaved && activeCleared);
    }

    function updateMistakes(questions) {
        const savedMistakes = readJSON(localStorageKeys.mistakes, []);
        const mistakes = Array.isArray(savedMistakes) ? savedMistakes : [];
        const byId = new Map(mistakes.map(mistake => [mistake.id, mistake]));
        const savedRevision = readJSON(localStorageKeys.revision, []);
        const revision = Array.isArray(savedRevision) ? savedRevision : [];
        const revisionsById = new Map(revision.map(item => [item.id, item]));
        const intervals = [1, 3, 7, 14, 30];
        questions.forEach(question => {
            if (question.selected === question.answer) {
                const scheduled = revisionsById.get(question.id);
                if (scheduled) {
                    const intervalIndex = Math.min(intervals.length - 1, (Number(scheduled.intervalIndex) || 0) + 1);
                    revisionsById.set(question.id, {
                        ...scheduled,
                        intervalIndex,
                        intervalDays: intervals[intervalIndex],
                        dueAt: Date.now() + intervals[intervalIndex] * 86_400_000,
                        lastResult: "correct"
                    });
                }
                const previousMistake = byId.get(question.id);
                if (previousMistake) {
                    previousMistake.lastReviewedCorrectAt = Date.now();
                    previousMistake.correctReviews = (Number(previousMistake.correctReviews) || 0) + 1;
                }
                return;
            }
            if (question.selected === null) return;
            const current = byId.get(question.id) || { id: question.id, incorrectCount: 0 };
            current.incorrectCount += 1;
            current.lastWrongAt = Date.now();
            byId.set(question.id, current);
            revisionsById.set(question.id, {
                id: question.id,
                intervalIndex: 0,
                intervalDays: 1,
                dueAt: Date.now() + 86_400_000,
                lastResult: "wrong"
            });
        });
        const mistakesSaved = writeStorage(localStorageKeys.mistakes, JSON.stringify([...byId.values()]));
        const revisionsSaved = writeStorage(localStorageKeys.revision, JSON.stringify([...revisionsById.values()]));
        return mistakesSaved && revisionsSaved;
    }

    function restoreLastLocalResult() {
        const result = readJSON(localStorageKeys.lastResult, null);
        if (!result || !Array.isArray(result.questions)) return;
        localQuizContainer.hidden = false;
        renderLocalQuizResults(result);
    }

    function renderLocalQuizResults(result, resultsSaved = true) {
        localQuizContainer.replaceChildren();
        const title = makeElement("h3", "output-title", result.timedOut ? "Time is up — quiz submitted" : "Quiz results");
        const summary = makeElement("div", "progress-metrics result-metrics");
        [
            ["Score", `${result.correct}/${result.total}`],
            ["Percentage", `${result.percentage}%`],
            ["Correct", result.correct],
            ["Wrong", result.wrong],
            ["Unanswered", result.unanswered],
            ["Time used", formatDuration(result.timeUsed)]
        ].forEach(([label, value]) => {
            const metric = makeElement("div", "progress-metric");
            metric.append(makeElement("span", "", label), makeElement("strong", "", String(value)));
            summary.append(metric);
        });
        const review = makeElement("details", "answer-review");
        review.open = result.wrong > 0 || result.unanswered > 0;
        review.append(makeElement("summary", "", "Review mistakes and unanswered questions"));
        const list = makeElement("ol", "answer-review-list");
        result.questions.forEach((question, index) => {
            if (question.selected === question.answer) return;
            const item = makeElement("li");
            item.append(
                makeElement("strong", "", `${index + 1}. ${question.question}`),
                makeElement("p", "", `Your answer: ${question.selected || "Unanswered"} · Correct: ${question.answer}`),
                makeElement("p", "", question.explanation)
            );
            list.append(item);
        });
        if (!list.children.length) list.append(makeElement("li", "", "Perfect score — no mistakes to review."));
        review.append(list);
        const actions = makeElement("div", "study-actions");
        actions.append(
            makeButton("Review mistakes", "quiz-next", () => { review.open = true; review.scrollIntoView({ block: "nearest" }); }),
            makeButton("Retry quiz", "quiz-next", () => retryLocalQuiz(result)),
            makeButton("Back to setup", "study-secondary", () => {
                localQuizContainer.hidden = true;
                localQuizStatus.textContent = "Your results are saved. Choose a selection to start another quiz.";
            })
        );
        localQuizContainer.append(title, makeElement("p", "study-hint", `${result.subject} · ${result.topic}${result.timedOut ? " · Automatically submitted when time expired." : ""}`), summary, review, actions);
        localQuizStatus.textContent = resultsSaved
            ? "Quiz complete. Your results and mistakes are saved in this browser."
            : "Quiz complete, but browser storage failed. These results may not be retained after you leave.";
    }

    function retryLocalQuiz(result) {
        if (result.subject !== "Mistake Book") {
            localSubject.value = result.subject;
            updateLocalTopicOptions();
            if ([...localTopic.options].some(option => option.value === result.topic)) localTopic.value = result.topic;
            saveLocalSettings();
        } else {
            startMistakePractice();
            return;
        }
        startLocalQuiz();
    }

    function renderMistakeBook() {
        const container = document.querySelector("#mistake-list");
        const mistakes = readJSON(localStorageKeys.mistakes, []);
        container.replaceChildren();
        const cards = mistakes.map(mistake => ({
            mistake,
            question: localQuestionBank.find(question => question.id === mistake.id)
        })).filter(entry => entry.question);
        if (!cards.length) {
            container.append(makeElement("p", "study-hint", "No missed questions yet. Your incorrect answers will appear here."));
            return;
        }
        cards.sort((a, b) => (b.mistake.lastWrongAt || 0) - (a.mistake.lastWrongAt || 0)).forEach(({ mistake, question }) => {
            const card = makeElement("article", "local-list-card");
            card.append(
                makeElement("strong", "", question.question),
                makeElement("p", "study-hint", `${question.subject} · ${question.topic} · ${question.difficulty} · Missed ${mistake.incorrectCount} time${mistake.incorrectCount === 1 ? "" : "s"}`),
                makeElement("p", "local-answer-note", `Answer: ${question.answer}. ${question.explanation}`)
            );
            const bookmark = makeButton(isQuestionBookmarked(question.id) ? "Remove bookmark" : "Bookmark", "study-secondary", () => {
                toggleQuestionBookmark(question.id);
                renderMistakeBook();
            });
            card.append(bookmark);
            container.append(card);
        });
    }

    function renderProgressDashboard() {
        const stats = readJSON(localStorageKeys.stats, { quizzes: 0, attempted: 0, correct: 0, wrong: 0, subjects: {}, recent: [] });
        const accuracy = stats.attempted ? Math.round(stats.correct / stats.attempted * 100) : 0;
        const streak = readJSON(localStorageKeys.streak, { days: 0 });
        document.querySelector("#study-streak").textContent = `🔥 ${Number(streak.days) || 0} day streak`;
        const metrics = document.querySelector("#progress-metrics");
        metrics.replaceChildren();
        [
            ["Quizzes completed", Number(stats.quizzes) || 0],
            ["Questions attempted", Number(stats.attempted) || 0],
            ["Overall accuracy", `${accuracy}%`],
            ["Correct / wrong", `${Number(stats.correct) || 0} / ${Number(stats.wrong) || 0}`]
        ].forEach(([label, value]) => {
            const metric = makeElement("div", "progress-metric");
            metric.append(makeElement("span", "", label), makeElement("strong", "", String(value)));
            metrics.append(metric);
        });
        const subjects = Object.entries(stats.subjects || {}).filter(([, value]) => value.attempted > 0)
            .sort((first, second) => second[1].correct / second[1].attempted - first[1].correct / first[1].attempted);
        const subjectContainer = document.querySelector("#subject-progress");
        subjectContainer.replaceChildren();
        if (!subjects.length) subjectContainer.append(makeElement("p", "study-hint", "Complete a local quiz to see subject accuracy."));
        subjects.forEach(([subject, value], index) => {
            const percentage = Math.round(value.correct / value.attempted * 100);
            const row = makeElement("div", "subject-progress-row");
            const label = makeElement("div", "subject-progress-label");
            label.append(makeElement("strong", "", subject), makeElement("span", "", `${percentage}% · ${value.correct}/${value.attempted}`));
            const bar = makeElement("div", "quiz-run-progress");
            bar.setAttribute("role", "progressbar");
            bar.setAttribute("aria-valuemin", "0");
            bar.setAttribute("aria-valuemax", "100");
            bar.setAttribute("aria-valuenow", String(percentage));
            const fill = makeElement("span");
            fill.style.width = `${percentage}%`;
            bar.append(fill);
            row.append(label, bar);
            if (subjects.length === 1) {
                row.append(makeElement("small", "study-hint", "Strongest and weakest subject"));
            } else if (index === 0 || index === subjects.length - 1) {
                row.append(makeElement("small", "study-hint", index === 0 ? "Strongest subject" : "Weakest subject"));
            }
            subjectContainer.append(row);
        });
        const recent = document.querySelector("#recent-quizzes");
        recent.replaceChildren();
        const results = Array.isArray(stats.recent) ? stats.recent : [];
        if (!results.length) recent.append(makeElement("p", "study-hint", "Your completed quiz scores will appear here."));
        results.forEach(result => {
            const row = makeElement("div", "recent-quiz-row");
            row.append(
                makeElement("strong", "", `${result.subject} · ${result.topic}`),
                makeElement("span", "", `${result.correct}/${result.total} · ${result.percentage}%`)
            );
            recent.append(row);
        });
    }

    function getLocalFlashcards() {
        const selectedDeck = document.querySelector("#flashcard-deck")?.value || "all";
        const builtIn = localQuestionBank.map(question => ({
            id: question.id,
            front: question.question,
            back: `${question.answer}\n\n${question.explanation}`,
            subject: question.subject,
            topic: question.topic,
            deck: "Question bank"
        }));
        const custom = readJSON(localStorageKeys.cards, []);
        const customCards = (Array.isArray(custom) ? custom : []).map(card => ({ ...card, deck: card.deck || "My deck" }));
        const cards = [...builtIn, ...customCards];
        return selectedDeck === "all" ? cards : cards.filter(card => card.deck === selectedDeck);
    }

    function renderFlashcardDeckOptions() {
        const select = document.querySelector("#flashcard-deck");
        const selected = select.value || "all";
        const custom = readJSON(localStorageKeys.cards, []);
        const decks = [...new Set((Array.isArray(custom) ? custom : []).map(card => card.deck || "My deck"))].sort();
        select.replaceChildren(
            new Option("All cards", "all"),
            new Option("Question bank", "Question bank"),
            new Option("My deck", "My deck"),
            ...decks.filter(deck => deck !== "My deck").map(deck => new Option(deck, deck))
        );
        if ([...select.options].some(option => option.value === selected)) select.value = selected;
        else select.value = "all";
    }

    function renderLocalFlashcard() {
        renderFlashcardDeckOptions();
        const cards = getLocalFlashcards();
        const face = document.querySelector("#local-flashcard");
        if (!cards.length) {
            face.textContent = "No flashcards yet.";
            return;
        }
        localCardState.index = ((localCardState.index % cards.length) + cards.length) % cards.length;
        const card = cards[localCardState.index];
        face.textContent = localCardState.flipped ? card.back : card.front;
        face.setAttribute("aria-label", localCardState.flipped ? "Show flashcard question" : "Flip flashcard to reveal the answer");
        document.querySelector("#local-card-count").replaceChildren(
            makeElement("span", "", `Card ${localCardState.index + 1} of ${cards.length}${card.subject ? ` · ${card.subject} / ${card.topic}` : " · Custom card"}`)
        );
        const savedMastered = readJSON(localStorageKeys.mastered, []);
        const mastered = Array.isArray(savedMastered) ? savedMastered : [];
        document.querySelector("#local-card-master").textContent = mastered.includes(card.id) ? "✓ Mastered" : "Mark mastered";
        writeStorage(localStorageKeys.cardIndex, String(localCardState.index));
    }

    function moveLocalCard(direction) {
        const cards = getLocalFlashcards();
        if (!cards.length) return;
        localCardState.index = (localCardState.index + direction + cards.length) % cards.length;
        localCardState.flipped = false;
        renderLocalFlashcard();
    }

    function markLocalCardMastered() {
        const cards = getLocalFlashcards();
        const card = cards[localCardState.index];
        if (!card) return;
        const savedMastered = readJSON(localStorageKeys.mastered, []);
        const mastered = Array.isArray(savedMastered) ? savedMastered : [];
        const updated = mastered.includes(card.id) ? mastered.filter(id => id !== card.id) : [...mastered, card.id];
        const saved = writeStorage(localStorageKeys.mastered, JSON.stringify(updated));
        document.querySelector("#local-card-status").textContent = saved
            ? "Flashcard progress saved."
            : "Could not save flashcard progress. Check available browser storage.";
        renderLocalFlashcard();
    }

    function addLocalFlashcard(event) {
        event.preventDefault();
        const front = document.querySelector("#local-card-front");
        const back = document.querySelector("#local-card-back");
        const deckInput = document.querySelector("#local-card-deck");
        const deck = deckInput.value.trim() || "My deck";
        const savedCards = readJSON(localStorageKeys.cards, []);
        const cards = Array.isArray(savedCards) ? savedCards : [];
        if (deck !== "My deck" && !hasPlan("premium-pro")) {
            deckInput.value = "My deck";
            showPlanGate("premium-pro", "Custom flashcard decks");
            return;
        }
        if (!hasPlan("premium") && cards.length >= 20) {
            showPlanGate("premium", "More than 20 custom flashcards");
            return;
        }
        cards.push({ id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, front: front.value.trim(), back: back.value.trim(), deck });
        if (!writeStorage(localStorageKeys.cards, JSON.stringify(cards))) {
            document.querySelector("#local-card-status").textContent = "Could not save the flashcard. Check available browser storage.";
            return;
        }
        event.currentTarget.reset();
        deckInput.value = deck;
        document.querySelector("#local-card-status").textContent = "Flashcard saved in this browser.";
        renderFlashcardDeckOptions();
        document.querySelector("#flashcard-deck").value = deck;
        localCardState.index = getLocalFlashcards().length - 1;
        localCardState.flipped = false;
        renderLocalFlashcard();
    }

    function isQuestionBookmarked(id) {
        const bookmarks = readJSON(localStorageKeys.bookmarks, []);
        return Array.isArray(bookmarks) && bookmarks.includes(id);
    }

    function toggleQuestionBookmark(id) {
        const savedBookmarks = readJSON(localStorageKeys.bookmarks, []);
        const bookmarks = Array.isArray(savedBookmarks) ? savedBookmarks : [];
        if (!bookmarks.includes(id) && bookmarks.length >= 20 && !hasPlan("premium")) {
            showPlanGate("premium", "Unlimited question bookmarks");
            return false;
        }
        const updated = bookmarks.includes(id) ? bookmarks.filter(savedId => savedId !== id) : [...bookmarks, id];
        const saved = writeStorage(localStorageKeys.bookmarks, JSON.stringify(updated));
        if (!saved) document.querySelector("#subscription-status").textContent = "Could not save this bookmark; browser storage may be full.";
        return saved;
    }

    function renderBookmarks() {
        const container = document.querySelector("#bookmark-list");
        container.replaceChildren();
        const savedBookmarks = readJSON(localStorageKeys.bookmarks, []);
        const questions = (Array.isArray(savedBookmarks) ? savedBookmarks : [])
            .map(id => localQuestionBank.find(question => question.id === id))
            .filter(Boolean);
        if (!questions.length) {
            container.append(makeElement("p", "study-hint", "Bookmark a question during a quiz or from search to keep it here."));
            return;
        }
        questions.forEach(question => {
            const card = makeElement("article", "local-list-card");
            card.append(makeElement("strong", "", question.question), makeElement("p", "study-hint", `${question.subject} · ${question.topic} · ${question.difficulty}`));
            card.append(makeButton("Remove bookmark", "study-secondary", () => {
                toggleQuestionBookmark(question.id);
                renderBookmarks();
            }));
            container.append(card);
        });
    }

    function renderQuestionSearch() {
        const input = document.querySelector("#question-search");
        const container = document.querySelector("#question-search-results");
        if (!input || !container) return;
        const query = input.value.trim().toLocaleLowerCase();
        container.replaceChildren();
        if (!query) {
            container.append(makeElement("p", "study-hint", `${localQuestionBank.length} questions across ${new Set(localQuestionBank.map(question => question.subject)).size} subjects.`));
            return;
        }
        const matches = localQuestionBank.filter(question =>
            [question.subject, question.topic, question.difficulty, question.question, question.answer, question.explanation]
                .some(value => value.toLocaleLowerCase().includes(query))
        ).slice(0, 30);
        if (!matches.length) container.append(makeElement("p", "study-hint", "No matching questions or topics."));
        matches.forEach(question => {
            const card = makeElement("article", "local-list-card");
            card.append(
                makeElement("strong", "", question.question),
                makeElement("p", "study-hint", `${question.subject} · ${question.topic} · ${question.difficulty}`)
            );
            const actions = makeElement("div", "local-inline-actions");
            actions.append(
                makeButton(isQuestionBookmarked(question.id) ? "★ Saved" : "☆ Bookmark", "study-secondary", () => {
                    toggleQuestionBookmark(question.id);
                    renderQuestionSearch();
                    renderBookmarks();
                }),
                makeButton("Quiz this topic", "study-secondary", () => {
                    localSubject.value = question.subject;
                    updateLocalTopicOptions();
                    localTopic.value = question.topic;
                    localDifficulty.value = "all";
                    saveLocalSettings();
                    setStudioView("local-quiz");
                    localQuizContainer.hidden = true;
                })
            );
            card.append(actions);
            container.append(card);
        });
    }

    function parseCalculatorExpression(source) {
        const tokens = source.replace(/\s+/g, "").match(/\d*\.?\d+|[()+\-*/]/g) || [];
        if (tokens.join("") !== source.replace(/\s+/g, "") || !tokens.length) throw new Error("Enter a valid arithmetic expression.");
        let index = 0;
        function primary() {
            const token = tokens[index++];
            if (token === "(") {
                const value = expression();
                if (tokens[index++] !== ")") throw new Error("Check your parentheses.");
                return value;
            }
            if (token === "+") return primary();
            if (token === "-") return -primary();
            if (!token || !/^\d*\.?\d+$/.test(token)) throw new Error("Enter a valid arithmetic expression.");
            return Number(token);
        }
        function term() {
            let value = primary();
            while (tokens[index] === "*" || tokens[index] === "/") {
                const operator = tokens[index++];
                const next = primary();
                if (operator === "/" && next === 0) throw new Error("Division by zero is undefined.");
                value = operator === "*" ? value * next : value / next;
            }
            return value;
        }
        function expression() {
            let value = term();
            while (tokens[index] === "+" || tokens[index] === "-") {
                const operator = tokens[index++];
                const next = term();
                value = operator === "+" ? value + next : value - next;
            }
            return value;
        }
        const result = expression();
        if (index !== tokens.length || !Number.isFinite(result)) throw new Error("Enter a valid arithmetic expression.");
        return result;
    }

    function calculateExpression(event) {
        event.preventDefault();
        const output = document.querySelector("#calculator-result");
        try {
            const result = parseCalculatorExpression(document.querySelector("#calculator-expression").value);
            output.textContent = `Result: ${Number(result.toPrecision(10))}`;
        } catch (error) {
            output.textContent = error.message;
        }
    }

    function resetLocalProgress() {
        if (!window.confirm("Reset quiz history, scores, mistakes, bookmarks, study time, notes, flashcards, streak, and revision progress? Your selected plan and clock settings will remain. This cannot be undone.")) return;
        [
            localStorageKeys.active, localStorageKeys.stats, localStorageKeys.mistakes,
            localStorageKeys.bookmarks, localStorageKeys.streak, localStorageKeys.cards,
            localStorageKeys.mastered, localStorageKeys.notes, localStorageKeys.cardIndex,
            localStorageKeys.notesLibrary, localStorageKeys.selectedNotebook,
            localStorageKeys.lastResult, localStorageKeys.revision, localStorageKeys.studyTime,
            localStorageKeys.focusSessions, localStorageKeys.materialBookmarks,
            "wooclap-reminder-last-date"
        ].forEach(key => writeStorage(key, ""));
        if (localQuizTimer) window.clearInterval(localQuizTimer);
        localQuizTimer = null;
        localQuizState = null;
        localQuizContainer.replaceChildren();
        localQuizContainer.hidden = true;
        localQuizStatus.textContent = "Local study progress has been reset.";
        localResumeButton.hidden = true;
        document.querySelector("#local-notes").value = "";
        document.querySelector("#notes-notebook").replaceChildren(new Option("My Notes", "My Notes"));
        document.querySelector("#notes-notebook").value = "My Notes";
        writeStorage(localStorageKeys.notesLibrary, JSON.stringify({ "My Notes": "" }));
        writeStorage(localStorageKeys.selectedNotebook, "My Notes");
        document.querySelector("#local-notes-status").textContent = "Notes cleared.";
        document.querySelector("#local-card-status").textContent = "";
        document.querySelector("#local-card-form").reset();
        document.querySelector("#reminder-toggle").setAttribute("aria-pressed", "false");
        document.querySelector("#reminder-toggle").textContent = "Reminders off";
        document.querySelector("#reminder-time").disabled = true;
        writeStorage(localStorageKeys.reminders, JSON.stringify({ enabled: false, time: "18:00" }));
        renderMistakeBook();
        renderProgressDashboard();
        renderLocalFlashcard();
        renderBookmarks();
        renderQuestionSearch();
    }

    const studyMaterials = Array.isArray(window.WOOPCLAP_STUDY_MATERIALS)
        ? window.WOOPCLAP_STUDY_MATERIALS
        : [];
    const academicCurriculum = Array.isArray(window.WOOPCLAP_ACADEMIC_CURRICULUM)
        ? window.WOOPCLAP_ACADEMIC_CURRICULUM
        : [];
    const academicBankAliases = {
        "DLD": {
            binary: "Binary Arithmetic", number: "Binary Arithmetic", complement: "Binary Arithmetic", signed: "Binary Arithmetic", bcd: "Binary Arithmetic",
            boolean: "Boolean Algebra", logic: "Boolean Algebra", gate: "Boolean Algebra", truth: "Boolean Algebra", minterm: "Boolean Algebra", sop: "Boolean Algebra", pos: "Boolean Algebra", karnaugh: "Boolean Algebra",
            sequential: "Sequential Circuits", flip: "Sequential Circuits", latch: "Sequential Circuits", counter: "Sequential Circuits", register: "Sequential Circuits", state: "Sequential Circuits", timing: "Sequential Circuits"
        },
        "Introduction to Database Systems": {
            normal: "Normalization", functional: "Normalization", "1nf": "Normalization", "2nf": "Normalization", "3nf": "Normalization",
            "first normal form": "Normalization", "second normal form": "Normalization", "third normal form": "Normalization", "boyce codd": "Normalization", bcnf: "Normalization",
            sql: "SQL Queries", select: "SQL Queries", insert: "SQL Queries", update: "SQL Queries", delete: "SQL Queries",
            key: "Relational Model", relational: "Relational Model", integrity: "Relational Model", entity: "Relational Model", database: "Relational Model", data: "Relational Model", architecture: "Relational Model", transaction: "Relational Model", acid: "Relational Model", index: "Relational Model", recovery: "Relational Model", security: "Relational Model"
        },
        "Data Structures": {
            "algorithm basics": "Time complexity",
            "big o, omega, and theta": "Time complexity", "big o notation": "Time complexity", "space complexity": "Time complexity",
            "one-dimensional arrays": "Arrays", "multidimensional arrays": "Arrays", "searching basics": "Linear search",
            "singly linked lists": "Singly Linked Lists", "linked list operations": "Singly Linked Lists", "stack applications": "Stacks",
            "circular queues": "Queues", "priority queues": "Heaps", "binary trees": "Tree traversals", "binary search trees": "Binary Search Trees",
            "heap operations": "Heaps", "balanced trees": "AVL Trees", "hashing": "Collision handling", "hash tables": "Collision handling",
            "graph representations": "Breadth-First Search", "complexity comparison": "Time complexity",
            "algorithm analysis": "Time complexity"
        }
    };
    const subscriptionPlans = [
        { id: "free", name: "Free", price: "Rs 0", period: "always",
            features: ["10 completed local quizzes per day", "Basic progress, mistakes and streak", "Flashcards, one notebook, search and clock", "3 AI study requests per day", "Community chat: text, images and voice notes"] },
        { id: "premium", name: "Premium", price: "Rs 300", period: "month",
            features: ["Unlimited local quizzes and advanced mistake practice", "Multiple notebooks, unlimited bookmarks and flashcards", "Pomodoro, custom goals and detailed study analytics", "20 AI study requests per day", "PREMIUM badge next to your name in chat"] },
        { id: "premium-plus", name: "Premium Plus", price: "Rs 550", period: "month", recommended: true,
            features: ["Editable weekly planner and multiple exam countdowns", "Mixed-topic quizzes and timed exam simulation", "Spaced-repetition and weak-topic practice", "40 AI study requests per day", "Full-screen focus mode and PLUS chat badge"] },
        { id: "premium-pro", name: "Premium Pro", price: "Rs 1250", period: "month",
            features: ["Actual-data topic mastery and performance trends", "Custom decks, quiz history and detailed analytics", "Import/export notes and long-term reports", "80 AI study requests per day", "PRO chat badge"] },
        { id: "premium-pro-max", name: "Premium Pro Max", price: "Rs 1500", period: "month",
            features: ["Study roadmap and revision forecast from your results", "Advanced focus and simultaneous study goals", "150 AI study requests per day (highest limit)", "PRO MAX chat badge and priority access to new features"] }
    ];
    const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    let selectedMaterialIndex = 0;
    let roomInterval = null;
    let pomodoroState = { phase: "focus", running: false, deadline: 0, remaining: 25 * 60, focusMinutes: 25 };
    let stopwatchState = { running: false, startedAt: 0, elapsed: 0 };
    let countdownState = { running: false, deadline: 0, initialSeconds: 600, remaining: 600 };
    let ambienceContext = null;
    let ambienceSource = null;
    let ambienceGain = null;
    let ambienceFilter = null;
    let fullscreenIntent = "";
    let roomTrackingMode = "";
    let roomLastTrackedAt = Date.now();
    let roomTrackingRemainder = 0;

    function initializePremiumFeatures() {
        const subjects = [...new Set(localQuestionBank.map(question => question.subject))].sort();
        const plannerSubject = document.querySelector("#planner-subject");
        const customSubject = document.querySelector("#custom-quiz-subject");
        subjects.forEach(subject => {
            plannerSubject.append(new Option(subject, subject));
            customSubject.append(new Option(subject, subject));
            document.querySelector("#extra-goal-subject").append(new Option(subject, subject));
        });
        const savedGoals = readJSON(localStorageKeys.goals, {});
        document.querySelector("#daily-goal-minutes").value = savedGoals.daily || 60;
        document.querySelector("#weekly-goal-minutes").value = savedGoals.weekly || 300;
        document.querySelector("#dashboard-daily-goal").value = savedGoals.daily || 60;
        document.querySelector("#dashboard-weekly-goal").value = savedGoals.weekly || 300;
        const savedClock = readJSON(localStorageKeys.clock, {});
        const savedRoom = readJSON(localStorageKeys.roomSettings, {});
        const savedFocus = ["25", "45", "50"].includes(String(savedRoom.focusMinutes)) ? String(savedRoom.focusMinutes) : "25";
        document.querySelector("#pomodoro-focus").value = savedFocus;
        pomodoroState.focusMinutes = Number(savedFocus);
        pomodoroState.remaining = pomodoroState.focusMinutes * 60;
        const savedCountdown = Math.max(1, Math.min(240, Number(savedRoom.countdownMinutes) || 10));
        document.querySelector("#countdown-minutes").value = savedCountdown;
        countdownState = { running: false, deadline: 0, initialSeconds: savedCountdown * 60, remaining: savedCountdown * 60 };
        document.querySelector("#ambience-type").value = ["off", "rain", "brown"].includes(savedRoom.ambience) ? savedRoom.ambience : "off";
        document.querySelector("#ambience-volume").value = Math.max(0, Math.min(35, Number(savedRoom.ambienceVolume) || 12));
        document.querySelector("#clock-enabled").checked = savedClock.enabled !== false;
        document.querySelector("#clock-numbers").checked = savedClock.numbers !== false;
        document.querySelector("#clock-size").value = [150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310, 320].includes(Number(savedClock.size)) ? savedClock.size : 240;
        document.querySelector("#clock-markers").value = ["all", "quarters", "none"].includes(savedClock.markers) ? savedClock.markers : "all";
        document.querySelector("#clock-format").value = savedClock.format === "24" ? "24" : "12";
        document.querySelector("#clock-theme").value = ["classic", "paper", "ocean", "violet"].includes(savedClock.theme) ? savedClock.theme : "classic";
        const reminders = readJSON(localStorageKeys.reminders, { enabled: false, time: "18:00" });
        const reminderButton = document.querySelector("#reminder-toggle");
        reminderButton.setAttribute("aria-pressed", String(Boolean(reminders.enabled)));
        reminderButton.textContent = reminders.enabled ? "Reminders on" : "Reminders off";
        document.querySelector("#reminder-time").value = reminders.time || "18:00";
        document.querySelector("#reminder-time").disabled = !reminders.enabled;
        bindClockSettings();
        bindStudyRoomControls();
        bindPlannerControls();
        bindMaterialsControls();
        bindPremiumDashboardControls();
        renderStudyMaterials();
        renderSubscriptionPlans();
        renderStudyPlanner();
        renderStudyRoomClock();
        renderPremiumDashboard();
        renderCustomTopicChoices();
        updateDigitalClock();
        window.setInterval(updateDigitalClock, 1000);
        window.setInterval(checkStudyReminder, 60_000);
    }

    function clockSettings() {
        return {
            enabled: document.querySelector("#clock-enabled").checked,
            numbers: document.querySelector("#clock-numbers").checked,
            size: Number(document.querySelector("#clock-size").value),
            markers: document.querySelector("#clock-markers").value,
            format: document.querySelector("#clock-format").value,
            theme: document.querySelector("#clock-theme").value
        };
    }

    function bindClockSettings() {
        const controls = ["#clock-enabled", "#clock-numbers", "#clock-size", "#clock-markers", "#clock-format", "#clock-theme"];
        controls.forEach(selector => document.querySelector(selector).addEventListener("change", () => {
            if (selector === "#clock-theme" && !hasPlan("premium")) {
                document.querySelector(selector).value = "classic";
                showPlanGate("premium", "Custom clock appearances");
                return;
            }
            const saved = writeStorage(localStorageKeys.clock, JSON.stringify(clockSettings()));
            if (!saved) document.querySelector("#room-status").textContent = "Clock settings could not be saved in this browser.";
            renderStudyRoomClock();
        }));
        document.querySelector("#clock-size").addEventListener("input", () => {
            document.querySelector("#clock-size-label").textContent = `${document.querySelector("#clock-size").value} px`;
            renderStudyRoomClock();
        });
    }

    function renderStudyRoomClock() {
        const settings = clockSettings();
        const wrapper = document.querySelector("#analog-clock-wrap");
        const digital = document.querySelector("#digital-clock");
        wrapper.hidden = !settings.enabled;
        digital.hidden = !settings.enabled;
        document.querySelector("#clock-size-label").textContent = `${settings.size} px`;
        const svg = document.querySelector("#analog-clock");
        svg.replaceChildren();
        svg.setAttribute("data-clock-theme", settings.theme);
        svg.style.setProperty("--clock-size", `${settings.size}px`);
        svg.append(svgElement("circle", { cx: 120, cy: 120, r: 112, class: "clock-face-ring" }));
        for (let minute = 0; minute < 60; minute += 1) {
            const major = minute % 15 === 0;
            const visible = settings.markers === "all" || (settings.markers === "quarters" && major);
            if (!visible) continue;
            const angle = minute * Math.PI / 30 - Math.PI / 2;
            const inner = major ? 94 : 101;
            const outer = 108;
            svg.append(svgElement("line", {
                x1: 120 + Math.cos(angle) * inner,
                y1: 120 + Math.sin(angle) * inner,
                x2: 120 + Math.cos(angle) * outer,
                y2: 120 + Math.sin(angle) * outer,
                class: `clock-marker${major ? " is-major" : ""}`,
                "stroke-width": major ? 2.5 : 1
            }));
        }
        if (settings.numbers) {
            for (let hour = 1; hour <= 12; hour += 1) {
                const angle = hour * Math.PI / 6 - Math.PI / 2;
                svg.append(svgElement("text", {
                    x: 120 + Math.cos(angle) * 80,
                    y: 120 + Math.sin(angle) * 80,
                    class: "clock-number"
                }, String(hour)));
            }
        }
        svg.append(
            svgElement("line", { id: "clock-hour-hand", x1: 120, y1: 124, x2: 120, y2: 72, class: "clock-hand-hour" }),
            svgElement("line", { id: "clock-minute-hand", x1: 120, y1: 124, x2: 120, y2: 48, class: "clock-hand-minute" }),
            svgElement("line", { id: "clock-second-hand", x1: 120, y1: 132, x2: 120, y2: 38, class: "clock-hand-second" }),
            svgElement("circle", { cx: 120, cy: 120, r: 5, class: "clock-center" })
        );
        updateDigitalClock();
    }

    function svgElement(tag, attributes, text) {
        const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
        Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, String(value)));
        if (text !== undefined) element.textContent = text;
        return element;
    }

    function updateDigitalClock() {
        const now = new Date();
        const digital = document.querySelector("#digital-clock");
        const use24Hour = document.querySelector("#clock-format").value === "24";
        digital.textContent = new Intl.DateTimeFormat(undefined, {
            hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: !use24Hour
        }).format(now);
        const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
        const minute = now.getMinutes() + seconds / 60;
        const hour = now.getHours() % 12 + minute / 60;
        const secondHand = document.querySelector("#clock-second-hand");
        const minuteHand = document.querySelector("#clock-minute-hand");
        const hourHand = document.querySelector("#clock-hour-hand");
        if (secondHand) secondHand.setAttribute("transform", `rotate(${seconds * 6} 120 120)`);
        if (minuteHand) minuteHand.setAttribute("transform", `rotate(${minute * 6} 120 120)`);
        if (hourHand) hourHand.setAttribute("transform", `rotate(${hour * 30} 120 120)`);
    }

    function localDayKey(date = new Date()) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }

    function studyTimeLog() {
        const value = readJSON("wooclap-study-time-log", {});
        return value && typeof value === "object" ? value : {};
    }

    function recordStudySeconds(seconds, source) {
        const amount = Math.max(0, Math.floor(seconds));
        if (!amount) return true;
        const log = studyTimeLog();
        const key = localDayKey();
        log[key] ||= { seconds: 0, sources: {} };
        log[key].seconds += amount;
        log[key].sources[source] = (Number(log[key].sources[source]) || 0) + amount;
        const saved = writeStorage("wooclap-study-time-log", JSON.stringify(log));
        updateTodayStudyTime();
        return saved;
    }

    function sumStudyTime(days = Infinity) {
        const log = studyTimeLog();
        const cutoff = Number.isFinite(days) ? Date.now() - days * 86_400_000 : 0;
        return Object.entries(log).reduce((sum, [date, item]) => {
            const stamp = new Date(`${date}T00:00:00`).getTime();
            return stamp >= cutoff ? sum + (Number(item.seconds) || 0) : sum;
        }, 0);
    }

    function updateTodayStudyTime() {
        const log = studyTimeLog();
        const seconds = Number(log[localDayKey()]?.seconds) || 0;
        document.querySelector("#today-study-time").textContent = `${Math.floor(seconds / 60)} min`;
    }

    function bindStudyRoomControls() {
        document.querySelector("#pomodoro-start").addEventListener("click", togglePomodoro);
        document.querySelector("#pomodoro-reset").addEventListener("click", resetPomodoro);
        document.querySelector("#pomodoro-focus").addEventListener("change", () => {
            if (!hasPlan("premium-plus") && Number(document.querySelector("#pomodoro-focus").value) !== 25) {
                document.querySelector("#pomodoro-focus").value = "25";
                showPlanGate("premium-plus", "Extended focus intervals");
                return;
            }
            pomodoroState.focusMinutes = Number(document.querySelector("#pomodoro-focus").value);
            resetPomodoro();
        });
        document.querySelector("#stopwatch-start").addEventListener("click", toggleStopwatch);
        document.querySelector("#stopwatch-reset").addEventListener("click", resetStopwatch);
        document.querySelector("#countdown-start").addEventListener("click", toggleCountdown);
        document.querySelector("#countdown-reset").addEventListener("click", resetCountdown);
        document.querySelector("#countdown-minutes").addEventListener("change", resetCountdown);
        document.querySelector("#focus-mode-toggle").addEventListener("click", toggleFocusMode);
        document.querySelector("#ambience-type").addEventListener("change", toggleAmbience);
        document.querySelector("#ambience-volume").addEventListener("input", updateAmbienceVolume);
        ["#pomodoro-focus", "#countdown-minutes", "#ambience-type", "#ambience-volume"].forEach(selector =>
            document.querySelector(selector).addEventListener("change", saveRoomSettings));
        document.addEventListener("fullscreenchange", () => {
            const active = document.fullscreenElement === studyDialog;
            studyDialog.classList.toggle("focus-mode", active && fullscreenIntent === "room");
            studyDialog.classList.toggle("quiz-focus-mode", active && fullscreenIntent === "quiz");
            document.querySelector("#focus-mode-toggle").textContent = active && fullscreenIntent === "room" ? "Exit focus mode" : "Enter focus mode";
        });
        updateRoomTimerDisplays();
    }

    function stopRoomTimers() {
        const now = Date.now();
        if (pomodoroState.running) {
            if (pomodoroState.phase === "focus") trackRoomStudyTime(Math.min(now, pomodoroState.deadline));
            else stopRoomTracking();
            pomodoroState.remaining = Math.max(0, Math.ceil((pomodoroState.deadline - now) / 1000));
        } else if (stopwatchState.running) {
            trackRoomStudyTime(now);
            stopwatchState.elapsed += now - stopwatchState.startedAt;
        } else if (countdownState.running) {
            trackRoomStudyTime(Math.min(now, countdownState.deadline));
            countdownState.remaining = Math.max(0, Math.ceil((countdownState.deadline - now) / 1000));
        }
        if (roomInterval) window.clearInterval(roomInterval);
        roomInterval = null;
        pomodoroState.running = false;
        stopwatchState.running = false;
        countdownState.running = false;
        document.querySelector("#pomodoro-start").textContent = "Resume";
        document.querySelector("#stopwatch-start").textContent = "Resume";
        document.querySelector("#countdown-start").textContent = "Resume";
    }

    function startRoomInterval() {
        if (!roomInterval) roomInterval = window.setInterval(tickRoomTimers, 1000);
    }

    function togglePomodoro() {
        if (!hasPlan("premium")) {
            showPlanGate("premium", "Pomodoro focus timer");
            return;
        }
        if (pomodoroState.running) {
            const now = Date.now();
            trackRoomStudyTime(Math.min(now, pomodoroState.deadline));
            pomodoroState.remaining = Math.max(0, Math.ceil((pomodoroState.deadline - now) / 1000));
            pomodoroState.running = false;
            document.querySelector("#pomodoro-start").textContent = "Resume";
            if (!stopwatchState.running && !countdownState.running) {
                window.clearInterval(roomInterval);
                roomInterval = null;
            }
            return;
        }
        if (stopwatchState.running || countdownState.running) stopRoomTimers();
        pomodoroState.running = true;
        pomodoroState.deadline = Date.now() + pomodoroState.remaining * 1000;
        beginRoomStudyTracking("pomodoro");
        document.querySelector("#pomodoro-start").textContent = "Pause";
        startRoomInterval();
    }

    function resetPomodoro() {
        if (pomodoroState.running && pomodoroState.phase === "focus") {
            trackRoomStudyTime(Math.min(Date.now(), pomodoroState.deadline));
        }
        pomodoroState.phase = "focus";
        pomodoroState.focusMinutes = Number(document.querySelector("#pomodoro-focus").value) || 25;
        pomodoroState.remaining = pomodoroState.focusMinutes * 60;
        pomodoroState.running = false;
        if (!stopwatchState.running && !countdownState.running) stopRoomTracking();
        document.querySelector("#pomodoro-start").textContent = "Start focus";
        document.querySelector("#pomodoro-phase").textContent = "Ready for a focus session";
        updateRoomTimerDisplays();
    }

    function toggleStopwatch() {
        if (stopwatchState.running) {
            trackRoomStudyTime(Date.now());
            stopwatchState.elapsed += Date.now() - stopwatchState.startedAt;
            stopwatchState.running = false;
            document.querySelector("#stopwatch-start").textContent = "Resume";
            if (!pomodoroState.running && !countdownState.running) {
                window.clearInterval(roomInterval);
                roomInterval = null;
            }
            return;
        }
        if (pomodoroState.running || countdownState.running) stopRoomTimers();
        stopwatchState.startedAt = Date.now();
        stopwatchState.running = true;
        beginRoomStudyTracking("stopwatch");
        document.querySelector("#stopwatch-start").textContent = "Pause";
        startRoomInterval();
    }

    function resetStopwatch() {
        stopwatchState = { running: false, startedAt: 0, elapsed: 0 };
        if (!pomodoroState.running && !countdownState.running) stopRoomTracking();
        document.querySelector("#stopwatch-start").textContent = "Start";
        if (!pomodoroState.running && !countdownState.running) {
            window.clearInterval(roomInterval);
            roomInterval = null;
        }
        updateRoomTimerDisplays();
    }

    function toggleCountdown() {
        if (countdownState.running) {
            const now = Date.now();
            trackRoomStudyTime(Math.min(now, countdownState.deadline));
            countdownState.remaining = Math.max(0, Math.ceil((countdownState.deadline - now) / 1000));
            countdownState.running = false;
            document.querySelector("#countdown-start").textContent = "Resume";
            if (!pomodoroState.running && !stopwatchState.running) {
                window.clearInterval(roomInterval);
                roomInterval = null;
            }
            return;
        }
        if (pomodoroState.running || stopwatchState.running) stopRoomTimers();
        countdownState.running = true;
        countdownState.deadline = Date.now() + countdownState.remaining * 1000;
        beginRoomStudyTracking("countdown");
        document.querySelector("#countdown-start").textContent = "Pause";
        startRoomInterval();
    }

    function resetCountdown() {
        if (countdownState.running) trackRoomStudyTime(Math.min(Date.now(), countdownState.deadline));
        const minutes = Math.min(240, Math.max(1, Number(document.querySelector("#countdown-minutes").value) || 10));
        document.querySelector("#countdown-minutes").value = minutes;
        countdownState = { running: false, deadline: 0, initialSeconds: minutes * 60, remaining: minutes * 60 };
        saveRoomSettings();
        document.querySelector("#countdown-start").textContent = "Start";
        if (!pomodoroState.running && !stopwatchState.running) {
            window.clearInterval(roomInterval);
            roomInterval = null;
        }
        updateRoomTimerDisplays();
    }

    function tickRoomTimers() {
        const now = Date.now();
        if (pomodoroState.running) {
            if (pomodoroState.phase === "focus") trackRoomStudyTime(Math.min(now, pomodoroState.deadline));
            pomodoroState.remaining = Math.max(0, Math.ceil((pomodoroState.deadline - now) / 1000));
            if (pomodoroState.remaining === 0) {
                if (pomodoroState.phase === "focus") {
                    pomodoroState.phase = "break";
                    pomodoroState.remaining = 5 * 60;
                    pomodoroState.deadline = now + pomodoroState.remaining * 1000;
                    stopRoomTracking();
                    document.querySelector("#pomodoro-phase").textContent = "Focus complete. Take a 5-minute break.";
                    playTimerChime();
                } else {
                    pomodoroState.phase = "focus";
                    pomodoroState.remaining = pomodoroState.focusMinutes * 60;
                    pomodoroState.running = false;
                    document.querySelector("#pomodoro-start").textContent = "Start focus";
                    document.querySelector("#pomodoro-phase").textContent = "Break complete. Ready for another focus session.";
                    playTimerChime();
                }
            }
        }
        if (stopwatchState.running) {
            trackRoomStudyTime(now);
        }
        if (countdownState.running) {
            trackRoomStudyTime(Math.min(now, countdownState.deadline));
            countdownState.remaining = Math.max(0, Math.ceil((countdownState.deadline - now) / 1000));
            if (countdownState.remaining === 0) {
                countdownState.running = false;
                document.querySelector("#countdown-start").textContent = "Start";
                document.querySelector("#room-status").textContent = "Countdown complete.";
                playTimerChime();
            }
        }
        if (!pomodoroState.running && !stopwatchState.running && !countdownState.running) {
            window.clearInterval(roomInterval);
            roomInterval = null;
            stopRoomTracking();
        }
        updateRoomTimerDisplays();
    }

    function updateRoomTimerDisplays() {
        const pomodoroSeconds = pomodoroState.running ? Math.max(0, Math.ceil((pomodoroState.deadline - Date.now()) / 1000)) : pomodoroState.remaining;
        const stopwatchSeconds = Math.floor((stopwatchState.elapsed + (stopwatchState.running ? Date.now() - stopwatchState.startedAt : 0)) / 1000);
        const countdownSeconds = countdownState.running ? Math.max(0, Math.ceil((countdownState.deadline - Date.now()) / 1000)) : countdownState.remaining;
        document.querySelector("#pomodoro-display").textContent = formatDuration(pomodoroSeconds);
        document.querySelector("#stopwatch-display").textContent = formatDuration(stopwatchSeconds);
        document.querySelector("#countdown-display").textContent = formatDuration(countdownSeconds);
    }

    function beginRoomStudyTracking(mode) {
        roomTrackingMode = mode;
        roomLastTrackedAt = Date.now();
        roomTrackingRemainder = 0;
    }

    function trackRoomStudyTime(until) {
        if (!roomTrackingMode) return;
        const boundary = Math.max(roomLastTrackedAt, until);
        const elapsed = boundary - roomLastTrackedAt;
        roomLastTrackedAt = boundary;
        roomTrackingRemainder += elapsed;
        const wholeSeconds = Math.floor(roomTrackingRemainder / 1000);
        if (wholeSeconds > 0) {
            recordStudySeconds(wholeSeconds, roomTrackingMode);
            roomTrackingRemainder -= wholeSeconds * 1000;
        }
    }

    function stopRoomTracking() {
        roomTrackingMode = "";
        roomTrackingRemainder = 0;
        roomLastTrackedAt = Date.now();
    }

    function playTimerChime() {
        try {
            const context = new AudioContext();
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.frequency.value = 660;
            gain.gain.value = 0.08;
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start();
            oscillator.stop(context.currentTime + 0.25);
            oscillator.addEventListener("ended", () => context.close(), { once: true });
        } catch {
            document.querySelector("#room-status").textContent = "Timer finished. This browser could not play the optional chime.";
        }
    }

    async function toggleFocusMode() {
        if (!hasPlan("premium-plus")) {
            showPlanGate("premium-plus", "Full-screen distraction-free focus mode");
            return;
        }
        return enterOrExitFullscreenFocus();
    }

    async function enterOrExitFullscreenFocus() {
        if (studyDialog.classList.contains("focus-mode") && document.fullscreenElement !== studyDialog) {
            studyDialog.classList.remove("focus-mode");
            document.querySelector("#focus-mode-toggle").textContent = "Enter focus mode";
            fullscreenIntent = "";
            return;
        }
        if (document.fullscreenElement === studyDialog) {
            fullscreenIntent = "";
            await document.exitFullscreen();
            return;
        }
        try {
            fullscreenIntent = "room";
            await studyDialog.requestFullscreen();
        } catch {
            fullscreenIntent = "room";
            studyDialog.classList.toggle("focus-mode");
            document.querySelector("#focus-mode-toggle").textContent = studyDialog.classList.contains("focus-mode") ? "Exit focus mode" : "Enter focus mode";
            document.querySelector("#room-status").textContent = "Browser fullscreen permission was unavailable; distraction-free layout is active.";
        }
    }

    async function enableQuizFullscreen() {
        try {
            fullscreenIntent = "quiz";
            await studyDialog.requestFullscreen();
        } catch {
            document.querySelector("#custom-quiz-status").textContent = "The timed exam is ready. Full-screen mode was unavailable; continue in the current window.";
        }
    }

    function saveRoomSettings() {
        writeStorage(localStorageKeys.roomSettings, JSON.stringify({
            focusMinutes: document.querySelector("#pomodoro-focus").value,
            countdownMinutes: document.querySelector("#countdown-minutes").value,
            ambience: document.querySelector("#ambience-type").value,
            ambienceVolume: document.querySelector("#ambience-volume").value
        }));
    }

    function toggleAmbience() {
        const select = document.querySelector("#ambience-type");
        if (!hasPlan("premium")) {
            select.value = "off";
            showPlanGate("premium", "Background ambience");
            return;
        }
        if (select.value === "off") {
            stopAmbience();
            return;
        }
        try {
            stopAmbience();
            ambienceContext = new AudioContext();
            const buffer = ambienceContext.createBuffer(1, ambienceContext.sampleRate * 3, ambienceContext.sampleRate);
            const data = buffer.getChannelData(0);
            let last = 0;
            for (let i = 0; i < data.length; i += 1) {
                const white = Math.random() * 2 - 1;
                last = select.value === "brown" ? (last + 0.02 * white) / 1.02 : (last * 0.72 + white * 0.28);
                data[i] = last * (select.value === "brown" ? 3.5 : 1.8);
            }
            ambienceSource = ambienceContext.createBufferSource();
            ambienceFilter = ambienceContext.createBiquadFilter();
            ambienceGain = ambienceContext.createGain();
            ambienceSource.buffer = buffer;
            ambienceSource.loop = true;
            ambienceFilter.type = "lowpass";
            ambienceFilter.frequency.value = select.value === "rain" ? 1400 : 500;
            ambienceGain.gain.value = Number(document.querySelector("#ambience-volume").value) / 1000;
            ambienceSource.connect(ambienceFilter);
            ambienceFilter.connect(ambienceGain);
            ambienceGain.connect(ambienceContext.destination);
            ambienceSource.start();
            document.querySelector("#room-status").textContent = "Soft ambience is playing. Use the volume slider or select Off to stop it.";
        } catch {
            stopAmbience();
            select.value = "off";
            document.querySelector("#room-status").textContent = "This browser could not start audio. Timer and study-room tools still work.";
        }
    }

    function updateAmbienceVolume() {
        if (ambienceGain) ambienceGain.gain.value = Number(document.querySelector("#ambience-volume").value) / 1000;
    }

    function stopAmbience() {
        if (ambienceSource) ambienceSource.stop();
        if (ambienceContext) ambienceContext.close();
        ambienceSource = null;
        ambienceContext = null;
        ambienceGain = null;
        ambienceFilter = null;
        document.querySelector("#room-status").textContent = "Background ambience is off.";
        saveRoomSettings();
    }

    function showPlanGate(requiredPlan, feature) {
        document.querySelector("#premium-lock-title").textContent = `${planNames[requiredPlan]} feature`;
        document.querySelector("#premium-lock-description").textContent = `${feature} is included with ${planNames[requiredPlan]}. Your free study tools remain available. Upgrade from the Plans tab.`;
        setStudioView("plans");
        document.querySelector("#subscription-status").textContent = `🔒 ${feature} requires ${planNames[requiredPlan]}. Choose a plan below to upgrade.`;
    }

    function renderSubscriptionPlans() {
        const grid = document.querySelector("#subscription-grid");
        if (!grid) return;
        const selectedPlan = activePlan();
        const subscription = readJSON(localStorageKeys.subscription, { plan: "free", status: "free" });
        grid.replaceChildren();
        subscriptionPlans.forEach(plan => {
            const card = makeElement("article", `subscription-card${plan.recommended ? " is-recommended" : ""}${selectedPlan === plan.id ? " is-current" : ""}`);
            if (plan.recommended) card.append(makeElement("span", "premium-tag", "RECOMMENDED"));
            card.append(makeElement("h4", "", plan.name));
            const price = makeElement("p", "subscription-price");
            price.append(document.createTextNode(plan.price), makeElement("span", "", ` / ${plan.period}`));
            card.append(price);
            const list = makeElement("ul");
            plan.features.forEach(feature => list.append(makeElement("li", "", feature)));
            card.append(list);
            card.append(makeButton(
                selectedPlan === plan.id ? "Current plan" : plan.id === "free" ? "Switch to Free" : "Upgrade now",
                "quiz-next",
                () => chooseDemoPlan(plan.id)
            ));
            grid.append(card);
        });
        const status = document.querySelector("#subscription-status");
        refreshLocalNotebooks();
        const notesInput = document.querySelector("#local-notes");
        if (notesInput) notesInput.maxLength = hasPlan("premium") ? 100000 : 20000;
        const notebookButton = document.querySelector("#create-notebook");
        if (notebookButton) notebookButton.textContent = hasPlan("premium") ? "New note" : "New note · Premium";
        status.textContent = subscription.status === "demo"
            ? `${planNames[selectedPlan]} demo access is active.`
            : "Free plan active. Pick a paid plan to upgrade.";
        document.querySelector("#current-plan-badge").textContent = `${planNames[selectedPlan].toUpperCase()}${subscription.status === "demo" ? " · DEMO" : ""}`;
    }

    function chooseDemoPlan(planId) {
        if (window.WoopAuth) { window.WoopAuth.checkout(planId); return; }
        const current = activePlan();
        if (planId === current) return;
        const message = planId === "free"
            ? "Switch back to the Free plan? Your local study history and notes will remain saved."
            : `Enable ${planNames[planId]} demo access in this browser? This is a local preview only. No payment will be processed, and it is not a real subscription.`;
        if (!window.confirm(message)) return;
        const subscription = { plan: planId, status: planId === "free" ? "free" : "demo", changedAt: new Date().toISOString(), provider: "local-demo" };
        if (!writeStorage(localStorageKeys.subscription, JSON.stringify(subscription))) {
            document.querySelector("#subscription-status").textContent = "Could not save demo plan state. Browser storage may be unavailable.";
            return;
        }
        document.querySelector("#subscription-status").textContent = planId === "free"
            ? "Free plan active. No payment action was taken."
            : `${planNames[planId]} demo access is active locally. No payment was processed.`;
        renderSubscriptionPlans();
        renderPremiumDashboard();
    }

    function renderStudyMaterials(query = document.querySelector("#material-search")?.value || "") {
        const topicsNode = document.querySelector("#material-topics");
        const contentNode = document.querySelector("#material-content");
        if (!topicsNode || !contentNode) return;
        const normalized = query.trim().toLocaleLowerCase();
        const items = studyMaterials.filter(item =>
            !normalized || `${item.subject} ${item.topic} ${item.title} ${item.explanation}`.toLocaleLowerCase().includes(normalized)
        );
        topicsNode.replaceChildren();
        items.forEach((item, index) => {
            const button = makeButton("", `material-topic-button${studyMaterials.indexOf(item) === selectedMaterialIndex ? " is-active" : ""}`, () => {
                selectedMaterialIndex = studyMaterials.indexOf(item);
                renderStudyMaterials(query);
            });
            button.append(makeElement("strong", "", item.topic), makeElement("span", "", item.subject));
            topicsNode.append(button);
        });
        if (!items.some(item => studyMaterials.indexOf(item) === selectedMaterialIndex) && items.length) selectedMaterialIndex = studyMaterials.indexOf(items[0]);
        const item = studyMaterials[selectedMaterialIndex];
        contentNode.replaceChildren();
        if (!item || !items.includes(item)) {
            contentNode.append(makeElement("p", "study-hint", "No study material matches this search."));
            return;
        }
        const appendList = (heading, values) => {
            contentNode.append(makeElement("h5", "", heading));
            const list = makeElement("ul");
            values.forEach(value => list.append(makeElement("li", "", value)));
            contentNode.append(list);
        };
        contentNode.append(makeElement("p", "premium-tag", item.subject), makeElement("h4", "", item.title), makeElement("p", "", item.explanation));
        appendList("Key points", item.keyPoints);
        appendList("Examples", item.examples);
        appendList("Important definitions", item.definitions);
        contentNode.append(makeElement("h5", "", "Quick revision"), makeElement("p", "", item.revision));
        const actions = makeElement("div", "material-actions");
        actions.append(
            makeButton("Start quiz", "quiz-next", () => {
                setStudioView("local-quiz");
                localSubject.value = item.subject;
                updateLocalTopicOptions();
                localTopic.value = item.questionTopic;
                localDifficulty.value = "all";
                saveLocalSettings();
                localQuizContainer.hidden = true;
                localSubject.dispatchEvent(new Event("change"));
            }),
            makeButton("Practice questions", "study-secondary", () => {
                localSubject.value = item.subject;
                updateLocalTopicOptions();
                localTopic.value = item.questionTopic;
                localDifficulty.value = "all";
                saveLocalSettings();
                startLocalQuiz();
            }),
            makeButton("Study flashcards", "study-secondary", () => {
                const first = localQuestionBank.findIndex(question => question.subject === item.subject && question.topic === item.questionTopic);
                if (first < 0) {
                    document.querySelector("#room-status").textContent = "No question-bank flashcards are available for this material yet.";
                    return;
                }
                localCardState.index = first;
                localCardState.flipped = false;
                setStudioView("flashcards");
            }),
            makeButton("Add to notes", "study-secondary", () => {
                const notes = document.querySelector("#local-notes");
                const note = `\n\n${item.title}\n${item.explanation}\nKey points:\n${item.keyPoints.map(point => `- ${point}`).join("\n")}\nQuick revision: ${item.revision}`;
                notes.value = `${notes.value}${note}`.trim();
                notes.dispatchEvent(new Event("input"));
                document.querySelector("#local-notes-status").textContent = "Material added to your local notes.";
            }),
            makeButton(isMaterialBookmarked(item.title) ? "★ Bookmarked" : "☆ Bookmark", "study-secondary", () => {
                toggleMaterialBookmark(item.title);
                renderStudyMaterials(query);
            })
        );
        contentNode.append(actions);
    }

    function initializeAcademicEngine() {
        const subjectSelect = document.querySelector("#academic-subject");
        const levelSelect = document.querySelector("#academic-level");
        const topicSelect = document.querySelector("#academic-topic");
        const saved = readJSON("wooclap-academic-engine-state", {});
        academicCurriculum.forEach(course => subjectSelect.append(new Option(course.subject, course.subject)));
        if (academicCurriculum.some(course => course.subject === saved.subject)) subjectSelect.value = saved.subject;
        if (["Mixed", "Basic", "Intermediate", "Advanced", "Hard"].includes(saved.level)) levelSelect.value = saved.level;
        if (["learn", "notes", "mcq", "quiz", "flashcards", "short", "long", "assignment", "practice", "coding", "definitions", "formulas", "revision", "exam", "weak", "mixed"].includes(saved.contentType)) {
            document.querySelector("#academic-content-type").value = saved.contentType;
        }
        if (["English", "Roman English"].includes(saved.language)) document.querySelector("#academic-language").value = saved.language;
        subjectSelect.addEventListener("change", () => updateAcademicTopicOptions());
        levelSelect.addEventListener("change", () => updateAcademicTopicOptions());
        topicSelect.addEventListener("change", renderAcademicRoadmap);
        document.querySelector("#academic-generate").addEventListener("click", renderAcademicActivity);
        updateAcademicTopicOptions(saved.topic);
        if (saved.topic) renderAcademicActivity();
    }

    function updateAcademicTopicOptions(preferredTopic = "") {
        const subject = document.querySelector("#academic-subject").value;
        const level = document.querySelector("#academic-level").value;
        const course = academicCurriculum.find(item => item.subject === subject);
        const options = (course?.topics || []).filter(item =>
            level === "Mixed" || item.level === (level === "Hard" ? "Advanced" : level)
        );
        const topicSelect = document.querySelector("#academic-topic");
        topicSelect.replaceChildren(...options.map(item => new Option(
            `${item.name}${level === "Hard" ? " · hard practice" : ""}`,
            item.name
        )));
        if (options.some(item => item.name === preferredTopic)) topicSelect.value = preferredTopic;
        renderAcademicRoadmap();
    }

    function renderAcademicRoadmap() {
        const container = document.querySelector("#academic-roadmap");
        if (!container) return;
        const subject = document.querySelector("#academic-subject").value;
        const level = document.querySelector("#academic-level").value;
        const course = academicCurriculum.find(item => item.subject === subject);
        const topics = (course?.topics || []).filter(item =>
            level === "Mixed" || item.level === (level === "Hard" ? "Advanced" : level)
        );
        const selected = document.querySelector("#academic-topic").value;
        container.replaceChildren();
        container.append(makeElement("p", "study-hint", `${topics.length} suggested ${level === "Mixed" ? "roadmap" : level} topics. This general roadmap has not been compared with your university syllabus.`));
        const list = makeElement("div", "academic-roadmap-list");
        topics.forEach(item => {
            const available = academicQuestions(subject, item.name).length > 0 ||
                academicMaterials(subject, item.name).length > 0;
            const button = makeButton(
                `${item.name}${available ? "" : " · outline only"}`,
                `academic-topic-chip${item.name === selected ? " is-active" : ""}`,
                () => {
                    document.querySelector("#academic-topic").value = item.name;
                    renderAcademicRoadmap();
                    renderAcademicActivity();
                }
            );
            button.setAttribute("aria-pressed", String(item.name === selected));
            list.append(button);
        });
        container.append(list);
    }

    function academicSubjectCode(subject) {
        if (subject === "Digital Logic Design") return "DLD";
        if (subject === "Introduction to Database Systems") return "DBMS";
        return subject;
    }

    function academicTopicAliases(subject, topic) {
        const normalized = topic.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
        const aliases = academicBankAliases[subject] || {};
        const matchedAlias = Object.entries(aliases).find(([phrase]) =>
            normalized.includes(phrase.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim())
        );
        const result = new Set([topic]);
        if (matchedAlias) result.add(matchedAlias[1]);
        const course = academicCurriculum.find(item => item.subject === subject);
        const item = course?.topics.find(entry => entry.name === topic);
        if (item) {
            const materials = studyMaterials.filter(material => material.subject === academicSubjectCode(subject) &&
                (material.topic.toLocaleLowerCase() === normalized ||
                    normalized.includes(material.topic.toLocaleLowerCase()) ||
                    material.topic.toLocaleLowerCase().includes(normalized)));
            materials.forEach(material => result.add(material.questionTopic));
        }
        return [...result].filter(Boolean);
    }

    function academicQuestions(subject, topic) {
        const bankSubject = academicSubjectCode(subject);
        const aliases = new Set(academicTopicAliases(subject, topic).map(value =>
            value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
        ));
        return localQuestionBank.filter(question =>
            question.subject === bankSubject &&
            (aliases.has(question.topic.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim()) ||
                question.academicTopic === topic)
        );
    }

    function academicMaterials(subject, topic) {
        const bankSubject = academicSubjectCode(subject);
        const normalized = topic.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
        return studyMaterials.filter(material => material.subject === bankSubject &&
            (material.topic.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim() === normalized ||
                material.title.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim() === normalized ||
                material.topic.toLocaleLowerCase().includes(normalized) ||
                normalized.includes(material.topic.toLocaleLowerCase())));
    }

    function renderAcademicActivity() {
        const subject = document.querySelector("#academic-subject").value;
        const topic = document.querySelector("#academic-topic").value;
        const level = document.querySelector("#academic-level").value;
        const contentType = document.querySelector("#academic-content-type").value;
        const language = document.querySelector("#academic-language").value;
        const courseTopic = academicCurriculum.find(item => item.subject === subject)?.topics.find(item => item.name === topic);
        const materials = academicMaterials(subject, topic);
        const material = materials[0] || null;
        const questions = academicQuestions(subject, topic);
        const record = {
            subject,
            topic,
            level,
            contentType,
            language,
            sourceType: material ? "Locally authored study guide" : questions.length ? "Local question bank" : "Suggested roadmap only",
            questions: questions.map(question => ({ id: question.id, question: question.question, answer: question.answer, explanation: question.explanation })),
            content: material ? {
                title: material.title,
                explanation: material.explanation,
                keyPoints: material.keyPoints,
                examples: material.examples,
                definitions: material.definitions,
                formulas: material.formulas || [],
                commonMistake: material.commonMistake || "",
                revision: material.revision
            } : null
        };
        const selectionSaved = writeStorage("wooclap-academic-engine-state", JSON.stringify({ subject, topic, level, contentType, language }));
        const outputSaved = writeStorage("wooclap-academic-engine-last-output", JSON.stringify(record));
        renderAcademicOutput(record, courseTopic, material, questions);
        if (!selectionSaved || !outputSaved) {
            const warning = makeElement("p", "study-hint is-error", "This study activity is displayed, but browser storage could not save it. Check available local storage.");
            document.querySelector("#academic-output").append(warning);
        }
    }

    function renderAcademicOutput(record, courseTopic, material, questions) {
        const container = document.querySelector("#academic-output");
        container.replaceChildren();
        const heading = makeElement("h4", "local-subheading", `${record.topic} · ${record.level}`);
        const source = makeElement("p", "study-hint academic-source",
            `${record.sourceType}. ${courseTopic?.scope || "Suggested roadmap; not verified against an uploaded course syllabus."}`);
        container.append(heading, source);
        const appendText = (title, text) => {
            if (!text) return;
            const section = makeElement("section", "academic-content-card");
            section.append(makeElement("h5", "", title), makeElement("p", "", text));
            container.append(section);
        };
        const appendList = (title, values) => {
            if (!Array.isArray(values) || !values.length) return;
            const section = makeElement("section", "academic-content-card");
            section.append(makeElement("h5", "", title));
            const list = makeElement("ul");
            values.forEach(value => list.append(makeElement("li", "", value)));
            section.append(list);
            container.append(section);
        };
        const contentType = record.contentType;
        if (contentType === "notes" || contentType === "learn" || contentType === "revision" || contentType === "exam") {
            if (material) {
                if (contentType === "notes") {
                    appendText("1. Concept name", material.title);
                    appendText("2. Simple definition", material.definitions?.[0] || "");
                    appendText("3. Explanation", material.explanation);
                    appendText("4. Why it is used", material.whyUsed || "Not included in the locally authored guide yet.");
                    appendText("5. How it works", material.howItWorks || "Not included in the locally authored guide yet.");
                    appendList("6. Important points", material.keyPoints);
                    appendList("7. Examples", material.examples);
                    appendText("8. Common mistake", material.commonMistake || "Not included in the locally authored guide yet.");
                    appendText("9. Exam point", material.examPoint || "Review the definitions and key points above.");
                    appendText("10. Quick revision", material.revision);
                } else if (contentType === "revision") {
                    appendText("Quick revision", material.revision);
                    appendList("Key points", material.keyPoints);
                } else {
                    appendText(contentType === "exam" ? "Concept summary" : "Explanation", material.explanation);
                    appendList("Important points", material.keyPoints);
                    appendList("Examples", material.examples);
                    appendList("Important definitions", material.definitions);
                    appendText("Quick revision", material.revision);
                }
            } else {
                appendText("Local content unavailable", "This roadmap topic does not have a locally authored guide yet. No course-specific material has been invented. Add your course notes to the existing optional study generator or select a topic with a local guide.");
            }
            if (contentType === "exam") {
                appendText("Exam preparation coverage", questions.length
                    ? `The local bank has ${questions.length} MCQ(s) for this topic. It does not yet contain a full mock exam or complete short/long-answer set.`
                    : "There is no local question set for this topic yet; a full mock exam cannot be created from the current local bank.");
                if (questions.length) container.append(makeButton("Start available topic quiz", "quiz-next", () => startAcademicQuiz(record, questions, "quiz")));
            }
        } else if (contentType === "definitions") {
            appendList("Important definitions", material?.definitions || []);
            if (!material?.definitions?.length) appendText("Local content unavailable", "There are no locally authored definitions for this topic yet.");
        } else if (contentType === "formulas") {
            appendList("Important formulas", material?.formulas || []);
            if (!material?.formulas?.length) appendText("No local formula set", "No formulas are stored for this topic in the local study bank. This avoids presenting an unverified formula list.");
        } else if (contentType === "flashcards") {
            const cards = [
                ...(material?.definitions || []).map(definition => ({ front: definition.split(":")[0], back: definition.slice(definition.indexOf(":") + 1).trim() })),
                ...questions.slice(0, 6).map(question => ({ front: question.question, back: `${question.answer} — ${question.explanation}` }))
            ].filter(card => card.front && card.back).slice(0, 12);
            if (!cards.length) appendText("No local flashcards", "This topic does not have local flashcard content yet.");
            else {
                let index = 0;
                let flipped = false;
                const face = makeButton(cards[0].front, "flashcard-face", () => {
                    flipped = !flipped;
                    face.textContent = flipped ? cards[index].back : cards[index].front;
                    face.setAttribute("aria-label", flipped ? "Show flashcard question" : "Flip card to reveal answer");
                });
                face.setAttribute("aria-label", "Flip card to reveal answer");
                const count = makeElement("p", "study-hint", `Card 1 of ${cards.length}`);
                const actions = makeElement("div", "flashcard-actions");
                actions.append(makeButton("Flip card", "flashcard-action", () => face.click()));
                actions.append(makeButton("Next card", "flashcard-action", () => {
                    index = (index + 1) % cards.length;
                    flipped = false;
                    face.textContent = cards[index].front;
                    count.textContent = `Card ${index + 1} of ${cards.length}`;
                    face.setAttribute("aria-label", "Flip card to reveal answer");
                }));
                container.append(count, face, actions);
            }
        } else if (["mcq", "quiz", "practice", "mixed", "weak"].includes(contentType)) {
            let selectedQuestions = questions;
            if (contentType === "mixed") {
                selectedQuestions = localQuestionBank.filter(question => question.subject === academicSubjectCode(record.subject));
                appendText("Mixed practice", `This will draw from all ${selectedQuestions.length} locally available question(s) in ${record.subject}, across topics.`);
            } else if (contentType === "weak") {
                const history = readJSON(localStorageKeys.stats, {}).history || [];
                const topicIds = new Set(questions.map(question => question.id));
                const attempts = history.filter(item => topicIds.has(item.id));
                if (attempts.length) {
                    const correct = attempts.filter(item => item.correct).length;
                    appendText("Your recorded performance", `${correct}/${attempts.length} correct (${Math.round(correct / attempts.length * 100)}%). This uses only your saved quiz answers.`);
                } else {
                    appendText("Not enough performance data", "Complete a quiz on this topic first. Weak-topic recommendations are not seeded with sample scores.");
                }
            }
            appendText("Available local questions", selectedQuestions.length
                ? `${selectedQuestions.length} question(s) are available from the local question bank.`
                : "No matching questions are currently in the local question bank.");
            if (selectedQuestions.length && (contentType !== "weak" || (readJSON(localStorageKeys.stats, {}).history || []).some(item => questions.some(question => question.id === item.id)))) {
                const start = makeButton(contentType === "mcq" ? "Start MCQ practice" : "Start quiz", "quiz-next", () => startAcademicQuiz(record, selectedQuestions, contentType));
                container.append(start);
            }
        } else {
            const promptParts = material?.keyPoints?.length ? material.keyPoints : questions.slice(0, 4).map(question => question.question);
            if (!material && !questions.length) {
                appendText("Local prompts unavailable", "There is not enough locally authored content to build practice prompts for this topic. No placeholder assignment or answer key has been created.");
            } else {
                const promptList = makeElement("ol", "academic-prompt-list");
                if (contentType === "short") {
                    (material?.definitions?.length ? material.definitions : promptParts).slice(0, 6).forEach((value, index) =>
                        promptList.append(makeElement("li", "", `In your own words, define or briefly explain ${value.split(":")[0] || `${record.topic} concept ${index + 1}`}.`))
                    );
                } else if (contentType === "long" || contentType === "assignment" || contentType === "exam") {
                    promptList.append(makeElement("li", "", `Explain ${material?.title || record.topic}, describe its key ideas, and support your answer with a worked example.`));
                    promptParts.slice(0, 3).forEach(value => promptList.append(makeElement("li", "", `Analyze the role of ${value.replace(/[.]+$/, "")} in ${record.topic}. State any assumptions and justify your reasoning.`)));
                } else if (contentType === "coding") {
                    if (record.subject !== "Data Structures") {
                        appendText("Coding problems unavailable", "The local coding-problem set currently covers selected Data Structures topics only.");
                        return;
                    }
                    const prompts = {
                        Arrays: "Write a function that returns the index of a target value in an array, or -1 when it is absent. State its worst-case time complexity.",
                        "Array operations": "Write a function that removes all occurrences of a target from an array in place and returns the new logical length.",
                        Stacks: "Implement a stack with push, pop, and peek operations. Explain how you handle an empty pop.",
                        Queues: "Implement a queue using a circular array. Track front, rear, and the full/empty condition.",
                        "Singly Linked Lists": "Write a function that inserts a node after a given node in a singly linked list. Explain the link updates.",
                        "Tree traversals": "Write a recursive inorder traversal for a binary tree and state its time and auxiliary-space complexity.",
                        "Binary Search Trees": "Write a search operation for a binary search tree and explain how its height affects runtime.",
                        "Breadth-First Search": "Implement breadth-first traversal with an adjacency list and a queue. Mark vertices when they are enqueued.",
                        "Depth-First Search": "Implement iterative depth-first traversal using an explicit stack and a visited set.",
                        "Merge Sort": "Implement merge sort and explain why merging two sorted halves is linear in their combined length."
                    };
                    promptList.append(makeElement("li", "", prompts[record.topic] || `Design and implement a ${record.topic} operation. Define its input/output, handle edge cases, and analyze time and space complexity.`));
                } else {
                    promptParts.slice(0, 6).forEach(value => promptList.append(makeElement("li", "", `Practice: explain or apply ${value.replace(/[.]+$/, "")} in a new example.`)));
                }
                container.append(promptList);
                if (contentType === "assignment") {
                    appendText("Assignment title", `${record.subject}: ${record.topic} practice`);
                    appendList("Learning objectives", material?.keyPoints || []);
                    appendText("Instructions", "Answer every prompt in your own words. Show intermediate reasoning for calculations or design decisions, state assumptions, and verify against your course material.");
                    appendText("Assignment brief", `Original practice assignment · ${record.level} level · Suggested time: 30 minutes · Suggested total: ${promptList.children.length * 5} marks.`);
                }
                appendText("Answer availability", "The local bank does not include a verified solution set for these written prompts. Check your lecture materials or ask your instructor before treating a solution as authoritative.");
            }
        }
        appendText("Language note", record.language === "Roman English"
            ? "Roman English is selected. The current built-in study guides are authored in English; automatic translation requires the optional connected AI service."
            : "");
    }

    function startAcademicQuiz(record, selectedQuestions, contentType) {
        if (contentType === "weak") {
            const history = readJSON(localStorageKeys.stats, {}).history || [];
            const scores = new Map();
            history.filter(item => selectedQuestions.some(question => question.id === item.id)).forEach(item => {
                const entry = scores.get(item.id) || { correct: 0, total: 0 };
                entry.correct += Number(item.correct);
                entry.total += 1;
                scores.set(item.id, entry);
            });
            selectedQuestions = [...selectedQuestions].sort((first, second) => {
                const a = scores.get(first.id);
                const b = scores.get(second.id);
                return (a ? a.correct / a.total : 1) - (b ? b.correct / b.total : 1);
            });
        }
        const bankSubject = academicSubjectCode(record.subject);
        const bankTopic = contentType === "mixed" ? "all" : selectedQuestions[0]?.topic || "all";
        localSubject.value = bankSubject;
        updateLocalTopicOptions();
        localTopic.value = [...localTopic.options].some(option => option.value === bankTopic) ? bankTopic : "all";
        const requestedDifficulty = record.level === "Basic" ? "Easy" :
            record.level === "Intermediate" ? "Medium" :
                record.level === "Advanced" || record.level === "Hard" ? "Hard" : "all";
        localDifficulty.value = contentType === "mixed" ? "all" :
            (selectedQuestions.some(question => question.difficulty === requestedDifficulty) ? requestedDifficulty : "all");
        localCountChoice.value = "5";
        saveLocalSettings();
        startLocalQuiz();
    }

    function bindMaterialsControls() {
        document.querySelector("#material-search").addEventListener("input", event => renderStudyMaterials(event.target.value));
        initializeAcademicEngine();
    }

    function isMaterialBookmarked(title) {
        const bookmarks = readJSON(localStorageKeys.materialBookmarks, []);
        return Array.isArray(bookmarks) && bookmarks.includes(title);
    }

    function toggleMaterialBookmark(title) {
        const saved = readJSON(localStorageKeys.materialBookmarks, []);
        const bookmarks = Array.isArray(saved) ? saved : [];
        writeStorage(localStorageKeys.materialBookmarks, JSON.stringify(bookmarks.includes(title)
            ? bookmarks.filter(item => item !== title)
            : [...bookmarks, title]));
    }

    function bindPlannerControls() {
        document.querySelector("#save-study-goals").addEventListener("click", () => {
            if (!hasPlan("premium")) {
                showPlanGate("premium", "Custom study goals");
                return;
            }
            const previousGoals = readJSON(localStorageKeys.goals, {});
            const goals = {
                daily: Math.max(10, Math.min(720, Number(document.querySelector("#daily-goal-minutes").value) || 60)),
                weekly: Math.max(30, Math.min(3000, Number(document.querySelector("#weekly-goal-minutes").value) || 300)),
                extras: Array.isArray(previousGoals.extras) ? previousGoals.extras : []
            };
            document.querySelector("#daily-goal-minutes").value = goals.daily;
            document.querySelector("#weekly-goal-minutes").value = goals.weekly;
            document.querySelector("#planner-status").textContent = writeStorage(localStorageKeys.goals, JSON.stringify(goals))
                ? "Study goals saved locally."
                : "Study goals could not be saved in this browser.";
            renderPremiumDashboard();
        });
        document.querySelector("#planner-add-form").addEventListener("submit", event => {
            event.preventDefault();
            if (!hasPlan("premium-plus")) {
                showPlanGate("premium-plus", "Editable weekly study planner");
                return;
            }
            const schedule = readJSON(localStorageKeys.planner, []);
            schedule.push({
                id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                day: document.querySelector("#planner-day").value,
                subject: document.querySelector("#planner-subject").value,
                minutes: Math.max(5, Math.min(360, Number(document.querySelector("#planner-minutes").value) || 45)),
                priority: document.querySelector("#planner-priority").value
            });
            if (!writeStorage(localStorageKeys.planner, JSON.stringify(schedule))) {
                document.querySelector("#custom-quiz-status").textContent = "The schedule could not be saved in this browser.";
                return;
            }
            renderStudyPlanner();
        });
        document.querySelector("#exam-add-form").addEventListener("submit", event => {
            event.preventDefault();
            if (!hasPlan("premium-plus")) {
                showPlanGate("premium-plus", "Exam countdowns");
                return;
            }
            const date = document.querySelector("#exam-date").value;
            if (!date || date < localDayKey()) {
                document.querySelector("#exam-list").replaceChildren(makeElement("p", "study-hint", "Choose today or a future date for the exam."));
                return;
            }
            const exams = readJSON(localStorageKeys.exams, []);
            exams.push({ id: `exam-${Date.now()}`, name: document.querySelector("#exam-name").value.trim(), date });
            if (!writeStorage(localStorageKeys.exams, JSON.stringify(exams))) {
                document.querySelector("#exam-list").replaceChildren(makeElement("p", "study-hint", "Could not save this exam in browser storage."));
                return;
            }
            event.currentTarget.reset();
            renderStudyPlanner();
        });
        document.querySelector("#reminder-toggle").addEventListener("click", toggleStudyReminders);
        document.querySelector("#reminder-time").addEventListener("change", saveReminderSettings);
        document.querySelector("#custom-quiz-subject").addEventListener("change", renderCustomTopicChoices);
        document.querySelector("#custom-quiz-start").addEventListener("click", startCustomQuiz);
        document.querySelector("#extra-goal-form").addEventListener("submit", addExtraStudyGoal);
    }

    function renderStudyPlanner() {
        const schedule = readJSON(localStorageKeys.planner, []);
        const container = document.querySelector("#weekly-schedule");
        if (!container) return;
        container.replaceChildren();
        weekdayNames.forEach(day => {
            const sessions = (Array.isArray(schedule) ? schedule : []).filter(item => item.day === day)
                .sort((a, b) => ({ high: 0, normal: 1, low: 2 }[a.priority || "normal"] - { high: 0, normal: 1, low: 2 }[b.priority || "normal"]));
            if (!sessions.length) return;
            const section = makeElement("section", "schedule-day");
            section.append(makeElement("h5", "", day));
            sessions.forEach(session => {
                const row = makeElement("div", "schedule-row");
                row.append(makeElement("span", "", `${session.subject} → ${session.minutes} min${session.priority === "high" ? " · High priority" : ""}`));
                row.append(makeButton("Remove", "study-secondary", () => {
                    writeStorage(localStorageKeys.planner, JSON.stringify(schedule.filter(item => item.id !== session.id)));
                    renderStudyPlanner();
                }));
                section.append(row);
            });
            container.append(section);
        });
        if (!container.children.length) container.append(makeElement("p", "study-hint", "No sessions added yet. Create a weekly schedule above."));
        renderPlannerExams();
        renderRevisionTasks();
    }

    function renderPlannerExams() {
        const container = document.querySelector("#exam-list");
        const exams = readJSON(localStorageKeys.exams, []);
        container.replaceChildren();
        const upcoming = (Array.isArray(exams) ? exams : []).sort((a, b) => a.date.localeCompare(b.date));
        if (!upcoming.length) {
            container.append(makeElement("p", "study-hint", "Add an exam above to see its countdown."));
            return;
        }
        upcoming.forEach(exam => {
            const days = Math.max(0, Math.ceil((new Date(`${exam.date}T23:59:59`) - new Date()) / 86_400_000));
            const row = makeElement("div", "exam-row");
            row.append(makeElement("span", "", `${exam.name} · ${days === 0 ? "Today" : `${days} day${days === 1 ? "" : "s"} left`} · ${exam.date}`));
            row.append(makeButton("Remove", "study-secondary", () => {
                writeStorage(localStorageKeys.exams, JSON.stringify(upcoming.filter(item => item.id !== exam.id)));
                renderStudyPlanner();
            }));
            container.append(row);
        });
    }

    function renderRevisionTasks() {
        const container = document.querySelector("#revision-list");
        const revisions = readJSON(localStorageKeys.revision, []);
        container.replaceChildren();
        const due = (Array.isArray(revisions) ? revisions : []).filter(item => item.dueAt <= Date.now());
        if (!due.length) container.append(makeElement("p", "study-hint", "No revision cards are due right now. Missed quiz questions are scheduled for spaced review."));
        due.slice(0, 20).forEach(item => {
            const question = localQuestionBank.find(entry => entry.id === item.id);
            if (!question) return;
            const row = makeElement("div", "revision-row");
            row.append(makeElement("span", "", `${question.subject} · ${question.topic} — ${question.question}`));
            row.append(makeButton("Review", "study-secondary", () => {
                localSubject.value = question.subject;
                updateLocalTopicOptions();
                localTopic.value = question.topic;
                startCustomQuiz([question.id], "Revision");
            }));
            container.append(row);
        });
    }

    function toggleStudyReminders() {
        const button = document.querySelector("#reminder-toggle");
        const enabled = button.getAttribute("aria-pressed") !== "true";
        const settings = { enabled, time: document.querySelector("#reminder-time").value || "18:00" };
        if (enabled && "Notification" in window && Notification.permission === "default") {
            Notification.requestPermission().then(permission => {
                document.querySelector("#room-status").textContent = permission === "granted"
                    ? "Browser reminders enabled."
                    : "Browser notifications were not allowed; your reminder preference is still saved in the planner.";
            });
        }
        const saved = writeStorage(localStorageKeys.reminders, JSON.stringify(settings));
        button.setAttribute("aria-pressed", String(enabled));
        button.textContent = enabled ? "Reminders on" : "Reminders off";
        document.querySelector("#reminder-time").disabled = !enabled;
        if (!saved) document.querySelector("#room-status").textContent = "Reminder settings could not be saved.";
        else checkStudyReminder(true);
    }

    function saveReminderSettings() {
        const settings = readJSON(localStorageKeys.reminders, { enabled: false });
        settings.time = document.querySelector("#reminder-time").value || "18:00";
        writeStorage(localStorageKeys.reminders, JSON.stringify(settings));
    }

    function checkStudyReminder(force = false) {
        const settings = readJSON(localStorageKeys.reminders, { enabled: false, time: "18:00" });
        if (!settings.enabled) return;
        const now = new Date();
        const [hour, minute] = (settings.time || "18:00").split(":").map(Number);
        if (!force && (now.getHours() < hour || (now.getHours() === hour && now.getMinutes() < minute))) return;
        const sent = readStorage("wooclap-reminder-last-date");
        if (sent === localDayKey()) return;
        const goals = readJSON(localStorageKeys.goals, { daily: 60 });
        const log = studyTimeLog();
        const todayMinutes = Math.floor((Number(log[localDayKey()]?.seconds) || 0) / 60);
        if (todayMinutes >= (Number(goals.daily) || 60)) return;
        writeStorage("wooclap-reminder-last-date", localDayKey());
        const reminder = `You have studied ${todayMinutes} of your ${Number(goals.daily) || 60} minute daily goal.`;
        document.querySelector("#room-status").textContent = reminder;
        if ("Notification" in window && Notification.permission === "granted") {
            try {
                new Notification("Time for a study session", { body: reminder });
            } catch {
                document.querySelector("#planner-status").textContent = "The browser could not display a reminder notification.";
            }
        }
    }

    function renderCustomTopicChoices() {
        const selectedSubject = document.querySelector("#custom-quiz-subject").value;
        const container = document.querySelector("#custom-topic-list");
        container.replaceChildren();
        const topics = [...new Set(localQuestionBank
            .filter(question => selectedSubject === "all" || question.subject === selectedSubject)
            .map(question => `${question.subject}::${question.topic}`))];
        topics.forEach(value => {
            const [subject, topic] = value.split("::");
            const label = makeElement("label", "custom-topic-choice");
            const input = document.createElement("input");
            input.type = "checkbox";
            input.value = value;
            label.append(input, makeElement("span", "", `${subject} · ${topic}`));
            container.append(label);
        });
    }

    function startCustomQuiz(questionIds = null, label = "Mixed quiz") {
        if (!hasPlan("premium-plus")) {
            showPlanGate("premium-plus", "Mixed-subject quizzes and exam simulations");
            return;
        }
        if (!questionIds && localQuizState && !window.confirm("Starting a custom quiz will replace your current in-progress quiz. Continue?")) return;
        let questions;
        if (questionIds) {
            questions = questionIds.map(id => localQuestionBank.find(question => question.id === id)).filter(Boolean);
        } else {
            const chosen = [...document.querySelectorAll("#custom-topic-list input:checked")].map(input => input.value);
            if (!chosen.length) {
                document.querySelector("#custom-quiz-status").textContent = "Select at least one topic to build a quiz.";
                return;
            }
            const topicSet = new Set(chosen);
            const difficulty = document.querySelector("#custom-quiz-difficulty").value;
            const allQuestions = localQuestionBank.filter(question =>
                topicSet.has(`${question.subject}::${question.topic}`) &&
                (difficulty === "all" || difficulty === "auto" || question.difficulty === difficulty)
            );
            if (!allQuestions.length) {
                document.querySelector("#custom-quiz-status").textContent = "There are no installed questions for the selected topics and difficulty.";
                return;
            }
            questions = shuffled(allQuestions);
            if (difficulty === "auto") {
                const recent = readJSON(localStorageKeys.stats, {}).history || [];
                const recentScores = recent.filter(item => chosen.includes(`${item.subject}::${item.topic}`)).slice(-10);
                const accuracy = recentScores.length ? recentScores.filter(item => item.correct).length / recentScores.length : 0.5;
                const adaptiveLevel = accuracy >= 0.8 ? "Hard" : accuracy < 0.5 ? "Easy" : "Medium";
                const adaptiveQuestions = questions.filter(question => question.difficulty === adaptiveLevel);
                if (adaptiveQuestions.length) questions = shuffled(adaptiveQuestions.concat(questions.filter(question => question.difficulty !== adaptiveLevel))).slice(0, 10);
            }
            const countChoice = document.querySelector("#custom-quiz-count").value;
            const count = countChoice === "all" ? questions.length : Number(countChoice);
            questions = questions.slice(0, count);
        }
        if (!questions.length) return;
        const timerMinutes = document.querySelector("#custom-quiz-exam")?.checked ? 30 : Number(localTimerChoice.value) / 60;
        const timeLimit = timerMinutes ? timerMinutes * 60 : 0;
        const uniqueSubjects = [...new Set(questions.map(question => question.subject))];
        localQuizState = {
            questionIds: questions.map(question => question.id),
            answers: questions.map(() => null),
            index: 0,
            subject: uniqueSubjects.length === 1 ? uniqueSubjects[0] : "Mixed subjects",
            topic: label,
            difficulty: "all",
            startedAt: Date.now(),
            timeLimit,
            deadline: timeLimit ? Date.now() + timeLimit * 1000 : null,
            submitted: false,
            isMistakePractice: label === "Revision",
            isExamSimulation: label === "Exam simulation" || Boolean(document.querySelector("#custom-quiz-exam")?.checked)
        };
        recordStudyDay();
        localQuizContainer.hidden = false;
        localQuizStatus.textContent = "";
        persistActiveQuiz();
        setStudioView("local-quiz");
        renderLocalQuiz();
        startLocalQuizTimer();
        if (localQuizState.isExamSimulation) enableQuizFullscreen();
    }

    function bindPremiumDashboardControls() {
        document.querySelector("#analytics-range").addEventListener("change", renderPremiumDashboard);
        document.querySelector("#dashboard-save-goals").addEventListener("click", () => {
            if (!hasPlan("premium")) {
                showPlanGate("premium", "Custom daily and weekly study goals");
                return;
            }
            const previousGoals = readJSON(localStorageKeys.goals, {});
            const goals = {
                daily: Math.max(10, Math.min(720, Number(document.querySelector("#dashboard-daily-goal").value) || 60)),
                weekly: Math.max(30, Math.min(3000, Number(document.querySelector("#dashboard-weekly-goal").value) || 300)),
                extras: Array.isArray(previousGoals.extras) ? previousGoals.extras : []
            };
            document.querySelector("#dashboard-daily-goal").value = goals.daily;
            document.querySelector("#dashboard-weekly-goal").value = goals.weekly;
            document.querySelector("#daily-goal-minutes").value = goals.daily;
            document.querySelector("#weekly-goal-minutes").value = goals.weekly;
            const saved = writeStorage(localStorageKeys.goals, JSON.stringify(goals));
            document.querySelector("#dashboard-goal-value").textContent = saved
                ? "Study goals updated."
                : "Could not save goals in browser storage.";
            renderGoalProgress();
        });
        document.querySelector("#dashboard-practice-weak").addEventListener("click", () => {
            if (!hasPlan("premium-plus")) {
                showPlanGate("premium-plus", "Study My Weak Topics");
                return;
            }
            const stats = readJSON(localStorageKeys.stats, {});
            const history = Array.isArray(stats.history) ? stats.history : [];
            const scores = new Map();
            history.forEach(item => {
                const key = `${item.subject}::${item.topic}`;
                scores.has(key) || scores.set(key, { ids: [], correct: 0, total: 0 });
                const value = scores.get(key);
                value.ids.push(item.id);
                value.correct += Number(item.correct);
                value.total += 1;
            });
            const weak = [...scores.entries()].sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total).slice(0, 3);
            const ids = [...new Set(weak.flatMap(([, value]) => value.ids))];
            if (!ids.length) {
                document.querySelector("#dashboard-weak-topics").replaceChildren(makeElement("p", "study-hint", "Complete quizzes first; weak topics are calculated from your answers."));
                return;
            }
            startCustomQuiz(ids, "Weak-topic practice");
        });
        document.querySelector("#export-study-report").addEventListener("click", exportStudyReport);
        document.querySelector("#export-notes").addEventListener("click", exportStudyNotes);
        document.querySelector("#import-study-data").addEventListener("change", importStudyNotes);
    }

    function analyticsHistory() {
        const stats = readJSON(localStorageKeys.stats, {});
        const history = Array.isArray(stats.history) ? stats.history : [];
        const range = document.querySelector("#analytics-range").value;
        if (range === "all") return history;
        const cutoff = Date.now() - Number(range) * 86_400_000;
        return history.filter(item => item.at >= cutoff);
    }

    function renderPremiumDashboard() {
        const plan = activePlan();
        const badge = document.querySelector("#current-plan-badge");
        if (badge) badge.textContent = `${planNames[plan].toUpperCase()}${readJSON(localStorageKeys.subscription, {}).status === "demo" ? " · DEMO" : ""}`;
        const metrics = document.querySelector("#premium-dashboard-metrics");
        if (!metrics) return;
        metrics.replaceChildren();
        const stats = readJSON(localStorageKeys.stats, { quizzes: 0, attempted: 0, correct: 0, recent: [] });
        const streak = readJSON(localStorageKeys.streak, { days: 0 });
        const history = analyticsHistory();
        const accuracy = history.length ? Math.round(history.filter(item => item.correct).length / history.length * 100) : 0;
        const todaySeconds = Number(studyTimeLog()[localDayKey()]?.seconds) || 0;
        const weekSeconds = sumStudyTime(7);
        [
            ["Today's study time", `${Math.floor(todaySeconds / 60)} min`],
            ["Weekly study time", `${Math.floor(weekSeconds / 60)} min`],
            ["Quiz accuracy", `${accuracy}%`],
            ["Questions completed", Number(stats.attempted) || 0],
            ["Current streak", `${Number(streak.days) || 0} days`],
            ["Quizzes completed", Number(stats.quizzes) || 0]
        ].forEach(([label, value]) => {
            const metric = makeElement("div", "dashboard-metric");
            metric.append(makeElement("span", "", label), makeElement("strong", "", String(value)));
            metrics.append(metric);
        });
        renderMasteryTopics(history);
        renderDashboardTopics(history);
        renderDashboardPlan();
        renderDashboardExams();
        renderDashboardRecent();
        renderDashboardRevisions();
        renderForecast(history);
        renderQuizHistory();
        renderPersonalRoadmap(history);
        renderGoalProgress();
        renderExtraStudyGoals();
        checkStudyReminder();
    }

    function masteryByTopic(history) {
        const topics = new Map();
        history.forEach(item => {
            const key = `${item.subject}::${item.topic}`;
            topics.has(key) || topics.set(key, { subject: item.subject, topic: item.topic, correct: 0, total: 0, questionIds: new Set() });
            const value = topics.get(key);
            value.total += 1;
            value.correct += Number(item.correct);
            value.questionIds.add(item.id);
        });
        return [...topics.values()].map(item => ({ ...item, score: Math.round(item.correct / item.total * 100) }));
    }

    function masteryLabel(score) {
        if (score >= 85) return "Excellent";
        if (score >= 70) return "Good";
        if (score >= 50) return "Developing";
        return "Needs practice";
    }

    function renderMasteryTopics(history) {
        const container = document.querySelector("#mastery-list");
        container.replaceChildren();
        if (!hasPlan("premium-pro")) {
            container.append(makeButton("🔒 Topic mastery analytics · Premium Pro", "study-secondary", () => showPlanGate("premium-pro", "Topic mastery analytics")));
            return;
        }
        const mastery = masteryByTopic(history).sort((a, b) => a.score - b.score);
        if (!mastery.length) {
            container.append(makeElement("p", "study-hint", "Topic mastery will appear after you answer local quiz questions. No sample scores are shown."));
            return;
        }
        mastery.forEach(item => {
            const card = makeElement("article", "topic-mastery-card");
            const heading = makeElement("div", "topic-mastery-heading");
            heading.append(makeElement("strong", "", item.topic), makeElement("span", "", `${item.score}% · ${masteryLabel(item.score)}`));
            const bar = makeElement("div", "quiz-run-progress");
            bar.setAttribute("role", "progressbar");
            bar.setAttribute("aria-valuemin", "0");
            bar.setAttribute("aria-valuemax", "100");
            bar.setAttribute("aria-valuenow", String(item.score));
            const fill = makeElement("span");
            fill.style.width = `${item.score}%`;
            bar.append(fill);
            const meta = makeElement("div", "topic-mastery-meta", `${item.subject} · ${item.total} answers`);
            card.append(heading, bar, meta);
            container.append(card);
        });
    }

    function renderDashboardTopics(history) {
        const topics = masteryByTopic(history);
        const weakContainer = document.querySelector("#dashboard-weak-topics");
        const strongContainer = document.querySelector("#dashboard-strong-topics");
        weakContainer.replaceChildren();
        strongContainer.replaceChildren();
        const weakest = [...topics].sort((a, b) => a.score - b.score).slice(0, 3);
        const strongest = [...topics].sort((a, b) => b.score - a.score).slice(0, 3);
        if (!topics.length) {
            weakContainer.append(makeElement("p", "study-hint", "Complete quizzes to identify topics to revise."));
            strongContainer.append(makeElement("p", "study-hint", "Complete quizzes to identify strong topics."));
            return;
        }
        weakest.forEach(item => weakContainer.append(makeElement("p", "study-hint", `${item.topic} · ${item.score}% (${item.total} answers)`)));
        strongest.forEach(item => strongContainer.append(makeElement("p", "study-hint", `${item.topic} · ${item.score}% (${item.total} answers)`)));
    }

    function renderGoalProgress() {
        const goals = readJSON(localStorageKeys.goals, { daily: 60, weekly: 300 });
        const todayMinutes = Math.floor((Number(studyTimeLog()[localDayKey()]?.seconds) || 0) / 60);
        document.querySelector("#dashboard-goal-value").textContent = `${todayMinutes} / ${Number(goals.daily) || 60} min today · ${Math.floor(sumStudyTime(7) / 60)} / ${Number(goals.weekly) || 300} min this week`;
        document.querySelector("#weekly-goal-progress span").style.width = `${Math.min(100, Math.round(sumStudyTime(7) / Math.max(1, Number(goals.weekly) || 300) / 60 * 100))}%`;
    }

    function renderDashboardPlan() {
        const container = document.querySelector("#dashboard-today-plan");
        const schedule = readJSON(localStorageKeys.planner, []);
        const today = weekdayNames[(new Date().getDay() + 6) % 7];
        const sessions = (Array.isArray(schedule) ? schedule : []).filter(item => item.day === today);
        container.replaceChildren();
        if (!sessions.length) container.append(makeElement("p", "study-hint", "No sessions scheduled for today."));
        sessions.forEach(item => container.append(makeElement("p", "study-hint", `${item.subject} · ${item.minutes} min`)));
    }

    function renderDashboardExams() {
        const container = document.querySelector("#dashboard-exams");
        const exams = readJSON(localStorageKeys.exams, []);
        container.replaceChildren();
        const next = (Array.isArray(exams) ? exams : []).filter(item => item.date >= localDayKey()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
        if (!next.length) container.append(makeElement("p", "study-hint", "No upcoming exams saved."));
        next.forEach(exam => {
            const days = Math.ceil((new Date(`${exam.date}T23:59:59`) - new Date()) / 86_400_000);
            container.append(makeElement("p", "study-hint", `${exam.name} · ${days === 0 ? "Today" : `${days} days`}`));
        });
    }

    function renderDashboardRecent() {
        const container = document.querySelector("#dashboard-recent-quizzes");
        const stats = readJSON(localStorageKeys.stats, {});
        container.replaceChildren();
        const recent = (Array.isArray(stats.recent) ? stats.recent : []).slice(0, 4);
        if (!recent.length) container.append(makeElement("p", "study-hint", "Completed quizzes will appear here."));
        recent.forEach(item => container.append(makeElement("p", "study-hint", `${item.subject} · ${item.topic} — ${item.percentage}%`)));
    }

    function renderDashboardRevisions() {
        const container = document.querySelector("#dashboard-revisions");
        const due = readJSON(localStorageKeys.revision, []).filter(item => item.dueAt <= Date.now());
        container.replaceChildren();
        if (!due.length) container.append(makeElement("p", "study-hint", "No revision tasks due today."));
        due.slice(0, 4).forEach(item => {
            const question = localQuestionBank.find(value => value.id === item.id);
            if (question) container.append(makeElement("p", "study-hint", `${question.subject} · ${question.topic}`));
        });
    }

    function renderForecast(history) {
        const container = document.querySelector("#performance-trend");
        container.replaceChildren();
        if (!hasPlan("premium-pro")) {
            container.append(makeButton("🔒 Advanced trends and forecasting · Premium Pro", "study-secondary", () => showPlanGate("premium-pro", "Performance forecasting")));
            return;
        }

        const recent = history.slice(-10);
        if (recent.length < 3) {
            container.append(makeElement("p", "study-hint", "Forecast needs at least three completed answers in this time range. Keep studying to build a personal trend."));
            return;
        }
        const scores = recent.map(item => Number(item.correct));
        const half = Math.floor(scores.length / 2);
        const earlier = scores.slice(0, half).reduce((sum, score) => sum + score, 0) / half;
        const latest = scores.slice(half).reduce((sum, score) => sum + score, 0) / (scores.length - half);
        const difference = Math.round((latest - earlier) * 100);
        const forecast = Math.round(Math.max(0, Math.min(100, (latest + (latest - earlier) * 0.5) * 100)));
        const trend = difference > 2 ? "improving" : difference < -2 ? "slipping" : "steady";
        container.append(makeElement("p", "study-hint", `Latest half: ${Math.round(latest * 100)}% · previous half: ${Math.round(earlier * 100)}% · ${trend} by ${Math.abs(difference)} points. Personal next-attempt estimate: ${forecast}% (based on your recent answers, not a guarantee).`));
    }

    function renderPersonalRoadmap(history) {
        const container = document.querySelector("#personal-roadmap");
        container.replaceChildren();
        if (!hasPlan("premium-pro-max")) {
            container.append(makeButton("🔒 A revision roadmap built from your results · Premium Pro Max", "study-secondary", () => showPlanGate("premium-pro-max", "Personal study roadmap")));
            return;
        }
        const mastery = masteryByTopic(history).sort((a, b) => a.score - b.score);
        const revisions = readJSON(localStorageKeys.revision, []);
        const dueNow = (Array.isArray(revisions) ? revisions : []).filter(item => item.dueAt <= Date.now()).length;
        const exams = readJSON(localStorageKeys.exams, []);
        const nextExam = (Array.isArray(exams) ? exams : []).filter(item => item.date >= localDayKey()).sort((a, b) => a.date.localeCompare(b.date))[0];
        if (!history.length) {
            container.append(makeElement("p", "study-hint", "Complete quizzes to create a personal roadmap. It will use your real answers; no sample performance is inserted."));
            return;
        }
        container.append(
            makeElement("p", "study-hint", mastery.length
                ? `1. Review ${mastery[0].subject} · ${mastery[0].topic} first (${mastery[0].score}% mastery across ${mastery[0].total} answers).`
                : "1. Complete a quiz to identify topics that need more practice."),
            makeElement("p", "study-hint", `2. Complete ${dueNow} spaced-revision task${dueNow === 1 ? "" : "s"} due now.`),
            makeElement("p", "study-hint", nextExam
                ? `3. Prepare for ${nextExam.name}, scheduled ${nextExam.date}.`
                : "3. Add an exam date to align revision with your exam."),
            makeElement("p", "study-hint", "AI-assisted study planning is not implemented here. The optional Claude study assistant is separate and requires its server integration and API key.")
        );
    }

    function renderExtraStudyGoals() {
        const container = document.querySelector("#extra-goal-list");
        if (!container) return;
        container.replaceChildren();
        const goals = readJSON(localStorageKeys.goals, {});
        const extras = Array.isArray(goals.extras) ? goals.extras : [];
        if (!extras.length) {
            container.append(makeElement("p", "study-hint", "Add personal daily goals here. Question counts use your actual quiz answers."));
            return;
        }
        const stats = readJSON(localStorageKeys.stats, {});
        const history = Array.isArray(stats.history) ? stats.history.filter(item => localDayKey(new Date(item.at)) === localDayKey()) : [];
        const timeLog = studyTimeLog();
        extras.forEach(goal => {
            const actual = goal.metric === "minutes"
                ? Math.floor((Number(timeLog[localDayKey()]?.seconds) || 0) / 60)
                : history.filter(item => goal.subject === "all" || item.subject === goal.subject).length;
            const target = Math.max(1, Number(goal.target) || 1);
            const row = makeElement("div", "extra-goal-row");
            row.append(
                makeElement("span", "", `${goal.title} · ${goal.subject === "all" ? "all subjects" : goal.subject} · ${actual}/${target} ${goal.metric}`),
                makeButton("Remove", "study-secondary", () => {
                    goals.extras = extras.filter(item => item.id !== goal.id);
                    if (!writeStorage(localStorageKeys.goals, JSON.stringify(goals))) {
                        document.querySelector("#planner-status").textContent = "Could not remove this goal from browser storage.";
                        return;
                    }
                    renderExtraStudyGoals();
                })
            );
            container.append(row);
        });
    }

    function addExtraStudyGoal(event) {
        event.preventDefault();
        if (!hasPlan("premium-pro-max")) {
            showPlanGate("premium-pro-max", "Multiple personalized study goals");
            return;
        }
        const title = document.querySelector("#extra-goal-title").value.trim();
        if (!title) {
            document.querySelector("#planner-status").textContent = "Enter a name for this study goal.";
            return;
        }
        const goals = readJSON(localStorageKeys.goals, {});
        goals.extras = Array.isArray(goals.extras) ? goals.extras : [];
        goals.extras.push({
            id: `goal-${Date.now()}`,
            title,
            metric: document.querySelector("#extra-goal-metric").value,
            subject: document.querySelector("#extra-goal-subject").value,
            target: Math.max(1, Number(document.querySelector("#extra-goal-target").value) || 1)
        });
        if (!writeStorage(localStorageKeys.goals, JSON.stringify(goals))) {
            document.querySelector("#planner-status").textContent = "Could not save this goal in browser storage.";
            return;
        }
        event.currentTarget.reset();
        renderExtraStudyGoals();
    }

    function renderQuizHistory() {
        const container = document.querySelector("#quiz-history");
        container.replaceChildren();
        if (!hasPlan("premium-pro")) {
            container.append(makeButton("🔒 Detailed quiz history · Premium Pro", "study-secondary", () => showPlanGate("premium-pro", "Detailed quiz history")));
            return;
        }
        const stats = readJSON(localStorageKeys.stats, {});
        const history = Array.isArray(stats.quizHistory) ? stats.quizHistory : [];
        const range = document.querySelector("#analytics-range").value;
        const cutoff = range === "all" ? 0 : Date.now() - Number(range) * 86_400_000;
        const rows = history.filter(item => item.completedAt >= cutoff).slice(0, 30);
        if (!rows.length) {
            container.append(makeElement("p", "study-hint", "No quizzes in this time range. Complete a quiz to start your history."));
            return;
        }
        rows.forEach(item => {
            const row = makeElement("div", "recent-quiz-row");
            row.append(
                makeElement("strong", "", `${item.subject} · ${item.topic}${item.isExamSimulation ? " · Exam simulation" : ""}`),
                makeElement("span", "", `${item.correct}/${item.total} · ${item.percentage}% · ${new Date(item.completedAt).toLocaleDateString()}`)
            );
            container.append(row);
        });
    }

    function exportStudyReport() {
        if (!hasPlan("premium-pro")) {
            showPlanGate("premium-pro", "Study report export");
            return;
        }
        const report = {
            exportedAt: new Date().toISOString(),
            stats: readJSON(localStorageKeys.stats, {}),
            studyTime: studyTimeLog(),
            exams: readJSON(localStorageKeys.exams, []),
            weeklyPlan: readJSON(localStorageKeys.planner, []),
            goals: readJSON(localStorageKeys.goals, {}),
            revisions: readJSON(localStorageKeys.revision, []),
            streak: readJSON(localStorageKeys.streak, {}),
            notes: readJSON(localStorageKeys.notesLibrary, { "My Notes": readStorage(localStorageKeys.notes) })
        };
        const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
        const anchor = makeElement("a");
        anchor.href = url;
        anchor.download = "woopclap-study-report.json";
        anchor.click();
        URL.revokeObjectURL(url);
    }

    function exportStudyNotes() {
        if (!hasPlan("premium-pro")) {
            showPlanGate("premium-pro", "Export study notes");
            return;
        }
        const notes = document.querySelector("#local-notes").value;
        if (!notes.trim()) {
            document.querySelector("#local-notes-status").textContent = "Add notes before exporting them.";
            return;
        }
        const url = URL.createObjectURL(new Blob([notes], { type: "text/plain;charset=utf-8" }));
        const anchor = makeElement("a");
        anchor.href = url;
        anchor.download = "wooclap-study-notes.txt";
        anchor.click();
        URL.revokeObjectURL(url);
    }

    function importStudyNotes(event) {
        if (!hasPlan("premium-pro")) {
            event.currentTarget.value = "";
            showPlanGate("premium-pro", "Import study notes");
            return;
        }
        const input = event.currentTarget;
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            const notes = document.querySelector("#local-notes");
            notes.value = `${notes.value}${notes.value ? "\n\n" : ""}${String(reader.result || "")}`.slice(0, 20_000);
            notes.dispatchEvent(new Event("input"));
            document.querySelector("#local-notes-status").textContent = `${file.name} imported into local notes.`;
            input.value = "";
        });
        reader.addEventListener("error", () => {
            document.querySelector("#local-notes-status").textContent = "Could not read the selected text file.";
            input.value = "";
        });
        reader.readAsText(file);
    }

    initializeLocalPlatform();
    initializePremiumFeatures();

    function setOutputMessage(message, isError = false) {
        studyOutput.replaceChildren(makeElement("p", isError ? "output-empty is-error" : "output-empty", message));
    }

    function setMode(mode) {
        activeMode = mode;
        const indicatorPositions = {
            quiz: "0%",
            notes: "calc(100% + 2px)",
            flashcards: "calc(200% + 4px)"
        };
        modeSwitch.style.setProperty("--indicator-x", indicatorPositions[mode] || "0%");
        modeButtons.forEach(button => {
            const isActive = button.dataset.mode === mode;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });
        buildLabel.textContent = `Build ${mode === "flashcards" ? "flashcards" : mode}`;

        if (topicInput.value.trim()) {
            setOutputMessage(`Ready to build ${mode} for ${topicInput.value.trim()}. Press the build button when you are ready.`);
        } else {
            setOutputMessage("Choose a topic, language, difficulty, and activity type to create a study set.");
        }
    }

    modeButtons.forEach(button => button.addEventListener("click", () => setMode(button.dataset.mode)));

    function buildOfflineQuiz(topic, material) {
        const entries = [];
        const seenTerms = new Set();
        const seenDefinitions = new Set();

        material.split(/\r?\n/).forEach(line => {
            const separator = line.indexOf(":");
            if (separator < 1) return;
            const term = line.slice(0, separator).trim();
            const definition = line.slice(separator + 1).trim();
            const termKey = term.toLocaleLowerCase();
            const definitionKey = definition.toLocaleLowerCase();
            if (!term || !definition || seenTerms.has(termKey) || seenDefinitions.has(definitionKey)) return;
            seenTerms.add(termKey);
            seenDefinitions.add(definitionKey);
            entries.push({ term, definition });
        });

        if (entries.length < 2) return null;

        const quizQuestions = entries.slice(0, 6).map(entry => {
            const choices = shuffled([
                entry.definition,
                ...entries.filter(other => other !== entry).map(other => other.definition).slice(0, 3)
            ]);
            return {
                question: `According to your notes, what does ${entry.term} mean?`,
                choices,
                answerIndex: choices.indexOf(entry.definition),
                explanation: `Your notes define ${entry.term} as: ${entry.definition}`
            };
        });

        return {
            explanation: `This practice quiz is built from the ${entries.length} term-definition pairs you entered for ${topic}.`,
            examples: entries.slice(0, 4).map(entry => `${entry.term}: ${entry.definition}`),
            quizQuestions,
            answers: quizQuestions.map((question, index) => ({
                questionIndex: index + 1,
                correctAnswer: question.choices[question.answerIndex],
                explanation: question.explanation
            })),
            flashcards: entries.slice(0, 4).map(entry => ({ front: entry.term, back: entry.definition })),
            isOffline: true
        };
    }

    async function buildActivity() {
        const topic = topicInput.value.trim();
        const material = materialInput.value.trim();
        const requestedMode = activeMode;
        if (!topic) {
            topicInput.focus();
            return;
        }
        writeStorage("wooclap-study-topic", topic);
        writeStorage("wooclap-study-material", material);
        writeStorage("wooclap-study-language", languageInput.value);
        writeStorage("wooclap-study-difficulty", difficultyInput.value);

        if (window.location.protocol === "file:") {
            const offlineBundle = requestedMode === "quiz" ? buildOfflineQuiz(topic, material) : null;
            if (offlineBundle) renderQuiz(topic, offlineBundle);
            else setOutputMessage(requestedMode === "quiz"
                ? "For a notes-only quiz, paste at least two Term: definition facts. For AI generation, run the server (node server.js) and open http://localhost:3000/ instead of opening the file directly."
                : "Run the server (node server.js), then open http://localhost:3000/ to generate this study set.", true);
            return;
        }

        activeBuildController?.abort();
        const controller = new AbortController();
        activeBuildController = controller;
        const currentRunId = ++buildRunId;
        const buildButton = studyForm.querySelector(".studio-build");
        const clearButton = studyForm.querySelector('[type="reset"]');
        buildButton.disabled = true;
        clearButton.disabled = true;
        modeButtons.forEach(button => { button.disabled = true; });
        buildLabel.textContent = "Thinking…";
        setOutputMessage("Your AI study activity is being prepared…");

        try {
            const response = await fetch(generateEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic,
                    language: languageInput.value,
                    difficulty: difficultyInput.value,
                    contentType: requestedMode,
                    material
                }),
                signal: controller.signal
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error || `Study request failed (${response.status}).`);
            if (currentRunId !== buildRunId) return;

            if (requestedMode === "notes") {
                renderNotes(topic, result);
            } else if (requestedMode === "quiz" && Array.isArray(result.quizQuestions) && Array.isArray(result.answers)) {
                quizState = null;
                renderQuiz(topic, result);
            } else if (requestedMode === "flashcards" && Array.isArray(result.flashcards)) {
                renderFlashcards(topic, result.flashcards.map(card => ({ term: card.front, definition: card.back })));
            } else {
                throw new Error("The AI returned an unexpected study format. Please try again.");
            }
        } catch (error) {
            if (error.name !== "AbortError" && currentRunId === buildRunId) {
                const offlineBundle = requestedMode === "quiz" ? buildOfflineQuiz(topic, material) : null;
                if (offlineBundle) {
                    renderQuiz(topic, offlineBundle);
                } else {
                    const isConnectionError = error instanceof TypeError;
                    const message = isConnectionError
                        ? requestedMode === "quiz"
                            ? "The study service is unavailable right now. You can still get a quiz by pasting at least two Term: definition lines, or try again in a moment."
                            : "Cannot reach the study service. Check your connection and that the server is running, then try again."
                        : error.message || "The AI request failed. Please try again.";
                    setOutputMessage(message, true);
                }
            }
        } finally {
            if (currentRunId === buildRunId) {
                activeBuildController = null;
                buildButton.disabled = false;
                clearButton.disabled = false;
                modeButtons.forEach(button => { button.disabled = false; });
                buildLabel.textContent = `Build ${requestedMode === "flashcards" ? "flashcards" : requestedMode}`;
            }
        }
    }

    studyForm.addEventListener("submit", event => {
        event.preventDefault();
        buildActivity();
    });

    studyForm.addEventListener("reset", event => {
        event.preventDefault();
        cancelBuild();
        topicInput.value = "";
        materialInput.value = "";
        languageInput.value = "English";
        difficultyInput.value = "easy";
        writeStorage("wooclap-study-topic", "");
        writeStorage("wooclap-study-material", "");
        writeStorage("wooclap-study-language", "English");
        writeStorage("wooclap-study-difficulty", "easy");
        quizState = null;
        flashcardState = null;
        setMode("quiz");
    });

    topicInput.addEventListener("change", () => writeStorage("wooclap-study-topic", topicInput.value.trim()));
    materialInput.addEventListener("change", () => writeStorage("wooclap-study-material", materialInput.value));
    languageInput.addEventListener("change", () => writeStorage("wooclap-study-language", languageInput.value));
    difficultyInput.addEventListener("change", () => writeStorage("wooclap-study-difficulty", difficultyInput.value));

    function renderNotes(topic, bundle = {}) {
        const key = `wooclap-notes-${encodeURIComponent(topic.toLocaleLowerCase()).slice(0, 80)}`;
        const savedNote = readStorage(key);
        const quizReview = (bundle.quizQuestions || []).map((question, index) => {
            const answer = bundle.answers?.[index];
            return `${index + 1}. ${question.question}\n${question.choices.map((choice, choiceIndex) => `${String.fromCharCode(65 + choiceIndex)}. ${choice}`).join("\n")}\nAnswer: ${answer?.correctAnswer || "See quiz"}\n${answer?.explanation || ""}`;
        });
        const cardReview = (bundle.flashcards || []).map(card => `${card.front}\n${card.back}`);
        const outline = [
            `${topic.toLocaleUpperCase()}\n`,
            "EASY EXPLANATION\n",
            bundle.explanation || "No explanation was returned.",
            "\nEXAMPLES\n",
            ...(bundle.examples || []).map((example, index) => `${index + 1}. ${example}`),
            "\nMULTIPLE-CHOICE QUESTIONS & ANSWERS\n",
            ...quizReview,
            "\nFLASHCARDS\n",
            ...cardReview
        ].join("\n");

        studyOutput.replaceChildren();
        studyOutput.append(makeElement("h3", "output-title", `Study notes: ${topic}`));
        const editor = makeElement("textarea", "studio-input notes-editor");
        editor.setAttribute("aria-label", `Editable study notes for ${topic}`);
        editor.value = savedNote || outline;
        const status = makeElement("p", "study-hint", savedNote ? "Saved notes restored from this browser." : "AI-generated study set. Review it, then save your edits in this browser.");
        const saveButton = makeButton("Save notes", "notes-save", () => {
            const saved = writeStorage(key, editor.value);
            status.textContent = saved ? "Notes saved in this browser." : "Storage is unavailable. Keep this page open to retain your notes.";
        });
        studyOutput.append(editor, saveButton, status);
    }

    function shuffled(values) {
        const result = [...values];
        for (let index = result.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
        }
        return result;
    }

    function renderQuiz(topic, bundle, keepScore = false) {
        if (!Array.isArray(bundle.quizQuestions) || bundle.quizQuestions.length === 0) {
            setOutputMessage("The AI did not return any quiz questions. Please build the quiz again.", true);
            return;
        }

        if (!keepScore || !quizState || quizState.topic !== topic) {
            quizState = {
                topic,
                bundle,
                questions: bundle.quizQuestions,
                index: 0,
                score: 0,
                answered: false,
                recorded: false
            };
        }

        if (quizState.index >= quizState.questions.length) {
            renderQuizResults();
            return;
        }

        const question = quizState.questions[quizState.index];
        const correctAnswer = question.choices[question.answerIndex];
        studyOutput.replaceChildren();
        studyOutput.append(makeElement("h3", "output-title", `Quiz: ${topic}`));
        if (quizState.bundle.isOffline) {
            studyOutput.append(makeElement("p", "study-hint offline-quiz-note", "Notes-only quiz built from your Term: definition lines. The AI service was unavailable."));
        }

        const run = makeElement("div", "quiz-run");
        const top = makeElement("div", "quiz-run-top");
        top.append(
            makeElement("span", "", `Question ${quizState.index + 1} of ${quizState.questions.length}`),
            makeElement("span", "", `Score ${quizState.score}`)
        );
        const progress = makeElement("div", "quiz-run-progress");
        progress.setAttribute("role", "progressbar");
        progress.setAttribute("aria-valuemin", "0");
        progress.setAttribute("aria-valuemax", String(quizState.questions.length));
        progress.setAttribute("aria-valuenow", String(quizState.index + (quizState.answered ? 1 : 0)));
        const progressFill = makeElement("span");
        progressFill.style.width = `${((quizState.index + (quizState.answered ? 1 : 0)) / quizState.questions.length) * 100}%`;
        progress.append(progressFill);
        const prompt = makeElement("h4", "quiz-prompt", question.question);
        const options = makeElement("div", "quiz-options");
        const feedback = makeElement("p", "quiz-feedback", quizState.answered ? "Answer recorded." : "Choose the best definition.");
        const nextButton = makeButton(
            quizState.index === quizState.questions.length - 1 ? "See results" : "Next question",
            "quiz-next",
            () => {
                if (!quizState.answered) return;
                quizState.index += 1;
                quizState.answered = false;
                renderQuiz(topic, quizState.bundle, true);
            }
        );
        nextButton.hidden = !quizState.answered;

        question.choices.forEach((optionText, optionIndex) => {
            const option = makeButton(optionText, "quiz-option", () => {
                if (quizState.answered) return;
                quizState.answered = true;
                const isCorrect = optionIndex === question.answerIndex;
                if (isCorrect) quizState.score += 1;
                option.classList.add(isCorrect ? "is-correct" : "is-wrong");
                [...options.children].forEach((choice, choiceIndex) => {
                    choice.disabled = true;
                    if (choiceIndex === question.answerIndex) choice.classList.add("is-correct");
                });
                feedback.textContent = isCorrect
                    ? `Correct. ${question.explanation}`
                    : `Correct answer: ${correctAnswer}. ${question.explanation}`;
                feedback.classList.add(isCorrect ? "is-correct" : "is-wrong");
                nextButton.hidden = false;
                progress.setAttribute("aria-valuenow", String(quizState.index + 1));
                progressFill.style.width = `${((quizState.index + 1) / quizState.questions.length) * 100}%`;
                top.lastElementChild.textContent = `Score ${quizState.score}`;
            });
            options.append(option);
        });

        run.append(top, progress, prompt, options, feedback, nextButton);
        studyOutput.append(run);
    }

    function renderQuizResults() {
        if (!quizState.recorded) {
            const stats = readJSON("wooclap-study-stats", { quizzes: 0, correct: 0, questions: 0 });
            stats.quizzes = (Number(stats.quizzes) || 0) + 1;
            stats.correct = (Number(stats.correct) || 0) + quizState.score;
            stats.questions = (Number(stats.questions) || 0) + quizState.questions.length;
            writeStorage("wooclap-study-stats", JSON.stringify(stats));
            quizState.recorded = true;
        }

        const percentage = Math.round((quizState.score / quizState.questions.length) * 100);
        studyOutput.replaceChildren();
        studyOutput.append(
            makeElement("h3", "output-title", `Session complete: ${quizState.topic}`),
            makeElement("p", "quiz-result-score", `${quizState.score} of ${quizState.questions.length} correct · ${percentage}%`),
            makeElement("p", "study-hint", "Your results are saved locally. Revisit the notes or run the quiz again to strengthen recall.")
        );
        const answerReview = makeElement("details", "answer-review");
        answerReview.append(makeElement("summary", "", "Review answers"));
        const answerList = makeElement("ol", "answer-review-list");
        quizState.bundle.answers.forEach(answer => {
            const item = makeElement("li");
            item.append(
                makeElement("strong", "", `${answer.questionIndex}. ${answer.correctAnswer}`),
                makeElement("p", "", answer.explanation)
            );
            answerList.append(item);
        });
        answerReview.append(answerList);
        const actions = makeElement("div", "study-actions");
        actions.append(
            makeButton("Try again", "quiz-next", () => renderQuiz(quizState.topic, quizState.bundle)),
            makeButton("Review notes", "study-secondary", () => {
                setMode("notes");
                renderNotes(quizState.topic, quizState.bundle);
            })
        );
        studyOutput.append(answerReview, actions);
    }

    function renderFlashcards(topic, entries) {
        const savedProgress = readJSON("wooclap-flashcard-progress", {});
        const key = encodeURIComponent(topic.toLocaleLowerCase()).slice(0, 80);
        const mastered = new Set(Array.isArray(savedProgress[key]) ? savedProgress[key] : []);
        flashcardState = { topic, entries, index: 0, flipped: false, mastered, key };
        showFlashcard();
    }

    function showFlashcard() {
        const state = flashcardState;
        if (!state) return;
        const entry = state.entries[state.index];
        studyOutput.replaceChildren();
        studyOutput.append(makeElement("h3", "output-title", `Flashcards: ${state.topic}`));

        const top = makeElement("div", "flashcard-top");
        top.append(
            makeElement("span", "", `Card ${state.index + 1} of ${state.entries.length}`),
            makeElement("span", "", `${state.mastered.size} mastered`)
        );
        const face = makeButton(state.flipped ? entry.definition : entry.term, "flashcard-face", () => {
            state.flipped = !state.flipped;
            showFlashcard();
        });
        face.setAttribute("aria-label", state.flipped ? "Show term" : "Flip card to reveal definition");
        const hint = makeElement("p", "study-hint", state.flipped ? "Definition" : "Think of the definition, then reveal it.");
        const actions = makeElement("div", "flashcard-actions");
        const reviewButton = makeButton("Need review", "flashcard-action is-muted", () => markFlashcard(false));
        const knownButton = makeButton("Know it", "flashcard-action", () => markFlashcard(true));
        const previousButton = makeButton("← Previous", "study-secondary", () => moveFlashcard(-1));
        const nextButton = makeButton("Next →", "study-secondary", () => moveFlashcard(1));
        actions.append(reviewButton, knownButton, previousButton, nextButton);
        studyOutput.append(top, face, hint, actions);
    }

    function markFlashcard(isKnown) {
        const state = flashcardState;
        const term = state.entries[state.index].term;
        if (isKnown) state.mastered.add(term);
        else state.mastered.delete(term);
        const savedProgress = readJSON("wooclap-flashcard-progress", {});
        savedProgress[state.key] = [...state.mastered];
        writeStorage("wooclap-flashcard-progress", JSON.stringify(savedProgress));
        state.flipped = true;
        showFlashcard();
    }

    function moveFlashcard(direction) {
        flashcardState.index = (flashcardState.index + direction + flashcardState.entries.length) % flashcardState.entries.length;
        flashcardState.flipped = false;
        showFlashcard();
    }

    function openStudySpace(event) {
        event.preventDefault();
        lastOpener = event.currentTarget;
        setStudioView(event.currentTarget.hasAttribute("data-open-plans") ? "plans" : "local-quiz");
        if (!studyDialog.open) studyDialog.showModal();
        if (event.currentTarget.hasAttribute("data-open-plans")) {
            document.querySelector("#subscription-grid button")?.focus();
        } else if (localQuizState) {
            localQuizContainer.hidden = false;
            localResumeButton.hidden = false;
            localQuizStatus.textContent = "Your in-progress quiz is saved. Resume it or start a new quiz.";
        } else {
            document.querySelector("#local-subject").focus();
        }
    }

    function closeStudySpace() {
        if (localQuizState && !localQuizState.submitted &&
            !window.confirm("Your quiz progress is saved on this device. Close the study space and resume it later?")) return;
        studyDialog.close();
    }

    openStudyLinks.forEach(link => link.addEventListener("click", openStudySpace));
    closeStudyButton.addEventListener("click", closeStudySpace);
    studyDialog.addEventListener("cancel", event => {
        event.preventDefault();
        closeStudySpace();
    });
    studyDialog.addEventListener("click", event => {
        if (event.target === studyDialog) closeStudySpace();
    });
    studyDialog.addEventListener("close", () => {
        cancelBuild();
        lastOpener?.focus();
    });

    // ---------- AI provider launcher ----------
    const chatLauncher = document.querySelector("#chat-launcher");
    const aiLauncherDock = document.querySelector("#ai-launcher-dock");
    const aiProviderBar = document.querySelector("#ai-provider-bar");
    const chatLauncherStatus = document.querySelector("#chat-launcher-status");

    function setAiProviderBarOpen(open) {
        aiProviderBar.classList.toggle("is-open", open);
        aiProviderBar.setAttribute("aria-hidden", String(!open));
        chatLauncher.setAttribute("aria-expanded", String(open));
    }

    chatLauncher.addEventListener("click", () => {
        const open = chatLauncher.getAttribute("aria-expanded") !== "true";
        setAiProviderBarOpen(open);
        chatLauncherStatus.textContent = "";
    });

    aiProviderBar.addEventListener("click", event => {
        const providerButton = event.target.closest("[data-ai-url]");
        if (!providerButton) return;

        const providerName = providerButton.dataset.aiName;
        const popupWidth = Math.min(620, Math.floor(window.screen.availWidth / 2));
        const popupHeight = window.screen.availHeight;
        const availableLeft = window.screen.availLeft || 0;
        const availableRight = availableLeft + window.screen.availWidth;
        const currentRight = window.screenX + window.outerWidth;
        const popupLeft = currentRight + popupWidth <= availableRight
            ? currentRight
            : Math.max(availableLeft, window.screenX - popupWidth);
        const popupTop = window.screen.availTop || 0;
        const aiWindow = window.open(
            providerButton.dataset.aiUrl,
            `wooclap-${providerName.toLowerCase()}`,
            `popup=yes,width=${popupWidth},height=${popupHeight},left=${popupLeft},top=${popupTop}`
        );
        setAiProviderBarOpen(false);

        if (!aiWindow) {
            chatLauncherStatus.textContent = `${providerName} was blocked. Allow pop-ups for this site, then try again.`;
            return;
        }

        aiWindow.opener = null;
        chatLauncherStatus.textContent = "";
    });

    document.addEventListener("pointerdown", event => {
        if (!aiLauncherDock.contains(event.target)) setAiProviderBarOpen(false);
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && chatLauncher.getAttribute("aria-expanded") === "true") {
            setAiProviderBarOpen(false);
            chatLauncher.focus();
        }
    });
})();