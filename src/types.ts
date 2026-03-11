import { Type } from "@google/genai";

export enum Priority {
  HIGH = "High",
  MEDIUM = "Medium",
  LOW = "Low"
}

export interface TestCase {
  id: string;
  ruleTested: string;
  scenario: string;
  steps: string[];
  expectedResult: string;
  priority: Priority;
}

export interface EdgeCase {
  id: string;
  ruleTested: string;
  variableTested: string;
  scenario: string;
  expectedResult: string;
}

export interface CoverageMetric {
  category: string;
  percentage: number;
}

export interface TestGenerationResult {
  testCases: TestCase[];
  edgeCases: EdgeCase[];
  testDataSuggestions: string[];
  riskAnalysis: string[];
  coverageMetrics: CoverageMetric[];
}

export interface HistoryItem {
  id: string;
  requirement: string;
  results: TestGenerationResult;
  timestamp: number;
}

export interface AuditResult {
  isValid: boolean;
  risks: string[];
}

export const AUDIT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isValid: { type: Type.BOOLEAN, description: "Whether the requirement is clear and complete" },
    risks: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of 2-3 potential risks, ambiguities, or missing states"
    }
  },
  required: ["isValid", "risks"]
};

export const TEST_GENERATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    testCases: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique ID for the test case (e.g., TC-001)" },
          ruleTested: { type: Type.STRING, description: "The specific business rule or requirement constraint being tested" },
          scenario: { type: Type.STRING, description: "Brief description of the test scenario" },
          steps: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Step-by-step instructions to execute the test"
          },
          expectedResult: { type: Type.STRING, description: "The expected outcome of the test" },
          priority: { 
            type: Type.STRING, 
            enum: ["High", "Medium", "Low"],
            description: "The priority of the test case" 
          }
        },
        required: ["id", "ruleTested", "scenario", "steps", "expectedResult", "priority"]
      }
    },
    edgeCases: {
      type: Type.ARRAY,
      items: { 
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique ID for the edge case (e.g., EC-001)" },
          ruleTested: { type: Type.STRING, description: "The specific business rule or requirement constraint being tested" },
          variableTested: { type: Type.STRING, description: "The specific variable or constraint being tested" },
          scenario: { type: Type.STRING, description: "The edge case scenario description" },
          expectedResult: { type: Type.STRING, description: "The expected outcome for this edge case" }
        },
        required: ["id", "ruleTested", "variableTested", "scenario", "expectedResult"]
      },
      description: "Structured edge cases and boundary analysis"
    },
    testDataSuggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Examples of test data to use for testing"
    },
    riskAnalysis: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Potential failure areas or risks associated with the feature"
    },
    coverageMetrics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: "The category of coverage (e.g., Functional, Security, Edge Cases)" },
          percentage: { type: Type.NUMBER, description: "The estimated percentage of coverage for this category (0-100)" }
        },
        required: ["category", "percentage"]
      },
      description: "Estimated test coverage metrics for different categories"
    }
  },
  required: ["testCases", "edgeCases", "testDataSuggestions", "riskAnalysis", "coverageMetrics"]
};
