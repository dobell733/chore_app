-- Get all of Sawyer's chores
SELECT c.chore_name, kc.is_locked
FROM Kids k
JOIN Kids_Chores kc ON k.kid_id = kc.kid_id
JOIN Chores c ON kc.chore_id = c.chore_id
WHERE k.name = 'Sawyer';


--Set a chore as locked for a specific child
UPDATE Kids_Chores
SET is_locked = TRUE
WHERE kid_id = (SELECT kid_id FROM Kids WHERE name = 'Brooke')
AND chore_id = (SELECT chore_id FROM Chores WHERE chore_name = 'Wash Your Dishes');


-- Get all chores, locked status, and points for a specific child
SELECT K.name AS Kid_Name, K.points AS Points, C.chore_name AS Chore_Name, KC.is_locked AS Is_Locked
FROM Kids K
JOIN Kids_Chores KC ON K.kid_id = KC.kid_id
JOIN Chores C ON KC.chore_id = C.chore_id
WHERE K.kid_id = 3;  -- Replace 3 with the specific kid_id you are interested in


-- Update the points of a specific child
UPDATE Kids
SET points = 100  -- Set to the new points value
WHERE kid_id = 1;  -- Replace 1 with the specific kid_id you are interested


-- Get the points of a specific child
SELECT points
FROM Kids
WHERE kid_id = 1;  -- Replace 1 with the specific kid_id you are interested in


-- Get all name, chores, locked status, and points for a specific child
SELECT 
    K.name AS KidName,
    C.chore_name AS ChoreName,
    C.point_value AS PointValue,
    KC.is_locked AS IsLocked,
    KC.unlock_time AS UnlockTime
FROM Kids AS K
INNER JOIN Kids_Chores AS KC ON K.kid_id = KC.kid_id
INNER JOIN Chores AS C ON KC.chore_id = C.chore_id
WHERE K.kid_id = 1;


-- Toggle locked status of a specific chore for a specific child
UPDATE Kids_Chores
SET is_locked = is_locked ^ 1  -- If it was 0 it will be updated to 1 and vice versa
WHERE kid_id = 1 AND chore_id = 2;  -- Replace 1 and 2 with the specific kid_id and chore_id


-- Set unlock time of a specific chore for a specific child to 24 hours from now (server time zone weirdness)
UPDATE Kids_Chores 
SET unlock_time = DATEADD(HOUR, 24, GETDATE())  
WHERE kid_id = 1 AND chore_id = 2; -- Replace 1 and 2 with the specific kid_id and chore_id


-- Update is_locked and unlock_time for a specific kid_id and chore_id
UPDATE Kids_Chores
SET is_locked = 1,  -- Set is_locked to true
    unlock_time = DATEADD(HOUR, 24, GETDATE())  -- Set unlock_time to 24 hours from the current time
WHERE kid_id = @kid_id AND chore_id = @chore_id;