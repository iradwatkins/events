# 🤖 OpenAI Integration Guide - SteppersLife Events

Future AI-powered features for customer support and content generation.

---

## 📋 Overview

This document outlines planned OpenAI integration points for the SteppersLife Events platform. These features leverage AI to enhance user experience, reduce support overhead, and improve content quality.

---

## 🎯 Planned AI Features

### 1. AI-Powered Customer Support Chatbot

**Purpose**: Provide instant 24/7 support for common questions

**Integration Points**:
- **Location**: Floating chat widget on all pages
- **Triggers**: Click "Help" button or automatic after 30s on checkout page
- **Context**: Pass current page, user status (organizer/attendee), and cart contents

**Use Cases**:
- "How do I purchase tickets?"
- "What's your refund policy?"
- "I didn't receive my confirmation email"
- "How do I create an event?"
- "What payment methods do you accept?"

**Implementation**:
```typescript
// lib/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function getChatResponse(
  userMessage: string,
  context: {
    page: string;
    userType: 'organizer' | 'attendee' | 'guest';
    cartItems?: number;
  }
) {
  const systemPrompt = `You are a helpful customer support agent for SteppersLife Events,
  a platform for stepping event ticketing. Current context:
  - Page: ${context.page}
  - User Type: ${context.userType}
  ${context.cartItems ? `- Items in cart: ${context.cartItems}` : ''}

  Provide concise, friendly responses. If you don't know something,
  suggest contacting support at support@stepperslife.com`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.7,
    max_tokens: 300
  });

  return response.choices[0].message.content;
}
```

**API Route**:
```typescript
// app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getChatResponse } from '@/lib/openai';

export async function POST(request: NextRequest) {
  const { message, context } = await request.json();

  try {
    const response = await getChatResponse(message, context);
    return NextResponse.json({ response });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
```

**Component**:
```tsx
// components/ai/chat-widget.tsx
'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
  }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: {
            page: window.location.pathname,
            userType: 'guest' // Get from auth context
          }
        })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl border">
          {/* Chat implementation */}
        </div>
      )}
    </>
  );
}
```

---

### 2. Event Description Generator

**Purpose**: Help organizers create compelling event descriptions

**Integration Point**: Event creation form

**Features**:
- Generate description from basic details (title, date, location, type)
- Multiple tone options (professional, casual, exciting)
- Include SEO keywords automatically
- Suggest ticket tier names and descriptions

**Implementation**:
```typescript
// lib/openai.ts
export async function generateEventDescription(params: {
  title: string;
  date: string;
  location: string;
  eventType: string;
  tone: 'professional' | 'casual' | 'exciting';
}) {
  const prompt = `Generate a compelling event description for:

  Title: ${params.title}
  Date: ${params.date}
  Location: ${params.location}
  Type: ${params.eventType}
  Tone: ${params.tone}

  Include:
  - Engaging opening paragraph
  - What attendees can expect
  - Why they should attend
  - Call to action

  Length: 150-200 words`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 500
  });

  return response.choices[0].message.content;
}
```

**UI Integration**:
```tsx
// app/organizer/events/create/page.tsx
<div className="space-y-4">
  <Label>Event Description</Label>
  <Textarea
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    rows={6}
  />
  <Button
    variant="outline"
    onClick={async () => {
      setLoading(true);
      const generated = await fetch('/api/ai/generate-description', {
        method: 'POST',
        body: JSON.stringify({ title, date, location, eventType, tone: 'exciting' })
      }).then(r => r.json());
      setDescription(generated.description);
      setLoading(false);
    }}
  >
    <Sparkles className="w-4 h-4 mr-2" />
    Generate with AI
  </Button>
</div>
```

---

### 3. Email Content Optimization

**Purpose**: Improve email open rates and engagement

**Integration Point**: Email templates

**Features**:
- Generate subject lines with high open rates
- Personalize email content based on user behavior
- A/B test suggestions for email campaigns
- Optimize timing recommendations

**Implementation**:
```typescript
export async function generateEmailSubject(params: {
  emailType: 'confirmation' | 'reminder' | 'refund' | 'new_event';
  eventName?: string;
  userName?: string;
}) {
  const prompt = `Generate 3 engaging email subject lines for:

  Type: ${params.emailType}
  Event: ${params.eventName || 'N/A'}
  Recipient: ${params.userName || 'User'}

  Requirements:
  - Under 50 characters
  - Action-oriented
  - Personal and friendly
  - Avoid spam words`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.9,
    max_tokens: 200
  });

  return response.choices[0].message.content;
}
```

---

### 4. Fraud Detection

**Purpose**: Identify suspicious orders and prevent fraudulent purchases

**Features**:
- Analyze purchase patterns
- Flag unusual behavior (bulk purchases, rapid orders, mismatched location)
- Risk scoring for each transaction
- Automated alerts for high-risk orders

**Implementation**:
```typescript
export async function analyzeFraudRisk(params: {
  orderAmount: number;
  orderQuantity: number;
  buyerEmail: string;
  buyerIP: string;
  eventLocation: string;
  previousOrders: number;
}) {
  const prompt = `Analyze this order for fraud risk:

  Amount: $${params.orderAmount}
  Quantity: ${params.orderQuantity} tickets
  Email: ${params.buyerEmail}
  IP Location: ${params.buyerIP}
  Event Location: ${params.eventLocation}
  Previous Orders: ${params.previousOrders}

  Provide:
  1. Risk score (0-100)
  2. Risk level (low/medium/high)
  3. Reasons for score
  4. Recommended action`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 300
  });

  return response.choices[0].message.content;
}
```

