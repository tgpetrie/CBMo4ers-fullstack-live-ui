# Use the official Python image
FROM python:3.12-slim

# Set the working directory
WORKDIR /app

# Copy the backend files
COPY backend/ /app/

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port the app runs on
EXPOSE 5000

# Command to run the backend
CMD ["python", "app.py"]