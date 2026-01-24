// Mock project data for API mocking
export const mockProjectData = {
  trustName: "NHS Test Trust",
  createdAt: "2024-01-15T10:00:00Z",
  questions: [
    {
      id: 1,
      questionId: "Q001",
      category: "Demographics",
      questionText: "What is your age range?",
      answerType: "radio",
      answerOptions: "Under 18|18-30|31-50|Over 50",
      suggestionCount: 2,
    },
    {
      id: 2,
      questionId: "Q002",
      category: "Demographics",
      questionText: "What is your gender?",
      answerType: "radio",
      answerOptions: "Male|Female|Non-binary|Prefer not to say",
      suggestionCount: 0,
    },
    {
      id: 3,
      questionId: "Q003",
      category: "Health",
      questionText: "Do you have any chronic conditions?",
      answerType: "multi_select",
      answerOptions: "Diabetes|Heart Disease|Asthma|None",
      suggestionCount: 1,
    },
    {
      id: 4,
      questionId: "Q004",
      category: "Health",
      questionText: "Please describe any additional health concerns",
      answerType: "text",
      answerOptions: null,
      suggestionCount: 0,
    },
    {
      id: 5,
      questionId: "Q005",
      category: "Lifestyle",
      questionText: "How often do you exercise?",
      answerType: "radio",
      answerOptions: "Daily|Weekly|Monthly|Rarely|Never",
      suggestionCount: 0,
    },
  ],
};

// Mock suggestions for a question
export const mockSuggestions = [
  {
    id: 1,
    submitterName: "Dr. Smith",
    submitterEmail: "smith@nhs.uk",
    suggestionText: "Consider adding more granular age ranges for elderly patients",
    reason: "Many health conditions vary significantly between 50-65 and 65+",
    status: "pending",
    createdAt: "2024-01-16T14:30:00Z",
    responseMessage: null,
  },
  {
    id: 2,
    submitterName: "Nurse Johnson",
    submitterEmail: null,
    suggestionText: "The age ranges should align with NHS standard categories",
    reason: "Consistency with other NHS forms would help with data analysis",
    status: "approved",
    createdAt: "2024-01-16T09:15:00Z",
    responseMessage: "Great suggestion! We will update this in the next version.",
  },
];

// Test data for form submissions
export const validSuggestion = {
  name: "Test User",
  email: "test@example.com",
  suggestion: "This question should be rephrased for better clarity.",
  reason: "The current wording may confuse non-native English speakers.",
};

// API response mocks
export const mockUploadResponse = {
  trustLinkId: "abc123xyz",
  adminLinkId: "admin456def",
  questionCount: 5,
};

export const mockSuggestionSubmitResponse = {
  success: true,
  suggestion: {
    id: 3,
    submitterName: "Test User",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
};
