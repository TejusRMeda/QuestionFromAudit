-- Expand answer_type CHECK constraints to include additional MyPreOp item types

-- Update questions table
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_answer_type_check;
ALTER TABLE questions ADD CONSTRAINT questions_answer_type_check
  CHECK (answer_type IN (
    'text', 'radio', 'multi_select', 'checkbox',
    'text-field', 'text-area', 'text-paragraph',
    'phone-number', 'age', 'number-input', 'allergy-list',
    'forage', 'bmi-calculator', 'frailty-score',
    'spacer', 'content-block', 'medication-list',
    'i-c-u-list', 'previous-operation-list', 'send-button', 'date', 'alert'
  ));

-- Update master_questions table
ALTER TABLE master_questions DROP CONSTRAINT IF EXISTS master_questions_answer_type_check;
ALTER TABLE master_questions ADD CONSTRAINT master_questions_answer_type_check
  CHECK (answer_type IN (
    'text', 'radio', 'multi_select', 'checkbox',
    'text-field', 'text-area', 'text-paragraph',
    'phone-number', 'age', 'number-input', 'allergy-list',
    'forage', 'bmi-calculator', 'frailty-score',
    'spacer', 'content-block', 'medication-list',
    'i-c-u-list', 'previous-operation-list', 'send-button', 'date', 'alert'
  ));

-- Update instance_questions table
ALTER TABLE instance_questions DROP CONSTRAINT IF EXISTS instance_questions_answer_type_check;
ALTER TABLE instance_questions ADD CONSTRAINT instance_questions_answer_type_check
  CHECK (answer_type IN (
    'text', 'radio', 'multi_select', 'checkbox',
    'text-field', 'text-area', 'text-paragraph',
    'phone-number', 'age', 'number-input', 'allergy-list',
    'forage', 'bmi-calculator', 'frailty-score',
    'spacer', 'content-block', 'medication-list',
    'i-c-u-list', 'previous-operation-list', 'send-button', 'date', 'alert'
  ));
