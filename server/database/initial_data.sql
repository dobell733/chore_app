-- Create Kids table
CREATE TABLE Kids (
  kid_id SERIAL PRIMARY KEY,
  name VARCHAR(50),
  age INTEGER,
  points INTEGER
);

-- Create Chores table
CREATE TABLE Chores (
  chore_id SERIAL PRIMARY KEY,
  chore_name VARCHAR(60),
  point_value INTEGER
);

-- Create Kids_Chores table (Intersection Table)
CREATE TABLE Kids_Chores (
  kids_chore_id SERIAL PRIMARY KEY,
  kid_id INTEGER REFERENCES Kids(kid_id),
  chore_id INTEGER REFERENCES Chores(chore_id),
  is_locked BOOLEAN DEFAULT false,
  unlock_time TIMESTAMP
);

-- Insert data into Kids table
INSERT INTO Kids (name, age, points) VALUES
('Sawyer', 7, 0),
('Brooke', 7, 0),
('Reagan', 4, 0);

-- Insert data into Chores table
INSERT INTO Chores (chore_name, point_value) VALUES
('Put Away Toys', 100), -- Only for Reagan
('Fold and Put Away Clothes', 200),
('Make Your Bed', 50),
('Sweep Hallway', 50),
('Wipe Down Surfaces', 50),
('Empty Trash', 50),
('Wipe Door Handles', 50),
('Put Away Clothes', 100),
('Wash Your Dishes', 50),
('Vacuum Your Room', 50),
('Put Away Toys / Clean Up Clutter', 100),  -- Added for Sawyer and Brooke
('Feed Pets', 50);  -- Only for Reagan  

-- Assign chores to Reagan
INSERT INTO Kids_Chores (kid_id, chore_id, is_locked, unlock_time)
SELECT 3, chore_id, false, NULL FROM Chores 
WHERE chore_name IN (
  'Put Away Toys',
  'Make Your Bed',
  'Wipe Down Surfaces',
  'Sweep Hallway',
  'Empty Trash',
  'Wipe Door Handles',
  'Put Away Clothes',
  'Feed Pets'
);

-- Assign chores to Sawyer and Brooke
INSERT INTO Kids_Chores (kid_id, chore_id, is_locked, unlock_time)
SELECT K.kid_id, C.chore_id, false, NULL 
FROM Kids K 
CROSS JOIN Chores C
WHERE K.name IN ('Sawyer', 'Brooke') 
AND C.chore_name IN (
  'Put Away Toys / Clean Up Clutter',  -- Changed for Sawyer and Brooke
  'Fold and Put Away Clothes',
  'Wash Your Dishes',
  'Make Your Bed',
  'Vacuum Your Room',
  'Wipe Down Surfaces',
  'Sweep Hallway',
  'Empty Trash',
  'Wipe Door Handles'
);