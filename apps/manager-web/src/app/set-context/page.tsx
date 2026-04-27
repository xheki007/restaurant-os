"use client";

import { useEffect } from "react";

export default function SetContextPage() {
  useEffect(() => {
    localStorage.setItem("tenantId", "cmocvsx2r0000xsvlzty3goyo");
    localStorage.setItem("branchId", "cmocvsx2v0002xsvlz7q2i5wy");

    window.location.href = "/de";
  }, []);

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#020617",
      color: "white",
      fontFamily: "Arial, sans-serif"
    }}>
      <div>
        <h1>Setting tenant context...</h1>
        <p>Tenant: antica-real-test-1</p>
        <p>Branch: Main Branch / Freiburg</p>
      </div>
    </main>
  );
}