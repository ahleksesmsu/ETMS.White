/*
  # Add scoring fields to survey questions and responses

  1. Changes
    - Add scoring fields to Question model
      - has_scoring (boolean)
      - scoring_guide (jsonb)
    - Add score field to SurveyResponse model
    - Add total_score field to SurveyAssignment model
*/

-- Add scoring fields to Question table
ALTER TABLE surveys_question
ADD COLUMN IF NOT EXISTS has_scoring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS scoring_guide jsonb;

-- Add score field to SurveyResponse table
ALTER TABLE surveys_surveyresponse
ADD COLUMN IF NOT EXISTS score float;

-- Add total_score field to SurveyAssignment table
ALTER TABLE surveys_surveyassignment
ADD COLUMN IF NOT EXISTS total_score float;