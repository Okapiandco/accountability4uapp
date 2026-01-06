import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// This is a cron-triggered function - minimal CORS needed for health checks only
const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') || '',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    // Fetch all recurring tasks that need processing
    const { data: recurringTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .not('recurrence', 'is', null)
      .or(`recurrence_end_date.is.null,recurrence_end_date.gte.${todayStr}`)

    if (fetchError) {
      console.error('Error fetching recurring tasks:', fetchError)
      throw fetchError
    }

    console.log(`Found ${recurringTasks?.length || 0} recurring tasks to process`)

    const tasksToCreate: any[] = []

    for (const task of recurringTasks || []) {
      const lastRecurrence = task.last_recurrence_date 
        ? new Date(task.last_recurrence_date) 
        : new Date(task.created_at)
      
      lastRecurrence.setHours(0, 0, 0, 0)

      let shouldCreateNew = false
      const daysSinceLastRecurrence = Math.floor(
        (today.getTime() - lastRecurrence.getTime()) / (1000 * 60 * 60 * 24)
      )

      switch (task.recurrence) {
        case 'daily':
          shouldCreateNew = daysSinceLastRecurrence >= 1
          break
        case 'weekly':
          shouldCreateNew = daysSinceLastRecurrence >= 7
          break
        case 'monthly':
          // Check if at least a month has passed
          const lastMonth = lastRecurrence.getMonth()
          const lastYear = lastRecurrence.getFullYear()
          const currentMonth = today.getMonth()
          const currentYear = today.getFullYear()
          
          const monthsDiff = (currentYear - lastYear) * 12 + (currentMonth - lastMonth)
          shouldCreateNew = monthsDiff >= 1
          break
      }

      if (shouldCreateNew) {
        // Create a new task instance
        tasksToCreate.push({
          user_id: task.user_id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          category: task.category,
          progress: 0,
          completed: false,
          due_date: todayStr,
          parent_task_id: task.id,
          // New instances are not recurring themselves
          recurrence: null,
          recurrence_end_date: null,
        })

        // Update the parent task's last recurrence date
        await supabase
          .from('tasks')
          .update({ last_recurrence_date: todayStr })
          .eq('id', task.id)
      }
    }

    if (tasksToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('tasks')
        .insert(tasksToCreate)

      if (insertError) {
        console.error('Error creating recurring task instances:', insertError)
        throw insertError
      }

      console.log(`Created ${tasksToCreate.length} new task instances`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: recurringTasks?.length || 0,
        created: tasksToCreate.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error: unknown) {
    // Log detailed error for server-side debugging
    console.error('Error processing recurring tasks:', error)
    
    // Return generic error message
    return new Response(
      JSON.stringify({ error: 'Task processing failed. Please try again.' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})