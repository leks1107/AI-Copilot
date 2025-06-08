/**
 * Builds a prompt for GPT-4 based on the transcript and resume data
 * @param {string} transcript - The transcribed text from AssemblyAI
 * @param {Object} resumeData - Optional resume data
 * @returns {string} The formatted prompt for GPT-4
 */
function buildPrompt(transcript, resumeData = null) {
  // Base system message
  const systemMessage = "You are an AI interview assistant. Your task is to provide a confident, concise, and professional response to the interview question. Use the STAR format (Situation, Task, Action, Result) when appropriate.";

  // Build context from resume if available
  let context = "";
  if (resumeData) {
    context = `Based on this resume: ${JSON.stringify(resumeData)}, `;
  }

  // Format the prompt
  const prompt = `${systemMessage}\n\n${context}The interviewer asked: "${transcript}". Provide a natural, conversational response that demonstrates expertise and confidence.`;

  return prompt;
}

module.exports = buildPrompt; 