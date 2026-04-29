"use client";

import { useEffect } from "react";

export default function SetContextPage() {
  useEffect(() => {
    localStorage.setItem("tenantId", "cmoivcmyq00010i6dwloahdi7");
    localStorage.setItem("branchId", "cmoivcmz200030i6dt17uimwj");

    window.location.href = "/sq/dashboard";
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
        <p>Tenant: Restaurant Antica</p>
        <p>Branch: Main Branch</p>
      </div>
    </main>
  );
}
