"use client";

import React from "react";

type FloorPlanEditorSectionProps = {
  id: string;
  title: string;
  openSection: string;
  setOpenSection: React.Dispatch<React.SetStateAction<string>>;
  children: React.ReactNode;
};

export default function FloorPlanEditorSection({
  id,
  title,
  openSection,
  setOpenSection,
  children
}: FloorPlanEditorSectionProps) {
  const isOpen = openSection === id;

  return (
    <div style={{ marginBottom: "14px" }}>
      <button
        type="button"
        onClick={() => setOpenSection(isOpen ? "" : id)}
        style={{
          width: "100%",
          textAlign: "left",
          fontWeight: 700,
          fontSize: "16px",
          padding: "12px 14px",
          borderRadius: "14px",
          cursor: "pointer",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <span>{title}</span>
        <span style={{ fontSize: "20px", lineHeight: 1 }}>
          {isOpen ? "-" : "+"}
        </span>
      </button>

      {isOpen ? <div style={{ marginTop: "12px" }}>{children}</div> : null}
    </div>
  );
}