import client from "./client.js";

export const authApi = {
  register: (data)     => client.post("/auth/register", data),
  login:    (data)     => client.post("/auth/login",    data),
  me:       ()         => client.get("/auth/me"),
};

export const studentApi = {
  getMe:         ()       => client.get("/students/me"),
  updateMe:      (data)   => client.put("/students/me", data),
  list:          (params) => client.get("/students", { params }),
  getById:       (id)     => client.get(`/students/${id}`),
  analyzeResume: (data)   => client.post("/students/resume-analyze", data),
};

export const companyApi = {
  list:   ()         => client.get("/companies"),
  create: (data)     => client.post("/companies", data),
  update: (id, data) => client.put(`/companies/${id}`, data),
  delete: (id)       => client.delete(`/companies/${id}`),
  getById: (id)      => client.get(`/companies/${id}`),
};

export const driveApi = {
  list:            (params)   => client.get("/drives",              { params }),
  create:          (data)     => client.post("/drives",             data),
  update:          (id, data) => client.put(`/drives/${id}`,        data),
  getById:         (id)       => client.get(`/drives/${id}`),
  eligible:        ()         => client.get("/drives/eligible"),
  extractCriteria: (data)     => client.post("/drives/extract-criteria", data),
  saveCriteria:    (id, data) => client.put(`/drives/${id}/criteria`, data),
  publish:         (id)       => client.post(`/drives/${id}/publish`),
  runEligibility:  (id, dry)  => client.post(`/drives/${id}/eligibility/run${dry ? "?dry_run=true" : ""}`),
  getRounds:       (id)       => client.get(`/drives/${id}/rounds`),
  createRound:     (id, data) => client.post(`/drives/${id}/rounds`, data),
};

export const applicationApi = {
  apply:    (driveId) => client.post(`/drives/${driveId}/apply`),
  withdraw: (driveId) => client.delete(`/drives/${driveId}/apply`),
  mine:     ()        => client.get("/applications/mine"),
  timeline: (id)      => client.get(`/applications/${id}/timeline`),
  list:     (params)  => client.get("/applications", { params }),
  shortlist: (driveId) => client.get(`/drives/${driveId}/shortlist`),
  approveShortlist: (driveId, data) => client.post(`/drives/${driveId}/shortlist/approve`, data),
  updateStatus: (id, data) => client.put(`/applications/${id}/status`, data),
};

export const scheduleApi = {
  generate: (driveId, data) => client.post(`/drives/${driveId}/schedule/generate`, data),
  confirm:  (driveId, data) => client.post(`/drives/${driveId}/schedule/confirm`,  data),
  get:      (driveId)       => client.get(`/drives/${driveId}/schedule`),
  mySchedule: ()            => client.get("/students/my-schedule"),
  reschedule: (slotId, data) => client.post(`/slots/${slotId}/reschedule`, data),
  rebalance:  (driveId, data) => client.post(`/drives/${driveId}/schedule/rebalance`, data),
};

export const notificationApi = {
  list:       (params) => client.get("/notifications", { params }),
  unreadCount: ()      => client.get("/notifications/unread-count"),
  markRead:    (id)    => client.put(`/notifications/${id}/read`),
  markAllRead: ()      => client.put("/notifications/read-all"),
};

export const aiApi = {
  resumeFeedback:  (appId)           => client.post(`/applications/${appId}/resume-feedback`),
  interviewPrep:   (driveId)         => client.post(`/drives/${driveId}/interview-prep`),
  assistantQuery:  (question)        => client.post("/assistant/query", { question }),
};

export const reportApi = {
  getDriveReport:    (id) => client.get(`/reports/drive/${id}`),
  skillGap:          ()   => client.get("/reports/skill-gap"),
  overview:          ()   => client.get("/reports/overview"),
  downloadCsv:       (id) => client.get(`/reports/drive/${id}.csv`, { responseType: "blob" }),
  csvUrl:            (id) => `${import.meta.env.VITE_API_URL}/reports/drive/${id}.csv`,
};

export const adminApi = {
  users:         (params)        => client.get("/admin/users", { params }),
  createUser:    (data)          => client.post("/admin/users", data),
  setUserStatus: (id, is_active) => client.put(`/admin/${id}/status`, { is_active }),
  auditLogs:     (params)        => client.get("/admin/audit-logs", { params }),
};
