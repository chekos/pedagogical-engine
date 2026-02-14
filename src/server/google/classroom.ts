import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

interface ClassroomCourse {
  id: string;
  name: string;
  section: string;
  enrollmentCode: string;
  courseState: string;
}

interface ClassroomStudent {
  userId: string;
  fullName: string;
  emailAddress: string;
}

/** List courses from Google Classroom */
export async function listCourses(
  auth: OAuth2Client
): Promise<ClassroomCourse[]> {
  const classroom = google.classroom({ version: "v1", auth });

  const res = await classroom.courses.list({
    courseStates: ["ACTIVE"],
    pageSize: 30,
  });

  return (res.data.courses || []).map((c) => ({
    id: c.id!,
    name: c.name || "Untitled Course",
    section: c.section || "",
    enrollmentCode: c.enrollmentCode || "",
    courseState: c.courseState || "ACTIVE",
  }));
}

/** List students in a specific course */
export async function listStudents(
  auth: OAuth2Client,
  courseId: string
): Promise<ClassroomStudent[]> {
  const classroom = google.classroom({ version: "v1", auth });

  const res = await classroom.courses.students.list({
    courseId,
    pageSize: 100,
  });

  return (res.data.students || []).map((s) => ({
    userId: s.userId!,
    fullName: s.profile?.name?.fullName || "Unknown",
    emailAddress: s.profile?.emailAddress || "",
  }));
}
