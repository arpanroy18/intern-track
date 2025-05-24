import tkinter as tk
from tkinter import scrolledtext
import os
from groq import Groq

def process_job_posting():
    job_posting = input_text.get(1.0, tk.END)
    status_label.config(text="Processing...")
    root.update()
    
    try:
        # Initialize Groq client
        client = Groq(
            api_key="REMOVED_GROQ_API_KEY"
        )

        # Create chat completion
        completion = client.chat.completions.create(
            model="meta-llama/llama-4-maverick-17b-128e-instruct",
            messages=[
                {
                    "role": "system",
                    "content": "You are a job posting parser. Extract and return ONLY a JSON object with no markdown formatting, code blocks, or additional text. Use this exact format:\n{\n  \"company\": \"Company Name\",\n  \"role\": \"Job Title\",\n  \"location\": \"City, State/Province\",\n  \"description\": \"Brief job description\"\n}\n\nEnsure all values are properly escaped JSON strings."
                },
                {
                    "role": "user",
                    "content": job_posting
                }
            ],
            temperature=0.1,
            max_completion_tokens=1024,
            top_p=1,
            stream=False,
            stop=None
        )
        
        # Get the response and handle markdown code blocks
        response = completion.choices[0].message.content.strip()
        
        # Remove markdown code blocks if present
        if response.startswith('```'):
            # Remove starting ```json or ``` and ending ```
            lines = response.split('\n')
            if len(lines) > 2:  # At least 3 lines: opening ```, content, closing ```
                response = '\n'.join(lines[1:-1])  # Take everything between the ``` markers
            
        output_text.delete(1.0, tk.END)
        output_text.insert(tk.END, response)
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
