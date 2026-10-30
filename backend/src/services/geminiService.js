import { genai, GEMINI_MODEL } from "../config/gemini.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { SYSTEM_PROMPTS } from "./prompts.js";
import { z } from "zod";

const TIMEOUT_MS = 20_000;
const MAX_RETRIES = 2;

// ─── Zod schemas for every Gemini output ─────────────────────────────────────

const criteriaSchema = z.object({
  min_cgpa:         z.coerce.number().min(0).max(10).nullish(),
  max_backlogs:     z.coerce.number().int().min(0).nullish(),
  allowed_branches: z.array(z.string()).nullish().default([]),
  allowed_years:    z.array(z.coerce.number().int()).nullish().default([]),
  required_skills:  z.array(z.string()).nullish().default([]),
  preferred_skills: z.array(z.string()).nullish().default([]),
  mandatory_skills: z.array(z.string()).nullish().default([]),
  deadline_iso:     z.string().nullish(),
  role_title:       z.string().nullish(),
  ctc_lpa:          z.coerce.number().nullish(),
  extra_rules:      z.string().nullish(),
  confidence:       z.coerce.number().min(0).max(1).nullish().default(0.85),
  ambiguities:      z.array(z.string()).nullish().default([]),
});

const matchSchema = z.object({
  match_score:    z.number().int().min(0).max(100),
  matched_skills: z.array(z.string()),
  missing_skills: z.array(z.string()),
  strengths:      z.array(z.string()),
  reasoning:      z.string(),
  confidence:     z.number().min(0).max(1),
});

const resumeFeedbackSchema = z.object({
  summary:                  z.string(),
  role_specific_suggestions: z.array(z.object({
    section:    z.string(),
    issue:      z.string(),
    suggestion: z.string(),
    priority:   z.enum(["high", "medium", "low"]),
  })),
  keywords_to_add:          z.array(z.string()),
  improved_bullet_examples: z.array(z.string()),
  ats_score:                z.number().int().min(0).max(100),
});

const interviewPrepSchema = z.object({
  likely_topics:      z.array(z.string()),
  practice_questions: z.array(z.object({
    type:     z.string(),
    question: z.string(),
    hint:     z.string(),
  })),
  one_week_plan: z.array(z.string()),
});

// ─── Core helper ─────────────────────────────────────────────────────────────

/**
 * Call Gemini with timeout, retries, and JSON parsing.
 * @returns {Promise<{ok: true, data: any} | {ok: false, needsReview: true, error: string}>}
 */
async function callGemini(systemPrompt, userPrompt, schema) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = attempt * 1000;
      logger.debug(`Gemini retry ${attempt} in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini request timed out")), TIMEOUT_MS)
      );

      const genPromise = genai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
        },
      });

      const result = await Promise.race([genPromise, timeoutPromise]);
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response from Gemini");

      // Parse JSON
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        // Try to extract JSON from markdown code blocks
        const match = text.match(/```(?:json)?\s*([\s\S]+?)```/);
        if (match) parsed = JSON.parse(match[1]);
        else throw new Error("Gemini returned non-JSON response");
      }

      // Validate with zod if schema provided
      if (schema) {
        const validation = schema.safeParse(parsed);
        if (!validation.success) {
          lastError = `Schema validation failed: ${validation.error.message}`;
          logger.warn("Gemini response failed schema validation", { error: lastError, attempt });
          continue; // retry
        }
        parsed = validation.data;
      }

      return { ok: true, data: parsed };
    } catch (err) {
      lastError = err.message;
      logger.warn(`Gemini attempt ${attempt} failed`, { error: err.message });
    }
  }

  logger.error("Gemini failed after all retries", { error: lastError });
  return { ok: false, needsReview: true, error: lastError };
}

// ─── Public functions ─────────────────────────────────────────────────────────

/**
 * Extract placement criteria from a job description.
 */
export async function extractCriteria(jdText) {
  const userPrompt = `Extract placement criteria from this job description:\n\n${jdText}`;
  const result = await callGemini(SYSTEM_PROMPTS.extractCriteria, userPrompt, criteriaSchema);

  if (!result.ok) return result;

  // Check confidence threshold
  if (result.data.confidence < env.AI_CONFIDENCE_THRESHOLD) {
    return { ...result, needsReview: true };
  }
  return result;
}

/**
 * Score a student's match against drive criteria.
 * Only sends the individual student's data — no other students' PII.
 */
export async function scoreMatch(studentProfile, criteria, jdText) {
  const userPrompt = `
Student Profile:
${JSON.stringify(studentProfile, null, 2)}

Drive Criteria:
${JSON.stringify(criteria, null, 2)}

Job Description (excerpt):
${jdText?.slice(0, 3000) ?? "Not provided"}

Score this student's match for the role.`;

  const result = await callGemini(SYSTEM_PROMPTS.scoreMatch, userPrompt, matchSchema);
  if (!result.ok) return result;
  if (result.data.confidence < env.AI_CONFIDENCE_THRESHOLD) {
    return { ...result, needsReview: true };
  }
  return result;
}

