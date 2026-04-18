# StudyMax: AI-Powered Voice Study Companion

StudyMax is a cutting-edge educational platform that transforms static PDFs into interactive, voice-enabled study sessions. This project serves as a showcase of modern web technologies integrated to create a seamless, AI-driven user experience.

---

## 🚀 The Vision
The goal of StudyMax is to help students and professionals "talk" to their books. Instead of just reading, users can upload documents and engage in a real-time conversation with an AI tutor that has deep knowledge of the specific content provided.

---

## 🛠️ The Tech Stack

Building a real-time voice application requires a carefully selected set of tools:

### ⚡ Framework & UI
- **[Next.js 16 (App Router)](https://nextjs.org/)**: The backbone of the app. We use **Server Actions** for secure database operations and **Client Components** for the interactive voice UI.
- **[Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)**: Used for rapid, consistent UI development.
- **[Lucide React](https://lucide.dev/)**: For clean, accessible iconography.

### 🔐 Authentication & Middleware
- **[Clerk](https://clerk.com/)**: Manages user authentication, session handling, and metadata (like subscription plans). It provides a secure way to identify users without building a complex auth backend from scratch.

### 📂 File Storage & Processing
- **[Vercel Blob](https://vercel.com/storage/blob)**: A modern solution for storing binary files (PDFs and images) with global CDN delivery.
- **[PDF.js (pdfjs-dist)](https://mozilla.github.io/pdf.js/)**: Handles client-side PDF parsing. This allows us to extract text and generate cover images directly in the browser, reducing server load.

### 🗄️ Database & Search
- **[MongoDB](https://www.mongodb.com/) & [Mongoose](https://mongoosejs.com/)**: A NoSQL database that excels at storing flexible document structures like book segments and session logs.
- **Custom RAG (Retrieval-Augmented Generation) Logic**: We split large books into "segments" (chunks) with overlaps to preserve context. When a user asks a question, we use MongoDB's `$text` search to find the most relevant snippets to feed the AI.

### 🎙️ Voice AI Interaction
- **[Vapi.ai](https://vapi.ai/)**: The core of the voice experience. Vapi handles the complex pipeline of **STT (Speech-to-Text)**, **LLM Processing**, and **TTS (Text-to-Speech)** with ultra-low latency, making the conversation feel natural.

---

## 🧠 Core Processes (How it Works)

### 1. The "Smart" Upload Process
When you upload a PDF, StudyMax doesn't just "save" it. It goes through a multi-step pipeline:
1.  **Validation**: The app checks the user's plan quota (Free vs. Pro) using Clerk and MongoDB.
2.  **Parsing**: PDF.js extracts the full text from the file on the client side.
3.  **Segmentation**: The text is split into ~500-word chunks with a 50-word overlap. This "overlap" ensures that if a concept is split between two segments, the AI still understands the context.
4.  **Storage**: 
    - The PDF file and a generated cover image are uploaded to **Vercel Blob**.
    - The book metadata is saved in MongoDB.
    - All text segments are saved as individual documents in the `BookSegment` collection for efficient searching.

### 2. The Retrieval-Augmented Generation (RAG)
To keep the AI accurate, we don't send the entire book to the LLM (which would be expensive and slow). Instead:
- When the user speaks, their transcript is sent to our search action.
- We perform a **keyword/text search** in MongoDB within that specific book's segments.
- The top results are returned and used as "context" for the AI assistant, ensuring its answers are grounded in the book's actual content.

### 3. Real-time Voice Orchestration
The voice interface is managed by a custom `useVapi` hook:
- **State Management**: It tracks whether the AI is `idle`, `listening`, `thinking`, or `speaking`.
- **Transcripts**: It provides real-time partial transcripts so users see what they (and the AI) are saying as it happens.
- **Session Tracking**: It monitors session duration to enforce plan limits and saves session history to the database.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ 
- A MongoDB Connection String
- A Clerk Account
- A Vapi.ai API Key and Assistant ID
- A Vercel Blob Token

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/mcarlod/studymax.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   Create a `.env.local` file with the following:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
   CLERK_SECRET_KEY=...
   MONGODB_URI=...
   BLOB_READ_WRITE_TOKEN=...
   VAPI_API_KEY=...
   VAPI_ASSISTANT_ID=...
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

---

## 🎓 What I Learned While Developing This
This project demonstrates how to orchestrate multiple third-party APIs to build a complex, high-performance AI application. Key takeaways include managing real-time state in React, optimizing database queries for text search, and handling large file uploads efficiently in a serverless environment.
