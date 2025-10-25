# End-to-End-Encryption-Backend
# 🔐 End-to-End Encryption Module for Secure Chat Systems

A standalone **End-to-End Encryption (E2EE)** module originally developed for the [CodeSwap](#) project — a peer-to-peer learning platform.  
This module enables **secure, private, and tamper-proof communication** between users using modern cryptographic standards.

---

## 🧭 Overview

This backend service provides APIs to:
- Generate cryptographic key pairs (RSA)
- Encrypt and decrypt messages securely
- Send and receive encrypted messages
- Manage message history and read status

The system ensures that **only the communicating users** can decrypt messages — not even the server or database administrators.

---


---

## 🧩 Technology Stack

| Layer | Technology |
|-------|-------------|
| **Backend** | Node.js, Express.js |
| **Databases** | MongoDB (encryption keys), MySQL (user data) |
| **Encryption** | RSA (asymmetric), AES (symmetric), OAEP padding |
| **Authentication** | JWT (JSON Web Tokens) |
| **Language** | JavaScript (ES6) |

---

## 🔑 Core Functionalities

### 1. **Key Management**
- RSA key pair (public/private) generation per user
- Public key stored in MongoDB, private key retained client-side
- JWT-based authentication for secure access

### 2. **Encryption Flow**
1. Sender retrieves recipient’s **public key**
2. Message encrypted using **AES**
3. AES key encrypted using **RSA public key**
4. Both encrypted payload and encrypted key stored in DB

### 3. **Decryption Flow**
1. Receiver decrypts AES key using **RSA private key**
2. Uses decrypted AES key to decrypt message content
3. Message displayed in plaintext only on the client side

---

## 📡 API Endpoints

### 🔐 **Crypto Routes**
| Method | Endpoint | Description |
|--------|-----------|-------------|
| `POST` | `/api/crypto/generate-keys` | Generate and store RSA key pair |
| `POST` | `/api/crypto/encrypt` | Encrypt message using receiver’s public key |
| `POST` | `/api/crypto/decrypt` | Decrypt message using user’s private key |

### 💬 **Message Routes**
| Method | Endpoint | Description |
|--------|-----------|-------------|
| `POST` | `/api/messages/send` | Send encrypted message |
| `GET` | `/api/messages/receive/:userId` | Retrieve user’s encrypted messages |
| `PATCH` | `/api/messages/mark-read/:messageId` | Mark a message as read |
| `GET` | `/api/messages/history/:chatId` | Retrieve encrypted chat history |

---





