// pages/index.tsx
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

interface TrialData {
  email: string;
  startDate: number;
  expiryDate: number;
  status: "active" | "expired";
}

export default function LandingPage() {
  const router = useRouter();
  const [userStatus, setUserStatus] = useState<"loading" | "new" | "trial" | "expired" | "paid">("loading");
  const [isClient, setIsClient] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(0);

  useEffect(() => setIsClient(true), []);

  const getTrialData = (): TrialData | null => {
    try {
      const trial = localStorage.getItem("bookfoldar_trial");
      return trial ? JSON.parse(trial) : null;
    } catch (error) {
      console.error("Error parsing trial data:", error);
      localStorage.removeItem("bookfoldar_trial");
      return null;
    }
  };

  const calculateTrialDaysRemaining = (trialData: TrialData) =>
    Math.max(0, Math.ceil((trialData.expiryDate - Date.now()) / (1000 * 60 * 60 * 24)));

  const isTrialActive = (trialData: TrialData) => Date.now() < trialData.expiryDate && trialData.status === "active";

  const checkUserAccess = async (emailToCheck?: string) => {
    const checkEmail = emailToCheck || localStorage.getItem("userEmail");

    if (checkEmail) {
      try {
        const response = await fetch("/api/check-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: checkEmail }),
        });

        if (!response.ok) {
          console.error("Failed to fetch subscription:", await response.text());
          setUserStatus("new");
          return;
        }

        const data = await response.json();

        if (data?.status?.hasActiveSubscription) {
          setUserEmail(checkEmail);
          setUserStatus("paid");
          localStorage.setItem("userEmail", checkEmail);
          return;
        }

        if (data?.status?.trialActive) {
          setUserEmail(checkEmail);
          setUserStatus("trial");
          setTrialDaysRemaining(data.status.trialDaysRemaining || 0);
          localStorage.setItem("userEmail", checkEmail);
          return;
        }

        setUserStatus("expired");
        return;
      } catch (error) {
        console.error("Error checking access:", error);
      }
    }

    const trialData = getTrialData();
    if (trialData) {
      setUserEmail(trialData.email);
      const daysRemaining = calculateTrialDaysRemaining(trialData);
      setTrialDaysRemaining(daysRemaining);
      setUserStatus(isTrialActive(trialData) ? "trial" : "expired");
      if (isTrialActive(trialData)) localStorage.setItem("userEmail", trialData.email);
    } else {
      setUserStatus("new");
    }
  };

  useEffect(() => {
    if (isClient) {
      checkUserAccess();
      if (router.query.success === "true") {
        const storedEmail = localStorage.getItem("userEmail");
        if (storedEmail) setTimeout(() => checkUserAccess(storedEmail), 2000);
      }
    }
  }, [isClient, router.query.success]);

  const startTrial = async () => {
    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }

    setIsStartingTrial(true);

    try {
      const startDate = Date.now();
      const expiryDate = startDate + 3 * 24 * 60 * 60 * 1000;

      const trialData: TrialData = { email: email.trim().toLowerCase(), startDate, expiryDate, status: "active" };
      localStorage.setItem("bookfoldar_trial", JSON.stringify(trialData));
      localStorage.setItem("userEmail", email.trim().toLowerCase());

      setUserEmail(email.trim().toLowerCase());
      setUserStatus("trial");
      setTrialDaysRemaining(3);
    } catch (error) {
      console.error("Error starting trial:", error);
      alert("Failed to start trial. Please try again.");
    } finally {
      setIsStartingTrial(false);
    }
  };

  const handleAccessApp = () => router.push("/app");

  return (
    <div>
      <h1>Welcome to BookfoldAR</h1>
      <p>Status: {userStatus}</p>

      {userStatus === "new" && (
        <div>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" />
          <button onClick={startTrial} disabled={isStartingTrial}>
            {isStartingTrial ? "Starting Trial..." : "Start Trial"}
          </button>
        </div>
      )}

      {userStatus === "trial" && (
        <div>
          <p>Trial days remaining: {trialDaysRemaining}</p>
          <button onClick={handleAccessApp}>Access App</button>
        </div>
      )}

      {userStatus === "paid" && <button onClick={handleAccessApp}>Access App</button>}
      {userStatus === "expired" && <p>Your trial has expired. Please purchase access.</p>}

      {/* FOOTER */}
      <footer style={{ textAlign: "center", padding: "1rem", fontSize: "0.875rem", color: "#666" }}>
        <a href="/privacy" style={{ margin: "0 0.5rem" }}>Privacy Policy</a> |
        <a href="/terms" style={{ margin: "0 0.5rem" }}>Terms of Service</a> |
        <a href="/refund" style={{ margin: "0 0.5rem" }}>Refund Policy</a>
      </footer>
    </div>
  );
}
