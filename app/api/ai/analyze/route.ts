import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer, contacts, interactions } = body;

    if (!customer || !interactions) {
      return NextResponse.json(
        { error: 'Missing customer or interactions data' },
        { status: 400 }
      );
    }

    const prompt = `
You are an AI CRM co-pilot for a dental/medical SaaS platform. Analyze the following practice history and output structured relationship intelligence.

Practice Name: ${customer.name} (Status: ${customer.status})
Contacts: ${JSON.stringify(contacts)}
Interaction History (newest first):
${JSON.stringify(interactions, null, 2)}
`;

    // Request structured JSON output using Gemini 2.5 Flash
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You extract actionable relationship intelligence for small dental and medical practice owners from sales interactions.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            attentionScore: {
              type: Type.INTEGER,
              description:
                'Urgency/attention score from 0 to 100 based on deal recency, buyer sentiment, and onboarding deadlines.',
            },
            urgencyReason: {
              type: Type.STRING,
              description:
                'One concise sentence explaining why this customer has this attention score.',
            },
            summary: {
              type: Type.STRING,
              description:
                'A 2-sentence executive summary of current relationship status.',
            },
            keyPainPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description:
                'List of key friction points or opportunities mentioned in interactions.',
            },
            suggestedAction: {
              type: Type.STRING,
              description:
                'Recommended next concrete action for the practice owner.',
            },
            recommendedEmailDraft: {
              type: Type.STRING,
              description:
                'A complete, personalized follow-up email draft matching the conversation context.',
            },
          },
          required: [
            'attentionScore',
            'urgencyReason',
            'summary',
            'keyPainPoints',
            'suggestedAction',
            'recommendedEmailDraft',
          ],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response received from Gemini API');
    }

    const parsedInsights = JSON.parse(responseText);
    return NextResponse.json(parsedInsights);
  } catch (error: any) {
    console.error('Gemini Analysis Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze customer intelligence', details: error.message },
      { status: 500 }
    );
  }
}