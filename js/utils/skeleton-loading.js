/**
 * REUSABLE SKELETON LOADING SYSTEM
 * Hotel Check-In Management System
 */

export function showSkeleton(target, options = {}) {
    const container = typeof target === "string"
        ? document.querySelector(target)
        : target;

    if (!container) {
        console.warn("Skeleton target not found:", target);
        return;
    }

    // Prevent duplicate skeletons
    if (container.querySelector(":scope > .skeleton-overlay")) {
        return;
    }

    const {
        count = 3,
        type = "list"
    } = options;

    container.classList.add("skeleton-loading");
    container.setAttribute("aria-busy", "true");

    const overlay = document.createElement("div");
    overlay.className = "skeleton-overlay";
    overlay.setAttribute("aria-hidden", "true");

    for (let i = 0; i < count; i++) {

        if (type === "cards") {
            const card = document.createElement("div");
            card.className = "skeleton-card";
            overlay.appendChild(card);
        } else {
            const row = document.createElement("div");
            row.className = "skeleton-row";

            const avatar = document.createElement("div");
            avatar.className = "skeleton-avatar";

            const content = document.createElement("div");
            content.className = "skeleton-content";

            const line1 = document.createElement("div");
            line1.className = "skeleton-line medium";

            const line2 = document.createElement("div");
            line2.className = "skeleton-line short";

            content.appendChild(line1);
            content.appendChild(line2);

            row.appendChild(avatar);
            row.appendChild(content);

            overlay.appendChild(row);
        }
    }

    container.appendChild(overlay);
}


/**
 * Remove Skeleton Loading
 */
export function hideSkeleton(target) {
    const container = typeof target === "string"
        ? document.querySelector(target)
        : target;

    if (!container) return;

    const overlay = container.querySelector(
        ":scope > .skeleton-overlay"
    );

    if (overlay) {
        overlay.remove();
    }

    container.classList.remove("skeleton-loading");
    container.removeAttribute("aria-busy");
}


/**
 * Run loading while waiting for data
 */
export async function withSkeleton(target, callback, options = {}) {
    showSkeleton(target, options);

    try {
        return await callback();
    } finally {
        hideSkeleton(target);
    }
}