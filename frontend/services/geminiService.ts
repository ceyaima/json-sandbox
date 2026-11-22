import { GoogleGenAI } from '@google/genai';
import { TreeNode } from '../types';

export async function analyzeBranchWithAI(
  pathNodes: TreeNode[],
  task: 'summary' | 'compare_variations' | 'emotional_analysis'
): Promise<string> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return 'API_KEY is not configured in this environment. Showing simulated sandbox analysis.';
  }

  const ai = new GoogleGenAI({ apiKey, vertexai: true });

  const transcript = pathNodes
    .map(
      (n, i) =>
        `Turn ${i + 1} [ID: ${n.id} | ${n.type.toUpperCase()}]:\n${n.content}\n${
          n.thought ? `(Thought: ${n.thought})\n` : ''
        }`
    )
    .join('\n---\n');

  let instruction = '';
  if (task === 'summary') {
    instruction =
      'Provide a succinct 3-bullet narrative summary of this branch path, highlighting the core decision points.';
  } else if (task === 'emotional_analysis') {
    instruction =
      'Analyze the underlying emotional subtext, psychology of characters involved, and tone dynamics in this dialogue branch.';
  } else {
    instruction =
      'Evaluate how this branch resolves the user prompt and compare what makes this variation distinct.';
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: [
          {
            text: `${instruction}\n\nBranch Transcript:\n${transcript}`
          }
        ]
      }
    });

    return response.text || 'No response generated.';
  } catch (err: unknown) {
    console.error('Gemini error:', err);
    return `Error generating AI analysis: ${err instanceof Error ? err.message : String(err)}`;
  }
}
