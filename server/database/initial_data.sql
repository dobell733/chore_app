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
(N'Sawyer', 7, 0),
(N'Brooke', 7, 0),
(N'Reagan', 4, 0);

-- Insert data into Chores table
INSERT INTO Chores (chore_name, point_value) VALUES
(N'🧸 Put Away Toys', 100),
(N'👚 Fold and Put Away Clothes', 200),
(N'🛏️ Make Your Bed', 50),
(N'🧹 Sweep Hallway', 50),
(N'🧽 Wipe Down Surfaces', 50),
(N'🗑️ Empty Trash', 50),
(N'🚪 Wipe Door Handles', 50),
(N'👕 Put Away Clothes', 100),
(N'🍽️ Wash Your Dishes', 50),
(N'🧹 Vacuum Your Room', 50),
(N'🧸 Put Away Toys / Clean Up Clutter', 100);  -- New Chore

-- Assign chores to Reagan
INSERT INTO Kids_Chores (kid_id, chore_id, is_locked, unlock_time)
SELECT 3, chore_id, 0, NULL FROM Chores 
WHERE chore_name IN (
  N'🧸 Put Away Toys',
  N'🛏️ Make Your Bed',
  N'🧽 Wipe Down Surfaces',
  N'🧹 Sweep Hallway',
  N'🗑️ Empty Trash',
  N'🚪 Wipe Door Handles',
  N'👕 Put Away Clothes'
);

-- Assign chores to Sawyer and Brooke
INSERT INTO Kids_Chores (kid_id, chore_id, is_locked, unlock_time)
SELECT kid_id, chore_id, 0, NULL FROM Kids, Chores 
WHERE name IN (N'Sawyer', N'Brooke') AND chore_name IN (
  N'🧸 Put Away Toys / Clean Up Clutter',  -- Changed for Sawyer and Brooke
  N'👚 Fold and Put Away Clothes',
  N'🍽️ Wash Your Dishes',
  N'🛏️ Make Your Bed',
  N'🧹 Vacuum Your Room',
  N'🧽 Wipe Down Surfaces',
  N'🧹 Sweep Hallway',
  N'🗑️ Empty Trash',
  N'🚪 Wipe Door Handles'
);
