"use client";

import { useId, useState } from "react";

const TABS = [
  { id: "posts", label: "Posts", icon: "ri-file-list-3-line" },
  { id: "categories", label: "Categories", icon: "ri-price-tag-3-line" },
];

export default function DashboardTabs({
  posts,
  categories,
  canManageCategories = false,
}) {
  const [activeTab, setActiveTab] = useState("posts");
  const baseId = useId();

  const tabs = canManageCategories
    ? TABS
    : TABS.filter((tab) => tab.id === "posts");
  const activePanel = activeTab === "categories" && canManageCategories
    ? "categories"
    : "posts";

  function handleKeyDown(event) {
    if (!canManageCategories) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();

    const nextPanel = activePanel === "posts" ? "categories" : "posts";
    setActiveTab(nextPanel);
    document.getElementById(`${baseId}-${nextPanel}-tab`)?.focus();
  }

  return (
    <div className="dashboard-tabs">
      <div
        className="dashboard-tab-list"
        role="tablist"
        aria-label="Tampilan dashboard"
        onKeyDown={handleKeyDown}
      >
        {tabs.map((tab) => {
          const isActive = activePanel === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${baseId}-${tab.id}-tab`}
              aria-selected={isActive}
              aria-controls={`${baseId}-${tab.id}-panel`}
              tabIndex={isActive ? 0 : -1}
              className={`dashboard-tab ${isActive ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={tab.icon} aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-${activePanel}-panel`}
        aria-labelledby={`${baseId}-${activePanel}-tab`}
        className="dashboard-tab-panel"
      >
        {activePanel === "categories" ? categories : posts}
      </div>
    </div>
  );
}
