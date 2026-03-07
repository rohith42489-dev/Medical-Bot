# 🏥 MediFlow | Smart Healthcare Assistant

MediFlow is a premium, AI-powered healthcare chatbot that provides instant diagnostic insights based on user symptoms. It leverages Machine Learning models (Decision Trees and SVM) to analyze symptoms and provide potential diagnoses along with recommended precautions.

## ✨ Features

- **Premium UI**: Ultra-modern, glassmorphic design with dark mode and smooth animations.
- **Smart Diagnosis**: Recursive symptom questioning powered by Scikit-Learn.
- **Dual Verification**: Cross-references results using multiple ML models for higher accuracy.
- **Interactive Chat**: Real-time asynchronous communication with a friendly AI assistant.
- **Actionable Advice**: Detailed descriptions and step-by-step precautions for every diagnosis.

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Docker (optional, for containerization)

### Local Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd healthcare-chatbot
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**:
   ```bash
   python app.py
   ```

4. **Access the UI**:
   Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your browser.

### 🐳 Running with Docker

1. **Build the image**:
   ```bash
   docker build -t mediflow-chatbot .
   ```

2. **Run the container**:
   ```bash
   docker run -p 5000:5000 mediflow-chatbot
   ```

## 🧠 Model Information

- **Primary Model**: Decision Tree Classifier (optimized discovery walk).
- **Secondary Verification**: Support Vector Machine (SVM) for result validation.
- **Dataset**: Comprehensive medical dataset containing 4900+ samples and 130+ symptoms.

## 🛡️ Disclaimer

**For informational purposes only.** This tool is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.

---
**Developed by:** ROHITH RAJENDRAN | **Reg No:** 23BSCS047