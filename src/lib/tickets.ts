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
  // Get hour for time context
  const hour = new Date().getHours()
  const timeOfDay = hour >= 22 || hour < 6 ? 'night'
    : hour < 12 ? 'morning'
    : hour < 17 ? 'afternoon' : 'evening'

  // Get active events
  const today = new Date().toISOString().split('T')[0]
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

  // Compute priority score
  const baseWeight = category?.default_priority_weight || 5
  const timeMultiplier = timeOfDay === 'night' ? 2.0 : timeOfDay === 'evening' ? 1.3 : 1.0
  const eventMultiplier = events && events.length > 0 ? events[0].priority_multiplier : 1.0
  const locationMultiplier = location.toLowerCase().includes('hostel') && timeOfDay === 'night' ? 1.8 : 1.0

  let priorityScore = baseWeight * timeMultiplier * eventMultiplier * locationMultiplier

  // Hard overrides
  const lowerDesc = description.toLowerCase()
  const lowerTitle = title.toLowerCase()
  // Critical hard overrides
  const powerKeywords = ['no power', 'power cut', 'no electricity', 'blackout', 'lights out', 'power failure']
  const medicalKeywords = ['medical emergency', 'accident', 'injured', 'unconscious', 'bleeding', 'heart', 'hospital']
  const hasPowerIssue = powerKeywords.some(k => lowerDesc.includes(k) || lowerTitle.includes(k))
  const hasMedical = medicalKeywords.some(k => lowerDesc.includes(k) || lowerTitle.includes(k))
  const isHostel = location.toLowerCase().includes('hostel') || lowerDesc.includes('hostel') || lowerTitle.includes('hostel')

  if (hasPowerIssue && isHostel && timeOfDay === 'night') priorityScore = 100
  if (hasPowerIssue && isHostel) priorityScore = Math.max(priorityScore, 70)
  if (hasMedical) priorityScore = 100

  // High priority keywords
  const highKeywords = ['not working', 'broken', 'urgent', 'immediately', 'exam tomorrow', 'cannot access', 'blocked']
  const hasHighKeyword = highKeywords.some(k => lowerDesc.includes(k) || lowerTitle.includes(k))
  if (hasHighKeyword) priorityScore = Math.max(priorityScore, 28)

  // Priority label
  const priorityLabel = priorityScore >= 60 ? 'critical'
    : priorityScore >= 30 ? 'high'
    : priorityScore >= 12 ? 'medium' : 'low'

  // SLA deadline
  const slaHours = category?.default_sla_hours || 24
  const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString()

  // Active event context
  const eventContext = events && events.length > 0 ? events[0].title : null

  // Generate ticket number
  const { data: countData } = await supabase.from('tickets').select('id', { count: 'exact' })
  const count = countData?.length || 0
  const ticketNumber = `THR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

  // Insert ticket
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
    active_event_context: eventContext,
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
    .select(`*, categories(name, icon), profiles!tickets_student_id_fkey(name, email, department, batch, hostel_block)`)
    .in('status', ['open', 'in_progress', 'awaiting_student'])
    .order('priority_score', { ascending: false })

  return { data, error }
}

export async function updateTicketStatus(ticketId: string, status: string) {
  const { data, error } = await supabase
    .from('tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', ticketId)
    .select()
    .single()

  return { data, error }
}
export async function getTicketById(ticketId: string) {
  const { data, error } = await supabase
    .from('tickets')
    .select(`*, categories(name, icon), profiles!tickets_student_id_fkey(name, email, department, batch, hostel_block)`)
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