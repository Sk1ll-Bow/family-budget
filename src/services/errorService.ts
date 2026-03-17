import { supabase } from '../core/supabase'

export interface IErrorLog {
  id?: string
  error_message: string
  stack_trace?: string
  user_id?: string
  url: string
  timestamp: string
}

/**
 * Logs an error to the Supabase error_logs table.
 * @param message The error message to log.
 * @param stack The stack trace (optional).
 * @returns The UUID of the created log entry.
 */
export const logError = async (message: string, stack?: string): Promise<string> => {
  const { data, error } = await supabase
    .from('error_logs')
    .insert([{
      error_message: message,
      stack_trace: stack,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }])
    .select('id')
    .single()

  if (error) {
    console.error('Failed to log error to Supabase:', error)
    return 'logging-failed'
  }

  return data?.id || 'unknown-id'
}
