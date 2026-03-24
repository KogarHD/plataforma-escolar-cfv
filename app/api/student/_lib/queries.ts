// C:\Users\KOGARPC\Proyectos\plataforma-escolar-cfv\app\api\student\_lib\queries.ts
import type { SupabaseClient } from '@supabase/supabase-js'

type AppSupabase = SupabaseClient

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}

export async function getStudentSummary(
  supabase: AppSupabase,
  studentId: string
) {
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id, student_id, group_id')
    .eq('student_id', studentId)
    .maybeSingle()

  if (enrollmentError) throw enrollmentError

  if (!enrollment) {
    return {
      group: null,
      subjects: [],
      tasks: [],
      totalSubjects: 0,
      totalTasks: 0,
    }
  }

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id, code')
    .eq('id', enrollment.group_id)
    .maybeSingle()

  if (groupError) throw groupError

  const { data: groupSubjects, error: groupSubjectsError } = await supabase
    .from('group_subjects')
    .select('subject_id')
    .eq('group_id', enrollment.group_id)

  if (groupSubjectsError) throw groupSubjectsError

  const subjectIds = unique((groupSubjects ?? []).map((item) => item.subject_id))

  const { data: subjects, error: subjectsError } =
    subjectIds.length > 0
      ? await supabase
          .from('subjects')
          .select('id, name')
          .in('id', subjectIds)
          .order('name', { ascending: true })
      : { data: [], error: null }

  if (subjectsError) throw subjectsError

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, title, description, due_date, created_at, group_id, subject_id')
    .eq('group_id', enrollment.group_id)
    .order('created_at', { ascending: false })

  if (tasksError) throw tasksError

  const subjectNameMap = new Map(
    (subjects ?? []).map((subject) => [subject.id, subject.name])
  )

  const normalizedTasks = (tasks ?? []).map((task) => ({
    ...task,
    subject_name: subjectNameMap.get(task.subject_id) ?? task.subject_id,
  }))

  return {
    group: group
      ? {
          id: group.id,
          code: group.code,
        }
      : null,
    subjects: subjects ?? [],
    tasks: normalizedTasks,
    totalSubjects: (subjects ?? []).length,
    totalTasks: normalizedTasks.length,
  }
}
export async function getStudentGroupDetail(
  supabase: AppSupabase,
  studentId: string
) {
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id, student_id, group_id')
    .eq('student_id', studentId)
    .maybeSingle()

  if (enrollmentError) throw enrollmentError

  if (!enrollment) {
    return {
      group: null,
      subjects: [],
      tasks: [],
      totalSubjects: 0,
      totalTasks: 0,
    }
  }

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id, code')
    .eq('id', enrollment.group_id)
    .maybeSingle()

  if (groupError) throw groupError

  const { data: groupSubjects, error: groupSubjectsError } = await supabase
    .from('group_subjects')
    .select('subject_id')
    .eq('group_id', enrollment.group_id)

  if (groupSubjectsError) throw groupSubjectsError

  const subjectIds = unique((groupSubjects ?? []).map((item) => item.subject_id))

  const { data: subjects, error: subjectsError } =
    subjectIds.length > 0
      ? await supabase
          .from('subjects')
          .select('id, name')
          .in('id', subjectIds)
          .order('name', { ascending: true })
      : { data: [], error: null }

  if (subjectsError) throw subjectsError

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, title, description, due_date, created_at, group_id, subject_id')
    .eq('group_id', enrollment.group_id)
    .order('created_at', { ascending: false })

  if (tasksError) throw tasksError

  const subjectNameMap = new Map(
    (subjects ?? []).map((subject) => [subject.id, subject.name])
  )

  const normalizedTasks = (tasks ?? []).map((task) => ({
    ...task,
    subject_name: subjectNameMap.get(task.subject_id) ?? task.subject_id,
  }))

  return {
    group: group
      ? {
          id: group.id,
          code: group.code,
        }
      : null,
    subjects: subjects ?? [],
    tasks: normalizedTasks,
    totalSubjects: (subjects ?? []).length,
    totalTasks: normalizedTasks.length,
  }
}
export async function getStudentTasks(
  supabase: AppSupabase,
  studentId: string
) {
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id, student_id, group_id')
    .eq('student_id', studentId)
    .maybeSingle()

  if (enrollmentError) throw enrollmentError

  if (!enrollment) {
    return {
      group: null,
      tasks: [],
      totalTasks: 0,
    }
  }

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id, code')
    .eq('id', enrollment.group_id)
    .maybeSingle()

  if (groupError) throw groupError

  const { data: groupSubjects, error: groupSubjectsError } = await supabase
    .from('group_subjects')
    .select('subject_id')
    .eq('group_id', enrollment.group_id)

  if (groupSubjectsError) throw groupSubjectsError

  const subjectIds = unique((groupSubjects ?? []).map((item) => item.subject_id))

  const { data: subjects, error: subjectsError } =
    subjectIds.length > 0
      ? await supabase
          .from('subjects')
          .select('id, name')
          .in('id', subjectIds)
      : { data: [], error: null }

  if (subjectsError) throw subjectsError

  const subjectNameMap = new Map(
    (subjects ?? []).map((subject) => [subject.id, subject.name])
  )

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, title, description, due_date, created_at, group_id, subject_id')
    .eq('group_id', enrollment.group_id)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (tasksError) throw tasksError

  const taskIds = unique((tasks ?? []).map((task) => task.id))

  const { data: submissions, error: submissionsError } =
    taskIds.length > 0
      ? await supabase
          .from('task_submissions')
          .select(
            'id, task_id, student_id, content, feedback, submitted_at, reviewed_at, updated_at'
          )
          .eq('student_id', studentId)
          .in('task_id', taskIds)
      : { data: [], error: null }

  if (submissionsError) throw submissionsError

  const submissionsMap = new Map(
    (submissions ?? []).map((submission) => [submission.task_id, submission])
  )

  const normalizedTasks = (tasks ?? []).map((task) => {
    const submission = submissionsMap.get(task.id)

    return {
      ...task,
      subject_name: subjectNameMap.get(task.subject_id) ?? task.subject_id,
      submission: submission
        ? {
            id: submission.id,
            task_id: submission.task_id,
            student_id: submission.student_id,
            content: submission.content,
            feedback: submission.feedback,
            submitted_at: submission.submitted_at,
            reviewed_at: submission.reviewed_at,
            updated_at: submission.updated_at,
          }
        : null,
      is_submitted: Boolean(submission),
      is_reviewed: Boolean(submission?.reviewed_at),
    }
  })

  return {
    group: group
      ? {
          id: group.id,
          code: group.code,
        }
      : null,
    tasks: normalizedTasks,
    totalTasks: normalizedTasks.length,
  }
}