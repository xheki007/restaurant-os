"use client";

import React from "react";

export type ReservationTooltipStatus = "PENDING" | "CONFIRMED" | "SEATED" | null;

export type FloorPlanReservationTooltipProps = {
  visible: boolean;
  x: number;
  y: number;
  title: string;
  subtitle?: string;
  status: ReservationTooltipStatus;
  partySize?: number;
  startAt?: string;
  endAt?: string;
  confirmationCode?: string;
};

function formatShortTime(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getStatusLabel(status: ReservationTooltipStatus) {
  if (status === "SEATED") {
    return "Seated";
  }

  if (status === "CONFIRMED") {
    return "Confirmed";
  }

  if (status === "PENDING") {
    return "Pending";
  }

  return "Available";
}

function getStatusColor(status: ReservationTooltipStatus) {
  if (status === "SEATED") {
    return "#7f1d1d";
  }

  if (status === "CONFIRMED") {
    return "#dc2626";
  }

  if (status === "PENDING") {
    return "#f59e0b";
  }

  return "#2563eb";
}

export default function FloorPlanReservationTooltip({
  visible,
  x,
  y,
  title,
  subtitle,
  status,
  partySize,
  startAt,
  endAt,
  confirmationCode
}: FloorPlanReservationTooltipProps) {
  if (!visible) {
    return null;
  }

  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);
  const timeLabel =
    startAt && endAt
      ? formatShortTime(startAt) + " - " + formatShortTime(endAt)
      : startAt
        ? formatShortTime(startAt)
        : "";

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate3d(12px, -12px, 0)",
        minWidth: "240px",
        maxWidth: "280px",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(2,8,23,0.96)",
        color: "#ffffff",
        boxShadow: "0 18px 48px rgba(0,0,0,0.35)",
        padding: "12px 14px",
        zIndex: 20,
        pointerEvents: "none",
        backdropFilter: "blur(10px)"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          marginBottom: "8px"
        }}
      >
        <div
          style={{
            fontSize: "13px",
            fontWeight: 800,
            lineHeight: 1.2
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            lineHeight: 1,
            padding: "6px 8px",
            borderRadius: "999px",
            background: statusColor,
            color: "#ffffff",
            whiteSpace: "nowrap"
          }}
        >
          {statusLabel}
        </div>
      </div>

      {subtitle ? (
        <div
          style={{
            fontSize: "11px",
            color: "rgba(255,255,255,0.70)",
            marginBottom: "10px"
          }}
        >
          {subtitle}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gap: "6px",
          fontSize: "12px",
          lineHeight: 1.35
        }}
      >
        {partySize ? (
          <div>
            <strong>Guests:</strong> {partySize}
          </div>
        ) : null}

        {timeLabel ? (
          <div>
            <strong>Time:</strong> {timeLabel}
          </div>
        ) : null}

        {confirmationCode ? (
          <div>
            <strong>Code:</strong> {confirmationCode}
          </div>
        ) : null}
      </div>
    </div>
  );
}