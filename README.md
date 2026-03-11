# TESTMIND AI

**TESTMIND AI** is a strategic product validation tool designed to bridge the gap between high-level product requirements and bulletproof execution. By leveraging AI-powered auditing and test generation, it empowers Product Managers and QA teams to identify logic gaps before they become costly engineering bugs.

## 🚀 Access the App
The application is live and ready to use:
**(https://testmind-ai.vercel.app)**

---

## 💡 The Problem: The "Requirement Gap"
In the fast-paced software lifecycle, **Product Managers** often face the challenge of requirement ambiguity. Vague user stories lead to:
* **Logic Contradictions:** Business rules that conflict with existing features.
* **Hidden Risks:** Critical edge cases discovered only *after* development begins.
* **Development Bloat:** Costly rework and "back-and-forth" between teams.

## 🛠 The Solution: Proactive Product Guardrails
TestMind AI transforms the requirement-gathering phase into a risk-aware workflow:
* **Pre-Flight Requirement Auditor:** Acts as a PM's "second brain," scanning for logic gaps.
* **Intelligent Scenario Generation:** Visualizes every possible path (Positive, Negative, and Boundary).
* **Risk & Coverage Analytics:** Provides data-driven insights for release readiness.
* **30-Day Session History:** A persistent workspace to track logic iterations.

---

## 📖 How to Use TestMind AI

1. **Input Your Requirement:** Paste your User Story or Product Requirement into the main text area. 
   * *Example: "As a Gold Member, I should get a 20% discount on electronics, but only if the cart value exceeds $500."*
2. **Run the Pre-Flight Audit:** Click **Validate Requirement**. The AI will scan for ambiguities (e.g., "What happens if a member is NOT Gold but spends $600?").
3. **Generate the Test Suite:** Click **Generate**. The app will produce:
   * A **Functional Test Table** (Positive/Negative/Mixed paths).
   * An **Edge Case & Boundary Analysis** table.
   * A **Risk Analysis** summary.
4. **Review Coverage:** Scroll to the bottom to see the **Test Coverage Analysis** graph, showing how well the AI covered Security, Functional, and Edge Case dimensions.
5. **Manage Your History:** Use the **Clock Icon** in the header to open the sidebar. Your work is automatically saved for 30 days so you can jump between different features you are planning.
6. **Export for the Team:** Click **Export to CSV** to download a professional report you can share with developers or upload to Jira/TestRail.

---

## 🧠 Key Learning: Strategic "Shift-Left"
This project demonstrates the power of **Shift-Left Product Management**. By identifying risks during the discovery phase, PMs reduce the "Cost of Quality" and accelerate time-to-market.

## 🛠 Tech Stack
* **Framework:** Next.js / React 19
* **AI Engine:** Gemini 3.1 Flash
* **Visuals:** Recharts for Coverage Analysis
