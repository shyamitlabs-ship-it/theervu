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
            content: `You are a ticket classification system for KCT (Kumaraguru College of Technology) helpdesk called Theervu.
            
Classify support tickets into exactly one of these categories: ${categories.join(', ')}.

Also assess priority based on content:
- critical: medical emergency, no power at night, safety issues
- high: exam-related issues, hostel infrastructure, network down
- medium: academic queries, transport issues, general complaints  
- low: library, canteen, minor inconveniences

Respond ONLY with valid JSON in this exact format:
{
  "category": "category name here",
  "confidence": 0.95,
  "priority": "high",
  "reasoning": "brief one line reason",
  "is_flagged": false
}

If the ticket doesn't fit any category well, set is_flagged to true and confidence below 0.5.`
          },
          {
            role: 'user',
            content: `Title: ${title}
Description: ${description}
Location: ${location}

Classify this ticket.`
          }
        ],
        temperature: 0.1,
        max_tokens: 200,
      })
    })

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) throw new Error('No response from Groq')

    const parsed = JSON.parse(content)
    return {
      category: parsed.category,
      confidence: parsed.confidence,
      priority: parsed.priority,
      reasoning: parsed.reasoning,
      is_flagged: parsed.is_flagged || parsed.confidence < 0.5,
    }
  } catch (error) {
    console.error('Groq classification error:', error)
    return {
      category: null,
      confidence: 0,
      priority: 'medium',
      reasoning: 'Classification failed',
      is_flagged: true,
    }
  }
}