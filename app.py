from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from chatbot_engine import ChatbotEngine
import os

app = Flask(__name__)
CORS(app)

engine = ChatbotEngine()

# Session storage (in-memory for simplicity in this demo)
# In a real app, use a proper session or database
user_sessions = {}

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/start', methods=['POST'])
def start_diagnosis():
    data = request.json
    name = data.get('name', 'User')
    session_id = os.urandom(16).hex()
    
    user_sessions[session_id] = {
        'name': name,
        'state': 'awaiting_symptom',
        'symptoms_exp': [],
        'days': 0
    }
    
    return jsonify({
        'session_id': session_id,
        'message': f"Hello {name}, I'm your healthcare assistant. Please enter the main symptom you are experiencing."
    })

@app.route('/api/process', methods=['POST'])
def process_input():
    data = request.json
    session_id = data.get('session_id')
    user_input = (data.get('input') or '').strip()
    
    if session_id not in user_sessions:
        return jsonify({'error': 'Invalid session'}), 400
    
    session = user_sessions[session_id]
    
    if session['state'] == 'awaiting_symptom':
        conf, matches = engine.check_pattern(user_input)
        if conf == 1:
            if len(matches) > 1:
                session['state'] = 'clarifying_symptom'
                return jsonify({
                    'state': 'clarifying_symptom',
                    'matches': matches,
                    'message': "I found several matching symptoms. Please select the one you mean:"
                })
            else:
                symptom = matches[0]
                disease, symptoms_given = engine.get_diagnosis_steps(symptom)
                session['state'] = 'awaiting_days'
                session['main_symptom'] = symptom
                session['potential_disease'] = disease
                session['symptoms_to_ask'] = symptoms_given
                session['current_symptom_idx'] = 0
                return jsonify({
                    'state': 'awaiting_days',
                    'message': f"Got it. How many days have you been experiencing {symptom.replace('_', ' ')}?"
                })
        else:
            return jsonify({
                'state': 'awaiting_symptom',
                'message': "I couldn't find a matching symptom. Please try again with a common medical term."
            })

    elif session['state'] == 'clarifying_symptom':
        symptom = data.get('selected_symptom')
        if not symptom:
            return jsonify({'error': 'No symptom selected'}), 400
             
        disease, symptoms_given = engine.get_diagnosis_steps(symptom)
        session['state'] = 'awaiting_days'
        session['main_symptom'] = symptom
        session['potential_disease'] = disease
        session['symptoms_to_ask'] = symptoms_given
        session['current_symptom_idx'] = 0
        return jsonify({
            'state': 'awaiting_days',
            'message': f"Got it. How many days have you been experiencing {symptom.replace('_', ' ')}?"
        })

    elif session['state'] == 'awaiting_days':
        try:
            days = int(user_input)
            session['days'] = days
            session['state'] = 'asking_symptoms'
            return ask_next_symptom(session)
        except:
            return jsonify({
                'state': 'awaiting_days',
                'message': "Please enter a valid number of days."
            })

    elif session['state'] == 'asking_symptoms':
        answer = user_input.lower()
        if answer in ['yes', 'no']:
            current_symptom = session['symptoms_to_ask'][session['current_symptom_idx']]
            if answer == 'yes':
                session['symptoms_exp'].append(current_symptom)
            
            session['current_symptom_idx'] += 1
            return ask_next_symptom(session)
        else:
            return jsonify({
                'state': 'asking_symptoms',
                'message': "Please answer with 'yes' or 'no'."
            })

    return jsonify({'error': 'Unknown state'}), 500

def ask_next_symptom(session):
    idx = session['current_symptom_idx']
    symptoms = session['symptoms_to_ask']
    
    if idx < len(symptoms):
        symptom = symptoms[idx].replace('_', ' ')
        return jsonify({
            'state': 'asking_symptoms',
            'message': f"Are you experiencing {symptom}?",
            'is_yes_no': True
        })
    else:
        # End of questions
        second_pred = engine.second_prediction(session['symptoms_exp'])
        result = engine.get_final_result(
            session['potential_disease'],
            second_pred,
            session['symptoms_exp'],
            session['days']
        )
        session['state'] = 'finished'
        return jsonify({
            'state': 'finished',
            'result': result,
            'message': "Diagnosis complete. Here are your results:"
        })

if __name__ == '__main__':
    # Ensure templates directory exists
    if not os.path.exists('templates'):
        os.makedirs('templates')
    if not os.path.exists('static'):
        os.makedirs('static')
    app.run(debug=True, host='0.0.0.0', port=5000)
