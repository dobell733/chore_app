-- Create Kids table
CREATE TABLE Kids (
  kid_id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(50),
  age INT,
  points INT
);

-- Create Chores table
CREATE TABLE Chores (
  chore_id INT IDENTITY(1,1) PRIMARY KEY,
  chore_name NVARCHAR(60),
  point_value INT
);

-- Create Kids_Chores table (Intersection Table)
CREATE TABLE Kids_Chores (
  kids_chore_id INT IDENTITY(1,1) PRIMARY KEY,
  kid_id INT FOREIGN KEY REFERENCES Kids(kid_id),
  chore_id INT FOREIGN KEY REFERENCES Chores(chore_id),
  is_locked BIT DEFAULT 0,
  unlock_time DATETIME
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
SELECT 3, chore_id, 0, NULL FROM Chores 
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
SELECT kid_id, chore_id, 0, NULL FROM Kids, Chores 
WHERE name IN ('Sawyer', 'Brooke') AND chore_name IN (
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
