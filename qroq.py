from groq import Groq

client = Groq(
    api_key='REMOVED_GROQ_API_KEY'
)

completion = client.chat.completions.create(
    model="meta-llama/llama-4-maverick-17b-128e-instruct",
    messages=[
        {
            "role": "system",
            "content": "You are a job posting parser. Extract and return ONLY a JSON object with no markdown formatting, code blocks, or additional text. Use this exact format:\n{\n  \"company\": \"Company Name\",\n  \"role\": \"Job Title\",\n  \"location\": \"City, State/Province\",\n  \"description\": \"Brief job description\"\n}\n\nEnsure all values are properly escaped JSON strings."
        },
        {
            "role": "user",
            "content": "bmo, software developer, toronto, 5+ yers of experience"
        }
    ],
    temperature=0.1,
    max_completion_tokens=1024,
    top_p=1,
    stream=False,
    stop=None
)

print(completion.choices[0].message.content)