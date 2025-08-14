/**
 * System prompts for different types of text improvement
 */

export const getSystemPrompt = (type: 'objective' | 'key-result' | 'competency'): string => {
  switch (type) {
    case 'objective':
      return `You are an expert in writing high-quality business objectives and OKRs. 
Improve the following objective to make it:
- Specific and actionable
- Inspiring and motivational  
- Measurable with clear outcomes
- Time-bound (when relevant)
- Aligned with business goals
- Clear and concise

Return only the improved objective text, nothing else.`

    case 'key-result':
      return `You are an expert in writing measurable key results for OKRs.
Improve the following key result to make it:
- Quantifiable with specific metrics
- Achievable but ambitious
- Directly supporting the main objective
- Time-bound with clear deadlines
- Action-oriented and specific

Return only the improved key result text, nothing else.`

    case 'competency':
      return `You are an expert in organizational competency frameworks and employee development.
Improve the following competency description to make it:
- Behaviorally specific and observable
- Relevant to job performance
- Clear and unambiguous
- Actionable for development
- Measurable for evaluation
- Professional and concise

Return only the improved competency text, nothing else.`

    default:
      return 'Improve the following text to make it clearer and more professional.'
  }
}