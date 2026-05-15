const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

const categories = ['Hostel', 'IT & Network', 'Academics', 'Transport', 'Canteen', 'Medical', 'Library']

export async function classifyTicket(title: string, description: string, location: string) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: `You are a ticket classification system for KCT (Kumaraguru College of Technology) helpdesk.

Your ONLY job is to classify which department should handle this ticket.
Choose exactly one from: ${categories.join(', ')}

Rules:
- Hostel: anything about rooms, dormitories, hostel blocks, power, water, hostel facilities
- IT & Network: wifi, internet, computers, printers, projectors, software, network
- Academics: attendance, marks, exams, lab records, faculty, timetable, hall tickets
- Transport: bus, van, routes, driver, college transport
- Canteen: food, mess, menu, mess card, dining
- Medical: health, sick, hospital, medicine, injury, doctor
- Library: books, library card, reading room, journals

Respond ONLY with valid JSON, nothing else:
{
  "category": "exact category name from the list",
  "confidence": 0.95,
  "reasoning": "one line reason",
  "is_flagged": false
}`
          },
          {
            role: 'user',
            content: `Title: ${title}
Description: ${description}
Location: ${location}

Which department handles this?`
          }
        ],
        temperature: 0.0,
        max_tokens: 150,
      })
    })

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) throw new Error('No response from Groq')

    // Strip any markdown if present
    const clean = content.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return {
      category: parsed.category,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
      is_flagged: parsed.is_flagged || parsed.confidence < 0.5,
    }
  } catch (error) {
    console.error('Groq classification error:', error)
    return {
      category: null,
      confidence: 0,
      reasoning: 'Classification failed',
      is_flagged: true,
    }
  }
}