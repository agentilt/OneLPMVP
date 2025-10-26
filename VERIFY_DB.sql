-- Verification query to check if the columns exist in the production database
-- Run this in your Neon SQL editor

SELECT 
    table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'Fund'
AND column_name IN ('managerEmail', 'managerPhone', 'managerWebsite')
ORDER BY column_name;

