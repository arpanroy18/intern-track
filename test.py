import os
import google.generativeai as genai

# Configure with API key directly
genai.configure(api_key="AIzaSyBicqwQfKK737X1N3JbupTydFR-LElT7dg")

# Create the model
generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
}

model = genai.GenerativeModel(
    model_name="gemini-pro",  # Changed model name to a valid one
    generation_config=generation_config,
)

# Create chat with specific system prompt
chat_session = model.start_chat(
    history=[
        {
            "role": "user",
            "parts": ["You are a job posting parser. When I give you a job posting text, extract the following information and return it in JSON format: Company, Role, Location, and Job Description. Only return the JSON object, nothing else."],
        },
        {
            "role": "model",
            "parts": ["I understand. I will parse job postings and return a JSON object containing the Company, Role, Location, and Job Description. I will only return the JSON object without any additional text."],
        }
    ]
)

# Get job posting text from console input
print("Please paste the job posting text (Press Ctrl+D on Unix/Linux/Mac or Ctrl+Z on Windows when done):")
job_posting = ""
try:
    while True:
        line = input()
        job_posting += line + "\n"
except (EOFError, KeyboardInterrupt):
    pass

# Send the job posting text for processing
response = chat_session.send_message(job_posting)

print(response.text)