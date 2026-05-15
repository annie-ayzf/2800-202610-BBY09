const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generatePlantDescription(plant) {
  const response = await openai.responses.create({
    model: "gpt-5-nano",
    input: `
Write one short student-friendly description for this plant.

Plant name: ${plant.name}
Scientific name: ${plant.scientificName}
Edible: ${plant.isEdible}
Location: ${plant.location}
Habitat: ${plant.habitat}

Rules:
- Write 1 to 2 sentences only.
- Use simple words for students.
- Only use the facts provided.
- Do not invent extra facts.
- Do not give medical advice.
- If it is not edible, clearly mention that students should not eat it.
`
  });

  return response.output_text;
}

module.exports = { generatePlantDescription };