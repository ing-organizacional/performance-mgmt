# Ollama AI Testing Guide

## Prerequisites

1. **Install Ollama**
   ```bash
   # macOS
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Or download from https://ollama.ai/download
   ```

2. **Pull the required model**
   ```bash
   # Pull the specific model we're using
   ollama pull llama3.1:8b-instruct-q5_K_M
   ```

3. **Start Ollama service**
   ```bash
   ollama serve
   # Should run on http://localhost:11434
   ```

4. **Test the model**
   ```bash
   ollama run llama3.1:8b-instruct-q5_K_M "Hello, how are you?"
   ```

## Environment Configuration

Add these environment variables to your `.env.local`:

```bash
# Enable AI features globally
AI_FEATURES_ENABLED=true

# Use Ollama as the provider
LLM_PROVIDER=ollama

# Ollama configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b-instruct-q5_K_M

# Optional: Tune performance
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=500
```

## Database Setup

Enable AI for your test company:

```bash
# Enable AI for all companies in the database
echo "UPDATE Company SET aiEnabled = true;" | yarn prisma db execute --stdin --schema=./prisma/schema.prisma
```

## Testing Steps

1. **Start the development server**
   ```bash
   yarn dev
   ```

2. **Login as Manager or HR**
   - Manager: `manager@demo.com / a`
   - HR: `hr@demo.com / a`

3. **Navigate to Assignments**
   - Go to `/evaluations/assignments`
   - Click "Department-Level Assignments" tab
   - Click "New OKR" or "New Competency"

4. **Test AI functionality**
   - Type at least 30 characters in title or description
   - You should see the blue AI button appear
   - Click the AI button to test improvement

## Debugging Console Output

Watch your terminal for detailed debug messages:

```
🔧 [LLM Config] Configuration loaded: { provider: 'ollama', model: 'llama3.1:8b-instruct-q5_K_M', ... }
🏭 [LLM Factory] Creating provider: ollama
🤖 [LLM Factory] Initializing Ollama provider
🔍 [AI Features] Checking AI status for company: cm123...
🌍 [AI Features] Global AI enabled: true
🏢 [AI Features] Company data: { id: 'cm123', name: 'Demo Company', aiEnabled: true, found: true }
✅ [AI Features] Final AI status for company cm123: true
🚀 [Server Action] AI text improvement request received: { type: 'objective', textLength: 45, ... }
🤖 [Ollama] Starting text improvement request
🔧 [Ollama] Configuration: { baseUrl: 'http://localhost:11434', model: 'llama3.1:8b', ... }
🚀 [Ollama] Sending request to: http://localhost:11434/api/generate
⏱️ [Ollama] Request completed in 1234ms
✅ [Ollama] Text improvement successful
```

## Troubleshooting

### Common Issues

1. **AI buttons don't appear**
   - Check: Text has 30+ characters
   - Check: `AI_FEATURES_ENABLED=true` in .env.local
   - Check: Company has `aiEnabled=true` in database

2. **"AI service is not configured" error**
   - Check: Ollama is running (`ollama serve`)
   - Check: Model is downloaded (`ollama list`)
   - Check: `OLLAMA_BASE_URL` and `OLLAMA_MODEL` in .env.local

3. **Network errors**
   - Check: Ollama service is running on port 11434
   - Test: `curl http://localhost:11434/api/version`

4. **Slow responses**
   - Use smaller models (llama3.1:1b, qwen2.5:3b)
   - Reduce `LLM_MAX_TOKENS`
   - Check system resources (RAM, CPU)

### Model Information

- **Current Model**: `llama3.1:8b-instruct-q5_K_M` (optimized 8B parameter model with instruction tuning)
- **Size**: Approximately 5.6GB
- **Quality**: High-quality quantized model with good performance

### Performance Tips

- Keep Ollama running in background
- Use SSD storage for better model loading
- Ensure sufficient RAM (8GB+ recommended)
- Consider GPU acceleration if available