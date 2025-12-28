import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function extractTransactionsFallback(fileContent) {
  console.log('OpenAI Fallback: Starting transaction extraction');
  console.log('OpenAI Fallback: File content length:', fileContent.length);

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a financial transaction extraction assistant. Extract all transactions from bank statements and return them as a JSON array. Each transaction should have: date (YYYY-MM-DD), amount (number, negative for debits/withdrawals, positive for credits/deposits), and description (string). Only return the JSON array, no other text."
        },
        {
          role: "user",
          content: `Extract all transactions from this bank statement and return as JSON array:

${fileContent.substring(0, 12000)}`
        }
      ],
      temperature: 0.1,
      max_tokens: 4000,
    });

    const responseText = completion.choices[0].message.content;
    console.log('OpenAI Fallback: Response received, length:', responseText.length);
    console.log('OpenAI Fallback: Response preview:', responseText.substring(0, 500));

    // Parse JSON response
    let transactions;
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        transactions = JSON.parse(jsonMatch[0]);
      } else {
        transactions = JSON.parse(responseText);
      }

      if (!Array.isArray(transactions)) {
        throw new Error('Response is not an array');
      }

      // Validate transactions
      transactions.forEach((transaction, index) => {
        if (!transaction.date || !transaction.description || transaction.amount === undefined) {
          throw new Error(`Transaction ${index} is missing required fields`);
        }
      });

    } catch (parseError) {
      console.error('OpenAI Fallback: Parse error:', parseError);
      throw new Error(`Failed to parse response: ${parseError.message}`);
    }

    console.log('OpenAI Fallback: Successfully extracted', transactions.length, 'transactions');
    return transactions;

  } catch (error) {
    console.error('OpenAI Fallback: Error:', error);
    throw error;
  }
}