import sqlite3
from faker import Faker
import random
from datetime import datetime, timedelta

fake = Faker()
statuses = ["Applied", "Online Assessment", "Interview", "Offer", "Closed"]

conn = sqlite3.connect('interntrack.db')
cursor = conn.cursor()

for _ in range(50):
    company = fake.company()
    role = fake.job()
    dateApplied = (datetime.now() - timedelta(days=random.randint(0, 365))).strftime('%Y-%m-%d')
    location = fake.city()
    applicationLink = fake.url()
    status = random.choice(statuses)
    notes = fake.sentence()
    # Generate a unique id and lastUpdated timestamp
    app_id = str(int(datetime.now().timestamp() * 1000)) + str(random.randint(100, 999))
    lastUpdated = datetime.now().isoformat()

    cursor.execute("""
        INSERT INTO applications (id, company, role, dateApplied, location, applicationLink, status, hadInterview, notes, lastUpdated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (app_id, company, role, dateApplied, location, applicationLink, status, 0, notes, lastUpdated))

conn.commit()
conn.close()