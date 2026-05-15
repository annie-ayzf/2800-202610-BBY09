const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generatePlantDescription(plant) {
  const response = await openai.responses.create({
    model: "gpt-5-nano",
    tools: [
      { type: "web_search"}
    ],
    input: `
Write an interesting student-friendly description for this plant

Plant name: ${plant.name}
Scientific name: ${plant.scientificName}
Edible: ${plant.isEdible}
Location: ${plant.location}
Habitat: ${plant.habitat}

Important:
The info card already shows the plants edible status, location, and habitat separately.
Do not simply repeat those fields in the sentence form.

Rules:
- Write 5 sentences only.
- Use simple words for students.
- Use the database facts as the main source of truth.
- You may use web search for basic background information about the plant.
- Do not change the edible value from the database.
- Do not invent extra facts.
- Do not give medical advice.
- If isEdible is false, clearly say students should not eat it.
`
  });

  return response.output_text;
}

module.exports = { generatePlantDescription };