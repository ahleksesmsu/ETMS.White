/*
  # Add factors to trainings

  1. Changes
    - Add factors field to Training model
    - Create many-to-many relationship between trainings and factors
*/

-- Create training_factors junction table
CREATE TABLE IF NOT EXISTS trainings_training_factors (
    id SERIAL PRIMARY KEY,
    training_id INTEGER NOT NULL REFERENCES trainings_training(id) ON DELETE CASCADE,
    factor_id INTEGER NOT NULL REFERENCES surveys_factor(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(training_id, factor_id)
);

-- Enable RLS
ALTER TABLE trainings_training_factors ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Allow read access to all authenticated users"
    ON trainings_training_factors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow write access to admins and HR"
    ON trainings_training_factors
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id
            AND (role = 'ADMIN' OR role = 'HR')
        )
    );