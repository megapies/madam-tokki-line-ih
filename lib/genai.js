const { GoogleGenerativeAI } = require("@google/generative-ai");

const extractShippingLabel = async (text) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: "You are a helpful assistant."
  });

  const result = await model.generateContent(text);
  console.log('raw result', result);
  const responseText = result.response.text();

  return responseText;
}

module.exports = { extractShippingLabel };