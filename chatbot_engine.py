import re
import pandas as pd
from sklearn import preprocessing
from sklearn.tree import DecisionTreeClassifier, _tree
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.svm import SVC
import csv
import warnings

warnings.filterwarnings("ignore", category=DeprecationWarning)

class ChatbotEngine:
    def __init__(self):
        self.training = pd.read_csv('Data/Training.csv')
        self.testing = pd.read_csv('Data/Testing.csv')
        self.cols = self.training.columns[:-1].tolist()
        self.x = self.training[self.cols]
        self.y = self.training['prognosis']
        
        self.reduced_data = self.training.groupby(self.training['prognosis']).max()
        
        self.le = preprocessing.LabelEncoder()
        self.le.fit(self.y)
        self.y_encoded = self.le.transform(self.y)
        
        # Decision Tree Model
        self.clf = DecisionTreeClassifier()
        self.clf.fit(self.x, self.y_encoded)
        
        # SVM Model (used in original code but not strictly for the tree walk)
        self.model = SVC()
        self.model.fit(self.x, self.y_encoded)
        
        self.severityDictionary = {}
        self.description_list = {}
        self.precautionDictionary = {}
        self.symptoms_dict = {symptom: index for index, symptom in enumerate(self.cols)}
        
        self.load_master_data()

    def load_master_data(self):
        # Description
        with open('MasterData/symptom_Description.csv') as csv_file:
            csv_reader = csv.reader(csv_file, delimiter=',')
            for row in csv_reader:
                if len(row) >= 2:
                    self.description_list[row[0]] = row[1]
        
        # Severity
        with open('MasterData/Symptom_severity.csv') as csv_file:
            csv_reader = csv.reader(csv_file, delimiter=',')
            for row in csv_reader:
                try:
                    self.severityDictionary[row[0]] = int(row[1])
                except:
                    pass
        
        # Precaution
        with open('MasterData/symptom_precaution.csv') as csv_file:
            csv_reader = csv.reader(csv_file, delimiter=',')
            for row in csv_reader:
                if len(row) >= 5:
                    self.precautionDictionary[row[0]] = [row[1], row[2], row[3], row[4]]

    def check_pattern(self, inp):
        if not inp or len(inp.strip()) < 2:
            return 0, []
            
        inp = inp.replace(' ', '_')
        patt = f"{inp}"
        regexp = re.compile(patt, re.IGNORECASE)
        pred_list = [item for item in self.cols if regexp.search(item)]
        if len(pred_list) > 0:
            return 1, pred_list
        else:
            return 0, []

    def get_diagnosis_steps(self, symptom_input):
        # 1. Find all potential diseases that actually have this symptom
        # This is much more accurate than walking a tree with dummy zeros
        try:
            candidates = self.reduced_data[self.reduced_data[symptom_input] == 1].index.tolist()
            if not candidates:
                # If for some reason the data doesn't match, fallback to the tree
                return self.tree_fallback(symptom_input)
            
            # Sort candidates by number of symptoms to pick the most "specific" one
            # or just pick the first one for the flow
            disease = candidates[0]
            symptoms_given = self.reduced_data.columns[self.reduced_data.loc[disease].values == 1].tolist()
            return disease, symptoms_given
        except:
            return self.tree_fallback(symptom_input)

    def tree_fallback(self, symptom_input):
        tree_ = self.clf.tree_
        feature_name = [
            self.cols[i] if i != _tree.TREE_UNDEFINED else "undefined!"
            for i in tree_.feature
        ]
        
        def recurse(node):
            if tree_.feature[node] != _tree.TREE_UNDEFINED:
                name = feature_name[node]
                val = 1 if name == symptom_input else 0
                if val <= tree_.threshold[node]:
                    return recurse(tree_.children_left[node])
                else:
                    return recurse(tree_.children_right[node])
            else:
                val = tree_.value[node].nonzero()
                disease = self.le.inverse_transform(val[0])[0]
                symptoms_given = self.reduced_data.columns[self.reduced_data.loc[disease].values == 1].tolist()
                return disease, symptoms_given

        return recurse(0)

    def second_prediction(self, symptoms_exp):
        # Use our pre-trained SVC model or Decision Tree for a robust check
        input_vector = np.zeros(len(self.cols))
        for item in symptoms_exp:
            if item in self.symptoms_dict:
                input_vector[self.symptoms_dict[item]] = 1

        # We'll use the pre-trained SVC model as it's generally more stable than a single DT
        pred_encoded = self.model.predict([input_vector])
        return self.le.inverse_transform(pred_encoded)[0]

    def calc_condition(self, symptoms_exp, days):
        total_sum = 0
        for item in symptoms_exp:
            if item in self.severityDictionary:
                total_sum += self.severityDictionary[item]
        
        if len(symptoms_exp) == 0:
            return "It might not be that bad but you should take precautions."
            
        condition_score = (total_sum * days) / (len(symptoms_exp) + 1)
        if condition_score > 13:
            return "You should take the consultation from doctor."
        else:
            return "It might not be that bad but you should take precautions."

    def get_final_result(self, disease, second_prediction, symptoms_exp, days):
        res = {
            "initial_disease": disease,
            "second_prediction": second_prediction,
            "condition": self.calc_condition(symptoms_exp, days),
            "description": self.description_list.get(disease, ""),
            "precautions": self.precautionDictionary.get(disease, []),
            "mismatch": False
        }
        
        if disease != second_prediction:
            res["mismatch"] = True
            res["second_description"] = self.description_list.get(second_prediction, "")
            
        return res