---

### 5. Smart Search & Recommendations

**Purpose**: Help users discover relevant events

**Features**:
- Natural language event search ("stepping events near me next weekend")
- Personalized event recommendations based on history
- "Events you might like" suggestions
- Trending events in user's area

**Implementation**:
```typescript
export async function searchEvents(query: string, userContext: {
  location?: string;
  previousEvents?: string[];
}) {
  // Use OpenAI to understand intent
  const intent = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{
      role: 'system',
      content: 'Extract search parameters from natural language queries. Return JSON.'
    }, {
      role: 'user',
      content: `Query: "${query}"\nUser location: ${userContext.location || 'unknown'}`
    }],
    response_format: { type: 'json_object' }
  });

  const searchParams = JSON.parse(intent.choices[0].message.content || '{}');

  // Use extracted params to query Convex
  // Return relevant events
}
```

---

## 🔧 Setup Instructions

### Step 1: Install OpenAI SDK

```bash
npm install openai
```

### Step 2: Add Environment Variables

```bash
# .env.local
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_ORG_ID=org-your-org-id  # Optional
```

### Step 3: Create OpenAI Client

```typescript
// lib/openai.ts
import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});
```

### Step 4: Implement Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
});

// Use in API routes:
const { success } = await ratelimit.limit(userIP);
if (!success) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

---

## 💰 Cost Considerations

### OpenAI Pricing (as of 2024)
- **GPT-4**: ~$0.03 per 1K input tokens, ~$0.06 per 1K output tokens
- **GPT-3.5-turbo**: ~$0.001 per 1K input tokens, ~$0.002 per 1K output tokens

### Estimated Monthly Costs (1,000 users)
- **Chat Support**: ~$50-100/month (assuming 500 chat sessions, avg 10 messages each)
- **Description Generator**: ~$10-20/month (assuming 200 events created)
- **Email Optimization**: ~$5-10/month (batch processing)
- **Fraud Detection**: ~$20-30/month (all orders analyzed)

**Total**: ~$85-160/month for AI features

### Cost Optimization Strategies
1. Use GPT-3.5-turbo for simpler tasks (chat, email)
2. Cache common responses
3. Implement rate limiting
4. Set max_tokens limits
5. Use function calling for structured outputs

---

## 🔒 Security Best Practices

### 1. Input Sanitization
```typescript
function sanitizeInput(text: string): string {
  return text
    .trim()
    .slice(0, 1000) // Max length
    .replace(/[<>]/g, ''); // Remove potential HTML
}
```

### 2. Content Moderation
```typescript
const moderation = await openai.moderations.create({
  input: userMessage
});

if (moderation.results[0].flagged) {
  return { error: 'Content violates policies' };
}
```

### 3. API Key Protection
- Never expose API keys in client-side code
- Use environment variables
- Rotate keys regularly
- Monitor usage on OpenAI dashboard

---

## 📊 Monitoring & Analytics

### Track AI Usage
```typescript
// convex/aiUsage/mutations.ts
export const logAIUsage = mutation({
  args: {
    feature: v.string(),
    tokensUsed: v.number(),
    cost: v.number(),
    success: v.boolean()
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('aiUsage', {
      ...args,
      timestamp: Date.now()
    });
  }
});
```

### Dashboard Metrics
- Total API calls per feature
- Token usage and costs
- Average response time
- Success/error rates
- User satisfaction ratings

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Install OpenAI SDK
- [ ] Set up API routes structure
- [ ] Implement rate limiting
- [ ] Add error handling

### Phase 2: Customer Support (Week 3-4)
- [ ] Build chat widget UI
- [ ] Train chatbot with FAQs
- [ ] Add context awareness
- [ ] Test with beta users

### Phase 3: Content Generation (Week 5-6)
- [ ] Event description generator
- [ ] Email subject line generator
- [ ] Ticket tier suggestions
- [ ] SEO optimization

### Phase 4: Advanced Features (Week 7-8)
- [ ] Fraud detection system
- [ ] Smart search implementation
- [ ] Personalized recommendations
- [ ] A/B testing framework

### Phase 5: Optimization (Ongoing)
- [ ] Monitor costs and usage
- [ ] Optimize prompts
- [ ] Implement caching
- [ ] Collect user feedback

---

## 📚 Additional Resources

- **OpenAI Documentation**: https://platform.openai.com/docs
- **Next.js AI Examples**: https://sdk.vercel.ai/docs
- **Prompt Engineering Guide**: https://www.promptingguide.ai
- **OpenAI Cookbook**: https://github.com/openai/openai-cookbook

---

## 🤝 Contributing

When implementing AI features:
1. Test thoroughly before deploying
2. Monitor costs closely
3. Provide fallbacks for API failures
4. Collect user feedback
5. Document prompt changes

---

**Note**: This is a future enhancement document. None of these features are currently implemented. Implement them incrementally based on user feedback and budget.
