import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// This function should only be called by cron/scheduler, not by end users.
// We verify a shared secret to prevent unauthorized invocation.

Deno.serve(async (req) => {
  // No CORS needed - this is a cron-only function, not called from browsers
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 })
  }

  try {
    // Verify cron secret to ensure only scheduled invocations can call this
    const cronSecret = Deno.env.get("CRON_SECRET");
    const authHeader = req.headers.get("Authorization");

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log("Unauthorized cron invocation attempt");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    // Fetch all recurring tasks that need processing
    const { data: recurringTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('id, user_id, title, description, priority, category, recurrence, recurrence_end_date, last_recurrence_date, created_at')
      .not('recurrence', 'is', null)
      .or(`recurrence_end_date.is.null,recurrence_end_date.gte.${todayStr}`)

    if (fetchError) {
      console.error('Error fetching recurring tasks:', fetchError)
      throw fetchError
    }

    console.log(`Found ${recurringTasks?.length || 0} recurring tasks to process`)

    const tasksToCreate: Array<{
      user_id: string;
      title: string;
      description: string | null;
      priority: string;
      category: string | null;
      progress: number;
      completed: boolean;
      due_date: string;
      parent_task_id: string;
      recurrence: null;
      recurrence_end_date: null;
    }> = []

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
        case 'monthly': {
          const lastMonth = lastRecurrence.getMonth()
          const lastYear = lastRecurrence.getFullYear()
          const currentMonth = today.getMonth()
          const currentYear = today.getFullYear()

          const monthsDiff = (currentYear - lastYear) * 12 + (currentMonth - lastMonth)
          shouldCreateNew = monthsDiff >= 1
          break
        }
      }

      if (shouldCreateNew) {
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
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error: unknown) {
    console.error('Error processing recurring tasks:', error)

    return new Response(
      JSON.stringify({ error: 'Task processing failed. Please try again.' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
