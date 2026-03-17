// C:\Users\KOGARPC\Proyectos\plataforma-escolar-cfv\app\api\teacher\_lib\queries.ts
import type { SupabaseClient } from '@supabase/supabase-js'

type AppSupabase = SupabaseClient

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}

type TeacherAssignmentRow = {
  id: string
  teacher_id: string
  group_id: string
  subject_id: string
}

type GroupRow = {
  id: string
  code: string
}

type SubjectRow = {
  id: string
  name: string
}

export async function getTeacherAssignments(
  supabase: AppSupabase,
  teacherId: string
) {
  const { data, error } = await supabase
    .from('teacher_assignments')
    .select('id, teacher_id, group_id, subject_id')
    .eq('teacher_id', teacherId)
    .order('group_id', { ascending: true })

  if (error) throw error

  const assignments = (data ?? []) as TeacherAssignmentRow[]

  const groupIds = unique(assignments.map((item) => item.group_id))
  const subjectIds = unique(assignments.map((item) => item.subject_id))

  const [{ data: groups, error: groupsError }, { data: subjects, error: subjectsError }] =
    await Promise.all([
      groupIds.length > 0
        ? supabase.from('groups').select('id, code').in('id', groupIds)
        : Promise.resolve({ data: [], error: null }),
      subjectIds.length > 0
        ? supabase.from('subjects').select('id, name').in('id', subjectIds)
        : Promise.resolve({ data: [], error: null }),
    ])

  if (groupsError) throw groupsError
  if (subjectsError) throw subjectsError

  const groupsMap = new Map(
    ((groups ?? []) as GroupRow[]).map((group) => [group.id, group.code])
  )

  const subjectsMap = new Map(
    ((subjects ?? []) as SubjectRow[]).map((subject) => [subject.id, subject.name])
  )

  return assignments.map((assignment) => ({
    ...assignment,
    group_name: groupsMap.get(assignment.group_id) ?? assignment.group_id,
    subject_name: subjectsMap.get(assignment.subject_id) ?? assignment.subject_id,
  }))
}

export async function getTeacherSummary(
  supabase: AppSupabase,
  teacherId: string
) {
  const assignments = await getTeacherAssignments(supabase, teacherId)

  const groupIds = unique(assignments.map((item) => item.group_id))
  const subjectIds = unique(assignments.map((item) => item.subject_id))

  let totalStudents = 0

  if (groupIds.length > 0) {
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('student_id, group_id')
      .in('group_id', groupIds)

    if (enrollmentsError) throw enrollmentsError

    totalStudents = unique(
      (enrollments ?? []).map((item) => item.student_id)
    ).length
  }

  return {
    totalGroups: groupIds.length,
    totalSubjects: subjectIds.length,
    totalStudents,
    assignments,
  }
}

export async function getTeacherGroupDetail(
  supabase: AppSupabase,
  teacherId: string,
  groupId: string
) {
  const { data: assignments, error: assignmentsError } = await supabase
    .from('teacher_assignments')
    .select('id, teacher_id, group_id, subject_id')
    .eq('teacher_id', teacherId)
    .eq('group_id', groupId)

  if (assignmentsError) throw assignmentsError

  if (!assignments || assignments.length === 0) {
    throw new Error('NOT_FOUND')
  }

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id, code')
    .eq('id', groupId)
    .maybeSingle()

  if (groupError) throw groupError
  if (!group) throw new Error('NOT_FOUND')

  const subjectIds = unique(assignments.map((item) => item.subject_id))

  const { data: subjects, error: subjectsError } =
    subjectIds.length > 0
      ? await supabase
          .from('subjects')
          .select('id, name')
          .in('id', subjectIds)
          .order('name', { ascending: true })
      : { data: [], error: null }

  if (subjectsError) throw subjectsError

  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('enrollments')
    .select('id, student_id, group_id')
    .eq('group_id', groupId)

  if (enrollmentsError) throw enrollmentsError

  const studentIds = unique((enrollments ?? []).map((item) => item.student_id))

  const { data: students, error: studentsError } =
    studentIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, username, role')
          .in('id', studentIds)
          .eq('role', 'student')
          .order('username', { ascending: true })
      : { data: [], error: null }

  if (studentsError) throw studentsError

  return {
    group: {
      id: group.id,
      code: group.code,
    },
    subjects: subjects ?? [],
    students: students ?? [],
    enrollments: enrollments ?? [],
    totalStudents: (students ?? []).length,
  }
}