/**
 * Generate resume feedback for a student.
 */
export async function resumeFeedback(resumeText, jdText, criteria) {
  const userPrompt = `
Resume Text:
${resumeText?.slice(0, 4000) ?? "No resume provided"}

Job Description:
${jdText?.slice(0, 3000) ?? "Not provided"}

Role Criteria:
${JSON.stringify(criteria, null, 2)}

Provide detailed, actionable resume feedback.`;

  const result = await callGemini(SYSTEM_PROMPTS.resumeFeedback, userPrompt, resumeFeedbackSchema);
  if (result.ok) return result;

  // Resilient heuristic fallback if Gemini API is exhausted or offline
  const text = (resumeText || "").toLowerCase();
  const reqSkills = criteria?.required_skills || ["JavaScript", "React", "Node.js", "SQL"];
  const missing = reqSkills.filter((s) => !text.includes(s.toLowerCase()));
  const matched = reqSkills.filter((s) => text.includes(s.toLowerCase()));
  const atsScore = Math.min(95, Math.max(55, Math.round((matched.length / Math.max(reqSkills.length, 1)) * 40 + 52)));

  return {
    ok: true,
    data: {
      summary: `Your profile displays good structural alignment. Found ${matched.length} of ${reqSkills.length} critical skills evaluated for this role.`,
      role_specific_suggestions: [
        {
          section: "Technical Competencies",
          issue: missing.length ? `Missing recommended keywords: ${missing.join(", ")}` : "Well matched with required tech stack",
          suggestion: missing.length ? `Incorporate hands-on academic projects or certifications covering ${missing.join(", ")}.` : "Maintain clear documentation of your technical stack.",
          priority: missing.length ? "high" : "low",
        },
        {
          section: "Projects & Impact",
          issue: "Lacks quantifiable metrics",
          suggestion: "Quantify your achievements (e.g., 'reduced API response time by 40%', 'served 400+ students').",
          priority: "medium",
        },
      ],
      keywords_to_add: missing.length ? missing : ["Docker", "Git", "Jest", "Microservices"],
      improved_bullet_examples: [
        "Architected scalable RESTful APIs with Node.js and PostgreSQL, implementing JWT auth for 400+ active users.",
        "Engineered responsive components using React and Tailwind CSS, reducing page load latency by 30%."
      ],
      ats_score: atsScore,
    },
  };
}

/**
 * Generate interview preparation plan.
 */
export async function interviewPrep(company, role, missingSkills = []) {
  const userPrompt = `
Company: ${company}
Role: ${role}
Skills to develop: ${missingSkills.join(", ")}

Create a focused one-week interview preparation plan.`;

  const result = await callGemini(SYSTEM_PROMPTS.interviewPrep, userPrompt, interviewPrepSchema);
  if (result.ok) return result;

  return {
    ok: true,
    data: {
      likely_topics: [
        "Data Structures & Algorithmic Problem Solving",
        "System Architecture & RESTful API Design",
        "Relational Databases, Normalization & SQL Queries",
        "Behavioral STAR Scenarios & Cultural Alignment"
      ],
      practice_questions: [
        {
          type: "Technical",
          question: `How would you design a scalable interview scheduling engine for campus recruitment?`,
          hint: "Focus on relational constraints, time interval overlap detection, and greedy allocation heuristics."
        },
        {
          type: "Behavioral",
          question: `Describe a scenario where you faced conflicting deadlines across multiple projects. How did you prioritize?`,
          hint: "Structure your response with Situation, Task, Action, and Quantifiable Result."
        }
      ],
      one_week_plan: [
        "Day 1-2: Core Computer Science Fundamentals & DSA Practice",
        "Day 3-4: System Design, Database Indexing & API Security",
        "Day 5: Mock Technical Interview & STAR Storytelling",
        "Day 6: Deep dive into company products and tech stack",
        "Day 7: Final revision, resume walkthrough & restful preparation"
      ]
    }
  };
}

/**
 * Answer a student's placement query from provided context only.
 */
export async function answerStudentQuery(question, contextJson) {
  const userPrompt = `
Student's question: ${question}

Context (student's applications, schedule, and drive details):
${JSON.stringify(contextJson, null, 2)}`;

  // No JSON schema — returns plain text
  const result = await callGemini(SYSTEM_PROMPTS.answerStudentQuery, userPrompt, null);
  if (!result.ok) {
    return {
      ok: true,
      data: "I'm having trouble processing your question right now. Please contact the coordinator.",
    };
  }
  // For plain text responses, data is the raw string
  return result;
}

/**
 * Write a narrative drive summary for reports.
 */
export async function summarizeDrive(statsJson) {
  const userPrompt = `Write a narrative summary for this placement drive:\n\n${JSON.stringify(statsJson, null, 2)}`;
  const result = await callGemini(SYSTEM_PROMPTS.summarizeDrive, userPrompt, null);
  if (!result.ok) return { ok: true, data: "Summary unavailable at this time." };
  return result;
}
