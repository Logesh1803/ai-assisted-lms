/**
 * Database Seed Script
 * Creates demo teacher, student, and 3 published courses with lessons.
 *
 * Run: npx ts-node --project tsconfig.seed.json scripts/seed.ts
 */

import "dotenv/config";
import { createHash, randomBytes, scryptSync } from "crypto";
import { PrismaClient } from "../libs/data-sources/generated/system/client";
import { PrismaPg } from "@prisma/adapter-pg";

// ─── Helpers ────────────────────────────────────────────────────────────────

function now(): bigint {
  return BigInt(Math.floor(Date.now() / 1000));
}

function hashPassword(password: string): string {
  const salt = randomBytes(32).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

const TEACHER = {
  firstName: "Dr. Arjun",
  lastName: "Sharma",
  email: "teacher@thinkbloom.dev",
  password: "Teacher@123",
};

const STUDENT = {
  firstName: "Priya",
  lastName: "Nair",
  email: "student@thinkbloom.dev",
  password: "Student@123",
};

const COURSES: Array<{
  title: string;
  description: string;
  thumbnail: string;
  tags: string[];
  lessons: Array<{ title: string; description: string; content: string; order: number }>;
}> = [
  // ─── Course 1: Machine Learning ──────────────────────────────────────────
  {
    title: "Machine Learning Fundamentals",
    description:
      "A comprehensive introduction to machine learning — from core mathematical intuition to hands-on model building. You will understand supervised, unsupervised, and reinforcement learning paradigms and implement classic algorithms from scratch.",
    thumbnail: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80",
    tags: ["machine-learning", "AI", "python", "data-science"],
    lessons: [
      {
        title: "What is Machine Learning?",
        description: "History, motivation, and the three learning paradigms.",
        order: 1,
        content: `# What is Machine Learning?

Machine Learning (ML) is a subfield of artificial intelligence that gives computers the ability to learn from data without being explicitly programmed.

## A Brief History

- **1950s** – Alan Turing proposes the Turing Test; Arthur Samuel coins "machine learning" while building a checkers-playing program.
- **1980s** – Backpropagation popularises neural networks.
- **2012** – AlexNet wins ImageNet, igniting the deep-learning revolution.
- **2017–present** – Transformers and Large Language Models reshape the field.

## The Three Learning Paradigms

| Paradigm | Description | Example |
|---|---|---|
| **Supervised** | Learn from labeled (input, output) pairs | Email spam classifier |
| **Unsupervised** | Find hidden structure in unlabeled data | Customer segmentation |
| **Reinforcement** | Agent learns by trial-and-error with rewards | Game-playing AI |

## Why Machine Learning?

Traditional programming requires you to hand-craft every rule. ML lets the **data define the rules**. This is invaluable when:

- The rules are too complex to express manually (image recognition).
- The environment changes over time (stock-price prediction).
- You need to personalise at scale (recommendation engines).

## Key Terminology

- **Feature (X)** – An input variable used for prediction.
- **Label (y)** – The output we want to predict.
- **Model** – A mathematical function mapping features to predictions.
- **Training** – Adjusting model parameters to minimise error.
- **Inference** – Using the trained model on new data.

## Your First ML Workflow

\`\`\`python
# 1. Collect & clean data
# 2. Split into train / validation / test sets
# 3. Choose a model (e.g., linear regression)
# 4. Train the model
# 5. Evaluate on the test set
# 6. Deploy & monitor
\`\`\`

In the next lesson we will dive into **Linear Regression** — the "Hello World" of supervised learning.`,
      },
      {
        title: "Linear Regression — The Hello World of ML",
        description: "Understand gradient descent and build a regressor from scratch in Python.",
        order: 2,
        content: `# Linear Regression

Linear regression models the relationship between one or more features **X** and a continuous target **y** as a straight line.

## The Hypothesis

$$\\hat{y} = w_0 + w_1 x_1 + w_2 x_2 + \\ldots + w_n x_n$$

In matrix notation: $\\hat{y} = X \\mathbf{w}$

## Loss Function — Mean Squared Error

$$\\text{MSE} = \\frac{1}{m} \\sum_{i=1}^{m} (\\hat{y}^{(i)} - y^{(i)})^2$$

We want to find weights **w** that minimise this.

## Gradient Descent

Gradient descent updates weights iteratively:

$$w := w - \\alpha \\frac{\\partial \\text{MSE}}{\\partial w}$$

where $\\alpha$ is the **learning rate**.

\`\`\`python
import numpy as np

def mse(y_pred, y_true):
    return ((y_pred - y_true) ** 2).mean()

class LinearRegression:
    def __init__(self, lr=0.01, epochs=1000):
        self.lr = lr
        self.epochs = epochs

    def fit(self, X, y):
        m, n = X.shape
        self.w = np.zeros(n)
        self.b = 0.0

        for _ in range(self.epochs):
            y_pred = X @ self.w + self.b
            error  = y_pred - y
            self.w -= self.lr * (2 / m) * X.T @ error
            self.b -= self.lr * (2 / m) * error.sum()

    def predict(self, X):
        return X @ self.w + self.b
\`\`\`

## Closed-Form Solution (Normal Equation)

$$\\mathbf{w} = (X^T X)^{-1} X^T y$$

This is exact but $O(n^3)$ — impractical for large feature sets. Gradient descent scales better.

## Regularisation

To prevent overfitting add a penalty term:

- **Ridge (L2)**: $+ \\lambda \\|\\mathbf{w}\\|^2$
- **Lasso (L1)**: $+ \\lambda \\|\\mathbf{w}\\|_1$ (promotes sparsity)`,
      },
      {
        title: "Classification with Logistic Regression",
        description: "From regression to classification — sigmoid function, cross-entropy, and decision boundaries.",
        order: 3,
        content: `# Logistic Regression

Despite its name, logistic regression is a **classification** algorithm. It predicts the probability that an example belongs to a class.

## The Sigmoid Function

$$\\sigma(z) = \\frac{1}{1 + e^{-z}}$$

- Output is always in **(0, 1)** — interpretable as a probability.
- Decision boundary: predict class 1 if $\\sigma(z) \\geq 0.5$.

## Loss — Binary Cross-Entropy

$$\\mathcal{L} = -\\frac{1}{m} \\sum_{i} \\left[ y^{(i)} \\log \\hat{y}^{(i)} + (1 - y^{(i)}) \\log (1 - \\hat{y}^{(i)}) \\right]$$

\`\`\`python
import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

class LogisticRegression:
    def __init__(self, lr=0.1, epochs=1000):
        self.lr = lr
        self.epochs = epochs

    def fit(self, X, y):
        m, n = X.shape
        self.w = np.zeros(n)
        self.b = 0.0

        for _ in range(self.epochs):
            z      = X @ self.w + self.b
            y_pred = sigmoid(z)
            dw = (1 / m) * X.T @ (y_pred - y)
            db = (1 / m) * (y_pred - y).sum()
            self.w -= self.lr * dw
            self.b -= self.lr * db

    def predict_proba(self, X):
        return sigmoid(X @ self.w + self.b)

    def predict(self, X, threshold=0.5):
        return (self.predict_proba(X) >= threshold).astype(int)
\`\`\`

## Evaluation Metrics

| Metric | Formula | When to Use |
|---|---|---|
| Accuracy | correct / total | Balanced classes |
| Precision | TP / (TP + FP) | Cost of false positives is high |
| Recall | TP / (TP + FN) | Cost of false negatives is high |
| F1 | 2 × P × R / (P + R) | Harmonic mean |
| ROC-AUC | Area under ROC curve | General performance |

## Multi-class: Softmax

For K classes use the **softmax** function: each output represents the probability of one class, and all probabilities sum to 1.`,
      },
      {
        title: "Decision Trees & Random Forests",
        description: "Non-parametric tree-based models, entropy/Gini splitting, and ensemble methods.",
        order: 4,
        content: `# Decision Trees & Random Forests

## Decision Trees

A decision tree recursively splits the feature space by choosing the feature and threshold that best separates the classes.

### Splitting Criteria

**Gini Impurity:**
$$G = 1 - \\sum_{k} p_k^2$$

**Information Gain (Entropy):**
$$H = -\\sum_{k} p_k \\log_2 p_k$$

The algorithm picks the split that maximises **Information Gain** (or minimises Gini).

\`\`\`python
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.datasets import load_iris

X, y = load_iris(return_X_y=True)
clf = DecisionTreeClassifier(max_depth=3, random_state=42)
clf.fit(X, y)
print(export_text(clf, feature_names=load_iris().feature_names))
\`\`\`

### Pros & Cons

✅ Interpretable  ✅ No feature scaling needed  ✅ Handles mixed types
❌ Prone to overfitting  ❌ High variance

## Random Forests — Bagging + Feature Randomness

A **random forest** trains **B** decision trees, each on a bootstrapped sample of the data and a random subset of features. Predictions are aggregated by majority vote (classification) or averaging (regression).

### Why it works

- **Bagging** reduces variance.
- **Feature randomness** decorrelates the trees, reducing overfitting further.

\`\`\`python
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

rf = RandomForestClassifier(n_estimators=200, max_features='sqrt', random_state=42)
scores = cross_val_score(rf, X, y, cv=5)
print(f"CV Accuracy: {scores.mean():.3f} ± {scores.std():.3f}")
\`\`\`

## Gradient Boosting (XGBoost / LightGBM)

Boosting trains trees **sequentially**, each correcting the errors of the previous one. Gradient boosting is one of the most powerful ML algorithms for tabular data.`,
      },
      {
        title: "Neural Networks & Deep Learning Basics",
        description: "Perceptrons, activation functions, backpropagation, and building an MLP with PyTorch.",
        order: 5,
        content: `# Neural Networks & Deep Learning Basics

## The Perceptron

A single neuron:
$$z = \\sum_i w_i x_i + b, \\quad a = \\phi(z)$$

where $\\phi$ is an **activation function**.

## Activation Functions

| Function | Formula | Use Case |
|---|---|---|
| Sigmoid | $\\frac{1}{1+e^{-z}}$ | Binary output layer |
| Tanh | $\\tanh(z)$ | Hidden layers (centred) |
| ReLU | $\\max(0, z)$ | Deep networks (default) |
| Leaky ReLU | $\\max(0.01z, z)$ | Avoids dead neurons |
| Softmax | $\\frac{e^{z_i}}{\\sum e^{z_j}}$ | Multi-class output |

## Multi-Layer Perceptron (MLP)

Stack layers of neurons. Information flows forward (forward pass), then gradients flow backward (backpropagation).

### Backpropagation (Chain Rule)

$$\\frac{\\partial \\mathcal{L}}{\\partial w} = \\frac{\\partial \\mathcal{L}}{\\partial a} \\cdot \\frac{\\partial a}{\\partial z} \\cdot \\frac{\\partial z}{\\partial w}$$

\`\`\`python
import torch
import torch.nn as nn

class MLP(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, output_dim),
        )

    def forward(self, x):
        return self.net(x)

model     = MLP(4, 64, 3)
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

# Training loop
for epoch in range(100):
    optimizer.zero_grad()
    outputs = model(X_tensor)
    loss    = criterion(outputs, y_tensor)
    loss.backward()
    optimizer.step()
\`\`\`

## Key Training Techniques

- **Batch Normalisation** – normalise layer inputs for stability.
- **Dropout** – randomly zero neurons to prevent co-adaptation.
- **Learning Rate Scheduling** – reduce LR when loss plateaus.
- **Early Stopping** – stop training when validation loss stops improving.`,
      },
    ],
  },

  // ─── Course 2: Full-Stack Web Dev ────────────────────────────────────────
  {
    title: "Full-Stack Web Development with React & Node.js",
    description:
      "Build production-ready full-stack web applications. Learn React 19, REST API design with Express, PostgreSQL, authentication with JWT, and deployment — guided by real-world project examples.",
    thumbnail: "https://images.unsplash.com/photo-1593720219276-0b1eacd0aef4?w=800&q=80",
    tags: ["react", "nodejs", "javascript", "fullstack", "web-dev"],
    lessons: [
      {
        title: "Modern JavaScript Essentials (ES2024)",
        description: "Arrow functions, destructuring, async/await, modules — everything you need before React.",
        order: 1,
        content: `# Modern JavaScript Essentials

Before diving into React, let's solidify the JS features you will use every day.

## Destructuring

\`\`\`js
// Array destructuring
const [first, second, ...rest] = [1, 2, 3, 4, 5];

// Object destructuring with rename & default
const { name: userName = "Guest", age } = user;
\`\`\`

## Spread & Rest

\`\`\`js
// Spread — clone and override
const updated = { ...original, price: 99 };

// Rest — collect remaining args
function sum(first, ...others) {
  return others.reduce((acc, n) => acc + n, first);
}
\`\`\`

## Optional Chaining & Nullish Coalescing

\`\`\`js
const city = user?.address?.city ?? "Unknown";
\`\`\`

## Async / Await

\`\`\`js
async function fetchUser(id) {
  try {
    const res  = await fetch(\`/api/users/\${id}\`);
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch user:", err.message);
  }
}
\`\`\`

## ES Modules

\`\`\`js
// Named exports
export const add = (a, b) => a + b;
export function multiply(a, b) { return a * b; }

// Default export
export default class Calculator { /* ... */ }

// Import
import Calculator, { add } from "./math.js";
\`\`\`

## Array Methods You'll Use Daily

\`\`\`js
const products = [
  { id: 1, name: "Laptop",  price: 999, inStock: true  },
  { id: 2, name: "Phone",   price: 699, inStock: false },
  { id: 3, name: "Tablet",  price: 499, inStock: true  },
];

// Filter → Map → Reduce pipeline
const total = products
  .filter(p => p.inStock)
  .map(p => p.price)
  .reduce((sum, p) => sum + p, 0);   // 1498
\`\`\``,
      },
      {
        title: "React 19 — Components, Props & State",
        description: "JSX, function components, useState, conditional rendering, and lists.",
        order: 2,
        content: `# React 19 — Components, Props & State

## What is React?

React is a **declarative, component-based UI library**. You describe *what* the UI should look like; React figures out *how* to update the DOM efficiently.

## Your First Component

\`\`\`tsx
// A function component is just a function that returns JSX
function Greeting({ name = "World" }: { name?: string }) {
  return <h1>Hello, {name}!</h1>;
}

// Usage
<Greeting name="Priya" />
\`\`\`

## useState — Local Component State

\`\`\`tsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}
\`\`\`

> ⚠️ **Never mutate state directly.** Always call the setter function.

## Conditional Rendering

\`\`\`tsx
function Alert({ type, message }: { type: "error" | "success"; message: string }) {
  return (
    <div className={\`alert alert-\${type}\`}>
      {type === "error" ? "❌" : "✅"} {message}
    </div>
  );
}
\`\`\`

## Rendering Lists

\`\`\`tsx
function ProductList({ products }: { products: Product[] }) {
  return (
    <ul>
      {products.map(product => (
        <li key={product.id}>
          <strong>{product.name}</strong> — ₹{product.price}
        </li>
      ))}
    </ul>
  );
}
\`\`\`

Always provide a stable, unique **key** when rendering lists. This lets React track which items changed.

## Props vs State

| | Props | State |
|---|---|---|
| Who owns it? | Parent component | The component itself |
| Mutable? | No (read-only) | Yes (via setter) |
| Triggers re-render? | Yes (when parent re-renders) | Yes (when setter called) |`,
      },
      {
        title: "React Hooks — useEffect, useContext & Custom Hooks",
        description: "Side effects, global state with Context API, and writing reusable custom hooks.",
        order: 3,
        content: `# React Hooks

## useEffect — Side Effects

\`\`\`tsx
import { useEffect, useState } from "react";

function UserProfile({ userId }: { userId: number }) {
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const data = await fetchUser(userId);
      if (!cancelled) {
        setUser(data);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; }; // cleanup
  }, [userId]); // re-run when userId changes

  if (loading) return <Spinner />;
  return <div>{user?.name}</div>;
}
\`\`\`

## useContext — Avoid Prop Drilling

\`\`\`tsx
// 1. Create context
const ThemeContext = createContext<"light" | "dark">("light");

// 2. Provide at the top level
function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  return (
    <ThemeContext.Provider value={theme}>
      <Layout />
    </ThemeContext.Provider>
  );
}

// 3. Consume anywhere in the tree
function Button({ children }: PropsWithChildren) {
  const theme = useContext(ThemeContext);
  return <button data-theme={theme}>{children}</button>;
}
\`\`\`

## Custom Hooks

Extract stateful logic into reusable hooks:

\`\`\`tsx
function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initial;
    } catch {
      return initial;
    }
  });

  function set(newVal: T) {
    setValue(newVal);
    localStorage.setItem(key, JSON.stringify(newVal));
  }

  return [value, set] as const;
}

// Usage
const [theme, setTheme] = useLocalStorage("theme", "light");
\`\`\`

## Rules of Hooks

1. Only call hooks at the **top level** — not inside loops, conditions, or nested functions.
2. Only call hooks from **React function components** or other custom hooks.`,
      },
      {
        title: "REST API Design with Node.js & Express",
        description: "Build a RESTful API with Express, validation, error handling, and middleware.",
        order: 4,
        content: `# REST API Design with Express

## What is REST?

**Re**presentational **S**tate **T**ransfer — an architectural style for distributed systems based on HTTP.

### Core Constraints

- **Stateless** – Each request contains all information needed; server holds no session.
- **Uniform Interface** – Resources identified by URIs; standard HTTP methods.
- **Layered System** – Client doesn't need to know if it's talking to a proxy or real server.

## HTTP Methods & Status Codes

| Method | Action | Success Code |
|---|---|---|
| GET | Retrieve resource | 200 OK |
| POST | Create resource | 201 Created |
| PUT | Replace resource | 200 OK |
| PATCH | Partial update | 200 OK |
| DELETE | Delete resource | 204 No Content |

## Building an API with Express

\`\`\`js
import express from "express";
import { z } from "zod";

const app = express();
app.use(express.json());

// ─── In-memory store (replace with DB) ──────────────────────
const courses = new Map();
let nextId = 1;

// ─── Validation schema ───────────────────────────────────────
const CourseSchema = z.object({
  title:       z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  tags:        z.array(z.string()).default([]),
});

// ─── Routes ──────────────────────────────────────────────────
// GET /courses
app.get("/courses", (req, res) => {
  res.json({ courses: [...courses.values()] });
});

// POST /courses
app.post("/courses", (req, res, next) => {
  try {
    const data   = CourseSchema.parse(req.body);
    const course = { id: nextId++, ...data };
    courses.set(course.id, course);
    res.status(201).json(course);
  } catch (err) {
    next(err);
  }
});

// ─── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof z.ZodError) {
    return res.status(422).json({ errors: err.errors });
  }
  res.status(500).json({ message: "Internal server error" });
});

app.listen(3000);
\`\`\`

## Middleware Pattern

\`\`\`js
// Authentication middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    req.user = verifyJwt(token);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

// Apply to all routes after this point
app.use(authenticate);
\`\`\``,
      },
      {
        title: "Authentication — JWT & Secure Sessions",
        description: "Implement login, registration, JWT access tokens, refresh tokens, and protected routes.",
        order: 5,
        content: `# Authentication with JWT

## The Authentication Flow

\`\`\`
Client          Server
  |--- POST /auth/login --------->|
  |   { email, password }         |
  |<-- { accessToken, user } -----|
  |                                |
  |--- GET /profile -------------->|
  |   Authorization: Bearer <token>|
  |<-- { user data } -------------|
\`\`\`

## Password Hashing

Never store plain-text passwords. Use a slow hashing algorithm:

\`\`\`js
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

function hashPassword(password) {
  const salt = randomBytes(32).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return \`\${salt}:\${hash}\`;
}

function verifyPassword(password, stored) {
  const [salt, storedHash] = stored.split(":");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}
\`\`\`

## Issuing a JWT

\`\`\`js
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;

function generateTokens(userId) {
  const accessToken = jwt.sign(
    { sub: userId },
    SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    { sub: userId, type: "refresh" },
    SECRET,
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
}
\`\`\`

## Protected Route Middleware

\`\`\`js
function requireAuth(req, res, next) {
  const [, token] = req.headers.authorization?.split(" ") ?? [];
  if (!token) return res.status(401).json({ message: "Unauthenticated" });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    res.status(401).json({ message: "Token invalid or expired" });
  }
}
\`\`\`

## React — Persisting Auth State

\`\`\`tsx
// Store token in memory, refresh token in httpOnly cookie
// Never store tokens in localStorage for sensitive apps!

function useAuth() {
  const [token, setToken] = useState<string | null>(null);

  async function login(email: string, password: string) {
    const { accessToken } = await authApi.login({ email, password });
    setToken(accessToken);
  }

  function logout() {
    setToken(null);
  }

  return { token, login, logout, isAuthenticated: !!token };
}
\`\`\`

## Security Checklist

- ✅ HTTPS everywhere
- ✅ Short-lived access tokens (15 min)
- ✅ Refresh tokens stored in httpOnly cookies
- ✅ Rate-limit login endpoint
- ✅ Hash passwords with scrypt/bcrypt/argon2`,
      },
    ],
  },

  // ─── Course 3: Data Structures & Algorithms ──────────────────────────────
  {
    title: "Data Structures & Algorithms in TypeScript",
    description:
      "Master the data structures and algorithms that underpin every efficient program and ace technical interviews. Each concept is explained intuitively and implemented from scratch in TypeScript with complexity analysis.",
    thumbnail: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80",
    tags: ["algorithms", "data-structures", "typescript", "interview-prep"],
    lessons: [
      {
        title: "Big-O Notation & Complexity Analysis",
        description: "Time vs space complexity, best/worst/average cases, and common complexity classes.",
        order: 1,
        content: `# Big-O Notation & Complexity Analysis

Big-O describes how the **runtime** or **space** of an algorithm grows relative to its input size **n**.

## Common Complexity Classes

| Class | Name | Example |
|---|---|---|
| O(1) | Constant | Array index access |
| O(log n) | Logarithmic | Binary search |
| O(n) | Linear | Linear search |
| O(n log n) | Log-linear | Merge sort |
| O(n²) | Quadratic | Bubble sort |
| O(2ⁿ) | Exponential | Recursive Fibonacci |
| O(n!) | Factorial | Brute-force TSP |

## Rules for Calculating Big-O

1. **Drop constants**: O(2n) → O(n)
2. **Drop non-dominant terms**: O(n² + n) → O(n²)
3. **Different inputs, different variables**: O(a + b), not O(n + n)

\`\`\`typescript
// O(1) — constant time
function getFirst(arr: number[]): number {
  return arr[0];
}

// O(n) — linear time
function sum(arr: number[]): number {
  let total = 0;
  for (const n of arr) total += n;
  return total;
}

// O(n²) — quadratic time (nested loops)
function hasDuplicate(arr: number[]): boolean {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) return true;
    }
  }
  return false;
}

// O(n) — with a Set (trade space for time)
function hasDuplicateFast(arr: number[]): boolean {
  return new Set(arr).size !== arr.length;
}
\`\`\`

## Space Complexity

Count extra memory used (excluding input):

- O(1): Iterative algorithms using a fixed number of variables.
- O(n): Storing a result array of size n.
- O(n): Recursive call stack depth n (e.g., linear recursion).
- O(log n): Call stack depth of binary search (log n levels).

## Best vs Worst vs Average Case

For a linear search on array of n elements:
- **Best**: Element is first → O(1)
- **Worst**: Element is last or absent → O(n)
- **Average**: O(n/2) → O(n)

Big-O typically refers to the **worst case** unless stated otherwise.`,
      },
      {
        title: "Arrays & Hash Maps",
        description: "Dynamic arrays, amortised analysis, and O(1) lookups with hash tables.",
        order: 2,
        content: `# Arrays & Hash Maps

## Dynamic Arrays

A dynamic array (like JavaScript's \`Array\`) starts with capacity **c**, and doubles when full.

| Operation | Time |
|---|---|
| Access by index | O(1) |
| Push (amortised) | O(1) |
| Insert at position | O(n) |
| Delete at position | O(n) |
| Search | O(n) |

### Two-Pointer Technique

\`\`\`typescript
// Find if a sorted array has a pair that sums to target
function twoSum(sorted: number[], target: number): [number, number] | null {
  let left = 0, right = sorted.length - 1;

  while (left < right) {
    const sum = sorted[left] + sorted[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return null;
}
\`\`\`

### Sliding Window

\`\`\`typescript
// Maximum sum of k consecutive elements
function maxSumSubarray(arr: number[], k: number): number {
  let windowSum = arr.slice(0, k).reduce((a, b) => a + b, 0);
  let maxSum    = windowSum;

  for (let i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i - k];
    maxSum = Math.max(maxSum, windowSum);
  }
  return maxSum;
}
\`\`\`

## Hash Maps

A hash map stores key-value pairs with O(1) average lookup, insert, and delete.

\`\`\`typescript
// Frequency counter pattern — find the first non-repeating char
function firstUnique(s: string): string | null {
  const freq = new Map<string, number>();

  for (const ch of s) {
    freq.set(ch, (freq.get(ch) ?? 0) + 1);
  }

  for (const ch of s) {
    if (freq.get(ch) === 1) return ch;
  }
  return null;
}

// Anagram check
function isAnagram(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const count = new Map<string, number>();
  for (const ch of a) count.set(ch, (count.get(ch) ?? 0) + 1);
  for (const ch of b) {
    const c = count.get(ch) ?? 0;
    if (c === 0) return false;
    count.set(ch, c - 1);
  }
  return true;
}
\`\`\``,
      },
      {
        title: "Linked Lists, Stacks & Queues",
        description: "Singly & doubly linked lists, stack-based problems, and queue implementations.",
        order: 3,
        content: `# Linked Lists, Stacks & Queues

## Singly Linked List

\`\`\`typescript
class ListNode<T> {
  constructor(public val: T, public next: ListNode<T> | null = null) {}
}

class LinkedList<T> {
  head: ListNode<T> | null = null;
  size = 0;

  prepend(val: T): void {
    this.head = new ListNode(val, this.head);
    this.size++;
  }

  append(val: T): void {
    const node = new ListNode(val);
    if (!this.head) { this.head = node; }
    else {
      let cur = this.head;
      while (cur.next) cur = cur.next;
      cur.next = node;
    }
    this.size++;
  }

  // Reverse in-place — O(n)
  reverse(): void {
    let prev: ListNode<T> | null = null;
    let cur = this.head;
    while (cur) {
      const next = cur.next;
      cur.next = prev;
      prev = cur;
      cur = next;
    }
    this.head = prev;
  }

  // Detect cycle — Floyd's algorithm O(n) time, O(1) space
  hasCycle(): boolean {
    let slow = this.head, fast = this.head;
    while (fast && fast.next) {
      slow = slow!.next;
      fast = fast.next.next;
      if (slow === fast) return true;
    }
    return false;
  }
}
\`\`\`

## Stack (LIFO)

\`\`\`typescript
class Stack<T> {
  private data: T[] = [];
  push(item: T) { this.data.push(item); }
  pop(): T | undefined { return this.data.pop(); }
  peek(): T | undefined { return this.data[this.data.length - 1]; }
  get size() { return this.data.length; }
}

// Classic problem: balanced brackets
function isBalanced(s: string): boolean {
  const stack = new Stack<string>();
  const map: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

  for (const ch of s) {
    if ("([{".includes(ch)) stack.push(ch);
    else if (stack.pop() !== map[ch]) return false;
  }
  return stack.size === 0;
}
\`\`\`

## Queue (FIFO)

\`\`\`typescript
// Efficient queue using a deque (two stacks)
class Queue<T> {
  private inbox  = new Stack<T>();
  private outbox = new Stack<T>();

  enqueue(item: T) { this.inbox.push(item); }

  dequeue(): T | undefined {
    if (this.outbox.size === 0) {
      while (this.inbox.size) this.outbox.push(this.inbox.pop()!);
    }
    return this.outbox.pop();
  }
}
\`\`\``,
      },
      {
        title: "Trees — Binary Trees & BSTs",
        description: "Tree traversals (BFS/DFS), binary search trees, and common tree problems.",
        order: 4,
        content: `# Trees — Binary Trees & BSTs

## Tree Terminology

- **Root** – Top node with no parent.
- **Leaf** – Node with no children.
- **Height** – Length of longest path from root to leaf.
- **Depth** – Distance from root to a given node.
- **Binary Tree** – Each node has at most 2 children.
- **BST** – Binary tree where left < root < right at every node.

\`\`\`typescript
class TreeNode {
  constructor(
    public val: number,
    public left: TreeNode | null = null,
    public right: TreeNode | null = null,
  ) {}
}
\`\`\`

## DFS Traversals

\`\`\`typescript
// Inorder: left → root → right  (gives sorted order for BST)
function inorder(root: TreeNode | null): number[] {
  if (!root) return [];
  return [...inorder(root.left), root.val, ...inorder(root.right)];
}

// Preorder: root → left → right  (useful for serialisation)
function preorder(root: TreeNode | null): number[] {
  if (!root) return [];
  return [root.val, ...preorder(root.left), ...preorder(root.right)];
}

// Postorder: left → right → root  (useful for deletion)
function postorder(root: TreeNode | null): number[] {
  if (!root) return [];
  return [...postorder(root.left), ...postorder(root.right), root.val];
}
\`\`\`

## BFS — Level-Order Traversal

\`\`\`typescript
function levelOrder(root: TreeNode | null): number[][] {
  if (!root) return [];
  const result: number[][] = [];
  const queue: TreeNode[]  = [root];

  while (queue.length) {
    const level: number[] = [];
    const len = queue.length;
    for (let i = 0; i < len; i++) {
      const node = queue.shift()!;
      level.push(node.val);
      if (node.left)  queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}
\`\`\`

## BST Operations

\`\`\`typescript
class BST {
  root: TreeNode | null = null;

  insert(val: number): void {
    this.root = this._insert(this.root, val);
  }

  private _insert(node: TreeNode | null, val: number): TreeNode {
    if (!node) return new TreeNode(val);
    if (val < node.val) node.left  = this._insert(node.left,  val);
    else if (val > node.val) node.right = this._insert(node.right, val);
    return node;
  }

  search(val: number): boolean {
    let cur = this.root;
    while (cur) {
      if (val === cur.val) return true;
      cur = val < cur.val ? cur.left : cur.right;
    }
    return false;
  }
}
\`\`\``,
      },
      {
        title: "Sorting & Searching Algorithms",
        description: "Merge sort, quicksort, binary search — with proofs and complexity trade-offs.",
        order: 5,
        content: `# Sorting & Searching Algorithms

## Comparison Sort Lower Bound

Any comparison-based sort requires **Ω(n log n)** comparisons in the worst case. Merge sort and heapsort achieve this. Quicksort is O(n log n) *average* but O(n²) worst.

## Merge Sort — O(n log n) guaranteed

**Divide** the array in half, **recursively sort** each half, **merge** them.

\`\`\`typescript
function mergeSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;

  const mid   = Math.floor(arr.length / 2);
  const left  = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}

function merge(left: number[], right: number[]): number[] {
  const result: number[] = [];
  let i = 0, j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]);
    else                     result.push(right[j++]);
  }

  return [...result, ...left.slice(i), ...right.slice(j)];
}
\`\`\`

## Quick Sort — O(n log n) average

Pick a **pivot**, partition elements around it, recurse.

\`\`\`typescript
function quickSort(arr: number[], lo = 0, hi = arr.length - 1): void {
  if (lo >= hi) return;
  const p = partition(arr, lo, hi);
  quickSort(arr, lo, p - 1);
  quickSort(arr, p + 1, hi);
}

function partition(arr: number[], lo: number, hi: number): number {
  const pivot = arr[hi];
  let i = lo - 1;

  for (let j = lo; j < hi; j++) {
    if (arr[j] <= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
  return i + 1;
}
\`\`\`

## Binary Search — O(log n)

Requires a **sorted** array.

\`\`\`typescript
function binarySearch(arr: number[], target: number): number {
  let lo = 0, hi = arr.length - 1;

  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if      (arr[mid] === target) return mid;
    else if (arr[mid] <  target)  lo = mid + 1;
    else                          hi = mid - 1;
  }
  return -1; // not found
}
\`\`\`

## Sorting Algorithm Cheat Sheet

| Algorithm | Best | Average | Worst | Space | Stable? |
|---|---|---|---|---|---|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ |
| Selection Sort | O(n²) | O(n²) | O(n²) | O(1) | ❌ |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | ✅ |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | ❌ |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | ❌ |`,
      },
    ],
  },
];

// ─── Main Seed Function ──────────────────────────────────────────────────────

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.SYSTEM_DATABASE_URL!,
  });
  const db = new PrismaClient({ adapter });

  try {
    await db.$connect();
    console.log("✅ Connected to database\n");

    const ts = now();

    // ── 1. Upsert teacher ─────────────────────────────────────────────────
    const teacher = await db.user.upsert({
      where: { email: TEACHER.email },
      update: {},
      create: {
        first_name: TEACHER.firstName,
        last_name: TEACHER.lastName,
        email: TEACHER.email,
        password: hashPassword(TEACHER.password),
        role: "TEACHER",
        status: "ACTIVE",
        email_verified: true,
        created_at: ts,
        updated_at: ts,
      },
    });
    console.log(`👩‍🏫 Teacher: ${teacher.email} (id=${teacher.id})`);

    // ── 2. Upsert student ─────────────────────────────────────────────────
    const student = await db.user.upsert({
      where: { email: STUDENT.email },
      update: {},
      create: {
        first_name: STUDENT.firstName,
        last_name: STUDENT.lastName,
        email: STUDENT.email,
        password: hashPassword(STUDENT.password),
        role: "STUDENT",
        status: "ACTIVE",
        email_verified: true,
        created_at: ts,
        updated_at: ts,
      },
    });
    console.log(`🎓 Student: ${student.email} (id=${student.id})\n`);

    // ── 3. Create courses + lessons ───────────────────────────────────────
    for (const courseData of COURSES) {
      // Skip if course with same title already exists for this teacher
      const existing = await db.course.findFirst({
        where: { title: courseData.title, teacher_id: teacher.id },
      });
      if (existing) {
        console.log(`⚠️  Course already exists, skipping: "${courseData.title}"`);
        continue;
      }

      const course = await db.course.create({
        data: {
          teacher_id: teacher.id,
          title: courseData.title,
          description: courseData.description,
          thumbnail: courseData.thumbnail,
          tags: courseData.tags,
          status: "PUBLISHED",
          created_by: teacher.id,
          updated_by: teacher.id,
          created_at: ts,
          updated_at: ts,
        },
      });
      console.log(`📚 Created course: "${course.title}" (uuid=${course.uuid})`);

      for (const lessonData of courseData.lessons) {
        await db.lesson.create({
          data: {
            course_id: course.id,
            title: lessonData.title,
            description: lessonData.description,
            content: lessonData.content,
            order: lessonData.order,
            created_by: teacher.id,
            updated_by: teacher.id,
            created_at: ts,
            updated_at: ts,
          },
        });
        console.log(`   📖 Lesson ${lessonData.order}: "${lessonData.title}"`);
      }
    }

    console.log("\n🎉 Seed complete!\n");
    console.log("──────────────────────────────────────────");
    console.log("Demo Credentials:");
    console.log(`  Teacher → ${TEACHER.email}  /  ${TEACHER.password}`);
    console.log(`  Student → ${STUDENT.email}  /  ${STUDENT.password}`);
    console.log("──────────────────────────────────────────");
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
