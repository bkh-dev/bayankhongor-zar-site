// script.js
(() => {
    "use strict";

    // -------------------------
    // Storage keys
    // -------------------------
    const ADS_KEY = "bh_ads";
    const INBOX_KEY = "bayankhongor_inbox_messages";
    const UI_STATE_KEY = "bh_ui_state";

    const SUPABASE_URL = "https://dtxrbjppxyggjkpybdcu.supabase.co";
    const SUPABASE_ANON_KEY = "sb_publishable_YGhtBnurAg3otWaBMXKjvQ_TQRQkvc9";
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const FAVORITES_KEY = "bh_favorites";
    const COMPARED_KEY = "bh_compared";
    const CURRENT_USER_KEY = "bh_current_user";
    const THEME_KEY = "bh_theme";
    const SEARCH_HISTORY_KEY = "bh_search_history";
    const USER_ROLE_KEY = "bh_user_role";
    const USERS_KEY = "bh_users";
    const SESSION_KEY = "bh_session_user";

    // -------------------------
    // State
    // -------------------------
    const state = {
        ads: [],
        filteredAds: [],
        favorites: new Set(),
        compared: new Set(),
        currentUser: "",
        currentPage: 1,
        pageSize: 9,
        currentRole: "seller",
        activeCategory: "all",
        activeSubcategory: "all",
        quickFilter: "all", // all|vip|top|active|sold
        viewMode: "all", // all|my|favorites
        editingAdId: null,
        pendingDeleteId: null,
        imageFiles: [], // File[] for new/edit preview
        searchHistory: [],
        authMode: "login"
    };

    // -------------------------
    // DOM refs
    // -------------------------
    const el = {
        currentUserInput: document.getElementById("currentUserInput"),
        currentUserStatus: document.getElementById("currentUserStatus"),
        profileBox: document.getElementById("profileBox"),
        profileSummary: document.getElementById("profileSummary"),
        profileAvatar: document.getElementById("profileAvatar"),
        profileInfoView: document.getElementById("profileInfoView"),
        profileEditBox: document.getElementById("profileEditBox"),
        profileNameText: document.getElementById("profileNameText"),
        profilePhoneText: document.getElementById("profilePhoneText"),
        profileRoleText: document.getElementById("profileRoleText"),
        profileNameInput: document.getElementById("profileNameInput"),
        toggleProfileEditBtn: document.getElementById("toggleProfileEditBtn"),
        saveProfileBtn: document.getElementById("saveProfileBtn"),
        cancelProfileEditBtn: document.getElementById("cancelProfileEditBtn"),
        saveUserBtn: document.getElementById("saveUserBtn"),
        clearUserBtn: document.getElementById("clearUserBtn"),

        showMyAdsBtn: document.getElementById("showMyAdsBtn"),
        showAllAdsBtn: document.getElementById("showAllAdsBtn"),
        showFavoritesBtn: document.getElementById("showFavoritesBtn"),
        openInboxBtn: document.getElementById("openInboxBtn"),
        openCompareBtn: document.getElementById("openCompareBtn"),
        themeToggleBtn: document.getElementById("themeToggleBtn"),
        loginBtn: document.getElementById("loginBtn"),
        logoutBtn: document.getElementById("logoutBtn"),
        roleSelect: document.getElementById("roleSelect"),
        compareCountBadge: document.getElementById("compareCountBadge"),

        searchInput: document.getElementById("searchInput"),
        categorySelect: document.getElementById("categorySelect"),
        minPriceInput: document.getElementById("minPriceInput"),
        maxPriceInput: document.getElementById("maxPriceInput"),
        sortSelect: document.getElementById("sortSelect"),
        searchBtn: document.getElementById("searchBtn"),
        resetFilterBtn: document.getElementById("resetFilterBtn"),
        searchHistoryBox: document.getElementById("searchHistoryBox"),

        sellerInput: document.getElementById("sellerInput"),
        phoneInput: document.getElementById("phoneInput"),
        titleInput: document.getElementById("titleInput"),
        priceInput: document.getElementById("priceInput"),
        locationInput: document.getElementById("locationInput"),
        newCategoryInput: document.getElementById("newCategoryInput"),
        subcategoryRow: document.getElementById("subcategoryRow"),
        subcategoryInput: document.getElementById("subcategoryInput"),
        statusInput: document.getElementById("statusInput"),
        descriptionInput: document.getElementById("descriptionInput"),
        imageInput: document.getElementById("imageInput"),
        imagePreviewBox: document.getElementById("imagePreviewBox"),
        vipInput: document.getElementById("vipInput"),
        topInput: document.getElementById("topInput"),
        addAdBtn: document.getElementById("addAdBtn"),
        cancelEditBtn: document.getElementById("cancelEditBtn"),
        formTitle: document.getElementById("formTitle"),
        editModeText: document.getElementById("editModeText"),

        resultsCount: document.getElementById("resultsCount"),
        filterModeText: document.getElementById("filterModeText"),
        topSection: document.getElementById("topSection"),
        vipSection: document.getElementById("vipSection"),
        normalSection: document.getElementById("normalSection"),
        pagination: document.getElementById("pagination"),
        pageInfo: document.getElementById("pageInfo"),

        totalAdsStat: document.getElementById("totalAdsStat"),
        vipAdsStat: document.getElementById("vipAdsStat"),
        topAdsStat: document.getElementById("topAdsStat"),
        activeAdsStat: document.getElementById("activeAdsStat"),
        soldAdsStat: document.getElementById("soldAdsStat"),
        totalViewsStat: document.getElementById("totalViewsStat"),

        inboxModal: document.getElementById("inboxModal"),
        closeInboxModal: document.getElementById("closeInboxModal"),
        inboxList: document.getElementById("inboxList"),

        compareModal: document.getElementById("compareModal"),
        closeCompareModal: document.getElementById("closeCompareModal"),
        compareContent: document.getElementById("compareContent"),
        favoriteCountBadge: document.getElementById("favoriteCountBadge"),

        deleteModal: document.getElementById("deleteModal"),
        closeDeleteModal: document.getElementById("closeDeleteModal"),
        cancelDeleteBtn: document.getElementById("cancelDeleteBtn"),
        confirmDeleteBtn: document.getElementById("confirmDeleteBtn"),
        deleteModalText: document.getElementById("deleteModalText"),

        subcategoryPanel: document.getElementById("subcategoryPanel"),

        toastContainer: document.getElementById("toastContainer"),
        addAdModal: document.getElementById("addAdModal"),
        openAddAdModalBtn: document.getElementById("openAddAdModalBtn"),
        closeAddAdModalBtn: document.getElementById("closeAddAdModalBtn"),
        authModal: document.getElementById("authModal"),
        closeAuthModalBtn: document.getElementById("closeAuthModalBtn"),
        authModalTitle: document.getElementById("authModalTitle"),
        authModeSelect: document.getElementById("authModeSelect"),
        authNameInput: document.getElementById("authNameInput"),
        authPhoneInput: document.getElementById("authPhoneInput"),
        authPasswordInput: document.getElementById("authPasswordInput"),
        authRoleSelect: document.getElementById("authRoleSelect"),
        authSubmitBtn: document.getElementById("authSubmitBtn")
    };

    // -------------------------
    // Utils
    // -------------------------
    let searchDebounceTimer = null;
    function escapeHtml(str) {
        return String(str ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    function formatPrice(value) {
        const n = Number(value || 0);
        return `${n.toLocaleString("mn-MN")}₮`;
    }

    function formatNumberInput(value) {
        const digits = String(value || "").replace(/\D/g, "");
        if (!digits) return "";
        return Number(digits).toLocaleString("en-US");
    }

    function formatDate(iso) {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return "";
        return d.toLocaleDateString("mn-MN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        });
    }

    function getShortDescription(text, max = 100) {
        const s = String(text || "").trim();
        if (s.length <= max) return escapeHtml(s);
        return `${escapeHtml(s.slice(0, max))}...`;
    }

    function getStorageJson(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    }

    function saveStorageJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function showToast(message, type = "info") {
        const node = document.createElement("div");
        node.className = `toast ${type}`;
        node.textContent = message;
        el.toastContainer.appendChild(node);
        setTimeout(() => node.remove(), 2500);
    }

    function id() {
        return Date.now() + Math.floor(Math.random() * 1000);
    }

    function hasCurrentUser() {
        return Boolean(state.currentUser.trim());
    }

    function isMyAd(ad) {
        if (!hasCurrentUser()) return false;

        const seller = String(ad.seller || "").trim().toLowerCase();
        const current = String(state.currentUser || "").trim().toLowerCase();

        return seller === current;
    }

    function canManageAd(ad) {
        if (state.currentRole === "viewer") return false;
        if (state.currentRole === "admin") return true;
        return isMyAd(ad);
    }

    function isFavorite(adId) {
        return state.favorites.has(Number(adId));
    }

    function isCompared(adId) {
        return state.compared.has(Number(adId));
    }

    function buildImage(url, alt = "image") {
        const safe = escapeHtml(url || "");
        if (!safe) {
            return `<div class="no-image">Зураггүй</div>`;
        }
        return `<img src="${safe}" alt="${escapeHtml(alt)}" loading="lazy" onerror="this.closest('.image-wrap').innerHTML='<div class=&quot;no-image&quot;>Зураггүй</div>';">`;
    }

    function getImageHTML(ad) {
        const first = Array.isArray(ad.images) ? ad.images[0] : ad.image;
        return `
            <div class="image-wrap">
                ${ad.vip ? `<div class="vip-badge">VIP</div>` : ""}
                ${ad.top ? `<div class="top-badge-card">TOP</div>` : ""}
                <div class="status-badge ${ad.status === "Зарагдсан" ? "status-sold" : "status-active"}">${escapeHtml(ad.status || "Идэвхтэй")}</div>
                ${buildImage(first, ad.title)}
            </div>
        `;
    }

    function getUsers() {
        return getStorageJson(USERS_KEY, []);
    }

    function saveUsers(users) {
        saveStorageJson(USERS_KEY, users);
    }

    function getSessionUser() {
        return getStorageJson(SESSION_KEY, null);
    }

    function saveSessionUser(user) {
        saveStorageJson(SESSION_KEY, user);
    }

    function openAuthModal(mode = "login") {
        state.authMode = mode;
        el.authModeSelect.value = mode;
        syncAuthModeUI();
        el.authModal.classList.add("show");
    }

    function closeAuthModal() {
        el.authModal.classList.remove("show");
        el.authNameInput.value = "";
        el.authPhoneInput.value = "";
        el.authPasswordInput.value = "";
        el.authRoleSelect.value = "seller";
    }

    function syncAuthModeUI() {
        const isRegister = el.authModeSelect.value === "register";
        state.authMode = isRegister ? "register" : "login";

        el.authModalTitle.textContent = isRegister ? "Бүртгүүлэх" : "Нэвтрэх";
        el.authSubmitBtn.textContent = isRegister ? "Бүртгүүлэх" : "Нэвтрэх";
        el.authRoleSelect.style.display = isRegister ? "block" : "none";
        el.authNameInput.style.display = isRegister ? "block" : "none";

        el.authPhoneInput.placeholder = isRegister
            ? "Бүртгүүлэх утасны дугаар"
            : "Нэвтрэх утасны дугаар";
    }

    function getCurrentSessionPhone() {
        const sessionUser = getSessionUser();
        return sessionUser?.phone ? String(sessionUser.phone).trim() : "";
    }

    function openProfileEdit() {
        if (!hasCurrentUser()) return;

        el.profileEditBox.style.display = "block";
        el.profileInfoView.style.display = "none";
        el.profileNameInput.value = state.currentUser || "";
        el.profileNameInput.focus();
    }

    function closeProfileEdit() {
        el.profileEditBox.style.display = "none";
        el.profileInfoView.style.display = "block";
        el.profileNameInput.value = "";
    }

    function updateProfileName() {
        const newName = el.profileNameInput.value.trim();
        const currentPhone = getCurrentSessionPhone();

        if (!newName) {
            showToast("Нэрээ оруулна уу.", "error");
            return;
        }

        if (!currentPhone) {
            showToast("Нэвтэрсэн хэрэглэгч олдсонгүй.", "error");
            return;
        }

        const users = getUsers();
        const userIndex = users.findIndex(
            (user) => String(user.phone || "").trim() === currentPhone
        );

        if (userIndex === -1) {
            showToast("Хэрэглэгчийн мэдээлэл олдсонгүй.", "error");
            return;
        }

        users[userIndex] = {
            ...users[userIndex],
            name: newName
        };

        saveUsers(users);

        const currentSession = getSessionUser() || {};
        saveSessionUser({
            ...currentSession,
            name: newName
        });

        state.currentUser = newName;
        saveAll();
        syncCurrentUserUI();
        closeProfileEdit();
        resetForm();
        renderAds();
        showToast("Нэр амжилттай шинэчлэгдлээ.", "success");
    }

    function syncProfileUI() {
        const sessionUser = getSessionUser();
        const loggedIn = hasCurrentUser();

        if (!el.profileBox) return;

        el.profileBox.style.display = loggedIn ? "block" : "none";

        if (!loggedIn) {
            closeProfileEdit();
            return;
        }

        const phone = sessionUser?.phone || "-";
        const role = state.currentRole || "viewer";
        const name = state.currentUser || "-";

        el.profileSummary.textContent = `${phone} • ${role}`;
        el.profileNameText.textContent = name;
        el.profilePhoneText.textContent = phone;
        el.profileRoleText.textContent = role;

        if (el.profileAvatar) {
            el.profileAvatar.textContent = name.charAt(0).toUpperCase() || "U";
        }
    }

    function syncCurrentUserUI() {
        const loggedIn = hasCurrentUser();

        el.currentUserInput.value = loggedIn ? state.currentUser : "";
        el.currentUserStatus.textContent = loggedIn
            ? `Одоогийн хэрэглэгч: ${state.currentUser} (${state.currentRole})`
            : "Одоогийн хэрэглэгч: нэвтрээгүй";

        el.clearUserBtn.disabled = !loggedIn;
        el.clearUserBtn.style.opacity = loggedIn ? "1" : "0.6";
        el.clearUserBtn.style.cursor = loggedIn ? "pointer" : "not-allowed";

        if (el.loginBtn) {
            el.loginBtn.style.display = loggedIn ? "none" : "inline-block";
        }

        if (el.logoutBtn) {
            el.logoutBtn.style.display = loggedIn ? "inline-block" : "none";
        }

        syncProfileUI();
    }

    function registerUser() {
        const name = el.authNameInput.value.trim();
        const phone = el.authPhoneInput.value.trim();
        const password = el.authPasswordInput.value.trim();
        const role = el.authRoleSelect.value;

        if (!name || !phone || !password) {
            showToast("Нэр, утасны дугаар, нууц үгээ бүрэн оруулна уу.", "error");
            return;
        }

        if (!/^\d{8}$/.test(phone)) {
            showToast("Утасны дугаар 8 оронтой байх ёстой.", "error");
            return;
        }

        const users = getUsers();
        const exists = users.some(
            (user) => String(user.phone || "").trim() === phone
        );

        if (exists) {
            showToast("Ийм утасны дугаартай хэрэглэгч бүртгэлтэй байна.", "error");
            return;
        }

        const newUser = {
            id: id(),
            name,
            phone,
            password,
            role,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);

        state.currentUser = name;
        state.currentRole = role;

        saveSessionUser({
            name,
            phone,
            role
        });

        saveAll();
        syncCurrentUserUI();
        closeAuthModal();
        resetForm();
        renderAds();
        showToast("Бүртгэл амжилттай үүслээ.", "success");
    }

    function loginUser() {
        const phone = el.authPhoneInput.value.trim();
        const password = el.authPasswordInput.value.trim();

        if (!phone || !password) {
            showToast("Утасны дугаар, нууц үгээ оруулна уу.", "error");
            return;
        }

        const users = getUsers();
        const foundUser = users.find(
            (user) =>
                String(user.phone || "").trim() === phone &&
                String(user.password) === password
        );

        if (!foundUser) {
            showToast("Утасны дугаар эсвэл нууц үг буруу байна.", "error");
            return;
        }

        state.currentUser = foundUser.name || foundUser.phone;
        state.currentRole = foundUser.role || "seller";

        saveSessionUser({
            name: foundUser.name || "",
            phone: foundUser.phone || "",
            role: state.currentRole
        });

        saveAll();
        closeProfileEdit();
        syncCurrentUserUI();
        closeAuthModal();
        resetForm();
        renderAds();
        showToast("Амжилттай нэвтэрлээ.", "success");
    }
    function logoutUser() {
        state.currentUser = "";
        state.currentRole = "viewer";
        state.viewMode = "all";
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(CURRENT_USER_KEY);
        localStorage.setItem(USER_ROLE_KEY, "viewer");

        syncCurrentUserUI();
        resetForm();
        renderAds();
        showToast("Системээс гарлаа.", "info");
    }

    function requireAuth(message = "Эхлээд нэвтэрнэ үү.") {
        if (hasCurrentUser()) return true;
        showToast(message, "error");
        openAuthModal("login");
        return false;
    }

    // -------------------------
    // Seed
    // -------------------------
    function seedAds() {
        return [
            {
                id: id(),
                title: "Prius 30 зарна",
                price: 28500000,
                location: "Баянхонгор",
                category: "Автомашин",
                description: "2012 он, гааль төлсөн, өнгө үзэмж сайн.",
                seller: "Бат",
                phone: "99112233",
                status: "Идэвхтэй",
                vip: true,
                top: false,
                views: 122,
                createdAt: new Date().toISOString(),
                images: ["https://placehold.co/600x400?text=Prius"]
            },
            {
                id: id(),
                title: "iPhone 13 Pro",
                price: 2400000,
                location: "Баянхонгор",
                category: "Утас, дугаар",
                description: "128GB, battery 88%, хайрцагтай.",
                seller: "Саруул",
                phone: "88119922",
                status: "Идэвхтэй",
                vip: false,
                top: true,
                views: 78,
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                images: ["https://placehold.co/600x400?text=iPhone"]
            },
            {
                id: id(),
                title: "2 өрөө байр яаралтай",
                price: 145000000,
                location: "Баянхонгор",
                category: "Үл хөдлөх",
                subcategory: "Үл хөдлөх зарна",
                description: "Төвд байрлалтай, дулаахан, зээлд хамруулж болно.",
                seller: "Отгон",
                phone: "99114455",
                status: "Зарагдсан",
                vip: false,
                top: false,
                views: 205,
                createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
                images: ["https://placehold.co/600x400?text=Apartment"]
            }
        ];
    }

    // -------------------------
    // Render card
    // -------------------------
    function getAdCardHTML(ad) {
        const safeId = Number(ad.id) || 0;
        return `
        <div class="ad-card ${ad.vip ? "vip-card" : ""} ${ad.top ? "top-card" : ""}">
            <a class="ad-link" href="detail.html?id=${ad.id}" data-view-id="${ad.id}">
                ${getImageHTML(ad)}
                <div class="ad-content">
                    <div class="ad-title">${escapeHtml(ad.title)}</div>
                    <div class="price">${formatPrice(ad.price)}</div>
                    <div class="location">${escapeHtml(ad.location)}</div>
                    <div class="category">${escapeHtml(ad.category)}</div>
                    <div class="description">${getShortDescription(ad.description)}</div>

                    <div class="meta-row">
                        <span>Нийтэлсэн: ${formatDate(ad.createdAt)}</span>
                        <span>Зар оруулагч: ${escapeHtml(ad.seller)}</span>
                    </div>

                    <div class="meta-row">
                        <span>👁 ${Number(ad.views || 0)} үзэлт</span>
                        <span>${escapeHtml(ad.phone || "")}</span>
                    </div>
                </div>
            </a>

            <div class="ad-content" style="padding-top:0;">
                <div class="card-actions">
                    <button class="fav-btn" type="button" data-fav-id="${ad.id}">
                        ${isFavorite(ad.id) ? "❤ Хадгалсан" : "🤍 Хадгалах"}
                    </button>

                    <button class="submit-btn" type="button" data-compare-id="${ad.id}">
                        ${isCompared(ad.id) ? "✓ Сонгосон" : "Харьцуулах"}
                    </button>

                    ${canManageAd(ad) ? `
                        <button class="edit-btn" type="button" data-edit-id="${ad.id}">Засах</button>
                        <button class="delete-btn" type="button" data-delete-id="${ad.id}">Устгах</button>
                    ` : ""}
                </div>
            </div>
        </div>
    `;
    }


    function renderSection(targetEl, title, titleClass, list) {
        if (!list.length) {
            targetEl.innerHTML = "";
            return;
        }
        targetEl.innerHTML = `
        <div class="list-section">
            <div class="list-section-title ${titleClass}">${title}</div>
            <div class="ads">${list.map(getAdCardHTML).join("")}</div>
        </div>
    `;
    }

    function syncSubcategoryPanel() {
        if (!el.subcategoryPanel) return;

        const shouldShow = state.activeCategory === "Үл хөдлөх";
        el.subcategoryPanel.classList.toggle("show", shouldShow);

        if (!shouldShow) {
            state.activeSubcategory = "all";
        }

        document.querySelectorAll(".subcategory-link").forEach((node) => {
            node.classList.toggle(
                "active",
                (node.dataset.subcategory || "all") === state.activeSubcategory
            );
        });
    }

    function renderStats() {
        const all = state.ads;
        el.totalAdsStat.textContent = String(all.length);
        el.vipAdsStat.textContent = String(all.filter((a) => a.vip).length);
        el.topAdsStat.textContent = String(all.filter((a) => a.top).length);

        if (el.activeAdsStat) {
            el.activeAdsStat.textContent = String(
                all.filter((a) => a.status === "Идэвхтэй").length
            );
        }

        el.soldAdsStat.textContent = String(
            all.filter((a) => a.status === "Зарагдсан").length
        );

        el.totalViewsStat.textContent = String(
            all.reduce((sum, a) => sum + Number(a.views || 0), 0)
        );
    }

    function renderCompareCount() {
        if (el.compareCountBadge) {
            el.compareCountBadge.textContent = String(state.compared.size);
        }
    }

    function renderFavoriteCount() {
        if (el.favoriteCountBadge) {
            el.favoriteCountBadge.textContent = String(state.favorites.size);
        }
    }

    function renderPagination(totalItems) {
        const totalPages = Math.max(1, Math.ceil(totalItems / state.pageSize));
        if (state.currentPage > totalPages) state.currentPage = totalPages;

        const prevDisabled = state.currentPage === 1 ? "disabled" : "";
        const nextDisabled = state.currentPage === totalPages ? "disabled" : "";

        let html = `<button class="page-btn" data-page="prev" ${prevDisabled}>Өмнөх</button>`;
        for (let p = 1; p <= totalPages; p += 1) {
            html += `<button class="page-btn ${p === state.currentPage ? "active" : ""}" data-page="${p}">${p}</button>`;
        }
        html += `<button class="page-btn" data-page="next" ${nextDisabled}>Дараах</button>`;
        el.pagination.innerHTML = html;

        if (el.pageInfo) {
            el.pageInfo.textContent = `${state.currentPage} / ${totalPages} хуудас`;
        }
    }

    function getFilterModeText() {
        const viewMap = {
            all: "Бүх зар",
            my: "Миний зарууд",
            favorites: "Таалагдсан"
        };

        const quickMap = {
            all: "Бүгд",
            vip: "VIP",
            top: "TOP",
            active: "Идэвхтэй",
            sold: "Зарагдсан"
        };

        const viewText = viewMap[state.viewMode] || "Бүх зар";
        const quickText = quickMap[state.quickFilter] || "Бүгд";

        if (state.quickFilter === "all") {
            return `Одоогийн горим: ${viewText}`;
        }

        return `Одоогийн горим: ${viewText} • Шүүлт: ${quickText}`;
    }

    function applyFilters() {
        const q = el.searchInput.value.trim().toLowerCase();
        const cat = el.categorySelect.value;
        const min = Number(el.minPriceInput.value || 0);
        const max = Number(el.maxPriceInput.value || 0);
        if (min > 0 && max > 0 && min > max) {
            showToast("Доод үнэ дээд үнээс их байж болохгүй.", "error");
            state.filteredAds = [];
            return;
        }
        const sort = el.sortSelect.value;

        let list = [...state.ads];

        if (state.viewMode === "my") {
            list = list.filter(isMyAd);
        }
        if (state.viewMode === "favorites") list = list.filter((a) => isFavorite(a.id));

        if (state.activeCategory !== "all") {
            list = list.filter((a) => a.category === state.activeCategory);
        }

        if (state.activeCategory === "Үл хөдлөх" && state.activeSubcategory !== "all") {
            list = list.filter((a) =>
                String(a.subcategory || "").trim() === state.activeSubcategory
            );
        }

        if (state.quickFilter === "vip") list = list.filter((a) => a.vip);
        if (state.quickFilter === "top") list = list.filter((a) => a.top);
        if (state.quickFilter === "active") list = list.filter((a) => a.status === "Идэвхтэй");
        if (state.quickFilter === "sold") list = list.filter((a) => a.status === "Зарагдсан");

        if (q) {
            list = list.filter((a) =>
                `${a.title} ${a.description} ${a.location} ${a.category} ${a.seller}`.toLowerCase().includes(q)
            );
        }

        if (cat !== "all") list = list.filter((a) => a.category === cat);
        if (min > 0) list = list.filter((a) => Number(a.price) >= min);
        if (max > 0) list = list.filter((a) => Number(a.price) <= max);

        list.sort((a, b) => {
            if (sort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
            if (sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
            if (sort === "price-low") return Number(a.price) - Number(b.price);
            if (sort === "price-high") return Number(b.price) - Number(a.price);
            if (sort === "vip-first") return Number(b.vip) - Number(a.vip);
            return 0;
        });

        state.filteredAds = list;
    }

    function renderAds() {
        applyFilters();

        const total = state.filteredAds.length;
        const start = (state.currentPage - 1) * state.pageSize;
        const pageItems = state.filteredAds.slice(start, start + state.pageSize);

        const top = pageItems.filter((a) => a.top);
        const vip = pageItems.filter((a) => a.vip && !a.top);
        const normal = pageItems.filter((a) => !a.vip && !a.top);

        renderSection(el.topSection, "TOP зарууд", "top-section-title", top);
        renderSection(el.vipSection, "VIP зарууд", "vip-section-title", vip);
        renderSection(el.normalSection, "Энгийн зарууд", "normal-section-title", normal);

        if (!total) {
            el.topSection.innerHTML = "";
            el.vipSection.innerHTML = "";

            const emptyText =
                state.viewMode === "favorites"
                    ? "Та одоогоор хадгалсан заргүй байна."
                    : state.viewMode === "my"
                        ? "Таны оруулсан зар одоогоор алга байна."
                        : "Тохирох зар олдсонгүй.";

            el.normalSection.innerHTML = `<div class="empty-box">${emptyText}</div>`;
        }

        el.resultsCount.textContent = `${total} зар`;
        el.filterModeText.textContent = getFilterModeText();
        renderPagination(total);
        renderStats();
        renderSearchHistory();
        renderCompareCount();
        renderFavoriteCount();
        saveUiState();

        if (el.addAdBtn) {
            el.addAdBtn.disabled = state.currentRole === "viewer";
            el.addAdBtn.style.opacity = state.currentRole === "viewer" ? "0.6" : "1";
            el.addAdBtn.style.cursor = state.currentRole === "viewer" ? "not-allowed" : "pointer";
        }

        syncTopModeButtons();
        syncCurrentUserUI();
        syncSubcategoryPanel();
    }
    // -------------------------
    // Search history
    // -------------------------
    function addSearchHistory(text) {
        const t = text.trim();
        if (!t) return;
        state.searchHistory = [t, ...state.searchHistory.filter((x) => x !== t)].slice(0, 8);
        saveStorageJson(SEARCH_HISTORY_KEY, state.searchHistory);
    }

    function renderSearchHistory() {
        if (!state.searchHistory.length) {
            el.searchHistoryBox.innerHTML = "";
            return;
        }

        el.searchHistoryBox.innerHTML = `
            ${state.searchHistory
                .map(
                    (h) =>
                        `<button class="history-chip" type="button" data-history="${escapeHtml(h)}">${escapeHtml(h)}</button>`
                )
                .join("")}
            <button class="history-chip clear-chip" type="button" data-clear-history="1">Түүх цэвэрлэх</button>
        `;
    }

    // -------------------------
    // Form
    // -------------------------
    function resetForm() {
        el.sellerInput.value = state.currentUser || "";
        el.sellerInput.readOnly = Boolean(state.currentUser);

        el.phoneInput.value = "";
        el.titleInput.value = "";
        el.priceInput.value = "";
        el.locationInput.value = "";
        el.newCategoryInput.value = "";
        el.statusInput.value = "Идэвхтэй";
        el.descriptionInput.value = "";
        el.vipInput.checked = false;
        el.topInput.checked = false;
        el.imageInput.value = "";
        state.imageFiles = [];
        el.imagePreviewBox.innerHTML = "";

        state.editingAdId = null;
        el.formTitle.textContent = "Шинэ зар нэмэх";
        el.editModeText.style.display = "none";
        el.cancelEditBtn.style.display = "none";
        el.addAdBtn.textContent = "Зар нэмэх";

        syncSubcategoryField();
    }
    function syncSubcategoryField() {
        const isRealEstate = el.newCategoryInput.value === "Үл хөдлөх";

        if (el.subcategoryRow) {
            el.subcategoryRow.style.display = isRealEstate ? "grid" : "none";
        }

        if (!isRealEstate && el.subcategoryInput) {
            el.subcategoryInput.value = "";
        }
    }

    function toDataUrl(file) {
        return new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(String(fr.result));
            fr.onerror = reject;
            fr.readAsDataURL(file);
        });
    }

    async function handleSubmitAd() {
        const seller = el.sellerInput.value.trim() || state.currentUser.trim();
        const phone = el.phoneInput.value.trim();
        const title = el.titleInput.value.trim();
        const price = Number(el.priceInput.value.replaceAll(",", "").trim());
        const location = el.locationInput.value.trim();
        const category = el.newCategoryInput.value;
        const subcategory = el.subcategoryInput.value;
        const status = el.statusInput.value;
        const description = el.descriptionInput.value.trim();
        const vip = el.vipInput.checked;
        const top = el.topInput.checked;

        if (!seller || !title || !price || !location || !category || !description) {
            showToast("Зар оруулагчийн нэр болон бусад мэдээллээ бүрэн оруулна уу.", "error");
            return;
        }

        if (category === "Үл хөдлөх" && !subcategory) {
            showToast("Үл хөдлөх төрлөө сонгоно уу.", "error");
            return;
        }

        let newImages = [];
        if (state.imageFiles.length) {
            newImages = await Promise.all(state.imageFiles.map(toDataUrl));
        }

        if (state.editingAdId) {
            const idx = state.ads.findIndex((a) => Number(a.id) === Number(state.editingAdId));
            if (idx === -1) return;

            const old = state.ads[idx];
            state.ads[idx] = {
                ...old,
                seller,
                phone,
                title,
                price,
                location,
                category,
                subcategory,
                status,
                description,
                vip,
                top,
                images: newImages.length ? newImages : old.images
            };
            showToast("Зар амжилттай засагдлаа.", "success");
        } else {
            state.ads.unshift({
                id: id(),
                seller,
                phone,
                title,
                price,
                location,
                category,
                subcategory,
                status,
                description,
                vip,
                top,
                views: 0,
                createdAt: new Date().toISOString(),
                images: newImages.length ? newImages : ["https://placehold.co/600x400?text=New+Ad"]
            });
            showToast("Шинэ зар нэмэгдлээ.", "success");
        }

        saveAll();
        resetForm();
        closeAddAdModal();
        state.currentPage = 1;
        renderAds();
    }

    function startEditAd(adId) {
        const ad = state.ads.find((a) => Number(a.id) === Number(adId));
        if (!ad) return;

        state.editingAdId = ad.id;
        el.formTitle.textContent = "Зар засах";
        el.editModeText.style.display = "block";
        el.cancelEditBtn.style.display = "inline-block";
        el.addAdBtn.textContent = "Хадгалах";

        el.sellerInput.value = ad.seller || "";
        el.phoneInput.value = ad.phone || "";
        el.titleInput.value = ad.title || "";
        el.priceInput.value = ad.price || "";
        el.locationInput.value = ad.location || "";
        el.newCategoryInput.value = ad.category || "";
        el.subcategoryInput.value = ad.subcategory || "";
        el.statusInput.value = ad.status || "Идэвхтэй";
        el.descriptionInput.value = ad.description || "";
        el.vipInput.checked = Boolean(ad.vip);
        el.topInput.checked = Boolean(ad.top);

        el.imageInput.value = "";
        state.imageFiles = [];
        el.imagePreviewBox.innerHTML = (ad.images || [])
            .map((src) => `<img src="${escapeHtml(src)}" alt="preview">`)
            .join("");

        openAddAdModal();
        syncSubcategoryField();
    }

    function openAddAdModal() {
        if (el.sellerInput) {
            el.sellerInput.value = state.currentUser || "";
            el.sellerInput.readOnly = Boolean(state.currentUser);
        }

        if (el.addAdModal) {
            el.addAdModal.classList.add("show");
            document.body.classList.add("modal-open");
        }
    }

    function closeAddAdModal() {
        if (el.addAdModal) {
            el.addAdModal.classList.remove("show");
            document.body.classList.remove("modal-open");
        }
    }

    // -------------------------
    // Delete modal
    // -------------------------
    function openDeleteModal(adId) {
        const ad = state.ads.find((x) => Number(x.id) === Number(adId));
        if (!ad) return;
        state.pendingDeleteId = ad.id;
        el.deleteModalText.innerHTML = `<strong>${escapeHtml(ad.title)}</strong> зарыг устгах уу?`;

        el.deleteModal.classList.add("show");
    }

    function closeDeleteModal() {
        state.pendingDeleteId = null;
        el.deleteModal.classList.remove("show");
    }

    function deleteAd(adId) {
        state.ads = state.ads.filter((a) => Number(a.id) !== Number(adId));
        state.favorites.delete(Number(adId));
        state.compared.delete(Number(adId));
        saveAll();
        renderAds();
        showToast("Зар устгагдлаа.", "success");
    }

    // -------------------------
    // Favorite / compare
    // -------------------------
    function toggleFavorite(adId) {
        if (!requireAuth("Зар хадгалахын тулд нэвтэрнэ үү.")) return;
        const idNum = Number(adId);
        if (state.favorites.has(idNum)) {
            state.favorites.delete(idNum);
            showToast("Таалагдсан жагсаалтаас хаслаа.", "info");
        } else {
            state.favorites.add(idNum);
            showToast("Таалагдсан жагсаалтад нэмлээ.", "success");
        }
        saveAll();
        renderAds();
    }

    function toggleCompare(adId) {
        const idNum = Number(adId);
        if (state.compared.has(idNum)) {
            state.compared.delete(idNum);
            showToast("Харьцуулах жагсаалтаас хаслаа.", "info");
        } else {
            if (state.compared.size >= 4) {
                showToast("Хамгийн ихдээ 4 зарыг харьцуулна.", "error");
                return;
            }
            if (state.compared.size >= 4) {
                showToast("Хамгийн ихдээ 4 зарыг харьцуулна.", "error");
                renderCompareCount();
                return;
            }
            state.compared.add(idNum);
            showToast("Харьцуулах жагсаалтад нэмлээ.", "success");
        }
        saveAll();
        renderAds();
    }

    // -------------------------
    // Inbox / compare modal
    // -------------------------
    function openInbox() {
        const raw = localStorage.getItem(INBOX_KEY);
        let messages = [];

        try {
            messages = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(messages)) messages = [];
        } catch {
            messages = [];
        }

        const currentSeller = String(state.currentUser || "").trim().toLowerCase();
        const filteredMessages = messages.filter(
            (m) => String(m.sellerName || "").trim().toLowerCase() === currentSeller
        );

        el.inboxList.innerHTML = filteredMessages.length
            ? filteredMessages
                .slice(0, 20)
                .map(
                    (m) => `
                <div class="inbox-item">
                    <div class="inbox-item-title">${escapeHtml(m.adTitle || "Гарчиггүй зар")}</div>
                    <div class="inbox-item-meta">
                        ${escapeHtml(m.buyerName || "Хэрэглэгч")} → ${escapeHtml(m.sellerName || "Зар оруулагч")}
                        • ${escapeHtml(m.createdAt || "")}
                    </div>
                    <div class="inbox-item-message">${escapeHtml(m.message || "")}</div>
                </div>
            `
                )
                .join("")
            : `<div class="empty-box">Таны inbox хоосон байна.</div>`;

        el.inboxModal.classList.add("show");
    }

    function openCompare() {
        const comparedIds = [...state.compared];
        const ads = comparedIds
            .map((id) => state.ads.find((a) => Number(a.id) === Number(id)))
            .filter(Boolean);

        if (!ads.length) {
            el.compareContent.innerHTML = `<div class="empty-box">Харьцуулах зар сонгогдоогүй байна.</div>`;
            el.compareModal.classList.add("show");
            return;
        }

        const rows = [
            ["Нэр", (a) => a.title],
            ["Үнэ", (a) => formatPrice(a.price)],
            ["Ангилал", (a) => a.category],
            ["Байршил", (a) => a.location],
            ["Төлөв", (a) => a.status],
            ["VIP/TOP", (a) => `${a.vip ? "VIP" : "-"} ${a.top ? "TOP" : ""}`.trim() || "-"],
            ["Үзэлт", (a) => String(a.views || 0)]
        ];

        const head = ads.map((a) => `<th>${escapeHtml(a.title)}</th>`).join("");
        const body = rows
            .map(
                ([label, fn]) => `
            <tr>
                <th>${escapeHtml(label)}</th>
                ${ads.map((ad) => `<td>${escapeHtml(fn(ad))}</td>`).join("")}
            </tr>
        `
            )
            .join("");

        el.compareContent.innerHTML = `
        <div style="display:flex; justify-content:flex-end; margin-bottom:10px;">
            <button id="clearCompareBtn" class="my-ads-btn secondary" type="button">Бүгдийг цэвэрлэх</button>
        </div>
        <table class="compare-table">
            <tr><th>Шинж</th>${head}</tr>
            ${body}
        </table>
    `;

        el.compareModal.classList.add("show");
    }

    // -------------------------
    // Theme
    // -------------------------
    function applyTheme(theme) {
        const dark = theme === "dark";
        document.body.classList.toggle("dark-mode", dark);
        el.themeToggleBtn.textContent = dark ? "Light mode" : "Dark mode";
    }

    function toggleTheme() {
        const isDark = document.body.classList.contains("dark-mode");
        const next = isDark ? "light" : "dark";
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
    }

    // -------------------------
    // Save/load
    // -------------------------
    function saveAll() {
        saveStorageJson(ADS_KEY, state.ads);
        saveStorageJson(FAVORITES_KEY, [...state.favorites]);
        saveStorageJson(COMPARED_KEY, [...state.compared]);
        localStorage.setItem(CURRENT_USER_KEY, state.currentUser || "");
        localStorage.setItem(USER_ROLE_KEY, state.currentRole || "seller");
    }

    function saveUiState() {
        saveStorageJson(UI_STATE_KEY, {
            viewMode: state.viewMode,
            quickFilter: state.quickFilter,
            activeCategory: state.activeCategory,
            activeSubcategory: state.activeSubcategory,
            currentPage: state.currentPage
        });
    }

    function loadAll() {
        const legacyAds = localStorage.getItem("bayankhongor_ads");
        if (!localStorage.getItem(ADS_KEY) && legacyAds) {
            localStorage.setItem(ADS_KEY, legacyAds);
        }

        const ads = getStorageJson(ADS_KEY, []);
        state.ads = ads.length ? ads : seedAds();

        state.ads = state.ads.map((ad) => {
            const normalizedCategory = String(ad.category || "").trim();

            if (normalizedCategory === "Үл хөдлөх" && !String(ad.subcategory || "").trim()) {
                return {
                    ...ad,
                    subcategory: "Үл хөдлөх зарна"
                };
            }

            return ad;
        });

        saveStorageJson(ADS_KEY, state.ads);

        state.favorites = new Set(getStorageJson(FAVORITES_KEY, []));
        state.compared = new Set(getStorageJson(COMPARED_KEY, []));
        state.searchHistory = getStorageJson(SEARCH_HISTORY_KEY, []);

        const sessionUser = getSessionUser();

        if (sessionUser && (sessionUser.name || sessionUser.phone)) {
            state.currentUser = sessionUser.name || sessionUser.phone || "";
            state.currentRole = sessionUser.role || "seller";
        } else {
            state.currentUser = "";
            state.currentRole = "viewer";
        }

        const ui = getStorageJson(UI_STATE_KEY, null);
        if (ui && typeof ui === "object") {
            if (ui.viewMode) state.viewMode = ui.viewMode;
            if (ui.quickFilter) state.quickFilter = ui.quickFilter;
            if (ui.activeCategory) state.activeCategory = ui.activeCategory;
            if (ui.activeSubcategory) state.activeSubcategory = ui.activeSubcategory;
            if (ui.currentPage) state.currentPage = Number(ui.currentPage) || 1;
        }

        const theme = localStorage.getItem(THEME_KEY) || "light";
        applyTheme(theme);
    }
    function bindEvents() {
        el.saveUserBtn.addEventListener("click", () => {
            openAuthModal("login");
        });

        if (el.loginBtn) {
            el.loginBtn.addEventListener("click", () => {
                openAuthModal("login");
            });
        }

        if (el.logoutBtn) {
            el.logoutBtn.addEventListener("click", () => {
                if (!hasCurrentUser()) {
                    showToast("Одоогоор нэвтэрсэн хэрэглэгч алга байна.", "info");
                    return;
                }

                logoutUser();
            });
        }

        if (el.toggleProfileEditBtn) {
            el.toggleProfileEditBtn.addEventListener("click", () => {
                if (!hasCurrentUser()) {
                    showToast("Эхлээд нэвтэрнэ үү.", "error");
                    return;
                }
                openProfileEdit();
            });
        }

        if (el.saveProfileBtn) {
            el.saveProfileBtn.addEventListener("click", updateProfileName);
        }

        if (el.cancelProfileEditBtn) {
            el.cancelProfileEditBtn.addEventListener("click", closeProfileEdit);
        }

        if (el.currentUserInput) {
            el.currentUserInput.addEventListener("click", () => {
                openAuthModal("login");
            });
        }

        el.clearUserBtn.addEventListener("click", () => {
            if (!hasCurrentUser()) {
                showToast("Одоогоор нэвтэрсэн хэрэглэгч алга байна.", "info");
                return;
            }
            logoutUser();
        });

        if (el.newCategoryInput) {
            el.newCategoryInput.addEventListener("change", syncSubcategoryField);
        }

        el.authModeSelect.addEventListener("change", syncAuthModeUI);

        el.authSubmitBtn.addEventListener("click", () => {
            if (state.authMode === "register") {
                registerUser();
            } else {
                loginUser();
            }
        });

        el.closeAuthModalBtn.addEventListener("click", closeAuthModal);

        el.clearUserBtn.addEventListener("click", () => {
            state.currentUser = "";
            el.currentUserInput.value = "";
            localStorage.removeItem(CURRENT_USER_KEY);
            el.currentUserStatus.textContent = "Одоогийн хэрэглэгч: сонгогдоогүй";
            state.viewMode = "all";
            el.sellerInput.readOnly = false;
            renderAds();
        });

        el.showMyAdsBtn.addEventListener("click", () => {
            if (!requireAuth("Миний заруудыг харахын тулд нэвтэрнэ үү.")) return;
            state.viewMode = "my";
            state.currentPage = 1;
            renderAds();
        });

        el.showAllAdsBtn.addEventListener("click", () => {
            state.viewMode = "all";
            state.currentPage = 1;

            if (el.sellerInput) {
                el.sellerInput.readOnly = false;
            }

            renderAds();
        });

        el.showFavoritesBtn.addEventListener("click", () => {
            if (!requireAuth("Таалагдсан заруудаа харахын тулд нэвтэрнэ үү.")) return;
            state.viewMode = "favorites";
            state.currentPage = 1;
            el.sellerInput.readOnly = false;
            renderAds();
        });
        el.openInboxBtn.addEventListener("click", () => {
            if (!requireAuth("Inbox харахын тулд нэвтэрнэ үү.")) return;
            openInbox();
        });
        el.openCompareBtn.addEventListener("click", openCompare);
        el.themeToggleBtn.addEventListener("click", toggleTheme);

        if (el.openAddAdModalBtn) {
            el.openAddAdModalBtn.addEventListener("click", () => {
                if (state.currentRole === "viewer") {
                    showToast("Зар нэмэхийн тулд эхлээд нэвтэрнэ үү.", "error");
                    return;
                }

                resetForm();
                openAddAdModal();
            });
        }

        if (el.closeAddAdModalBtn) {
            el.closeAddAdModalBtn.addEventListener("click", () => {
                resetForm();
                closeAddAdModal();
            });
        }

        el.searchBtn.addEventListener("click", () => {
            addSearchHistory(el.searchInput.value);
            state.currentPage = 1;
            renderAds();
        });

        if (el.resetFilterBtn) {
            el.resetFilterBtn.addEventListener("click", () => {
                el.searchInput.value = "";
                el.categorySelect.value = "all";
                el.minPriceInput.value = "";
                el.maxPriceInput.value = "";
                el.sortSelect.value = "newest";

                state.activeCategory = "all";
                state.quickFilter = "all";
                state.currentPage = 1;
                state.activeSubcategory = "all";

                document.querySelectorAll(".category-item, .top-category-item").forEach((n) => {
                    n.classList.remove("active");
                });

                document.querySelectorAll('.category-item[data-category="all"], .top-category-item[data-category="all"]')
                    .forEach((node) => node.classList.add("active"));

                document.querySelectorAll(".quick-filter-btn").forEach((n) => n.classList.remove("active"));
                const allQuick = document.querySelector('.quick-filter-btn[data-quick="all"]');
                if (allQuick) allQuick.classList.add("active");

                renderAds();
                showToast("Шүүлт цэвэрлэгдлээ.", "info");
            });
        }

        el.searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                addSearchHistory(el.searchInput.value);
                state.currentPage = 1;
                renderAds();
            }
        });

        document.querySelectorAll(".category-item, .top-category-item").forEach((node) => {
            node.addEventListener("click", (e) => {
                if (e.target.closest(".subcategory-link")) return;

                const category = node.dataset.category || "all";

                document.querySelectorAll(".category-item").forEach((n) => {
                    n.classList.toggle("active", (n.dataset.category || "all") === category);
                });

                document.querySelectorAll(".top-category-item").forEach((n) => {
                    n.classList.toggle("active", (n.dataset.category || "all") === category);
                });

                state.activeCategory = category;
                state.activeSubcategory = "all";
                state.currentPage = 1;
                renderAds();
            });
        });

        document.querySelectorAll(".quick-filter-btn").forEach((node) => {
            node.addEventListener("click", () => {
                document.querySelectorAll(".quick-filter-btn").forEach((n) => n.classList.remove("active"));
                node.classList.add("active");
                state.quickFilter = node.dataset.quick || "all";
                state.currentPage = 1;
                renderAds();
            });
        });

        el.addAdBtn.addEventListener("click", () => {
            if (!requireAuth("Зар нэмэхийн тулд нэвтэрнэ үү.")) return;

            if (state.currentRole === "viewer") {
                showToast("Viewer role зар нэмэх эрхгүй.", "error");
                return;
            }

            handleSubmitAd();
        });
        el.cancelEditBtn.addEventListener("click", () => {
            resetForm();
            closeAddAdModal();
        });

        el.imageInput.addEventListener("change", () => {
            state.imageFiles = Array.from(el.imageInput.files || []);
            el.imagePreviewBox.innerHTML = "";
            state.imageFiles.forEach((file) => {
                const url = URL.createObjectURL(file);
                const img = document.createElement("img");
                img.src = url;
                img.alt = "preview";
                img.onload = () => URL.revokeObjectURL(url);
                el.imagePreviewBox.appendChild(img);
            });
        });

        el.closeInboxModal.addEventListener("click", () => el.inboxModal.classList.remove("show"));
        el.closeCompareModal.addEventListener("click", () => el.compareModal.classList.remove("show"));
        el.closeDeleteModal.addEventListener("click", closeDeleteModal);
        el.cancelDeleteBtn.addEventListener("click", closeDeleteModal);

        el.confirmDeleteBtn.addEventListener("click", () => {
            if (state.pendingDeleteId != null) {
                deleteAd(state.pendingDeleteId);
            }
            closeDeleteModal();
        });

        window.addEventListener("click", (e) => {
            if (e.target === el.inboxModal) el.inboxModal.classList.remove("show");
            if (e.target === el.compareModal) el.compareModal.classList.remove("show");
            if (e.target === el.deleteModal) closeDeleteModal();
            if (e.target === el.addAdModal) {
                resetForm();
                closeAddAdModal();
            }
            if (e.target === el.mobileCategoriesModal) closeMobileCategoriesModal();
        });

        if (el.priceInput) {
            el.priceInput.addEventListener("input", () => {
                const digits = String(el.priceInput.value || "").replace(/\D/g, "");
                if (!digits) {
                    el.priceInput.value = "";
                    return;
                }

                const formatted = Number(digits).toLocaleString("en-US");
                el.priceInput.value = formatted;
            });
        }

        // Delegation for dynamic buttons/cards
        document.addEventListener("click", (e) => {
            const favBtn = e.target.closest("[data-fav-id]");
            if (favBtn) {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(favBtn.dataset.favId);
                return;
            }

            const compareBtn = e.target.closest("[data-compare-id]");
            if (compareBtn) {
                e.preventDefault();
                e.stopPropagation();
                toggleCompare(compareBtn.dataset.compareId);
                return;
            }

            const clearCompareBtn = e.target.closest("#clearCompareBtn");
            if (clearCompareBtn) {
                state.compared.clear();
                saveAll();
                openCompare();
                renderAds();
                showToast("Харьцуулах жагсаалт цэвэрлэгдлээ.", "info");
                return;
            }

            const editBtn = e.target.closest("[data-edit-id]");
            if (editBtn) {
                e.preventDefault();
                e.stopPropagation();

                const adForEdit = state.ads.find((a) => Number(a.id) === Number(editBtn.dataset.editId));
                if (!adForEdit || !canManageAd(adForEdit)) {
                    showToast("Танд энэ зарыг засах эрх алга.", "error");
                    return;
                }

                startEditAd(editBtn.dataset.editId);
                return;
            }


            const deleteBtn = e.target.closest("[data-delete-id]");
            if (deleteBtn) {
                e.preventDefault();
                e.stopPropagation();

                const adForDelete = state.ads.find((a) => Number(a.id) === Number(deleteBtn.dataset.deleteId));
                if (!adForDelete || !canManageAd(adForDelete)) {
                    showToast("Танд энэ зарыг устгах эрх алга.", "error");
                    return;
                }

                openDeleteModal(deleteBtn.dataset.deleteId);
                return;
            }

            const pageBtn = e.target.closest("[data-page]");
            if (pageBtn) {
                const v = pageBtn.dataset.page;
                const totalPages = Math.max(1, Math.ceil(state.filteredAds.length / state.pageSize));
                if (v === "prev" && state.currentPage > 1) state.currentPage -= 1;
                else if (v === "next" && state.currentPage < totalPages) state.currentPage += 1;
                else if (!Number.isNaN(Number(v))) state.currentPage = Number(v);
                renderAds();
                return;
            }

            const historyChip = e.target.closest("[data-history]");
            if (historyChip) {
                el.searchInput.value = historyChip.dataset.history || "";
                state.currentPage = 1;
                renderAds();
                return;
            }

            const clearHistory = e.target.closest("[data-clear-history]");
            if (clearHistory) {
                state.searchHistory = [];
                saveStorageJson(SEARCH_HISTORY_KEY, []);
                renderSearchHistory();
                return;
            }
        });

        // Count view when entering detail link
        document.addEventListener("click", (e) => {
            const link = e.target.closest("a.ad-link[data-view-id]");
            if (!link) return;
            const adId = Number(link.dataset.viewId);
            const ad = state.ads.find((a) => Number(a.id) === adId);
            if (!ad) return;
            ad.views = Number(ad.views || 0) + 1;
            saveStorageJson(ADS_KEY, state.ads);
        });

        document.querySelectorAll(".subcategory-link").forEach((node) => {
            node.addEventListener("click", () => {
                state.activeSubcategory = node.dataset.subcategory || "all";
                state.currentPage = 1;
                renderAds();
            });
        });
    }

    function init() {
        loadAll();
        syncCurrentUserUI();

        if (el.roleSelect) {
            el.roleSelect.value = state.currentRole || "seller";
        }

        bindEvents();
        document.querySelectorAll(".quick-filter-btn").forEach((n) => n.classList.remove("active"));
        const activeQuick = document.querySelector(`.quick-filter-btn[data-quick="${state.quickFilter}"]`);
        if (activeQuick) activeQuick.classList.add("active");

        document.querySelectorAll(".category-item, .top-category-item").forEach((n) => {
            n.classList.remove("active");
        });

        const activeCategoryNodes = document.querySelectorAll(
            `.category-item[data-category="${state.activeCategory}"], .top-category-item[data-category="${state.activeCategory}"]`
        );

        activeCategoryNodes.forEach((node) => node.classList.add("active"));
        resetForm();
        renderAds();
        renderCompareCount();
        renderFavoriteCount();
    }

    function syncTopModeButtons() {
        el.showAllAdsBtn.classList.remove("active");
        el.showMyAdsBtn.classList.remove("active");
        el.showFavoritesBtn.classList.remove("active");

        if (state.viewMode === "all") el.showAllAdsBtn.classList.add("active");
        if (state.viewMode === "my") el.showMyAdsBtn.classList.add("active");
        if (state.viewMode === "favorites") el.showFavoritesBtn.classList.add("active");
    }

    init();
    syncTopModeButtons();
})();
