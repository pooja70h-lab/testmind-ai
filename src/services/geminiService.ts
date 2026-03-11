import { GoogleGenAI } from "@google/genai";
import { AUDIT_SCHEMA, AuditResult, TEST_GENERATION_SCHEMA, TestGenerationResult } from "../types";

const API_KEY = process.env.GEMINI_API_KEY;

export const generateAuditPrompt = (requirement: string) => {
  return `As an expert QA and Product Validator, perform a 'Pre-Flight Audit' on the following product requirement.
  
  Requirement:
  "${requirement}"
  
  Analyze the requirement for:
  1. Ambiguity: Are there terms that could be interpreted in multiple ways?
  2. Missing Edge Cases: Are there obvious error states or boundary conditions not addressed?
  3. Contradictions: Does the logic conflict with itself?
  
  Analyze the user's requirement for logic gaps, ambiguous terms, or missing error states. Return a bulleted list of 2-3 potential risks to the user.
  
  If the requirement is clear, complete, and logically sound, set isValid to true. Otherwise, set isValid to false and provide the risks.`;
};

export async function auditRequirement(requirement: string): Promise<AuditResult> {
  if (!API_KEY) {
    throw new Error("Gemini API Key is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const model = "gemini-3-flash-preview";

  const prompt = generateAuditPrompt(requirement);

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: AUDIT_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI model.");
    }

    return JSON.parse(text) as AuditResult;
  } catch (error) {
    console.error("Error auditing requirement:", error);
    throw error;
  }
}

export const generatePrompt = (requirement: string) => {
  return `As an expert QA Engineer, analyze the following product requirement and generate a comprehensive, high-quality test suite ensuring COMPLETE FUNCTIONAL COVERAGE.
  
Requirement:
"${requirement}"

Please provide a structured response following these strict guidelines:

1. COMPLETE FUNCTIONAL COVERAGE:
   For EVERY business rule, constraint, or logic branch identified in the requirement, you MUST generate the following 4 paths:
   - POSITIVE PATH: A standard 'happy path' where the rule is met.
   - DIRECT NEGATIVE PATH: A scenario where the rule is explicitly violated.
   - PARTIAL/MIXED PATH: A scenario where some conditions are met but one specific constraint fails (e.g., a VIP user meets the point threshold but buys an excluded item).
   - BOUNDARY PATH: Testing the exact limits or transition points (e.g., exactly 500 points, exactly 50% cart value, or 1 second before/after a deadline).

2. TEST CASES & EDGE CASES MAPPING:
   - Ensure the Test Cases Table and Edge Case Table reflect a 1:1 mapping of these constraints so that no rule is left untested.
   - Use the 'ruleTested' field to explicitly state which business rule or constraint is being addressed.
   - Provide at least 12-15 structured test cases to ensure depth.

3. EDGE CASE & BOUNDARY ANALYSIS:
   - Identify critical edge cases, boundary conditions, and state transitions.
   - Focus on variables like limits, null values, extreme inputs, and race conditions.

4. TEST DATA SUGGESTIONS:
   - Provide specific examples of test inputs (valid/invalid emails, special characters, edge numbers).

5. RISK ANALYSIS:
   - Identify potential failure points, technical risks, or areas prone to regression.

6. TEST COVERAGE ESTIMATION:
   - Calculate and provide estimated test coverage percentages for Functional, Security, Edge Cases, and Performance.

Format the output as a structured JSON object.`;
};

export async function generateTestCases(requirement: string, signal?: AbortSignal): Promise<TestGenerationResult> {
  if (!API_KEY) {
    throw new Error("Gemini API Key is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const model = "gemini-3-flash-preview"; 

  const prompt = generatePrompt(requirement);

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: TEST_GENERATION_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI model.");
    }

    return JSON.parse(text) as TestGenerationResult;
  } catch (error) {
    console.error("Error generating test cases:", error);
    throw error;
  }
}
