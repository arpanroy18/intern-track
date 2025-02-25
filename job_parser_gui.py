
import tkinter as tk
from tkinter import scrolledtext
import google.generativeai as genai

def process_job_posting():
    job_posting = input_text.get(1.0, tk.END)
    status_label.config(text="Processing...")
    root.update()
    
    try:
        # Configure with API key
        genai.configure(api_key="AIzaSyBicqwQfKK737X1N3JbupTydFR-LElT7dg")

        # Create the model
        generation_config = {
            "temperature": 1,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
        }

        model = genai.GenerativeModel(
            model_name="gemini-pro",
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

        # Send the job posting text for processing
        response = chat_session.send_message(job_posting)
        
        # Clean and display the response
        cleaned_response = response.text.strip()
        if cleaned_response.startswith("```json"):
            cleaned_response = cleaned_response[7:]  # Remove ```json
        if cleaned_response.endswith("```"):
            cleaned_response = cleaned_response[:-3]  # Remove ```
        
        output_text.delete(1.0, tk.END)
        output_text.insert(tk.END, cleaned_response)
        status_label.config(text="Processing complete!")
    
    except Exception as e:
        output_text.delete(1.0, tk.END)
        output_text.insert(tk.END, f"Error: {str(e)}")
        status_label.config(text="Error occurred!")

# Create the main window
root = tk.Tk()
root.title("Job Posting Parser")
root.geometry("800x600")

# Create frames
input_frame = tk.Frame(root)
input_frame.pack(pady=10, fill=tk.BOTH, expand=True)

output_frame = tk.Frame(root)
output_frame.pack(pady=10, fill=tk.BOTH, expand=True)

# Input section
tk.Label(input_frame, text="Paste job posting here:").pack(anchor="w")
input_text = scrolledtext.ScrolledText(input_frame, height=10)
input_text.pack(fill=tk.BOTH, expand=True, padx=10)

# Button
process_button = tk.Button(root, text="Parse Job Posting", command=process_job_posting)
process_button.pack(pady=10)

# Status label
status_label = tk.Label(root, text="")
status_label.pack()

# Output section
tk.Label(output_frame, text="Parsed Results (JSON):").pack(anchor="w")
output_text = scrolledtext.ScrolledText(output_frame, height=10)
output_text.pack(fill=tk.BOTH, expand=True, padx=10)

root.mainloop()
