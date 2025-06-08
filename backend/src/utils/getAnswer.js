const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Gets an answer from GPT-4 based on the prompt
 * @param {string} prompt - The prompt to send to GPT-4
 * @returns {Promise<string>} The generated answer
 */
async function getAnswer(prompt) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an AI interview assistant. Provide concise, professional responses."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
      presence_penalty: 0.6,
      frequency_penalty: 0.3
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('GPT-4 API error:', error);
    throw new Error('Failed to get answer from GPT-4');
  }
}

module.exports = getAnswer; 