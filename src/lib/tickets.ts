import { supabase } from './supabase'

export async function createTicket({
  studentId,
  title,
  description,
  categoryId,
  location,
}: {
  studentId: string
  title: string
  description: string
  categoryId: string
  location: string
}) {
  const hour = new Date().getHours()
  const timeOfDay = hour >= 22 || hour < 6 ? 'night'
    : hour < 12 ? 'morning'
    : hour < 17 ? 'afternoon' : 'evening'

  const today = new Date().toISOString().split('T')[0]

  // Get active events
  const { data: events } = await supabase
    .from('college_events')
    .select('*')
    .lte('start_date', today)
    .gte('end_date', today)

  // Get category weight
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .single()

  // Get student's batch for batch-aware event matching
  const { data: studentProfile } = await supabase
    .from('profiles')
    .select('batch')
    .eq('id', studentId)
    .single()

  const studentBatch = studentProfile?.batch
    ? studentProfile.batch.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    : ''

  // Find applicable event — batch aware
  let eventMultiplier = 1.0
  let activeEventContext = null

  if (events && events.length > 0) {
    for (const event of events) {
      const batches: string[] = event.affected_batches || ['All']
      const appliesToStudent = batches.includes('All') ||
        batches.some((b: string) => {
          const cleanBatch = b.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
          return studentBatch.includes(cleanBatch) || cleanBatch.includes(studentBatch)
        })

      if (appliesToStudent && (event.priority_multiplier || 1.0) > eventMultiplier) {
        eventMultiplier = event.priority_multiplier || 1.0
        activeEventContext = event.title
      }
    }
  }

  // Base weight and multipliers
  const baseWeight = category?.default_priority_weight || 5
  const timeMultiplier = timeOfDay === 'night' ? 2.0 : timeOfDay === 'evening' ? 1.3 : 1.0
  const locationMultiplier = location.toLowerCase().includes('hostel') && timeOfDay === 'night' ? 1.8 : 1.0

  let priorityScore = baseWeight * timeMultiplier * eventMultiplier * locationMultiplier

  // Hard overrides
  const lowerDesc = description.toLowerCase()
  const lowerTitle = title.toLowerCase()

  const powerKeywords = ['no power', 'power cut', 'no electricity', 'blackout', 'lights out', 'power failure']
  const medicalKeywords = ['medical emergency', 'accident', 'injured', 'unconscious', 'bleeding', 'heart attack', 'hospital']
  const hasPowerIssue = powerKeywords.some(k => lowerDesc.includes(k) || lowerTitle.includes(k))
  const hasMedical = medicalKeywords.some(k => lowerDesc.includes(k) || lowerTitle.includes(k))
  const isHostel = location.toLowerCase().includes('hostel') || lowerDesc.includes('hostel') || lowerTitle.includes('hostel')

  if (hasPowerIssue && isHostel && timeOfDay === 'night') priorityScore = 100
  if (hasPowerIssue && isHostel) priorityScore = Math.max(priorityScore, 70)
  if (hasMedical) priorityScore = 100

  const highKeywords = ['not working', 'broken', 'urgent', 'immediately', 'exam tomorrow', 'cannot access', 'blocked', 'not opening']
  const hasHighKeyword = highKeywords.some(k => lowerDesc.includes(k) || lowerTitle.includes(k))
  if (hasHighKeyword) priorityScore = Math.max(priorityScore, 28)

  const priorityLabel = priorityScore >= 60 ? 'critical'
    : priorityScore >= 30 ? 'high'
    : priorityScore >= 12 ? 'medium' : 'low'

  const slaHours = category?.default_sla_hours || 24
  const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString()

  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 9000 + 1000)
  const ticketNumber = `THR-${new Date().getFullYear()}-${random}-${timestamp.toString().slice(-4)}`

  const { data, error } = await supabase.from('tickets').insert({
    ticket_number: ticketNumber,
    student_id: studentId,
    category_id: categoryId,
    title,
    description,
    location,
    priority_score: priorityScore,
    priority_label: priorityLabel,
    sla_deadline: slaDeadline,
    time_of_day_at_creation: timeOfDay,
    active_event_context: activeEventContext,
    status: 'open',
  }).select().single()

  if (error) console.error('Ticket creation error:', error)
  return { data, error }
}

export async function getStudentTickets(studentId: string) {
  const { data, error } = await supabase
    .from('tickets')
    .select(`*, categories(name, icon)`)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function getStaffTickets() {
  const { data, error } = await supabase
    .from('tickets')
    .select(`*, categories(name, icon), profiles!tickets_student_id_fkey(name, email, department, batch, hostel_block, roll_number)`)
    .in('status', ['open', 'in_progress', 'awaiting_student'])
    .order('priority_score', { ascending: false })
  return { data, error }
}

export async function updateTicketStatus(ticketId: string, status: string) {
  const updates: any = { status, updated_at: new Date().toISOString() }
  if (status === 'resolved') updates.resolved_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', ticketId)
    .select()
    .single()
  return { data, error }
}

export async function getTicketById(ticketId: string) {
  const { data, error } = await supabase
    .from('tickets')
    .select(`*, categories(name, icon), profiles!tickets_student_id_fkey(name, email, department, batch, hostel_block, roll_number)`)
    .eq('id', ticketId)
    .single()
  return { data, error }
}

export async function getTicketComments(ticketId: string) {
  const { data, error } = await supabase
    .from('ticket_comments')
    .select(`*, profiles(name, role)`)
    .eq('ticket_id', ticketId)
    .eq('is_internal', false)
    .order('created_at', { ascending: true })
  return { data, error }
}

export async function addComment(ticketId: string, authorId: string, content: string, isInternal: boolean = false) {
  const { data, error } = await supabase
    .from('ticket_comments')
    .insert({ ticket_id: ticketId, author_id: authorId, content, is_internal: isInternal })
    .select()
    .single()
  return { data, error }
}

export async function getSimilarTickets(title: string, description: string, categoryId: string) {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      id, title, description, ticket_number, created_at, resolved_at,
      ticket_comments(content, is_internal, profiles(role))
    `)
    .eq('category_id', categoryId)
    .eq('status', 'resolved')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error || !data || data.length === 0) return []

  const keywords = [...title.toLowerCase().split(' '), ...description.toLowerCase().split(' ')]
    .filter(w => w.length > 3)

  const scored = data.map(ticket => {
    const text = `${ticket.title} ${ticket.description}`.toLowerCase()
    const score = keywords.filter(k => text.includes(k)).length
    const resolution = (ticket.ticket_comments as any[])
      ?.filter((c: any) => c.profiles?.role === 'staff' && !c.is_internal)
      ?.slice(-1)[0]?.content || 'Resolved by support team'
    return { ...ticket, score, resolution }
  })

  return scored
    .filter(t => t.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}