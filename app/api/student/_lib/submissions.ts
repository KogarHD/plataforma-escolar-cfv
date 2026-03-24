// C:\Users\edgar\Proyectos\plataforma-escolar-cfv\app\api\student\_lib\submissions.ts
import type { SupabaseClient } from '@supabase/supabase-js'

type AppSupabase = SupabaseClient

type SubmissionRow = {
  id: string
  task_id: string
  student_id: string
  content: string
  submitted_at: string
  updated_at: string
}

export async function createStudentSubmission(
  supabase: AppSupabase,
  studentId: string,
  input: {
    task_id: string
    content: string
  }
) {
  const payload = {
    task_id: input.task_id,
    student_id: studentId,
    content: input.content.trim(),
  }

  const { data, error } = await supabase
    .from('task_submissions')
    .insert(payload)
    .select('id, task_id, student_id, content, submitted_at, updated_at')
    .single()

  if (error) throw error

  return data as SubmissionRow
}

export async function updateStudentSubmission(
  supabase: AppSupabase,
  studentId: string,
  submissionId: string,
  input: {
    content: string
  }
) {
  const payload = {
    content: input.content.trim(),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('task_submissions')
    .update(payload)
    .eq('id', submissionId)
    .eq('student_id', studentId)
    .select('id, task_id, student_id, content, submitted_at, updated_at')
    .single()

  if (error) throw error

  return data as SubmissionRow
}