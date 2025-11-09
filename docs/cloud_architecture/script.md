# Piatto Technical Demo Script

### Part 1: The Technical Vision

*(This script is intended for Markus to narrate over visuals)*

**(Scene: Transition from the user-facing demo to a clean, technical background. Show a slide with the Piatto logo and the words "The Architecture".)**

"That was a taste of the seamless user experience Piatto offers. Now, let's pull back the curtain and dive into the robust, scalable, and intelligent architecture that makes it all possible.

Our philosophy was simple: build a production-grade application using a modern, decoupled tech stack. For the frontend, we chose **React with Vite**, delivering a lightning-fast, responsive user interface. The backend is powered by **Python with FastAPI**, a high-performance framework perfect for building efficient, asynchronous APIs."

---

### Part 2: Engineered for Global Scale with Google Cloud Run

**(Scene: The screen wipes to the first, simplest architecture diagram: `01_services.md`. With each point, the diagram animates to the next step: `02_load_balancer.md`, `03_database_storage.md`, and finally `04_full_architecture.md`.)**

"From day one, Piatto was designed for global scale, and **Google Cloud Run** is the cornerstone of our strategy.

**(Animate to `01_services.md`)**

At its core, our architecture is composed of two containerized services on Cloud Run: a dedicated **frontend service** that serves the user interface, and a **backend API service** that handles all the business logic.

**(Animate to `02_load_balancer.md`)**

To deliver a flawless user experience worldwide, we front our application with a **Google Cloud Global Load Balancer** and **Cloud CDN**. This ensures the lowest possible latency for our users, whether they're in Tokyo or Toronto, by caching content close to them and intelligently routing traffic.

**(Animate to `03_database_storage.md`)**

Our backend service is stateful, relying on a managed **Cloud SQL** instance for our primary MySQL database, which handles everything from user data to saved recipes. For user-generated content, like ingredient photos, we leverage the elastic, virtually infinite scalability of **Cloud Storage Buckets**.

**(Animate to `04_full_architecture.md`)**

This entire infrastructure is serverless. By leveraging Cloud Run, we get automatic, near-instant scaling from zero to thousands of requests without managing a single server. It's a cost-effective, resilient, and powerful foundation that allows us to focus on building features, not managing infrastructure."

---

### Part 3: The Intelligence Core: A Multi-Agent System with Google ADK

**(Scene: Transition to a new diagram illustrating the agent interaction flow. Show icons for each agent: `ImageAnalyzer`, `RecipeAgent`, `InstructionAgent`, `ImageAgent`, and `ChatAgent`, with arrows showing the data flow.)**

"But the real magic of Piatto lies in its intelligence layer—a sophisticated, multi-agent system built with **Google's Agent Development Kit (ADK)** and powered by **Gemini**. This isn't just a single AI; it's a team of specialized agents collaborating to create the perfect recipe.

Here’s how it works:

1.  When a user wants a recipe, their request—along with an optional photo of ingredients—hits our backend.
2.  The **Image Analyzer Agent** immediately gets to work, using Gemini's advanced vision capabilities to identify every item in the photo.
3.  This structured data, combined with the user's preferences, is passed to the **Recipe Agent**. It acts as the creative chef, brainstorming a complete recipe concept.
4.  The draft is then passed to two agents in parallel: the **Image Agent**, which searches for a stunning, inspirational photo for the dish, and the **Instruction Agent**, which breaks the recipe down into clear, step-by-step instructions.
5.  Finally, the outputs are assembled into the beautiful, comprehensive recipe you saw earlier.

And it doesn't stop there. The **Chat Agent** retains the full context of the generated recipe, allowing users to ask follow-up questions like, *'How can I make this less salty?'* or *'What's the next step?'*, creating a truly interactive and hands-free cooking assistant.

By orchestrating these specialized agents on Cloud Run, we've built a system that is not only deeply intelligent but also just as scalable and resilient as the rest of our platform."

---

### Part 4: Conclusion

**(Scene: Transition back to the Piatto logo with the tagline "Cook Smarter, Not Harder".)**

"With Piatto, we've demonstrated how the combination of a modern tech stack, the immense power of Google Cloud Run, and a cutting-edge multi-agent AI system can solve a real-world problem. We've built a platform that's ready to scale globally and redefine the future of home cooking.

Thank you."
