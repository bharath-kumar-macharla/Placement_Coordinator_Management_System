/**
 * Unit tests for the eligibility rule engine.
 * Run: npm test (from backend/)
 */

import { checkStudentEligibility } from "../services/eligibilityService.js";

const baseCriteria = {
  min_cgpa:         7.0,
  max_backlogs:     0,
  allowed_branches: ["CSE", "IT"],
  allowed_years:    [4],
  mandatory_skills: [],
  required_skills:  ["JavaScript", "React"],
};

const eligibleStudent = {
  cgpa:     8.5,
  backlogs: 0,
  branch:   "CSE",
  year:     4,
  skills:   ["JavaScript", "React", "Node.js"],
};

describe("checkStudentEligibility", () => {
  test("eligible student passes all rules", () => {
    const { eligible, reasons } = checkStudentEligibility(eligibleStudent, baseCriteria);
    expect(eligible).toBe(true);
    expect(reasons.every((r) => r.passed)).toBe(true);
  });

  test("low CGPA fails", () => {
    const student = { ...eligibleStudent, cgpa: 6.5 };
    const { eligible, reasons } = checkStudentEligibility(student, baseCriteria);
    expect(eligible).toBe(false);
    const cgpaRule = reasons.find((r) => r.rule === "min_cgpa");
    expect(cgpaRule.passed).toBe(false);
    expect(cgpaRule.detail).toMatch(/6.5 is below the minimum 7/);
  });

  test("too many backlogs fails", () => {
    const student = { ...eligibleStudent, backlogs: 2 };
    const { eligible, reasons } = checkStudentEligibility(student, baseCriteria);
    expect(eligible).toBe(false);
    const backlogRule = reasons.find((r) => r.rule === "max_backlogs");
    expect(backlogRule.passed).toBe(false);
  });

  test("wrong branch fails", () => {
    const student = { ...eligibleStudent, branch: "MECH" };
    const { eligible, reasons } = checkStudentEligibility(student, baseCriteria);
    expect(eligible).toBe(false);
    const branchRule = reasons.find((r) => r.rule === "branch");
    expect(branchRule.passed).toBe(false);
    expect(branchRule.detail).toMatch(/MECH/);
  });

  test("wrong year fails", () => {
    const student = { ...eligibleStudent, year: 3 };
    const { eligible, reasons } = checkStudentEligibility(student, baseCriteria);
    expect(eligible).toBe(false);
    const yearRule = reasons.find((r) => r.rule === "year");
    expect(yearRule.passed).toBe(false);
  });

  test("missing mandatory skill fails", () => {
    const criteriaWithMandatory = { ...baseCriteria, mandatory_skills: ["Docker"] };
    const student = { ...eligibleStudent, skills: ["JavaScript", "React"] };
    const { eligible, reasons } = checkStudentEligibility(student, criteriaWithMandatory);
    expect(eligible).toBe(false);
    const skillRule = reasons.find((r) => r.rule === "mandatory_skills");
    expect(skillRule.passed).toBe(false);
    expect(skillRule.detail).toMatch(/Docker/);
  });

  test("required_skills (non-mandatory) do NOT hard-reject", () => {
    // required_skills without being in mandatory_skills should not reject
    const criteriaOnlyRequired = { ...baseCriteria, required_skills: ["Kubernetes"], mandatory_skills: [] };
    const student = { ...eligibleStudent, skills: ["JavaScript", "React"] };
    const { eligible } = checkStudentEligibility(student, criteriaOnlyRequired);
    expect(eligible).toBe(true); // required_skills are soft signals
  });

  test("null criteria fields are skipped", () => {
    const openCriteria = {
      min_cgpa: null,
      max_backlogs: null,
      allowed_branches: [],
      allowed_years: [],
      mandatory_skills: [],
    };
    const anyStudent = { cgpa: 3.0, backlogs: 10, branch: "MECH", year: 1, skills: [] };
    const { eligible } = checkStudentEligibility(anyStudent, openCriteria);
    expect(eligible).toBe(true);
  });

  test("branch matching is case-insensitive", () => {
    const student = { ...eligibleStudent, branch: "cse" };
    const { eligible } = checkStudentEligibility(student, baseCriteria);
    expect(eligible).toBe(true);
  });
});
