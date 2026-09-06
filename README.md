# Gemini Reflection Journal

A secure, user-authenticated reflection and journaling web application powered by **Google Gemini 3.6 Flash** and **Cloud Firestore**. Users can write multi-turn journal entries, converse with an AI companion for cognitive reframing, and generate structured executive summaries, key themes, and actionable next steps—all with strict, owner-bound data isolation.

---

## Architecture & Security Highlights

- **User Identity**: Firebase Authentication with Google Sign-In (federated authentication, zero email/password custom handling).
- **Database & Data Isolation**: Cloud Firestore with Attribute-Based Access Control (ABAC) ensuring each user can strictly only read and write their own documents at `/users/{userId}/interactions/{interactionId}`.
- **AI Processing Engine**: Gemini 3.6 Flash API with a resilient model fallback ladder (`gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`).
- **Secret Management**: Zero-hardcoding hygiene. All API keys and credentials are kept strictly server-side via environment variables and Google Cloud Secret Manager.

---

## Prerequisites

1. **Google Cloud Project**: An active GCP project with billing enabled.
2. **gcloud CLI**: Installed and authenticated (`gcloud auth login`).
3. **Node.js**: v20 or higher.
4. **Firebase CLI**: Installed (`npm install -g firebase-tools`).

---

## 1. Enable Required Google Cloud APIs

```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  aiplatform.googleapis.com \
  artifactregistry.googleapis.com
```

---

## 2. Secret Manager Configuration

Securely store your Gemini API key in Google Cloud Secret Manager:

```bash
# Set your project ID
export PROJECT_ID=$(gcloud config get-value project)
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Create and populate the GEMINI_API_KEY secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the Cloud Run compute service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Cloud Firestore Security Rules

Deploy the owner-bound security rules to ensure zero-trust user data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }

    match /test/connection {
      allow read: if true;
    }

    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy the rules using the Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Build & Local Development

Install dependencies:
```bash
npm install
```

Start the unified full-stack development server:
```bash
npm run dev
```
The app runs on `http://localhost:3000`.

To create a production build:
```bash
npm run build
```

---

## 5. Google Cloud Run Deployment Flow

Deploy the full-stack container directly using `gcloud run deploy`:

```bash
export SERVICE_NAME="gemini-reflection-journal"
export REGION="us-central1"

gcloud run deploy ${SERVICE_NAME} \
  --source . \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000
```

---

## 6. Campaign Verification Binding

Apply the required challenge verification label to your deployed Cloud Run service:

```bash
gcloud run services update ${SERVICE_NAME} \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=${REGION}
```

---

## 7. Comprehensive Walkthrough & Verification Steps

| Step | Feature Tested | Expected Behavior |
| :--- | :--- | :--- |
| **1** | **Landing Page** | The unauthenticated user sees the elegant landing hero and the "Sign In with Google" button. |
| **2** | **Authentication** | Clicking "Continue with Google" triggers the Google Sign-In popup. Upon completion, the user is navigated directly to the private dashboard with their profile avatar and email displayed in the header. |
| **3** | **Drafting a Reflection** | The user types a title (e.g. "Overcoming Imposter Syndrome"), selects a category (e.g. "Learning & Growth"), and enters reflection text. The word count updates live. |
| **4** | **Explicit Persistence** | Clicking "Save Entry" persists the document to Firestore under `/users/{userId}/interactions/{id}` and displays a green "Saved" badge. |
| **5** | **Multi-Turn Dialogue** | In the right panel, typing a question (e.g. "What reframes can I consider?") and clicking Send (or pressing Enter) adds the user query to the stream. Gemini 3.6 Flash responds with reflective markdown text and the interaction is automatically saved. |
| **6** | **Cognitive Synthesis** | Clicking "Generate Summary" invokes `/api/gemini/summarize`. Gemini returns an executive summary, key themes (`#growth`, `#mindset`), cognitive insights, and interactive checkboxes for action items. The updated reflection is saved to Firestore. |
| **7** | **History & Search** | The past entry appears in the left sidebar log with timestamp and category. Searching in the sidebar filters entries in real-time. |
| **8** | **Cross-User Data Isolation** | Signing out and logging in as a different Google account displays an empty log, verifying that Firestore security rules prevent reading documents owned by other users. |
