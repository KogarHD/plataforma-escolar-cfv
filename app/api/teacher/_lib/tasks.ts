// C:\Users\KOGARPC\Proyectos\plataforma-escolar-cfv\app\api\teacher\_lib\tasks.ts
import type { SupabaseClient } from '@supabase/supabase-js'

type AppSupabase = SupabaseClient

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}

type TaskRow = {
  id: string
  teacher_id: string
  group_id: string
  subject_id: string
  title: string
  description: string
  due_date: string | null
  created_at: string
}

type GroupRow = {
  id: string
  code: string
}

type SubjectRow = {
  id: string
  name: string
}

export async function listTeacherTasks(
  supabase: AppSupabase,
  teacherId: string
) {
  const { data, error } = await supabase
    .from('tasks')
    .select(
      'id, teacher_id, group_id, subject_id, title, description, due_date, created_at'
    )
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const tasks = (data ?? []) as TaskRow[]

  const groupIds = unique(tasks.map((task) => task.group_id))
  const subjectIds = unique(tasks.map((task) => task.subject_id))

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

  return tasks.map((task) => ({
    ...task,
    group_name: groupsMap.get(task.group_id) ?? task.group_id,
    subject_name: subjectsMap.get(task.subject_id) ?? task.subject_id,
  }))
}

export async function createTeacherTask(
  supabase: AppSupabase,
  teacherId: string,
  input: {
    group_id: string
    subject_id: string
    title: string
    description?: string
    due_date?: string | null
  }
) {
  const payload = {
    teacher_id: teacherId,
    group_id: input.group_id,
    subject_id: input.subject_id,
    title: input.title.trim(),
    description: (input.description ?? '').trim(),
    due_date: input.due_date ?? null,
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert(payload)
    .select(
      'id, teacher_id, group_id, subject_id, title, description, due_date, created_at'
    )
    .single()

  if (error) throw error

  const [groupRes, subjectRes] = await Promise.all([
    supabase.from('groups').select('id, code').eq('id', data.group_id).maybeSingle(),
    supabase.from('subjects').select('id, name').eq('id', data.subject_id).maybeSingle(),
  ])

  if (groupRes.error) throw groupRes.error
  if (subjectRes.error) throw subjectRes.error

  return {
    ...data,
    group_name: groupRes.data?.code ?? data.group_id,
    subject_name: subjectRes.data?.name ?? data.subject_id,
  }
}
export async function updateTeacherTask(
  supabase: AppSupabase,
  teacherId: string,
  taskId: string,
  input: {
    title: string
    description?: string
    due_date?: string | null
  }
) {
  const payload = {
    title: input.title.trim(),
    description: (input.description ?? '').trim(),
    due_date: input.due_date ?? null,
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', taskId)
    .eq('teacher_id', teacherId)
    .select(
      'id, teacher_id, group_id, subject_id, title, description, due_date, created_at'
    )
    .single()

  if (error) throw error

  const [groupRes, subjectRes] = await Promise.all([
    supabase.from('groups').select('id, code').eq('id', data.group_id).maybeSingle(),
    supabase.from('subjects').select('id, name').eq('id', data.subject_id).maybeSingle(),
  ])

  if (groupRes.error) throw groupRes.error
  if (subjectRes.error) throw subjectRes.error

  return {
    ...data,
    group_name: groupRes.data?.code ?? data.group_id,
    subject_name: subjectRes.data?.name ?? data.subject_id,
  }
}

export async function deleteTeacherTask(
  supabase: AppSupabase,
  teacherId: string,
  taskId: string
) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('teacher_id', teacherId)

  if (error) throw error

  return { ok: true as const }
}
export async function listTeacherTaskSubmissions(
  supabase: AppSupabase,
  teacherId: string,
  taskId: string
) {
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, teacher_id, group_id, subject_id, title')
    .eq('id', taskId)
    .eq('teacher_id', teacherId)
    .maybeSingle()

  if (taskError) throw taskError
  if (!task) throw new Error('NOT_FOUND')

  const { data: submissions, error: submissionsError } = await supabase
    .from('task_submissions')
    .select(
      'id, task_id, student_id, content, feedback, grade, submitted_at, reviewed_at, graded_at, updated_at'
    )
    .eq('task_id', taskId)
    .order('submitted_at', { ascending: false })

  if (submissionsError) throw submissionsError

  const studentIds = [...new Set((submissions ?? []).map((item) => item.student_id))]

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

  const studentsMap = new Map(
    (students ?? []).map((student) => [student.id, student.username])
  )

  return {
    task: {
      id: task.id,
      title: task.title,
      group_id: task.group_id,
      subject_id: task.subject_id,
    },
    totalSubmissions: (submissions ?? []).length,
    submissions: (submissions ?? []).map((submission) => ({
      ...submission,
      student_username:
        studentsMap.get(submission.student_id) ?? submission.student_id,
    })),
  }
}
export async function reviewTeacherSubmission(
  supabase: AppSupabase,
  teacherId: string,
  submissionId: string,
  input: {
    feedback: string
    grade: number | null
  }
) {
  const { data: submission, error: submissionError } = await supabase
    .from('task_submissions')
    .select(
      'id, task_id, student_id, content, feedback, grade, submitted_at, reviewed_at, graded_at, updated_at'
    )
    .eq('id', submissionId)
    .maybeSingle()

  if (submissionError) throw submissionError
  if (!submission) throw new Error('NOT_FOUND')

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, teacher_id')
    .eq('id', submission.task_id)
    .eq('teacher_id', teacherId)
    .maybeSingle()

  if (taskError) throw taskError
  if (!task) throw new Error('NOT_FOUND')

  const now = new Date().toISOString()

  const payload = {
    feedback: input.feedback.trim(),
    grade: input.grade,
    reviewed_at: now,
    graded_at: input.grade !== null ? now : null,
    updated_at: now,
  }

  const { data, error } = await supabase
    .from('task_submissions')
    .update(payload)
    .eq('id', submissionId)
    .select(
      'id, task_id, student_id, content, feedback, grade, submitted_at, reviewed_at, graded_at, updated_at'
    )
    .single()

  if (error) throw error

  const { data: student, error: studentError } = await supabase
    .from('profiles')
    .select('id, username, role')
    .eq('id', data.student_id)
    .eq('role', 'student')
    .maybeSingle()

  if (studentError) throw studentError

  return {
    ...data,
    student_username: student?.username ?? data.student_id,
  }
}